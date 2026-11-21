import fs from 'fs';
import path from 'path';
import { AiAnalysisResult } from './types';

export interface CacheEntry {
  hash: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  summary: string;
  needs_reply: boolean;
  model_name?: string;
  created_at: string;
}

class ReviewCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private dbInstance: any = null;
  private storageType: 'sqlite' | 'json' = 'json';
  private dataDir: string;
  private jsonFilePath: string;
  private dbFilePath: string;
  private initialized = false;

  constructor() {
    // In Vercel / serverless environments, write to /tmp; otherwise ./data
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.dataDir = isServerless ? '/tmp' : path.join(process.cwd(), 'data');
    this.jsonFilePath = path.join(this.dataDir, 'reviews_cache.json');
    this.dbFilePath = path.join(this.dataDir, 'reviews_cache.sqlite');
  }

  private init() {
    if (this.initialized) return;

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Try node:sqlite (native in Node 22+)
      try {
        const { DatabaseSync } = require('node:sqlite');
        this.dbInstance = new DatabaseSync(this.dbFilePath);
        this.dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS review_cache (
            hash TEXT PRIMARY KEY,
            sentiment TEXT NOT NULL,
            topics TEXT NOT NULL,
            summary TEXT NOT NULL,
            needs_reply INTEGER NOT NULL,
            model_name TEXT,
            created_at TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_cache_hash ON review_cache(hash);
        `);
        this.storageType = 'sqlite';
      } catch (sqliteErr) {
        // Fallback to JSON file storage
        this.storageType = 'json';
        this.loadFromJsonFile();
      }
    } catch (err) {
      // In-memory fallback
      this.storageType = 'json';
    }

    this.initialized = true;
  }

  private loadFromJsonFile() {
    try {
      if (fs.existsSync(this.jsonFilePath)) {
        const raw = fs.readFileSync(this.jsonFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            this.memoryCache.set(k, v as CacheEntry);
          }
        }
      }
    } catch {
      // Ignore file read error on initial run
    }
  }

  private saveToJsonFile() {
    try {
      const obj: Record<string, CacheEntry> = {};
      this.memoryCache.forEach((v, k) => {
        obj[k] = v;
      });
      fs.writeFileSync(this.jsonFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in ephemeral environments
    }
  }

  public get(textHash: string): AiAnalysisResult | null {
    this.init();
    if (!textHash) return null;

    if (this.storageType === 'sqlite' && this.dbInstance) {
      try {
        const stmt = this.dbInstance.prepare('SELECT * FROM review_cache WHERE hash = ?');
        const row = stmt.get(textHash);
        if (row) {
          return {
            sentiment: row.sentiment,
            topics: JSON.parse(row.topics),
            summary: row.summary,
            needs_reply: Boolean(row.needs_reply),
          };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    const cached = this.memoryCache.get(textHash);
    if (cached) {
      return {
        sentiment: cached.sentiment,
        topics: cached.topics as any,
        summary: cached.summary,
        needs_reply: cached.needs_reply,
      };
    }

    return null;
  }

  public getBatch(hashes: string[]): Map<string, AiAnalysisResult> {
    const results = new Map<string, AiAnalysisResult>();
    for (const h of hashes) {
      const res = this.get(h);
      if (res) {
        results.set(h, res);
      }
    }
    return results;
  }

  public set(textHash: string, data: AiAnalysisResult, modelName: string = 'llm'): void {
    this.init();
    if (!textHash || !data) return;

    const entry: CacheEntry = {
      hash: textHash,
      sentiment: data.sentiment,
      topics: data.topics,
      summary: data.summary,
      needs_reply: data.needs_reply,
      model_name: modelName,
      created_at: new Date().toISOString(),
    };

    if (this.storageType === 'sqlite' && this.dbInstance) {
      try {
        const stmt = this.dbInstance.prepare(`
          INSERT OR REPLACE INTO review_cache (hash, sentiment, topics, summary, needs_reply, model_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          textHash,
          data.sentiment,
          JSON.stringify(data.topics),
          data.summary,
          data.needs_reply ? 1 : 0,
          modelName,
          entry.created_at
        );
        return;
      } catch (err) {
        // Fallback to memory
      }
    }

    this.memoryCache.set(textHash, entry);
    this.saveToJsonFile();
  }

  public setBatch(
    items: { hash: string; data: AiAnalysisResult }[],
    modelName: string = 'llm'
  ): void {
    for (const item of items) {
      this.set(item.hash, item.data, modelName);
    }
  }

  public stats(): { total_entries: number; storage_type: string } {
    this.init();
    let count = 0;
    if (this.storageType === 'sqlite' && this.dbInstance) {
      try {
        const row = this.dbInstance.prepare('SELECT COUNT(*) as cnt FROM review_cache').get();
        count = row ? Number(row.cnt) : 0;
      } catch {
        count = this.memoryCache.size;
      }
    } else {
      count = this.memoryCache.size;
    }
    return {
      total_entries: count,
      storage_type: this.storageType,
    };
  }

  public clear(): void {
    this.init();
    this.memoryCache.clear();
    if (this.storageType === 'sqlite' && this.dbInstance) {
      try {
        this.dbInstance.exec('DELETE FROM review_cache;');
      } catch {}
    }
    try {
      if (fs.existsSync(this.jsonFilePath)) {
        fs.unlinkSync(this.jsonFilePath);
      }
    } catch {}
  }
}

export const reviewCache = new ReviewCache();

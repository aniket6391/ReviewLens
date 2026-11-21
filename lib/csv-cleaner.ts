import { parse } from 'csv-parse/sync';
import crypto from 'crypto';
import { CleanedReview, RawCsvRow } from './types';

/**
 * Normalizes text for consistent hashing and analysis:
 * - Strips outer whitespace
 * - Collapses consecutive whitespace/newlines
 * - Converts to lowercase for duplicate detection
 */
export function normalizeTextForHash(text: string): string {
  if (!text) return '';
  const noHtml = text.replace(/<[^>]*>/g, '');
  return noHtml.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Computes SHA-256 hash of review text for caching and deduplication
 */
export function hashReviewText(text: string): string {
  const normalized = normalizeTextForHash(text);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Cleans rating field:
 * Accepts numbers 1-5 or strings "1"-"5".
 * Treats "five", "", undefined, null, or out-of-range numbers as null (unknown).
 */
export function parseRating(rawRating: any): number | null {
  if (rawRating === undefined || rawRating === null) return null;
  const str = String(rawRating).trim();
  if (str === '') return null;

  const num = Number(str);
  if (!isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)) {
    return num;
  }
  return null;
}

/**
 * Finds a matching column key using case-insensitive and alias matching
 */
function findColumnKey(sampleRow: Record<string, any>, aliases: string[]): string | null {
  const keys = Object.keys(sampleRow);
  for (const k of keys) {
    const normalizedKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalizedKey === normalizedAlias) {
        return k;
      }
    }
  }
  return null;
}

/**
 * Parses raw CSV string or file buffer into CleanedReview[]
 * Handles multi-line quoted fields, empty rows, bad columns, and detects duplicates.
 */
export function parseAndCleanCsv(csvContent: string): CleanedReview[] {
  // Remove UTF-8 BOM if present
  const sanitizedContent = csvContent.replace(/^\uFEFF/, '').trim();

  if (!sanitizedContent) {
    return [];
  }

  let records: RawCsvRow[] = [];
  try {
    records = parse(sanitizedContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (error: any) {
    throw new Error(`CSV Parsing Failed: ${error.message || 'Invalid CSV format'}`);
  }

  if (records.length === 0) {
    return [];
  }

  // Detect column mapping intelligently
  const firstRow = records[0];
  const detectedColumns = Object.keys(firstRow);

  const reviewTextKey = findColumnKey(firstRow, [
    'review_text',
    'review text',
    'reviewtext',
    'review',
    'reviews',
    'text',
    'comment',
    'comments',
    'feedback',
    'body',
    'content',
    'message',
    'description',
  ]);

  // If no review text column is found, the user uploaded an unrelated CSV (e.g. Student_Performance.csv)
  if (!reviewTextKey) {
    throw new Error(
      `No customer review text column found in CSV. Detected columns: [${detectedColumns.join(
        ', '
      )}]. Please upload a customer reviews CSV containing a 'review_text' (or 'review', 'comment') column, or click 'Load Sample reviews.csv' to use the official assessment dataset.`
    );
  }

  const productKey = findColumnKey(firstRow, [
    'product',
    'product_name',
    'product name',
    'item',
    'item_name',
    'item name',
    'title',
    'product_title',
  ]);

  const ratingKey = findColumnKey(firstRow, [
    'rating',
    'ratings',
    'score',
    'stars',
    'star_rating',
    'star rating',
    'user_rating',
  ]);

  const reviewIdKey = findColumnKey(firstRow, [
    'review_id',
    'review id',
    'reviewid',
    'id',
    'id_review',
  ]);

  const dateKey = findColumnKey(firstRow, [
    'date',
    'review_date',
    'review date',
    'created_at',
    'timestamp',
  ]);

  const cleanedReviews: CleanedReview[] = [];
  const seenHashes = new Map<string, string>(); // hash -> first_review_id

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const reviewId = String((reviewIdKey && row[reviewIdKey]) || `ROW_${i + 1}`).trim();
    const product = String((productKey && row[productKey]) || 'General Product').trim();
    const rawRatingStr = ratingKey && row[ratingKey] !== undefined && row[ratingKey] !== null
      ? String(row[ratingKey]).trim()
      : '';
    const rating = parseRating(rawRatingStr);
    const date = String((dateKey && row[dateKey]) || new Date().toISOString().split('T')[0]).trim();
    const rawReviewText = reviewTextKey && row[reviewTextKey] !== undefined && row[reviewTextKey] !== null
      ? String(row[reviewTextKey])
      : '';
    const trimmedText = rawReviewText.trim();

    const isEmpty = trimmedText.length === 0;
    const textHash = hashReviewText(trimmedText);

    let isDuplicate = false;
    let duplicateOf: string | null = null;

    if (!isEmpty) {
      if (seenHashes.has(textHash)) {
        isDuplicate = true;
        duplicateOf = seenHashes.get(textHash)!;
      } else {
        seenHashes.set(textHash, reviewId);
      }
    }

    const status: CleanedReview['status'] = isEmpty
      ? 'empty_skipped'
      : isDuplicate
      ? 'duplicate'
      : 'valid';

    cleanedReviews.push({
      review_id: reviewId,
      product,
      rating,
      rating_raw: rawRatingStr,
      date,
      review_text: rawReviewText,
      cleaned_text: trimmedText,
      text_hash: textHash,
      is_empty: isEmpty,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf,
      status,
    });
  }

  return cleanedReviews;
}

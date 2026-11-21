import { NextRequest, NextResponse } from 'next/server';
import { parseAndCleanCsv } from '@/lib/csv-cleaner';
import { reviewCache } from '@/lib/cache';
import { analyzeBatch, detectLlmConfig } from '@/lib/llm-client';
import { calculateDashboardStats, checkRatingMismatch } from '@/lib/insights';
import { CleanedReview, ProcessedReview } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    let csvContent = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No CSV file uploaded' },
          { status: 400 }
        );
      }
      csvContent = await file.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Empty CSV content provided' },
        { status: 400 }
      );
    }

    // 1. Parse and Clean CSV (Handles messy text, empty reviews, bad ratings, duplicates)
    const cleanedReviews = parseAndCleanCsv(csvContent);
    if (cleanedReviews.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid rows found in CSV' },
        { status: 400 }
      );
    }

    // 2. Setup LLM config & Cache
    const llmConfig = detectLlmConfig();
    const batchSize = Number(process.env.BATCH_SIZE) || 5;

    let aiCallsMade = 0;
    let cacheHits = 0;
    let batchesProcessed = 0;

    // Track processed results
    const processedMap = new Map<string, ProcessedReview>();
    const reviewsNeedingAi: CleanedReview[] = [];

    // 3. Check Cache & handle duplicates/empty reviews first
    for (const review of cleanedReviews) {
      // Empty review text -> skip analysis
      if (review.is_empty) {
        processedMap.set(review.review_id, {
          ...review,
          analysis_status: 'empty_skipped',
          summary: 'Review text is empty; skipped from AI analysis.',
        });
        continue;
      }

      // Check cache for this text hash
      const cached = reviewCache.get(review.text_hash);
      if (cached) {
        cacheHits++;
        processedMap.set(review.review_id, {
          ...review,
          sentiment: cached.sentiment,
          topics: cached.topics,
          summary: cached.summary,
          needs_reply: cached.needs_reply,
          analysis_status: review.is_duplicate ? 'duplicate' : 'from_cache',
        });
        continue;
      }

      // If duplicate of a review already in this upload that we'll analyze
      if (review.is_duplicate) {
        // Will be populated once canonical review is analyzed
        continue;
      }

      // Needs new LLM analysis
      reviewsNeedingAi.push(review);
    }

    // 4. Process new reviews in batches (Requirement 5)
    for (let i = 0; i < reviewsNeedingAi.length; i += batchSize) {
      const batch = reviewsNeedingAi.slice(i, i + batchSize);
      batchesProcessed++;

      // If live LLM or demo LLM
      aiCallsMade++;
      const batchResults = await analyzeBatch(batch, llmConfig);

      const itemsToCache: { hash: string; data: any }[] = [];

      for (const review of batch) {
        const res = batchResults.get(review.review_id);
        if (res && !res.failed && res.analysis) {
          processedMap.set(review.review_id, {
            ...review,
            sentiment: res.analysis.sentiment,
            topics: res.analysis.topics,
            summary: res.analysis.summary,
            needs_reply: res.analysis.needs_reply,
            analysis_status: 'analyzed',
            prompt_injection_flagged: review.cleaned_text.toLowerCase().includes('ignore all previous instructions'),
          });

          itemsToCache.push({
            hash: review.text_hash,
            data: res.analysis,
          });
        } else {
          // Requirement 3: Mark as analysis_failed instead of crashing
          processedMap.set(review.review_id, {
            ...review,
            analysis_status: 'analysis_failed',
            error_message: res?.error || 'Analysis failed',
            summary: 'Analysis failed schema validation or model error.',
          });
        }
      }

      // Save valid batch results to persistent cache (Requirement 6)
      if (itemsToCache.length > 0) {
        reviewCache.setBatch(itemsToCache, `${llmConfig.provider}:${llmConfig.model}`);
      }
    }

    // 5. Populate duplicates from the canonical reviews
    for (const review of cleanedReviews) {
      if (review.is_duplicate && !processedMap.has(review.review_id)) {
        const canonicalReview = review.duplicate_of
          ? processedMap.get(review.duplicate_of)
          : null;

        if (canonicalReview && canonicalReview.sentiment) {
          cacheHits++;
          processedMap.set(review.review_id, {
            ...review,
            sentiment: canonicalReview.sentiment,
            topics: canonicalReview.topics,
            summary: canonicalReview.summary,
            needs_reply: canonicalReview.needs_reply,
            analysis_status: 'duplicate',
            prompt_injection_flagged: canonicalReview.prompt_injection_flagged,
          });
        } else {
          // If canonical was skipped/failed
          processedMap.set(review.review_id, {
            ...review,
            analysis_status: 'duplicate',
            summary: `Duplicate of ${review.duplicate_of || 'earlier review'}.`,
          });
        }
      }
    }

    // 6. Assemble final ordered review list & check rating mismatches (Bonus 1)
    const finalReviews: ProcessedReview[] = cleanedReviews.map((r) => {
      const p = processedMap.get(r.review_id) || {
        ...r,
        analysis_status: 'analysis_failed' as const,
      };

      const mismatchCheck = checkRatingMismatch(p);
      if (mismatchCheck.isMismatch) {
        p.rating_mismatch = true;
        p.rating_mismatch_reason = mismatchCheck.reason;
      } else {
        p.rating_mismatch = false;
      }

      return p;
    });

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    // 7. Calculate aggregate statistics & insights
    const stats = calculateDashboardStats(finalReviews, {
      processing_time_ms: processingTimeMs,
      ai_calls_made: aiCallsMade,
      cache_hits: cacheHits,
      batches_processed: batchesProcessed,
      llm_provider: `${llmConfig.provider} (${llmConfig.model})`,
    });

    return NextResponse.json({
      success: true,
      reviews: finalReviews,
      stats,
    });
  } catch (error: any) {
    console.error('API Error in /api/analyze:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error while processing reviews',
      },
      { status: 500 }
    );
  }
}

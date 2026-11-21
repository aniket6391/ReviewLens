import {
  ProcessedReview,
  DashboardStats,
  ProductInsight,
  PraiseComplaintItem,
  TopicType,
} from './types';

/**
 * Checks for rating mismatch between customer star rating and AI detected sentiment.
 * Examples:
 * - 4 or 5 stars but sentiment is 'negative' (e.g., R008: 5 stars, broken handles)
 * - 1 or 2 stars but sentiment is 'positive'
 */
export function checkRatingMismatch(review: ProcessedReview): {
  isMismatch: boolean;
  reason?: string;
} {
  if (review.rating === null || !review.sentiment) {
    return { isMismatch: false };
  }

  // High rating (4 or 5) with negative sentiment
  if (review.rating >= 4 && review.sentiment === 'negative') {
    return {
      isMismatch: true,
      reason: `High rating (${review.rating}★) contradicts Negative sentiment ("${review.summary || review.cleaned_text.slice(0, 50)}")`,
    };
  }

  // Low rating (1 or 2) with positive sentiment
  if (review.rating <= 2 && review.sentiment === 'positive') {
    return {
      isMismatch: true,
      reason: `Low rating (${review.rating}★) contradicts Positive sentiment ("${review.summary || review.cleaned_text.slice(0, 50)}")`,
    };
  }

  return { isMismatch: false };
}

/**
 * Generates aggregated dashboard statistics, top 3 complaints/praises,
 * product-level breakdowns, and rating agreement metrics.
 */
export function calculateDashboardStats(
  reviews: ProcessedReview[],
  perf: {
    processing_time_ms: number;
    ai_calls_made: number;
    cache_hits: number;
    batches_processed: number;
    llm_provider: string;
  }
): DashboardStats {
  const totalInputRows = reviews.length;
  let totalAnalysed = 0;
  let totalEmptySkipped = 0;
  let totalDuplicates = 0;
  let totalFailed = 0;

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let needsReplyCount = 0;
  let ratingMismatchCount = 0;
  let ratedCount = 0;
  let agreedRatingCount = 0;

  const productMap: Record<string, ProcessedReview[]> = {};

  for (const r of reviews) {
    if (r.analysis_status === 'empty_skipped') {
      totalEmptySkipped++;
      continue;
    }
    if (r.analysis_status === 'duplicate') {
      totalDuplicates++;
    }
    if (r.analysis_status === 'analysis_failed') {
      totalFailed++;
      continue;
    }

    totalAnalysed++;

    if (r.sentiment) {
      sentimentCounts[r.sentiment]++;
    }

    if (r.needs_reply) {
      needsReplyCount++;
    }

    if (r.rating !== null && r.sentiment) {
      ratedCount++;
      const mismatch = checkRatingMismatch(r);
      if (mismatch.isMismatch) {
        ratingMismatchCount++;
      } else {
        agreedRatingCount++;
      }
    }

    const prodName = r.product || 'General';
    if (!productMap[prodName]) {
      productMap[prodName] = [];
    }
    productMap[prodName].push(r);
  }

  // Calculate sentiment percentages
  const sentimentPercentages = {
    positive: totalAnalysed > 0 ? Math.round((sentimentCounts.positive / totalAnalysed) * 100) : 0,
    neutral: totalAnalysed > 0 ? Math.round((sentimentCounts.neutral / totalAnalysed) * 100) : 0,
    negative: totalAnalysed > 0 ? Math.round((sentimentCounts.negative / totalAnalysed) * 100) : 0,
  };

  // Rating Agreement %
  const ratingAgreementPercentage =
    ratedCount > 0 ? Math.round((agreedRatingCount / ratedCount) * 100) : 100;

  // Compute Top 3 Praises & Top 3 Complaints
  const { topPraises, topComplaints } = extractTopPraisesAndComplaints(reviews);

  // Compute Product-level insights
  const productInsights: Record<string, ProductInsight> = {};
  for (const [prodName, prodReviews] of Object.entries(productMap)) {
    const pAnalysed = prodReviews.filter((r) => r.analysis_status !== 'empty_skipped');
    const pSentiment = { positive: 0, neutral: 0, negative: 0 };
    let pNeedsReply = 0;
    let pMismatches = 0;
    let ratingSum = 0;
    let ratingItems = 0;
    const topicCounts: Record<TopicType, number> = {
      quality: 0,
      delivery: 0,
      price: 0,
      packaging: 0,
      support: 0,
      size_fit: 0,
      other: 0,
    };

    for (const pr of pAnalysed) {
      if (pr.sentiment) pSentiment[pr.sentiment]++;
      if (pr.needs_reply) pNeedsReply++;
      if (pr.rating_mismatch) pMismatches++;
      if (pr.rating !== null) {
        ratingSum += pr.rating;
        ratingItems++;
      }
      if (pr.topics) {
        for (const t of pr.topics) {
          if (topicCounts[t] !== undefined) topicCounts[t]++;
        }
      }
    }

    const pTotal = pAnalysed.length;
    productInsights[prodName] = {
      product: prodName,
      total_reviews: pTotal,
      avg_rating: ratingItems > 0 ? Math.round((ratingSum / ratingItems) * 10) / 10 : null,
      sentiment_counts: pSentiment,
      sentiment_percentages: {
        positive: pTotal > 0 ? Math.round((pSentiment.positive / pTotal) * 100) : 0,
        neutral: pTotal > 0 ? Math.round((pSentiment.neutral / pTotal) * 100) : 0,
        negative: pTotal > 0 ? Math.round((pSentiment.negative / pTotal) * 100) : 0,
      },
      top_topics: Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic: topic as TopicType, count }))
        .sort((a, b) => b.count - a.count)
        .filter((t) => t.count > 0),
      needs_reply_count: pNeedsReply,
      rating_mismatches: pMismatches,
    };
  }

  const cacheHitRate =
    totalAnalysed > 0
      ? Math.round((perf.cache_hits / (perf.cache_hits + perf.ai_calls_made || 1)) * 100)
      : 0;

  return {
    total_input_rows: totalInputRows,
    total_analysed: totalAnalysed,
    total_empty_skipped: totalEmptySkipped,
    total_duplicates: totalDuplicates,
    total_failed: totalFailed,
    sentiment_counts: sentimentCounts,
    sentiment_percentages: sentimentPercentages,
    needs_reply_count: needsReplyCount,
    rating_mismatch_count: ratingMismatchCount,
    rating_agreement_percentage: ratingAgreementPercentage,
    top_3_praises: topPraises,
    top_3_complaints: topComplaints,
    product_insights: productInsights,
    performance: {
      processing_time_ms: perf.processing_time_ms,
      ai_calls_made: perf.ai_calls_made,
      cache_hits: perf.cache_hits,
      cache_hit_rate: cacheHitRate,
      batches_processed: perf.batches_processed,
      llm_provider: perf.llm_provider,
    },
  };
}

/**
 * Extracts Top 3 Praises and Top 3 Complaints from analysed reviews
 */
function extractTopPraisesAndComplaints(reviews: ProcessedReview[]): {
  topPraises: PraiseComplaintItem[];
  topComplaints: PraiseComplaintItem[];
} {
  const praisesByTopic: Record<TopicType, ProcessedReview[]> = {
    quality: [],
    delivery: [],
    price: [],
    packaging: [],
    support: [],
    size_fit: [],
    other: [],
  };

  const complaintsByTopic: Record<TopicType, ProcessedReview[]> = {
    quality: [],
    delivery: [],
    price: [],
    packaging: [],
    support: [],
    size_fit: [],
    other: [],
  };

  for (const r of reviews) {
    if (r.analysis_status === 'empty_skipped' || r.analysis_status === 'analysis_failed') continue;
    if (!r.topics) continue;

    if (r.sentiment === 'positive') {
      for (const t of r.topics) {
        praisesByTopic[t]?.push(r);
      }
    } else if (r.sentiment === 'negative' || r.needs_reply) {
      for (const t of r.topics) {
        complaintsByTopic[t]?.push(r);
      }
    }
  }

  const topicLabels: Record<TopicType, { praise: string; complaint: string }> = {
    quality: {
      praise: 'Product Build, Fabric & Material Quality',
      complaint: 'Defects, Broken Parts & Durability Issues',
    },
    size_fit: {
      praise: 'Comfortable Fit & Ergonomic Design',
      complaint: 'Misleading Size Charts & Inaccurate Sizing',
    },
    delivery: {
      praise: 'Fast & Next-Day Delivery',
      complaint: 'Extensive Delivery Delays & Lost Packages',
    },
    price: {
      praise: 'Great Value for Price',
      complaint: 'Overpriced Compared to Market Alternatives',
    },
    support: {
      praise: 'Helpful & Smooth Exchange Support',
      complaint: 'Slow Support Responses & Unresolved Refund Tickets',
    },
    packaging: {
      praise: 'Clean & Well-Protected Packaging',
      complaint: 'Damaged, Torn, or Smashed Delivery Boxes',
    },
    other: {
      praise: 'Aesthetic Design & Easy Everyday Use',
      complaint: 'Missing Product Specs (e.g. Microwave Safety, Instructions)',
    },
  };

  const sortedPraises = Object.entries(praisesByTopic)
    .map(([topic, items]) => ({
      topic: topic as TopicType,
      theme: topicLabels[topic as TopicType]?.praise || topic,
      product: items[0]?.product || 'All Products',
      count: items.length,
      sample_reviews: items.slice(0, 2).map((item) => ({
        review_id: item.review_id,
        text: item.cleaned_text,
        summary: item.summary || item.cleaned_text.slice(0, 60),
      })),
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const sortedComplaints = Object.entries(complaintsByTopic)
    .map(([topic, items]) => ({
      topic: topic as TopicType,
      theme: topicLabels[topic as TopicType]?.complaint || topic,
      product: items[0]?.product || 'All Products',
      count: items.length,
      sample_reviews: items.slice(0, 2).map((item) => ({
        review_id: item.review_id,
        text: item.cleaned_text,
        summary: item.summary || item.cleaned_text.slice(0, 60),
      })),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    topPraises: sortedPraises,
    topComplaints: sortedComplaints,
  };
}

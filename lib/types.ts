export type SentimentType = 'positive' | 'neutral' | 'negative';

export type TopicType =
  | 'quality'
  | 'delivery'
  | 'price'
  | 'packaging'
  | 'support'
  | 'size_fit'
  | 'other';

export const ALLOWED_SENTIMENTS: SentimentType[] = ['positive', 'neutral', 'negative'];

export const ALLOWED_TOPICS: TopicType[] = [
  'quality',
  'delivery',
  'price',
  'packaging',
  'support',
  'size_fit',
  'other',
];

export interface RawCsvRow {
  review_id?: string;
  product?: string;
  rating?: string | number;
  date?: string;
  review_text?: string;
  [key: string]: any;
}

export interface CleanedReview {
  review_id: string;
  product: string;
  rating: number | null; // null if missing or invalid like "five"
  rating_raw: string;
  date: string;
  review_text: string;
  cleaned_text: string;
  text_hash: string;
  is_empty: boolean;
  is_duplicate: boolean;
  duplicate_of: string | null;
  status: 'valid' | 'empty_skipped' | 'duplicate';
}

export interface AiAnalysisResult {
  sentiment: SentimentType;
  topics: TopicType[];
  summary: string;
  needs_reply: boolean;
}

export interface ProcessedReview extends CleanedReview {
  sentiment?: SentimentType;
  topics?: TopicType[];
  summary?: string;
  needs_reply?: boolean;
  analysis_status: 'analyzed' | 'from_cache' | 'empty_skipped' | 'duplicate' | 'analysis_failed';
  rating_mismatch?: boolean;
  rating_mismatch_reason?: string;
  error_message?: string;
  suggested_reply?: string;
  prompt_injection_flagged?: boolean;
}

export interface PraiseComplaintItem {
  topic: TopicType;
  theme: string;
  product: string;
  count: number;
  sample_reviews: {
    review_id: string;
    text: string;
    summary: string;
  }[];
}

export interface ProductInsight {
  product: string;
  total_reviews: number;
  avg_rating: number | null;
  sentiment_counts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentiment_percentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_topics: { topic: TopicType; count: number }[];
  needs_reply_count: number;
  rating_mismatches: number;
}

export interface DashboardStats {
  total_input_rows: number;
  total_analysed: number;
  total_empty_skipped: number;
  total_duplicates: number;
  total_failed: number;
  sentiment_counts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentiment_percentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  needs_reply_count: number;
  rating_mismatch_count: number;
  rating_agreement_percentage: number;
  top_3_praises: PraiseComplaintItem[];
  top_3_complaints: PraiseComplaintItem[];
  product_insights: Record<string, ProductInsight>;
  performance: {
    processing_time_ms: number;
    ai_calls_made: number;
    cache_hits: number;
    cache_hit_rate: number;
    batches_processed: number;
    llm_provider: string;
  };
}

export interface AnalyzeApiResponse {
  success: boolean;
  reviews: ProcessedReview[];
  stats: DashboardStats;
  message?: string;
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ProcessedReview, SentimentType, TopicType } from '@/lib/types';

interface ReviewsTableProps {
  reviews: ProcessedReview[];
  selectedProduct: string;
  onSelectProduct: (p: string) => void;
  selectedSentiment: string;
  onSelectSentiment: (s: any) => void;
  selectedTopic: string;
  onSelectTopic: (t: string) => void;
  filterFlag: string;
  onSelectFilterFlag: (f: string) => void;
  onOpenReplyModal: (review: ProcessedReview) => void;
}

export const ReviewsTable: React.FC<ReviewsTableProps> = ({
  reviews,
  selectedProduct,
  onSelectProduct,
  selectedSentiment,
  onSelectSentiment,
  selectedTopic,
  onSelectTopic,
  filterFlag,
  onSelectFilterFlag,
  onOpenReplyModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract unique products
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    for (const r of reviews) {
      if (r.product) set.add(r.product);
    }
    return Array.from(set).sort();
  }, [reviews]);

  // Counts for quick chips
  const counts = useMemo(() => {
    return {
      all: reviews.length,
      needsReply: reviews.filter((r) => r.needs_reply).length,
      positive: reviews.filter((r) => r.sentiment === 'positive').length,
      neutral: reviews.filter((r) => r.sentiment === 'neutral').length,
      negative: reviews.filter((r) => r.sentiment === 'negative').length,
      mismatch: reviews.filter((r) => r.rating_mismatch).length,
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Product Filter
      if (selectedProduct !== 'all' && r.product !== selectedProduct) {
        return false;
      }

      // 2. Sentiment Filter
      if (selectedSentiment !== 'all' && r.sentiment !== selectedSentiment) {
        return false;
      }

      // 3. Topic Filter
      if (selectedTopic !== 'all') {
        if (!r.topics || !r.topics.includes(selectedTopic as TopicType)) {
          return false;
        }
      }

      // 4. Special Flags Filter
      if (filterFlag === 'needs_reply' && !r.needs_reply) return false;
      if (filterFlag === 'mismatch' && !r.rating_mismatch) return false;
      if (filterFlag === 'duplicates' && !r.is_duplicate) return false;
      if (filterFlag === 'empty' && !r.is_empty) return false;
      if (filterFlag === 'injection' && !r.prompt_injection_flagged) return false;
      if (filterFlag === 'failed' && r.analysis_status !== 'analysis_failed') return false;

      // 5. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesText = r.review_text.toLowerCase().includes(q);
        const matchesSummary = (r.summary || '').toLowerCase().includes(q);
        const matchesId = r.review_id.toLowerCase().includes(q);
        const matchesProduct = r.product.toLowerCase().includes(q);
        if (!matchesText && !matchesSummary && !matchesId && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, selectedProduct, selectedSentiment, selectedTopic, filterFlag, searchQuery]);

  const resetAllFilters = () => {
    onSelectProduct('all');
    onSelectSentiment('all');
    onSelectTopic('all');
    onSelectFilterFlag('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedProduct !== 'all' ||
    selectedSentiment !== 'all' ||
    selectedTopic !== 'all' ||
    filterFlag !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Search and Quick Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => {
              onSelectFilterFlag('all');
              onSelectSentiment('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              filterFlag === 'all' && selectedSentiment === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Reviews ({counts.all})
          </button>

          <button
            onClick={() => {
              onSelectFilterFlag('needs_reply');
              onSelectSentiment('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1 ${
              filterFlag === 'needs_reply'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>⚠️ Needs Reply ({counts.needsReply})</span>
          </button>

          <button
            onClick={() => {
              onSelectSentiment('positive');
              onSelectFilterFlag('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              selectedSentiment === 'positive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Positive ({counts.positive})
          </button>

          <button
            onClick={() => {
              onSelectSentiment('neutral');
              onSelectFilterFlag('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              selectedSentiment === 'neutral'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Neutral ({counts.neutral})
          </button>

          <button
            onClick={() => {
              onSelectSentiment('negative');
              onSelectFilterFlag('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              selectedSentiment === 'negative'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Negative ({counts.negative})
          </button>

          {counts.mismatch > 0 && (
            <button
              onClick={() => {
                onSelectFilterFlag('mismatch');
                onSelectSentiment('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterFlag === 'mismatch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              ⚖️ Rating Mismatch ({counts.mismatch})
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="ml-auto text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Search & Product Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, product name, or review ID..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedProduct}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="all">Filter by Product: All</option>
              {uniqueProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Review Cards / Clean List Table */}
      <div className="divide-y divide-slate-100">
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No reviews found matching your filter</p>
            <button
              onClick={resetAllFilters}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isExpanded = expandedRows[r.review_id];
            return (
              <div
                key={r.review_id}
                className={`p-4 sm:p-5 transition-colors hover:bg-slate-50/70 ${
                  r.rating_mismatch ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Left: Product, Stars, Summary */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Product Name */}
                      <span className="font-bold text-slate-900">{r.product}</span>
                      <span className="text-slate-300">•</span>

                      {/* Stars */}
                      {r.rating !== null ? (
                        <span className="flex items-center text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                          <span>{r.rating}★</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Rating: Unknown {r.rating_raw ? `('${r.rating_raw}')` : ''}
                        </span>
                      )}

                      <span className="text-slate-300">•</span>

                      {/* Sentiment Badge */}
                      {r.sentiment === 'positive' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Positive
                        </span>
                      )}
                      {r.sentiment === 'neutral' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Neutral
                        </span>
                      )}
                      {r.sentiment === 'negative' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Negative
                        </span>
                      )}

                      {/* Topic Tags */}
                      {r.topics &&
                        r.topics.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            {t}
                          </span>
                        ))}

                      {/* Special Alert: Rating Mismatch */}
                      {r.rating_mismatch && (
                        <span
                          title={r.rating_mismatch_reason}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>Mismatch (5★ vs text)</span>
                        </span>
                      )}

                      {/* Special: Prompt Injection Shield */}
                      {r.prompt_injection_flagged && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Adversarial Prompt Ignored</span>
                        </span>
                      )}

                      {/* Duplicate badge */}
                      {r.is_duplicate && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                          Duplicate of {r.duplicate_of} (cached)
                        </span>
                      )}
                    </div>

                    {/* AI Summary in clean English */}
                    <p className="text-sm font-semibold text-slate-800 leading-snug pt-0.5">
                      {r.summary || 'Empty review text (skipped)'}
                    </p>

                    {/* Toggle original review text */}
                    <div>
                      <button
                        onClick={() => toggleExpand(r.review_id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-1 mt-1"
                      >
                        <span>{isExpanded ? 'Hide original review' : 'Read original review'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1 animate-in fade-in duration-100">
                          <p className="italic whitespace-pre-wrap">
                            &quot;{r.review_text || 'No review text provided'}&quot;
                          </p>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                            <span>ID: {r.review_id}</span>
                            <span>•</span>
                            <span>Date: {r.date}</span>
                            {r.rating_mismatch_reason && (
                              <>
                                <span>•</span>
                                <span className="text-amber-800 font-medium">
                                  {r.rating_mismatch_reason}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center sm:self-center">
                    {r.needs_reply ? (
                      <button
                        onClick={() => onOpenReplyModal(r)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {r.suggested_reply ? 'View Reply Draft' : 'Draft Reply'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 py-1.5 px-3 rounded-lg bg-slate-50">
                        No reply needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

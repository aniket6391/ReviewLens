'use client';

import React from 'react';
import {
  FileText,
  Smile,
  Meh,
  Frown,
  MessageSquareWarning,
  Scale,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface SummaryCardsProps {
  stats: DashboardStats;
  onFilterNeedsReply: () => void;
  onFilterRatingMismatch: () => void;
  onFilterSentiment: (sentiment: 'positive' | 'neutral' | 'negative' | 'all') => void;
  activeFilter?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  onFilterNeedsReply,
  onFilterRatingMismatch,
  onFilterSentiment,
  activeFilter,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Reviews Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {stats.total_analysed}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {stats.total_input_rows} total rows ({stats.total_empty_skipped} empty skipped)
        </p>
      </div>

      {/* 2. Customer Sentiment Split Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Sentiment Split</span>
          <div className="flex items-center space-x-1">
            <Smile className="w-3.5 h-3.5 text-emerald-500" />
            <Meh className="w-3.5 h-3.5 text-amber-500" />
            <Frown className="w-3.5 h-3.5 text-rose-500" />
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <button
            onClick={() => onFilterSentiment('positive')}
            className="text-left group"
            title="Filter Positive reviews"
          >
            <span className="text-xl font-bold text-emerald-600 group-hover:underline">
              {stats.sentiment_percentages.positive}%
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Positive</span>
          </button>

          <button
            onClick={() => onFilterSentiment('neutral')}
            className="text-left group"
            title="Filter Neutral reviews"
          >
            <span className="text-xl font-bold text-amber-500 group-hover:underline">
              {stats.sentiment_percentages.neutral}%
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Neutral</span>
          </button>

          <button
            onClick={() => onFilterSentiment('negative')}
            className="text-left group"
            title="Filter Negative reviews"
          >
            <span className="text-xl font-bold text-rose-600 group-hover:underline">
              {stats.sentiment_percentages.negative}%
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Negative</span>
          </button>
        </div>

        {/* Stacked Sentiment Visual Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mt-3">
          <div
            style={{ width: `${stats.sentiment_percentages.positive}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Positive: ${stats.sentiment_counts.positive}`}
          />
          <div
            style={{ width: `${stats.sentiment_percentages.neutral}%` }}
            className="bg-amber-400 h-full transition-all"
            title={`Neutral: ${stats.sentiment_counts.neutral}`}
          />
          <div
            style={{ width: `${stats.sentiment_percentages.negative}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Negative: ${stats.sentiment_counts.negative}`}
          />
        </div>
      </div>

      {/* 3. Needs Your Reply (High Priority Action) */}
      <div
        onClick={onFilterNeedsReply}
        className={`bg-white rounded-2xl border p-5 shadow-sm transition-all cursor-pointer group ${
          activeFilter === 'needs_reply'
            ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
            : 'border-slate-200/90 hover:border-rose-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 group-hover:underline">
            Needs Your Reply
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <MessageSquareWarning className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
          {stats.needs_reply_count}
        </div>
        <div className="flex items-center justify-between text-xs text-rose-700 mt-1.5 font-medium">
          <span>Complaints needing attention</span>
          <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 4. Rating Agreement (Bonus 1) */}
      <div
        onClick={onFilterRatingMismatch}
        className={`bg-white rounded-2xl border p-5 shadow-sm transition-all cursor-pointer group ${
          activeFilter === 'mismatch'
            ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20'
            : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Rating Agreement
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">
          {stats.rating_agreement_percentage}%
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {stats.rating_mismatch_count > 0 ? (
            <span className="text-amber-700 font-semibold">
              ⚠️ {stats.rating_mismatch_count} mismatch flagged (Click to see)
            </span>
          ) : (
            'All ratings match sentiment'
          )}
        </p>
      </div>
    </div>
  );
};

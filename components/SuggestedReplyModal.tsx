'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  Smile,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { ProcessedReview } from '@/lib/types';

interface SuggestedReplyModalProps {
  review: ProcessedReview | null;
  onClose: () => void;
  onSaveReply?: (reviewId: string, reply: string) => void;
}

export const SuggestedReplyModal: React.FC<SuggestedReplyModalProps> = ({
  review,
  onClose,
  onSaveReply,
}) => {
  const [replyText, setReplyText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!review) return;

    if (review.suggested_reply) {
      setReplyText(review.suggested_reply);
    } else {
      generateReply();
    }
    setCopied(false);
  }, [review]);

  const generateReply = async () => {
    if (!review) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.review_id,
          product: review.product,
          rating: review.rating,
          review_text: review.review_text,
          summary: review.summary,
          topics: review.topics,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await res.json();
      setReplyText(data.reply);
      if (onSaveReply) {
        onSaveReply(review.review_id, data.reply);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with reply generator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!replyText) return;
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reply to Customer
              </h3>
              <p className="text-xs text-slate-500">
                AI-drafted personalized response addressing their exact issue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Customer review context */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>{review.product}</span>
              <span className="text-slate-500 font-normal">
                Rating: {review.rating !== null ? `${review.rating}★` : 'Not provided'}
              </span>
            </div>
            <p className="text-xs text-slate-600 italic">
              &quot;{review.review_text}&quot;
            </p>
            {review.summary && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <strong>Issue:</strong> {review.summary}
              </p>
            )}
          </div>

          {/* AI Generated Reply */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Suggested Response</span>
              </label>

              <button
                onClick={generateReply}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 disabled:opacity-50 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>

            {isLoading ? (
              <div className="h-32 flex flex-col items-center justify-center space-y-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500">
                  Crafting personalized, empathetic store reply...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none shadow-sm"
                placeholder="Suggested response will appear here..."
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Click copy to paste into email or Shopify support
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Done
            </button>
            <button
              onClick={handleCopy}
              disabled={isLoading || !replyText}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

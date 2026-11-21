'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { PerformanceStats } from '@/components/PerformanceStats';
import { SummaryCards } from '@/components/SummaryCards';
import { TopPraisesComplaints } from '@/components/TopPraisesComplaints';
import { ProductView } from '@/components/ProductView';
import { ReviewsTable } from '@/components/ReviewsTable';
import { SuggestedReplyModal } from '@/components/SuggestedReplyModal';
import { ProcessedReview, DashboardStats } from '@/lib/types';
import {
  MessageSquare,
  Lightbulb,
  Package,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ total_entries: number; storage_type: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active View Tab: 'reviews' | 'insights' | 'products' | 'telemetry'
  const [activeTab, setActiveTab] = useState<'reviews' | 'insights' | 'products' | 'telemetry'>('reviews');

  // Filters state
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'positive' | 'neutral' | 'negative' | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [filterFlag, setFilterFlag] = useState('all');

  // Modal state
  const [activeReplyReview, setActiveReplyReview] = useState<ProcessedReview | null>(null);

  // Fetch cache stats on mount
  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const res = await fetch('/api/cache');
      if (res.ok) {
        const data = await res.json();
        setCacheStats({
          total_entries: data.total_entries || 0,
          storage_type: data.storage_type || 'sqlite',
        });
      }
    } catch {
      // Ignore initial cache stat fetch error
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await fetch('/api/cache', { method: 'DELETE' });
      if (res.ok) {
        await fetchCacheStats();
        setReviews([]);
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to clear cache', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleAnalyze = async (csvContent: string) => {
    setIsProcessing(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Analysis failed');
      }

      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      await fetchCacheStats();
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during review analysis');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickLoadSample = async () => {
    setUploadError(null);
    try {
      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Could not load sample dataset');
      const csvText = await res.text();
      await handleAnalyze(csvText);
    } catch (err: any) {
      setUploadError(err.message || 'Error loading sample dataset');
    }
  };

  const handleSaveReply = (reviewId: string, reply: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.review_id === reviewId ? { ...r, suggested_reply: reply } : r))
    );
  };

  const handleFilterNeedsReply = () => {
    setFilterFlag('needs_reply');
    setSelectedSentiment('all');
    setSelectedProduct('all');
    setSelectedTopic('all');
    setActiveTab('reviews');
  };

  const handleFilterRatingMismatch = () => {
    setFilterFlag('mismatch');
    setSelectedSentiment('all');
    setSelectedProduct('all');
    setSelectedTopic('all');
    setActiveTab('reviews');
  };

  const handleFilterSentiment = (s: 'positive' | 'neutral' | 'negative' | 'all') => {
    setSelectedSentiment(s);
    setFilterFlag('all');
    setActiveTab('reviews');
  };

  const handleSelectTopicFromInsight = (topic: string) => {
    setSelectedTopic(topic);
    setActiveTab('reviews');
  };

  const handleSelectProductFromInsight = (productName: string) => {
    setSelectedProduct(productName);
    setActiveTab('reviews');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        onClearCache={handleClearCache}
        isClearingCache={isClearingCache}
        cacheStats={cacheStats}
        llmProvider={stats?.performance.llm_provider}
        onLoadSample={handleQuickLoadSample}
        hasData={Boolean(stats)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Upload Zone (Adapts to compact bar when data loaded) */}
        <UploadZone
          onAnalyze={handleAnalyze}
          isProcessing={isProcessing}
          totalRows={reviews.length}
          hasData={Boolean(stats)}
        />

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-rose-900 shadow-sm animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 font-bold text-rose-800 text-sm">
                  <span>⚠️ Unrecognized CSV Format</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
                  {uploadError}
                </p>
                <p className="text-[11px] text-rose-600 font-medium pt-1">
                  Expected CSV headers: <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">review_id, product, rating, date, review_text</code>
                </p>
              </div>

              <button
                onClick={handleQuickLoadSample}
                disabled={isProcessing}
                className="self-start sm:self-center inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all whitespace-nowrap"
              >
                <span>⚡ Load reviews.csv Dataset</span>
              </button>
            </div>
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Top Summary Metric Cards */}
            <SummaryCards
              stats={stats}
              onFilterNeedsReply={handleFilterNeedsReply}
              onFilterRatingMismatch={handleFilterRatingMismatch}
              onFilterSentiment={handleFilterSentiment}
              activeFilter={filterFlag}
            />

            {/* Navigation Tabs Bar */}
            <div className="flex items-center space-x-1 border-b border-slate-200/80 pb-px text-sm font-semibold">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>All Reviews ({reviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Key Praises & Complaints</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Product Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  activeTab === 'telemetry'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Speed & Cache</span>
              </button>
            </div>

            {/* Tab 1: All Reviews Table */}
            {activeTab === 'reviews' && (
              <ReviewsTable
                reviews={reviews}
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                selectedSentiment={selectedSentiment}
                onSelectSentiment={setSelectedSentiment}
                selectedTopic={selectedTopic}
                onSelectTopic={setSelectedTopic}
                filterFlag={filterFlag}
                onSelectFilterFlag={setFilterFlag}
                onOpenReplyModal={(review) => setActiveReplyReview(review)}
              />
            )}

            {/* Tab 2: Praises & Complaints */}
            {activeTab === 'insights' && (
              <div>
                <TopPraisesComplaints
                  topPraises={stats.top_3_praises}
                  topComplaints={stats.top_3_complaints}
                  onSelectTopic={handleSelectTopicFromInsight}
                />
              </div>
            )}

            {/* Tab 3: Products Breakdown */}
            {activeTab === 'products' && (
              <ProductView
                products={stats.product_insights}
                selectedProduct={selectedProduct}
                onSelectProduct={handleSelectProductFromInsight}
              />
            )}

            {/* Tab 4: Performance & Telemetry */}
            {activeTab === 'telemetry' && (
              <PerformanceStats
                performance={stats.performance}
                totalAnalysed={stats.total_analysed}
              />
            )}
          </div>
        )}
      </main>

      {/* Suggested Reply Modal */}
      <SuggestedReplyModal
        review={activeReplyReview}
        onClose={() => setActiveReplyReview(null)}
        onSaveReply={handleSaveReply}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 ReviewLens · CEDCOSS Assessment</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Clean Data Pipeline</span>
            <span>•</span>
            <span>Prompt Injection Hardened</span>
            <span>•</span>
            <span>SQLite Cache</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

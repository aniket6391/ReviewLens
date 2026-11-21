'use client';

import React from 'react';
import { Sparkles, Trash2, ShieldCheck, Zap, Play } from 'lucide-react';

interface NavbarProps {
  onClearCache: () => void;
  isClearingCache: boolean;
  cacheStats?: { total_entries: number; storage_type: string } | null;
  llmProvider?: string;
  onLoadSample?: () => void;
  hasData?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onClearCache,
  isClearingCache,
  cacheStats,
  llmProvider,
  onLoadSample,
  hasData,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                ReviewLens
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                AI Store Insights
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 text-xs">
          {!hasData && onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span>Load Sample</span>
            </button>
          )}

          {/* Cache Counter & Clear */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-500 hidden sm:inline">
              Cached: <strong>{cacheStats ? cacheStats.total_entries : 0}</strong>
            </span>
            <button
              onClick={onClearCache}
              disabled={isClearingCache}
              title="Reset and clear cached review analysis"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

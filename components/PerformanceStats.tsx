'use client';

import React from 'react';
import { Clock, Cpu, Database, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface PerformanceStatsProps {
  performance: DashboardStats['performance'];
  totalAnalysed: number;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  performance,
  totalAnalysed,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Speed & Cost Efficiency
            </h3>
            <p className="text-xs text-slate-500">
              Demonstrating batch processing, SQLite caching, and zero API cost
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cost: Free Tier ($0.00)</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
            {performance.llm_provider}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Processing Time */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">Total Time</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {(performance.processing_time_ms / 1000).toFixed(2)}s
          </p>
          <span className="text-[11px] text-slate-400">
            {performance.batches_processed} batches dispatched
          </span>
        </div>

        {/* AI API Calls */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">AI Calls Made</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {performance.ai_calls_made}
          </p>
          <span className="text-[11px] text-slate-400">Rate-limit safe</span>
        </div>

        {/* Served From Cache */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">Cache Hits</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 font-mono">
            {performance.cache_hits} reviews
          </p>
          <span className="text-[11px] text-slate-400">Saved redundant calls</span>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">Hit Rate</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {performance.cache_hit_rate}%
          </p>
          <span className="text-[11px] text-slate-400">SQLite persistent</span>
        </div>
      </div>
    </div>
  );
};

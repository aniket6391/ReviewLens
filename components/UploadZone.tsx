'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface UploadZoneProps {
  onAnalyze: (csvContent: string) => Promise<void>;
  isProcessing: boolean;
  totalRows?: number;
  hasData?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyze,
  isProcessing,
  totalRows = 0,
  hasData = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        await onAnalyze(content);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleLoad = async () => {
    setError(null);
    setSelectedFileName('reviews.csv');
    try {
      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Could not load sample dataset');
      const csvText = await res.text();
      await onAnalyze(csvText);
    } catch (err: any) {
      setError(err.message || 'Error loading sample dataset');
    }
  };

  // Compact bar when data is already loaded
  if (hasData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800">
                {selectedFileName || 'reviews.csv'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-medium">
                {totalRows} Reviews Loaded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cleaned, deduplicated, and analyzed with AI insights
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Upload New CSV</span>
          </button>

          <button
            onClick={handleSampleLoad}
            disabled={isProcessing}
            title="Reload official assessment dataset"
            className="inline-flex items-center justify-center p-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Welcoming, clean Hero Card when no data is loaded
  return (
    <div className="max-w-2xl mx-auto my-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl border-2 transition-all p-8 sm:p-10 text-center shadow-sm ${
          dragOver
            ? 'border-blue-500 bg-blue-50/40 scale-[1.01]'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Friendly Hero Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ReviewLens Insights
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
          Instantly transform customer reviews into clear actions: see what shoppers love, what they complain about, and draft quick replies.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleSampleLoad}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Load Sample reviews.csv</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Upload Your CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* Subtle dropzone note */}
        <p className="text-xs text-slate-400 mt-4">
          Or simply drag and drop your <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">reviews.csv</code> here
        </p>

        {/* Error message if any */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-6 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-blue-900 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing reviews with AI (batching & cache check)...</span>
            </div>
            <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

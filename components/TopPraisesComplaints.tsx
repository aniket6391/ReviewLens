'use client';

import React from 'react';
import { ThumbsUp, ThumbsDown, MessageSquareQuote, CheckCircle, AlertTriangle } from 'lucide-react';
import { PraiseComplaintItem } from '@/lib/types';

interface TopPraisesComplaintsProps {
  topPraises: PraiseComplaintItem[];
  topComplaints: PraiseComplaintItem[];
  onSelectTopic: (topic: string) => void;
}

export const TopPraisesComplaints: React.FC<TopPraisesComplaintsProps> = ({
  topPraises,
  topComplaints,
  onSelectTopic,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Praises Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-70"></div>
        <div className="flex items-center space-x-3 mb-5 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Top 3 What Customers Love
            </h3>
            <p className="text-xs text-slate-500">
              Key drivers of positive customer sentiment across all products
            </p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {topPraises.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No positive reviews detected yet.</p>
          ) : (
            topPraises.map((item, index) => (
              <div
                key={index}
                onClick={() => onSelectTopic(item.topic)}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">
                      {item.theme}
                    </span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-mono">
                    {item.count} {item.count === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                {item.sample_reviews.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100 flex items-start space-x-2">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="italic line-clamp-2">
                      &quot;{item.sample_reviews[0].text.replace(/\n/g, ' ')}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complaints Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 opacity-70"></div>
        <div className="flex items-center space-x-3 mb-5 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center">
            <ThumbsDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Top 3 Critical Complaints
            </h3>
            <p className="text-xs text-slate-500">
              Primary pain points causing customer dissatisfaction and churn
            </p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {topComplaints.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No complaints detected yet.</p>
          ) : (
            topComplaints.map((item, index) => (
              <div
                key={index}
                onClick={() => onSelectTopic(item.topic)}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/70 hover:border-rose-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-rose-900">
                      {item.theme}
                    </span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 font-mono">
                    {item.count} {item.count === 1 ? 'complaint' : 'complaints'}
                  </span>
                </div>

                {item.sample_reviews.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100 flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="italic line-clamp-2">
                      &quot;{item.sample_reviews[0].text.replace(/\n/g, ' ')}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

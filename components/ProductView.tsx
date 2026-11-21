'use client';

import React from 'react';
import { Package, Star, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';
import { ProductInsight } from '@/lib/types';

interface ProductViewProps {
  products: Record<string, ProductInsight>;
  selectedProduct: string;
  onSelectProduct: (productName: string) => void;
}

export const ProductView: React.FC<ProductViewProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
}) => {
  const productList = Object.values(products);

  if (productList.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Product-Level Intelligence
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Bonus Feature
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual sentiment distributions, average ratings & topic frequencies by product SKU
          </p>
        </div>

        {selectedProduct !== 'all' && (
          <button
            onClick={() => onSelectProduct('all')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
          >
            Reset to All Products
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productList.map((prod) => {
          const isSelected = selectedProduct === prod.product;
          return (
            <div
              key={prod.product}
              onClick={() => onSelectProduct(prod.product)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                  : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {prod.product}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      {prod.avg_rating !== null ? `${prod.avg_rating} / 5` : 'N/A'}
                    </span>
                    <span>·</span>
                    <span>{prod.total_reviews} reviews</span>
                  </div>
                </div>

                <div className="text-right">
                  {prod.needs_reply_count > 0 && (
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {prod.needs_reply_count} reply needed
                    </span>
                  )}
                </div>
              </div>

              {/* Sentiment percentage bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span className="text-emerald-700 font-semibold">
                    {prod.sentiment_percentages.positive}% Pos
                  </span>
                  <span className="text-amber-700">
                    {prod.sentiment_percentages.neutral}% Neu
                  </span>
                  <span className="text-rose-700 font-semibold">
                    {prod.sentiment_percentages.negative}% Neg
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 flex overflow-hidden">
                  <div
                    style={{ width: `${prod.sentiment_percentages.positive}%` }}
                    className="bg-emerald-500 h-full"
                  />
                  <div
                    style={{ width: `${prod.sentiment_percentages.neutral}%` }}
                    className="bg-amber-400 h-full"
                  />
                  <div
                    style={{ width: `${prod.sentiment_percentages.negative}%` }}
                    className="bg-rose-500 h-full"
                  />
                </div>
              </div>

              {/* Top topics pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {prod.top_topics.slice(0, 3).map((t) => (
                  <span
                    key={t.topic}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200"
                  >
                    {t.topic} ({t.count})
                  </span>
                ))}
              </div>

              {/* Filter callout */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 group">
                <span>{isSelected ? 'Currently Filtering' : 'Filter Reviews'}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Star, CheckCircle, MessageSquare, Heart, Sparkles, Box } from 'lucide-react';
import { REVIEWS } from '../data';

export const ReviewsSection: React.FC = () => {
  return (
    <section
      id="reviews"
      className="relative py-20 px-4 sm:px-8 bg-[#fafafa] text-gray-950 border-t border-gray-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black mb-2">
              <MessageSquare size={13} />
              <span>Verified Customer Feedback</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-black"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              WHAT DEVOTEES & GAMERS SAY
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              From temple pooja altars and vehicle dashboards to competitive battle stations, here is what our customers experience with our 3D prints.
            </p>
          </div>
        </div>

        {/* Reviews Cards Container / Slot */}
        {REVIEWS.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>

                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-800">
                      {rev.category === 'god-idols' && <Heart size={10} className="fill-amber-500 text-amber-500" />}
                      {rev.category === 'custom-prints' && <Sparkles size={10} className="text-amber-500" />}
                      {rev.category === 'figurines' && <Box size={10} className="text-gray-700" />}
                      <span>
                        {rev.category === 'god-idols'
                          ? 'God Idol'
                          : rev.category === 'custom-prints'
                          ? 'Custom Print'
                          : 'Figurine'}
                      </span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed italic mb-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-black uppercase">
                        {rev.author}
                      </h4>
                      <span className="text-[10px] text-gray-500">{rev.location}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} />
                      Verified Print
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-gray-400 truncate">
                    {rev.figurineName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xs p-10 sm:p-14 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-700">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-1.5">
              Genuine Customer Reviews Coming Soon
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              We are collecting verified feedback and unboxing photos from our customers. Genuine testimonials will be displayed here soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

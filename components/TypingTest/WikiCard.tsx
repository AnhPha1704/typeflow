'use client';

import React from 'react';
import { WikiPageData } from '@/utils/fetchWikiText';

interface WikiCardProps {
  data: WikiPageData;
}

export const WikiCard: React.FC<WikiCardProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      {/* Article Image (if exists) */}
      {data.thumbnail && (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <img 
            src={data.thumbnail.source} 
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nord-0 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber mb-1 block">Featured Topic</span>
            <h3 className="text-xl font-black text-nord-6 tracking-tighter leading-none">{data.title}</h3>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="flex flex-col gap-4">
        {!data.thumbnail && (
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber/60 mb-2 block">Article Title</span>
            <h3 className="text-2xl font-black text-nord-6 tracking-tighter">{data.title}</h3>
          </div>
        )}
        
        {data.description && (
          <p className="text-xs font-bold text-frost-2 uppercase tracking-wide leading-tight border-l-2 border-amber/30 pl-3">
            {data.description}
          </p>
        )}

        <div className="space-y-4">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted block">Abstract</span>
          <p className="text-sm text-nord-4 leading-relaxed line-clamp-6 opacity-80 italic">
            "{data.extract}..."
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
          <a 
            href={data.content_urls?.desktop.page} 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-btn w-full justify-center group"
          >
            Wiki Article
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

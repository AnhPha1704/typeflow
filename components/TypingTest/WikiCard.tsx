'use client';

import React from 'react';
import { WikiPageData } from '@/utils/fetchWikiText';

interface WikiCardProps {
  data: WikiPageData;
  visible: boolean;
}

export const WikiCard: React.FC<WikiCardProps> = ({ data, visible }) => {
  if (!visible) return null;

  return (
    <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass-box overflow-hidden flex flex-col md:flex-row group transition-all duration-500 hover:border-primary/30">
        {data.thumbnail && (
          <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden">
            <img 
              src={data.thumbnail.source} 
              alt={data.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent md:bg-gradient-to-r"></div>
          </div>
        )}
        
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Context</span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
              {data.title}
            </h3>
            {data.description && (
              <p className="text-xs text-sub italic mb-3">{data.description}</p>
            )}
            <p className="text-sm text-sub/80 line-clamp-3 leading-relaxed mb-4">
              {data.extract}
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <a 
              href={data.content_urls?.desktop.page} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black text-white hover:text-primary transition-colors flex items-center gap-2 group/link uppercase tracking-widest"
            >
              Đọc thêm trên Wikipedia
              <svg className="w-3 h-3 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
              </svg>
            </a>
            
            <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Wikipedia {data.lang.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

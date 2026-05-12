'use client';

import React from 'react';
import { C } from '@/lib/constants';
import { WikiPageData } from '@/utils/fetchWikiText';

interface WikiCardProps {
  data:    WikiPageData;
  loading: boolean;
}

const labelStyle: React.CSSProperties = {
  fontSize:      '0.6rem',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.25em',
  color:         C.sub,
};

const panelStyle: React.CSSProperties = {
  background:    C.surface,
  border:        `1px solid ${C.border}`,
  borderRadius:  '1.25rem',
  padding:       '1.75rem',
  display:       'flex',
  flexDirection: 'column',
  gap:           '1.25rem',
};

export function WikiCard({ data, loading }: WikiCardProps) {
  if (loading) {
    return (
      <div style={{ ...panelStyle, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 28, height: 28,
          border: `2px solid ${C.border}`,
          borderTopColor: C.accent,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ ...labelStyle, letterSpacing: '0.3em' }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ ...panelStyle, flex: 1, overflow: 'hidden' }}>
      <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'auto' }}>
        {/* Thumbnail */}
        {data.thumbnail && (
          <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', height: 160 }}>
            <img
              src={data.thumbnail.source}
              alt={data.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.surface}, transparent)` }} />
          </div>
        )}

        {/* Title + description */}
        <div>
          <div style={{ ...labelStyle, color: C.accent, marginBottom: 4 }}>Article</div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {data.title}
          </h3>
          {data.description && (
            <p style={{ fontSize: '0.75rem', color: C.sub, marginTop: 4, fontStyle: 'italic' }}>
              {data.description}
            </p>
          )}
        </div>

        {/* Extract preview */}
        <p style={{
          fontSize:           '0.8rem',
          lineHeight:         1.6,
          color:              C.sub,
          flex:               1,
          overflow:           'hidden',
          display:            '-webkit-box',
          WebkitLineClamp:    6,
          WebkitBoxOrient:    'vertical',
        }}>
          {data.extract}
        </p>

        {/* Link to Wikipedia */}
        {data.content_urls?.desktop.page && (
          <a
            href={data.content_urls.desktop.page}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...labelStyle,
              color:          C.sub,
              textDecoration: 'none',
              display:        'flex',
              alignItems:     'center',
              gap:            4,
              marginTop:      'auto',
              paddingTop:     8,
              borderTop:      `1px solid ${C.border}`,
            }}
          >
            Read on Wikipedia →
          </a>
        )}
      </div>
    </div>
  );
}

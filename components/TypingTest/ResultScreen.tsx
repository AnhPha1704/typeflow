'use client';

import React from 'react';
import { C, Stats } from '@/lib/constants';
import { WpmChart } from './WpmChart';

interface ResultScreenProps {
  stats:   Stats;
  onRetry: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize:      '0.6rem',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.25em',
  color:         C.sub,
};

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: C.text }}>{value}</span>
      <span style={{ ...labelStyle, display: 'block', marginTop: 2 }}>{label}</span>
    </div>
  );
}

export function ResultScreen({ stats, onRetry }: ResultScreenProps) {
  return (
    <div
      className="sk-result"
      style={{
        height:         '100%',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '2rem',
        padding:        '1rem',
      }}
    >
      <div style={{ textAlign: 'center', width: '100%' }}>
        {/* Label */}
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    800,
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          color:         C.accent,
          marginBottom:  16,
        }}>
          Test Complete
        </div>

        {/* WPM hero */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'center' }}>
          <span style={{
            fontFamily: "'JetBrains Mono'",
            fontSize:   '5rem',
            fontWeight: 900,
            lineHeight: 1,
            color:      C.accent,
          }}>
            {stats.wpm}
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: C.sub }}>WPM</span>
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 12, marginBottom: 32 }}>
          <StatItem label="Accuracy" value={`${stats.acc}%`} />
          <StatItem label="Chars"    value={`${stats.chars}`} />
        </div>

        {/* WPM Chart */}
        <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <WpmChart timeline={stats.wpmTimeline} />
        </div>
      </div>

      {/* Retry button */}
      <button id="btn-retry" onClick={onRetry} className="sk-btn">
        Try Again
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}

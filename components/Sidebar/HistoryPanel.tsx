'use client';

import React from 'react';
import { C, HistoryEntry, SHORTCUTS } from '@/lib/constants';
import { Kbd } from '@/components/ui/Kbd';

// ── HistoryCard ───────────────────────────────────────────────────────────────

interface HistoryCardProps {
  entry: HistoryEntry;
  index: number;
}

function HistoryCard({ entry, index }: HistoryCardProps) {
  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '0.75rem 1rem',
        background:     'rgba(255,255,255,0.03)',
        border:         `1px solid ${C.border}`,
        borderRadius:   '0.75rem',
        flexShrink:     0,
        // Stagger entrance animation
        animation:      `slide-up 0.4s var(--ease-out-expo) ${index * 40}ms both`,
      }}
    >
      <div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: '1.1rem', color: C.text }}>
          {entry.wpm}{' '}
          <span style={{ fontSize: '0.6rem', color: C.sub, fontWeight: 700 }}>WPM</span>
        </div>
        <div style={{
          fontSize:      '0.6rem',
          color:         C.sub,
          fontWeight:    700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop:     2,
        }}>
          {entry.date}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.85rem', fontWeight: 800, color: C.accent }}>
          {entry.acc}%
        </div>
        <div style={{ fontSize: '0.55rem', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>
          ACC
        </div>
      </div>
    </div>
  );
}

// ── HistoryPanel ──────────────────────────────────────────────────────────────

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

interface HistoryPanelProps {
  history: HistoryEntry[];
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
      <div style={{ ...labelStyle, paddingBottom: 8 }}>Recent Sessions</div>

      {/* History list */}
      <div style={{ ...panelStyle, flex: 1, overflow: 'hidden', padding: '1rem', minHeight: 0 }}>
        {history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '100%', paddingRight: 4 }}>
            {history.map((entry, i) => (
              <HistoryCard key={`${entry.date}-${i}`} entry={entry} index={i} />
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <span style={{ ...labelStyle, letterSpacing: '0.3em', textAlign: 'center' }}>No sessions yet</span>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div style={{
        ...panelStyle,
        background: `${C.accent}08`,
        border:     `1px solid ${C.accent}22`,
        gap:        '1rem',
      }}>
        <div style={{ ...labelStyle, color: C.accent, letterSpacing: '0.3em', fontWeight: 800 }}>
          Quick Reference
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.sub }}>{desc}</span>
              <Kbd>{key}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

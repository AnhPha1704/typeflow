'use client';

import React from 'react';
import { C, LANGS, DURATIONS, Lang, Duration } from '@/lib/constants';
import { TabGroup } from '@/components/ui/TabGroup';
import { Kbd } from '@/components/ui/Kbd';

interface ControlsProps {
  language:   Lang;
  duration:   Duration;
  onLanguage: (l: Lang) => void;
  onDuration: (d: Duration) => void;
  onRestart:  () => void;
}

export function Controls({
  language,
  duration,
  onLanguage,
  onDuration,
  onRestart,
}: ControlsProps) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      paddingInline:  4,
      flexShrink:     0,
    }}>
      {/* Left: duration + lang selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TabGroup<Duration>
          options={DURATIONS}
          value={duration}
          format={d => `${d}s`}
          onChange={onDuration}
        />

        <div style={{ width: 1, height: 20, background: C.border }} />

        <TabGroup<Lang>
          options={LANGS}
          value={language}
          format={l => l.toUpperCase()}
          onChange={onLanguage}
        />
      </div>

      {/* Right: restart button */}
      <button
        id="btn-restart"
        onClick={onRestart}
        title="Restart (ESC)"
        style={{
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       '6px 8px',
          borderRadius:  6,
          color:         C.sub,
          display:       'flex',
          alignItems:    'center',
          gap:           4,
          fontSize:      '0.7rem',
          fontWeight:    700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
        Restart
        <Kbd>ESC</Kbd>
      </button>
    </div>
  );
}

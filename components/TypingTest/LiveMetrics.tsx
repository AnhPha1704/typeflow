'use client';

import React from 'react';
import { Stats } from '@/lib/constants';
import { Metric } from '@/components/ui/Metric';

interface LiveMetricsProps {
  stats:     Stats;
  timeLeft:  number;
  isStarted: boolean;
  finished:  boolean;
}

export function LiveMetrics({ stats, timeLeft, isStarted, finished }: LiveMetricsProps) {
  const visible = isStarted && !finished;
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'center',
      gap:            12,
      opacity:        visible ? 1 : 0,
      transform:      visible ? 'none' : 'translateY(-8px)',
      transition:     'all 0.4s ease',
      pointerEvents:  'none',
      height:         60,
      flexShrink:     0,
    }}>
      <Metric value={stats.wpm}       label="wpm" />
      <Metric value={`${stats.acc}%`} label="acc" />
      <Metric value={timeLeft}        label="sec" />
    </div>
  );
}

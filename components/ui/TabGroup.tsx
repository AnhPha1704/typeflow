'use client';

import React from 'react';
import { C } from '@/lib/constants';

interface TabGroupProps<T extends string | number> {
  options:  readonly T[];
  value:    T;
  format?:  (v: T) => string;
  onChange: (v: T) => void;
}

export function TabGroup<T extends string | number>({
  options,
  value,
  format = (v) => String(v),
  onChange,
}: TabGroupProps<T>) {
  return (
    <div className="sk-tab-group">
      {options.map(opt => (
        <button
          key={String(opt)}
          className={`sk-tab ${value === opt ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); onChange(opt); }}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

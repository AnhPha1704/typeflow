'use client';

import React from 'react';

interface MetricProps {
  value: string | number;
  label: string;
}

export function Metric({ value, label }: MetricProps) {
  return (
    <div className="sk-metric">
      <span className="sk-val">{value}</span>
      <span className="sk-label">{label}</span>
    </div>
  );
}

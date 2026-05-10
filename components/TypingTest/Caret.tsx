'use client';

import React from 'react';

interface CaretProps {
  left:   number;
  top:    number;
  height: number;
}

export function Caret({ left, top, height }: CaretProps) {
  return (
    <div
      className="sk-caret"
      style={{
        left,
        top:    top + height * 0.1,
        height: height * 0.8,
      }}
    />
  );
}

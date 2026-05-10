'use client';

import React from 'react';

interface KbdProps {
  children: React.ReactNode;
}

export function Kbd({ children }: KbdProps) {
  return <span className="sk-kbd">{children}</span>;
}

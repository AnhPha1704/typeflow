'use client';

import React, { useEffect, useRef } from 'react';
import { C } from '@/lib/constants';

interface WpmChartProps {
  timeline: number[];
  width?: number;
  height?: number;
}

export function WpmChart({ timeline, width = 600, height = 200 }: WpmChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (timeline.length < 2) return;

    const maxWpm = Math.max(...timeline, 100);
    const minWpm = 0;
    const padding = 20;

    const getX = (i: number) => (i / (timeline.length - 1)) * (width - padding * 2) + padding;
    const getY = (wpm: number) => height - ((wpm - minWpm) / (maxWpm - minWpm)) * (height - padding * 2) - padding;

    // Draw grid lines
    ctx.strokeStyle = `${C.border}44`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = getY(minWpm + (maxWpm - minWpm) * (i / 4));
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    ctx.stroke();

    // Draw average line
    const avg = timeline.reduce((a, b) => a + b, 0) / timeline.length;
    const avgY = getY(avg);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = `${C.sub}66`;
    ctx.beginPath();
    ctx.moveTo(padding, avgY);
    ctx.lineTo(width - padding, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw area gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, `${C.accent}33`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(timeline[0]));
    for (let i = 1; i < timeline.length; i++) {
      ctx.lineTo(getX(i), getY(timeline[i]));
    }
    ctx.lineTo(getX(timeline.length - 1), height - padding);
    ctx.lineTo(getX(0), height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(timeline[0]));

    for (let i = 1; i < timeline.length; i++) {
      ctx.lineTo(getX(i), getY(timeline[i]));
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = C.accent;
    timeline.forEach((wpm, i) => {
      ctx.beginPath();
      ctx.arc(getX(i), getY(wpm), 3, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [timeline, width, height]);

  return (
    <div style={{ width: '100%', maxWidth: width, margin: '0 auto', opacity: timeline.length > 0 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: C.sub, fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        <span>Start</span>
        <span>Average: {Math.round(timeline.reduce((a, b) => a + b, 0) / (timeline.length || 1))} WPM</span>
        <span>End</span>
      </div>
    </div>
  );
}

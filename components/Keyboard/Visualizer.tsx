'use client';

import React, { useState, useEffect } from 'react';

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Space']
];

export const VirtualKeyboard = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [hasSignal, setHasSignal] = useState(false);

  useEffect(() => {
    const normalizeVietnamese = (str: string): string => {
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toUpperCase();
    };

    const mapCodeToLabel = (code: string | undefined, key: string | undefined): string | null => {
      const c = code || '';
      if (c === 'Space') return 'SPACE';
      if (c === 'Backspace') return 'BACKSPACE';
      if (c === 'Tab') return 'TAB';
      if (c === 'Enter') return 'ENTER';
      if (c.includes('Shift')) return 'SHIFT';
      if (c === 'CapsLock') return 'CAPS';
      
      if (c.startsWith('Key')) return c.replace('Key', '');
      if (c.startsWith('Digit')) return c.replace('Digit', '');

      // Fallback to key normalization for IME
      let k = key ? key : '';
      if (!k || k === 'Process') return null;

      // Special cases for non-letter keys
      if (k === ' ') return 'SPACE';
      if (k === 'Backspace') return 'BACKSPACE';
      if (k === 'Tab') return 'TAB';
      if (k === 'Enter') return 'ENTER';

      // Normalize Vietnamese (á -> A, ư -> U, đ -> D)
      const normalizedK = normalizeVietnamese(k);

      for (const row of ROWS) {
        // Find if the normalized key exists in our layout
        for (const rowKey of row) {
          if (rowKey.toUpperCase() === normalizedK) return rowKey.toUpperCase();
        }
      }

      return null;
    };

    const handleKeyAction = (type: 'down' | 'up' | 'flash', code?: string, key?: string) => {
      setHasSignal(true);
      setTimeout(() => setHasSignal(false), 50);

      const label = mapCodeToLabel(code, key);
      if (label) {
        setActiveKeys(prev => {
          const next = new Set(prev);
          if (type === 'down') next.add(label);
          else if (type === 'up') next.delete(label);
          else {
            next.add(label);
            const timerId = setTimeout(() => {
              setActiveKeys(p => {
                const n = new Set(p);
                n.delete(label);
                return n;
              });
            }, 100);
            return next;
          }
          return next;
        });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => handleKeyAction('down', e.code, e.key);
    const onKeyUp = (e: KeyboardEvent) => handleKeyAction('up', e.code, e.key);
    const onCustomKeyDown = (e: any) => handleKeyAction('down', e.detail.code, e.detail.key);
    const onCustomKeyUp = (e: any) => handleKeyAction('up', e.detail.code, e.detail.key);
    const onCustomFlash = (e: any) => handleKeyAction('flash', undefined, e.detail.key);

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('typeflow-keydown', onCustomKeyDown);
    window.addEventListener('typeflow-keyup', onCustomKeyUp);
    window.addEventListener('typeflow-flash', onCustomFlash);
    
    const handleBlur = () => setActiveKeys(new Set());
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('typeflow-keydown', onCustomKeyDown);
      window.removeEventListener('typeflow-keyup', onCustomKeyUp);
      window.removeEventListener('typeflow-flash', onCustomFlash);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleBlur);
    };
  }, []);

  const getKeyLabel = (key: string) => {
    if (key === 'SPACE') return '';
    if (key === 'BACKSPACE') return 'DELETE';
    return key;
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none pointer-events-none font-pixel relative">
      <div className={`absolute -top-6 right-0 w-2 h-2 ${hasSignal ? 'bg-primary' : 'bg-black/20'} transition-colors`}></div>
      
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-2 w-full">
          {row.map((key, keyIndex) => {
            const label = key.toUpperCase();
            const isActive = activeKeys.has(label);
            
            let widthClass = 'w-12';
            if (label === 'SPACE') widthClass = 'flex-1 max-w-[450px]';
            if (label === 'TAB' || label === '\\') widthClass = 'w-20';
            if (label === 'CAPS' || label === 'ENTER' || label === 'BACKSPACE') widthClass = 'w-24';
            if (label === 'SHIFT') widthClass = 'w-32';

            return (
              <div
                key={keyIndex}
                className={`
                  ${widthClass} h-12 flex items-center justify-center text-sm font-bold border-4 border-black relative transition-all
                  ${isActive 
                    ? 'bg-primary text-white translate-y-1 translate-x-1 shadow-none z-10 duration-75' 
                    : 'bg-[#313244] text-[#6c7086] shadow-[4px_4px_0px_#000] duration-300'}
                `}
              >
                {!isActive && (
                  <div className="absolute top-1 left-1 right-1 h-1/3 bg-white/5 pointer-events-none"></div>
                )}
                {getKeyLabel(label)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

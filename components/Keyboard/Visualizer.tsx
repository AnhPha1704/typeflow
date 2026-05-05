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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key.toUpperCase();
      if (e.code === 'Space') key = 'SPACE';
      if (e.key === 'Tab') key = 'TAB';
      if (e.key === 'Enter') key = 'ENTER';
      if (e.key === 'Shift') key = 'SHIFT';
      if (e.key === 'CapsLock') key = 'CAPS';
      if (e.key === 'Backspace') key = 'BACKSPACE';
      
      setActiveKeys(prev => new Set(prev).add(key));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let key = e.key.toUpperCase();
      if (e.code === 'Space') key = 'SPACE';
      if (e.key === 'Tab') key = 'TAB';
      if (e.key === 'Enter') key = 'ENTER';
      if (e.key === 'Shift') key = 'SHIFT';
      if (e.key === 'CapsLock') key = 'CAPS';
      if (e.key === 'Backspace') key = 'BACKSPACE';

      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getKeyLabel = (key: string) => {
    if (key === 'SPACE') return '';
    if (key === 'BACKSPACE') return 'DELETE';
    return key;
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none pointer-events-none font-pixel">
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
                {/* Visual indicator of a key cap */}
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

'use client';

import React from 'react';
import { C } from '@/lib/constants';
import { Caret } from './Caret';
import { CharacterDisplay } from './CharacterDisplay';

interface TypingAreaProps {
  zoneRef:    React.RefObject<HTMLDivElement | null>;
  charRefs:   React.MutableRefObject<(HTMLSpanElement | null)[]>;
  characters: string[];
  userInput:  string;
  isStarted:  boolean;
  caretPos:   { left: number; top: number; height: number };
}

const labelStyle: React.CSSProperties = {
  fontSize:      '0.6rem',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.25em',
  color:         C.sub,
};

export function TypingArea({
  zoneRef,
  charRefs,
  characters,
  userInput,
  isStarted,
  caretPos,
}: TypingAreaProps) {
  return (
    <>
      <div ref={zoneRef} className="sk-typing" style={{ overflow: 'auto', height: '100%' }}>
        <Caret {...caretPos} />
        <CharacterDisplay
          characters={characters}
          userInput={userInput}
          charRefs={charRefs}
        />
      </div>

      {/* "Start typing" hint */}
      {!isStarted && (
        <div style={{
          position:     'absolute',
          bottom:       24,
          left:         0,
          right:        0,
          textAlign:    'center',
          pointerEvents:'none',
        }}>
          <span style={{ ...labelStyle, letterSpacing: '0.35em' }}>
            start typing to begin
          </span>
        </div>
      )}
    </>
  );
}

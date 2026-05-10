'use client';

import { useEffect, useRef, useState } from 'react';

interface CaretPos {
  left:   number;
  top:    number;
  height: number;
}

interface UseCaretPositionOptions {
  charRefs:   React.MutableRefObject<(HTMLSpanElement | null)[]>;
  zoneRef:    React.RefObject<HTMLDivElement | null>;
  inputIndex: number; // userInput.length — the index of the next char to type
  wikiDataKey: string | undefined; // changes when text reloads
}

export function useCaretPosition({
  charRefs,
  zoneRef,
  inputIndex,
  wikiDataKey,
}: UseCaretPositionOptions): CaretPos {
  const [caretPos, setCaretPos] = useState<CaretPos>({ left: 0, top: 0, height: 24 });
  const prevLineRef = useRef<number>(-1);

  useEffect(() => {
    const span = charRefs.current[inputIndex];
    const zone = zoneRef.current;
    if (!span || !zone) return;

    const zr = zone.getBoundingClientRect();
    const sr = span.getBoundingClientRect();

    const newTop = sr.top - zr.top + zone.scrollTop;

    setCaretPos({ left: sr.left - zr.left, top: newTop, height: sr.height });

    // Auto-scroll: keep caret visible when it moves to a new line
    const caretLine = Math.round(newTop / sr.height);
    if (caretLine !== prevLineRef.current) {
      prevLineRef.current = caretLine;
      span.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [inputIndex, wikiDataKey, charRefs, zoneRef]);

  return caretPos;
}

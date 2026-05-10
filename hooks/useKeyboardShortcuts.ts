'use client';

import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onReset:    () => void;
  inputRef:   React.RefObject<HTMLTextAreaElement | null>;
  isFinished: boolean;
  isLoading:  boolean;
}

export function useKeyboardShortcuts({
  onReset,
  inputRef,
  isFinished,
  isLoading,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onReset();
        return;
      }
      // Tab key: focus input without navigating away
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      // Any other key while test is active: ensure input is focused
      if (!isFinished && !isLoading) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReset, inputRef, isFinished, isLoading]);
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { HistoryEntry, HISTORY_KEY, HISTORY_MAX } from '@/lib/constants';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // Ignore parse errors
    }
  }, []);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, HISTORY_MAX);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors (e.g. private mode quota)
      }
      return updated;
    });
  }, []);

  return { history, addEntry };
}

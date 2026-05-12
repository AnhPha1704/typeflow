'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WikiPageData } from '@/utils/fetchWikiText';
import { Lang, Duration, Mode, Stats } from '@/lib/constants';
import { calcWPM, calcAccuracy, countCorrect } from '@/lib/scoring';
import { getTextSource } from '@/lib/textSources';

interface UseTypingTestOptions {
  language:  Lang;
  duration:  Duration;
  mode:      Mode;
  onTestEnd: (stats: Stats) => void;
}

export function useTypingTest({ language, duration, mode, onTestEnd }: UseTypingTestOptions) {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [wikiData,    setWikiData]    = useState<WikiPageData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [userInput,   setUserInput]   = useState('');
  const [startTime,   setStartTime]   = useState<number | null>(null);
  const [isStarted,   setIsStarted]   = useState(false);
  const [finished,    setFinished]    = useState(false);
  const [timeLeft,    setTimeLeft]    = useState<number>(duration);
  const [stats,       setStats]       = useState<Stats>({ wpm: 0, acc: 0, chars: 0, wpmTimeline: [] });

  // ── Refs (avoid stale closures) ─────────────────────────────────────────────
  const timerRef     = useRef<NodeJS.Timeout | null>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const charRefs     = useRef<(HTMLSpanElement | null)[]>([]);
  const statsRef     = useRef<Stats>({ wpm: 0, acc: 0, chars: 0, wpmTimeline: [] });
  const isEndingRef  = useRef(false);
  const loadIdRef    = useRef(0);
  const userInputRef = useRef('');

  // ── Characters array (memoised) ─────────────────────────────────────────────
  const characters = useMemo(() => wikiData?.extract.split('') ?? [], [wikiData]);

  // ── End test ─────────────────────────────────────────────────────────────────
  const endTest = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const { wpm, acc, chars, wpmTimeline: timeline } = statsRef.current;
    if (wpm > 0 || chars > 0) {
      onTestEnd({ wpm, acc, chars, wpmTimeline: timeline });
    }
  }, [onTestEnd]);

  // ── Reset & fetch new article ────────────────────────────────────────────────
  const load = useCallback(async (langArg?: Lang | unknown, durArg?: Duration | unknown, modeArg?: Mode | unknown) => {
    const lang = typeof langArg === 'string' ? langArg as Lang : language;
    const dur  = typeof durArg === 'number' ? durArg as Duration : duration;
    const md   = typeof modeArg === 'string' ? modeArg as Mode : mode;

    const currentLoadId = ++loadIdRef.current;

    if (timerRef.current) clearInterval(timerRef.current);
    isEndingRef.current  = false;
    statsRef.current     = { wpm: 0, acc: 0, chars: 0, wpmTimeline: [] };
    userInputRef.current = '';
    charRefs.current     = [];

    setLoading(true);
    setFinished(false);
    setUserInput('');
    setStartTime(null);
    setIsStarted(false);
    setTimeLeft(dur);
    setStats({ wpm: 0, acc: 0, chars: 0, wpmTimeline: [] });

    try {
      const data = await getTextSource(md, lang);
      if (loadIdRef.current !== currentLoadId) return; // Stale request
      setWikiData(data);
    } catch (err) {
      if (loadIdRef.current !== currentLoadId) return;
      console.error(err);
    } finally {
      if (loadIdRef.current === currentLoadId) {
        setLoading(false);
      }
    }

    setTimeout(() => {
      if (loadIdRef.current === currentLoadId) {
        inputRef.current?.focus();
      }
    }, 120);
  }, [language, duration, mode]);


  // Initial load
  useEffect(() => { load(); }, [load]);

  // ── Countdown timer & Timeline tracking ──────────────────────────────────────
  useEffect(() => {
    if (!isStarted || finished) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimeout(endTest, 0);
          return 0;
        }
        return t - 1;
      });

      // Record WPM for timeline
      if (startTime && wikiData) {
        const elapsedMs = Date.now() - startTime;
        const correct = countCorrect(userInputRef.current, wikiData.extract);
        const currentWpm = calcWPM(correct, elapsedMs);

        setStats(prev => {
          const nextTimeline = [...prev.wpmTimeline, currentWpm];
          const next: Stats = { ...prev, wpm: currentWpm, wpmTimeline: nextTimeline };
          statsRef.current = next;
          return next;
        });
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, finished, startTime, wikiData, endTest]);

  // ── Scoring ──────────────────────────────────────────────────────────────────
  const recalcStats = useCallback((inp: string) => {
    if (!wikiData) return;
    const correct = countCorrect(inp, wikiData.extract);
    const acc     = calcAccuracy(inp, wikiData.extract);
    const wpm     = startTime ? calcWPM(correct, Date.now() - startTime) : 0;
    
    setStats(prev => {
      const next: Stats = { wpm, acc, chars: inp.normalize('NFC').length, wpmTimeline: prev.wpmTimeline };
      statsRef.current = next;
      return next;
    });
  }, [wikiData, startTime]);

  // ── Input handler ─────────────────────────────────────────────────────────────
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const raw = e.currentTarget.value;
    if (finished || loading || !wikiData) { e.currentTarget.value = ''; return; }
    if (!isStarted && raw.length > 0) {
      setIsStarted(true);
      setStartTime(Date.now());
    }
    const norm = raw.normalize('NFC');
    setUserInput(norm);
    userInputRef.current = norm;
    recalcStats(norm);
    if (norm.length >= wikiData.extract.length) endTest();
  }, [finished, loading, wikiData, isStarted, recalcStats, endTest]);

  return {
    // State
    wikiData,
    loading,
    userInput,
    isStarted,
    finished,
    timeLeft,
    stats,
    characters,
    // Refs
    inputRef,
    charRefs,
    // Actions
    load,
    handleInput,
  };
}

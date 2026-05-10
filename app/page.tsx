'use client';

import { useState, useRef, useCallback } from 'react';
import { C, LANGS, DURATIONS, SHORTCUTS, Lang, Duration, Stats, HistoryEntry } from '@/lib/constants';
import { useTypingTest }         from '@/hooks/useTypingTest';
import { useCaretPosition }      from '@/hooks/useCaretPosition';
import { useHistory }            from '@/hooks/useHistory';
import { useKeyboardShortcuts }  from '@/hooks/useKeyboardShortcuts';
import { Controls }              from '@/components/TypingTest/Controls';
import { LiveMetrics }           from '@/components/TypingTest/LiveMetrics';
import { TypingArea }            from '@/components/TypingTest/TypingArea';
import { ResultScreen }          from '@/components/TypingTest/ResultScreen';
import { WikiCard }              from '@/components/Sidebar/WikiCard';
import { HistoryPanel }          from '@/components/Sidebar/HistoryPanel';

export default function Home() {
  // ── Config state ──────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<Lang>('vi');
  const [duration, setDuration] = useState<Duration>(30);

  // ── History ───────────────────────────────────────────────────────────────
  const { history, addEntry } = useHistory();

  // ── Typing test ───────────────────────────────────────────────────────────
  const handleTestEnd = useCallback((stats: Stats) => {
    const entry: HistoryEntry = {
      wpm:  stats.wpm,
      acc:  stats.acc,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addEntry(entry);
  }, [addEntry]);

  const {
    wikiData, loading,
    userInput, isStarted, finished, timeLeft, stats, characters,
    inputRef, charRefs,
    load, handleInput,
  } = useTypingTest({ language, duration, onTestEnd: handleTestEnd });

  // ── Caret ─────────────────────────────────────────────────────────────────
  const zoneRef   = useRef<HTMLDivElement>(null);
  const caretPos  = useCaretPosition({
    charRefs,
    zoneRef,
    inputIndex:  userInput.length,
    wikiDataKey: wikiData?.title,
  });

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({ onReset: () => load(), inputRef, isFinished: finished, isLoading: loading });

  // ── Handlers for Controls ─────────────────────────────────────────────────
  const handleDuration = (d: Duration) => { setDuration(d); load(language, d); };
  const handleLanguage = (l: Lang)     => { setLanguage(l); load(l, duration); };

  // ── Progress bar ──────────────────────────────────────────────────────────
  const pct      = (timeLeft / duration) * 100;
  const barColor = pct > 40 ? C.accent : pct > 15 ? '#e6a817' : C.error;

  // ── Shared styles ─────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background:    C.surface,
    border:        `1px solid ${C.border}`,
    borderRadius:  '1.25rem',
    padding:       '1.75rem',
    display:       'flex',
    flexDirection: 'column',
    gap:           '1.25rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize:      '0.6rem',
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    color:         C.sub,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden', position: 'relative' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Background orbs */}
      <div className="orb" style={{ width: 700, height: 700, top: -200, left: -150, background: 'radial-gradient(circle, rgba(215,249,250,0.04), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(215,249,250,0.03), transparent 70%)', filter: 'blur(80px)', animationDelay: '-10s' }} />

      {/* Hidden capture textarea */}
      <textarea
        ref={inputRef}
        onInput={handleInput}
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', left: 0, top: 0 }}
        autoFocus spellCheck={false} autoComplete="off"
      />

      {/* 3-column grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '1.5rem', maxWidth: 1700, margin: '0 auto', width: '100%', padding: '2.5rem 2rem', height: '100vh' }}>

        {/* ── LEFT: Wiki sidebar ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.accent}22`, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2H6v11h3v9l9-12h-5l3-8z" fill={C.accent} />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>TypeFlow</div>
              <div style={{ ...labelStyle, paddingBottom: 0 }}>Sage Forest</div>
            </div>
          </div>

          <WikiCard data={wikiData!} loading={loading || !wikiData} />
        </aside>

        {/* ── CENTER: Typing area ── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem', minHeight: 0 }}>

          <Controls
            language={language}
            duration={duration}
            onLanguage={handleLanguage}
            onDuration={handleDuration}
            onRestart={() => load()}
          />

          <LiveMetrics stats={stats} timeLeft={timeLeft} isStarted={isStarted} finished={finished} />

          {/* Progress bar */}
          <div className="sk-track" style={{ flexShrink: 0 }}>
            <div className="sk-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>

          {/* Main panel */}
          <div style={{ ...panelStyle, flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...labelStyle, letterSpacing: '0.4em', animation: 'pulse 2s infinite' }}>
                  Fetching content…
                </span>
              </div>
            ) : finished ? (
              <ResultScreen stats={stats} onRetry={() => load()} />
            ) : (
              <TypingArea
                zoneRef={zoneRef}
                charRefs={charRefs}
                characters={characters}
                userInput={userInput}
                isStarted={isStarted}
                caretPos={caretPos}
              />
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: 4, opacity: 0.5 }}>
            {wikiData && !loading
              ? <span style={{ ...labelStyle, letterSpacing: '0.2em' }}>{wikiData.title}</span>
              : <span />
            }
          </div>
        </main>

        {/* ── RIGHT: History sidebar ── */}
        <HistoryPanel history={history} />

      </div>
    </div>
  );
}

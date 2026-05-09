'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchWikiPage, WikiPageData } from '@/utils/fetchWikiText';

// ─── Constants ───────────────────────────────────────────────────────────────

const LANGS     = ['vi', 'en', 'ja'] as const;
const DURATIONS = [15, 30, 60]       as const;

type Lang     = typeof LANGS[number];
type Duration = typeof DURATIONS[number];

interface HistoryEntry {
  wpm:  number;
  acc:  number;
  date: string;
}

interface Stats {
  wpm:   number;
  acc:   number;
  chars: number;
}

/** Sage Forest design tokens — single source of truth */
const C = {
  bg:      '#161e1b',
  surface: '#1e2a25',
  border:  '#2d3d37',
  text:    '#EAE7D6',
  sub:     '#5D7B6F',
  accent:  '#D7F9FA',
  error:   '#e07070',
} as const;

// ─── Shared style objects ─────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  // State
  const [wikiData,   setWikiData]   = useState<WikiPageData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [language,   setLanguage]   = useState<Lang>('vi');
  const [duration,   setDuration]   = useState<Duration>(30);
  const [userInput,  setUserInput]  = useState('');
  const [startTime,  setStartTime]  = useState<number | null>(null);
  const [isStarted,  setIsStarted]  = useState(false);
  const [finished,   setFinished]   = useState(false);
  const [timeLeft,   setTimeLeft]   = useState<number>(30);
  const [stats,      setStats]      = useState<Stats>({ wpm: 0, acc: 0, chars: 0 });
  const [caretPos,   setCaretPos]   = useState({ left: 0, top: 0, height: 24 });
  const [history,    setHistory]    = useState<HistoryEntry[]>([]);

  // Refs
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const zoneRef     = useRef<HTMLDivElement>(null);
  const charRefs    = useRef<(HTMLSpanElement | null)[]>([]);
  const statsRef    = useRef<Stats>({ wpm: 0, acc: 0, chars: 0 }); // always-fresh stats for timer closure
  const isEndingRef = useRef(false);                                // guard against double endTest()

  // ── Load history from localStorage (client-only) ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('tf_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // ── Reset & fetch a new article ───────────────────────────────────────────
  const load = useCallback(async (lang = language, dur = duration) => {
    if (timerRef.current) clearInterval(timerRef.current);
    isEndingRef.current = false;
    statsRef.current    = { wpm: 0, acc: 0, chars: 0 };
    charRefs.current    = [];

    setLoading(true);
    setFinished(false);
    setUserInput('');
    setStartTime(null);
    setIsStarted(false);
    setTimeLeft(dur);
    setStats({ wpm: 0, acc: 0, chars: 0 });

    try {
      const data = await fetchWikiPage(lang);
      setWikiData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

    setTimeout(() => inputRef.current?.focus(), 120);
  }, [language, duration]);

  useEffect(() => { load(); }, [load]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStarted || finished) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Caret position tracking ───────────────────────────────────────────────
  useEffect(() => {
    const span = charRefs.current[userInput.length];
    const zone = zoneRef.current;
    if (!span || !zone) return;
    const zr = zone.getBoundingClientRect();
    const sr = span.getBoundingClientRect();
    setCaretPos({ left: sr.left - zr.left, top: sr.top - zr.top, height: sr.height });
  }, [userInput, wikiData]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { load(); return; }
      if (!finished && !loading) inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finished, loading, load]);

  // ── Scoring ───────────────────────────────────────────────────────────────
  const calcStats = useCallback((inp: string) => {
    if (!wikiData) return;
    const norm = inp.normalize('NFC');
    const tgt  = wikiData.extract.normalize('NFC');
    let correct = 0;
    for (let i = 0; i < Math.min(norm.length, tgt.length); i++) {
      if (norm[i] === tgt[i]) correct++;
    }
    const acc = norm.length > 0 ? Math.round((correct / norm.length) * 100) : 0;
    let wpm = 0;
    if (startTime) {
      const minutes = (Date.now() - startTime) / 60_000;
      if (minutes > 0) wpm = Math.round((correct / 5) / minutes);
    }
    const next: Stats = { wpm, acc, chars: norm.length };
    statsRef.current = next; // sync ref before setState to avoid stale closure in timer
    setStats(next);
  }, [wikiData, startTime]);

  // ── End test & save history ───────────────────────────────────────────────
  const endTest = useCallback(() => {
    if (isEndingRef.current) return; // prevent double-fire from timer ticking at t=0
    isEndingRef.current = true;

    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const { wpm, acc, chars } = statsRef.current; // read ref — never stale
    if (wpm > 0 || chars > 0) {
      const entry: HistoryEntry = {
        wpm,
        acc,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, 6);
        localStorage.setItem('tf_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const raw = e.currentTarget.value;
    if (finished || loading || !wikiData) { e.currentTarget.value = ''; return; }
    if (!isStarted && raw.length > 0) { setIsStarted(true); setStartTime(Date.now()); }
    const norm = raw.normalize('NFC');
    setUserInput(norm);
    calcStats(norm);
    if (norm.length >= wikiData.extract.length) endTest();
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const characters = useMemo(() => wikiData?.extract.split('') ?? [], [wikiData]);
  const pct        = (timeLeft / duration) * 100;
  const barColor   = pct > 40 ? C.accent : pct > 15 ? '#e6a817' : C.error;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden', position: 'relative' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Background orbs */}
      <div className="orb" style={{ width: 700, height: 700, top: -200, left: -150, background: 'radial-gradient(circle, rgba(215,249,250,0.04), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(215,249,250,0.03), transparent 70%)', filter: 'blur(80px)', animationDelay: '-10s' }} />

      {/* Hidden capture input */}
      <textarea
        ref={inputRef}
        onInput={handleInput}
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', left: 0, top: 0 }}
        autoFocus spellCheck={false} autoComplete="off"
      />

      {/* 3-column grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '1.5rem', maxWidth: 1700, margin: '0 auto', width: '100%', padding: '2.5rem 2rem', height: '100vh' }}>

        {/* ── LEFT: Wiki card ── */}
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

          {/* Article info */}
          <div style={{ ...panelStyle, flex: 1, overflow: 'hidden' }}>
            {wikiData && !loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'auto' }}>
                {wikiData.thumbnail && (
                  <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', height: 160 }}>
                    <img src={wikiData.thumbnail.source} alt={wikiData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.surface}, transparent)` }} />
                  </div>
                )}
                <div>
                  <div style={{ ...labelStyle, color: C.accent, marginBottom: 4 }}>Article</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{wikiData.title}</h3>
                  {wikiData.description && (
                    <p style={{ fontSize: '0.75rem', color: C.sub, marginTop: 4, fontStyle: 'italic' }}>{wikiData.description}</p>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: C.sub, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                  {wikiData.extract}
                </p>
                {wikiData.content_urls?.desktop.page && (
                  <a
                    href={wikiData.content_urls.desktop.page}
                    target="_blank" rel="noopener noreferrer"
                    style={{ ...labelStyle, color: C.sub, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${C.border}` }}
                  >
                    Read on Wikipedia →
                  </a>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ ...labelStyle, letterSpacing: '0.3em' }}>Loading…</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: Typing area ── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem', minHeight: 0 }}>

          {/* Controls bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sk-tab-group">
                {DURATIONS.map(d => (
                  <button key={d} className={`sk-tab ${duration === d ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setDuration(d); load(language, d); }}>
                    {d}s
                  </button>
                ))}
              </div>
              <div style={{ width: 1, height: 20, background: C.border }} />
              <div className="sk-tab-group">
                {LANGS.map(l => (
                  <button key={l} className={`sk-tab ${language === l ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setLanguage(l); }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => load()}
              title="Restart (ESC)"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, color: C.sub, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Restart
            </button>
          </div>

          {/* Live metrics (visible while typing) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, opacity: isStarted && !finished ? 1 : 0, transform: isStarted && !finished ? 'none' : 'translateY(-8px)', transition: 'all 0.4s ease', pointerEvents: 'none', height: 60, flexShrink: 0 }}>
            <div className="sk-metric"><span className="sk-val">{stats.wpm}</span><span className="sk-label">wpm</span></div>
            <div className="sk-metric"><span className="sk-val">{stats.acc}%</span><span className="sk-label">acc</span></div>
            <div className="sk-metric"><span className="sk-val">{timeLeft}</span><span className="sk-label">sec</span></div>
          </div>

          {/* Progress bar */}
          <div className="sk-track" style={{ flexShrink: 0 }}>
            <div className="sk-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>

          {/* Main panel */}
          <div style={{ ...panelStyle, flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...labelStyle, letterSpacing: '0.4em', animation: 'pulse 2s infinite' }}>Fetching content…</span>
              </div>
            ) : finished ? (
              <ResultScreen stats={stats} onRetry={load} accent={C.accent} sub={C.sub} text={C.text} />
            ) : (
              <>
                <div ref={zoneRef} className="sk-typing" style={{ overflow: 'auto', height: '100%' }}>
                  <div className="sk-caret" style={{ left: caretPos.left, top: caretPos.top + caretPos.height * 0.1, height: caretPos.height * 0.8 }} />
                  {characters.map((ch, i) => {
                    const cls = i < userInput.length
                      ? (userInput[i] === ch ? 'c-correct' : 'c-wrong')
                      : 'c-untyped';
                    return <span key={i} ref={el => { charRefs.current[i] = el; }} className={cls}>{ch}</span>;
                  })}
                </div>
                {!isStarted && (
                  <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ ...labelStyle, letterSpacing: '0.35em' }}>start typing to begin</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer: source & shortcuts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: 4, opacity: 0.5 }}>
            {wikiData && !loading
              ? <span style={{ ...labelStyle, letterSpacing: '0.2em' }}>{wikiData.title}</span>
              : <span />
            }
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.65rem', color: C.sub, fontWeight: 700 }}>
              <span className="sk-kbd">ESC</span><span style={{ marginLeft: -10 }}>reset</span>
            </div>
          </div>
        </main>

        {/* ── RIGHT: History & tips ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
          <div style={{ ...labelStyle, paddingBottom: 8 }}>Recent Sessions</div>

          {/* History list */}
          <div style={{ ...panelStyle, flex: 1, overflow: 'hidden', padding: '1rem', minHeight: 0 }}>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '100%', paddingRight: 4 }}>
                {history.map((entry, i) => (
                  <HistoryCard key={`${entry.date}-${i}`} entry={entry} accent={C.accent} sub={C.sub} text={C.text} border={C.border} />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <span style={{ ...labelStyle, letterSpacing: '0.3em', textAlign: 'center' }}>No sessions yet</span>
              </div>
            )}
          </div>

          {/* Shortcuts reference */}
          <div style={{ ...panelStyle, background: `${C.accent}08`, border: `1px solid ${C.accent}22`, gap: '1rem' }}>
            <div style={{ ...labelStyle, color: C.accent, letterSpacing: '0.3em', fontWeight: 800 }}>Quick Reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.sub }}>{desc}</span>
                  <span className="sk-kbd">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SHORTCUTS: [string, string][] = [
  ['ESC',   'Restart session'],
  ['Click', 'Focus input'],
];

function ResultScreen({ stats, onRetry, accent, sub, text }: {
  stats:   Stats;
  onRetry: () => void;
  accent:  string;
  sub:     string;
  text:    string;
}) {
  return (
    <div className="sk-result" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: accent, marginBottom: 16 }}>
          Test Complete
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '6rem', fontWeight: 900, lineHeight: 1, color: accent }}>{stats.wpm}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: sub }}>WPM</span>
        </div>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 12 }}>
          <StatItem label="Accuracy" value={`${stats.acc}%`} text={text} sub={sub} />
          <StatItem label="Chars"    value={`${stats.chars}`} text={text} sub={sub} />
        </div>
      </div>
      <button onClick={onRetry} className="sk-btn">
        Try Again
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}

function StatItem({ label, value, text, sub }: { label: string; value: string; text: string; sub: string }) {
  return (
    <div>
      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: text }}>{value}</span>
      <span style={{ fontSize: '0.65rem', display: 'block', color: sub, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
    </div>
  );
}

function HistoryCard({ entry, accent, sub, text, border }: {
  entry:  HistoryEntry;
  accent: string;
  sub:    string;
  text:   string;
  border: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}`, borderRadius: '0.75rem', flexShrink: 0 }}>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: '1.1rem', color: text }}>
          {entry.wpm} <span style={{ fontSize: '0.6rem', color: sub, fontWeight: 700 }}>WPM</span>
        </div>
        <div style={{ fontSize: '0.6rem', color: sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
          {entry.date}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.85rem', fontWeight: 800, color: accent }}>{entry.acc}%</div>
        <div style={{ fontSize: '0.55rem', color: sub, fontWeight: 700, textTransform: 'uppercase' }}>ACC</div>
      </div>
    </div>
  );
}

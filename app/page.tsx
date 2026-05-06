'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchWikiPage, WikiPageData } from '@/utils/fetchWikiText';

const LANGS    = ['vi', 'en', 'ja'] as const;
const DURATIONS = [15, 30, 60] as const;
type Lang     = typeof LANGS[number];
type Duration = typeof DURATIONS[number];

/* ── Sage Forest Design Tokens ── */
const SK = {
  bg:      '#161e1b',  /* very dark sage */
  surface: '#1e2a25',  /* dark sage surface */
  border:  '#2d3d37',  /* sage border */
  text:    '#EAE7D6',  /* cream — typed correct */
  sub:     '#5D7B6F',  /* dark sage — untyped */
  sub2:    '#A4C3A2',  /* medium sage — hover/secondary */
  accent:  '#D7F9FA',  /* icy mint — caret, WPM, active */
  yellow:  '#D7F9FA',  /* alias for accent */
  error:   '#e07070',  /* warm coral — error chars */
};

export default function Home() {
  const [wikiData, setWikiData]   = useState<WikiPageData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [language, setLanguage]   = useState<Lang>('vi');
  const [duration, setDuration]   = useState<Duration>(30);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [finished, setFinished]   = useState(false);
  const [timeLeft, setTimeLeft]   = useState<number>(30);
  const [stats, setStats]         = useState({ wpm: 0, acc: 0, chars: 0 });
  const [caretPos, setCaretPos]   = useState({ left: 0, top: 0, height: 24 });
  const [history, setHistory]     = useState<{wpm: number; acc: number; date: string}[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const zoneRef  = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tf_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const load = useCallback(async (lang = language, dur = duration) => {
    setLoading(true);
    setFinished(false);
    setUserInput('');
    setStartTime(null);
    setIsStarted(false);
    setTimeLeft(dur);
    setStats({ wpm: 0, acc: 0, chars: 0 });
    charRefs.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const data = await fetchWikiPage(lang);
      setWikiData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [language, duration]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isStarted || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { endTest(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, finished]);

  /* Caret tracking */
  useEffect(() => {
    const span = charRefs.current[userInput.length];
    const zone = zoneRef.current;
    if (!span || !zone) return;
    const pr = zone.getBoundingClientRect();
    const sr = span.getBoundingClientRect();
    setCaretPos({ left: sr.left - pr.left, top: sr.top - pr.top, height: sr.height });
  }, [userInput, wikiData]);

  const calc = useCallback((inp: string) => {
    if (!wikiData) return;
    const norm = inp.normalize('NFC');
    const tgt  = wikiData.extract.normalize('NFC');
    let ok = 0;
    for (let i = 0; i < Math.min(norm.length, tgt.length); i++)
      if (norm[i] === tgt[i]) ok++;
    const acc = norm.length > 0 ? Math.round((ok / norm.length) * 100) : 0;
    let wpm = 0;
    if (startTime) {
      const m = (Date.now() - startTime) / 60000;
      if (m > 0) wpm = Math.round((ok / 5) / m);
    }
    setStats({ wpm, acc, chars: norm.length });
  }, [wikiData, startTime]);

  const endTest = useCallback(() => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setStats(prev => {
      const e = { wpm: prev.wpm, acc: prev.acc, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setHistory(h => { const n = [e, ...h].slice(0, 6); localStorage.setItem('tf_history', JSON.stringify(n)); return n; });
      return prev;
    });
  }, []);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const raw = e.currentTarget.value;
    if (finished || loading || !wikiData) { e.currentTarget.value = ''; return; }
    if (!isStarted && raw.length > 0) { setIsStarted(true); setStartTime(Date.now()); }
    const norm = raw.normalize('NFC');
    setUserInput(norm);
    calc(norm);
    if (norm.length >= wikiData.extract.length) endTest();
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') load();
      if (e.key === 'Tab') { e.preventDefault(); setLanguage(l => LANGS[(LANGS.indexOf(l) + 1) % LANGS.length]); }
      if (!finished && !loading) inputRef.current?.focus();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [finished, loading, load]);

  const characters = useMemo(() => wikiData?.extract.split('') || [], [wikiData]);
  const pct = (timeLeft / duration) * 100;
  const fillColor = pct > 40 ? SK.yellow : pct > 15 ? '#e6a817' : SK.error;

  /* ── Panel styles ── */
  const panel: React.CSSProperties = {
    background: SK.surface, border: `1px solid ${SK.border}`,
    borderRadius: '1.25rem', padding: '1.75rem', display: 'flex',
    flexDirection: 'column', gap: '1.25rem',
  };

  return (
    <div
      style={{ minHeight: '100vh', background: SK.bg, color: SK.text, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden', position: 'relative' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Subtle orbs — serika yellow tint */}
      <div className="orb" style={{ width: 700, height: 700, top: -200, left: -150, background: 'radial-gradient(circle, rgba(226,183,20,0.04), transparent 70%)', filter: 'blur(80px)', opacity: 1 }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(226,183,20,0.03), transparent 70%)', filter: 'blur(80px)', opacity: 1, animationDelay: '-10s' }} />

      {/* Hidden input */}
      <textarea
        ref={inputRef}
        onInput={handleInput}
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', left: 0, top: 0 }}
        autoFocus spellCheck={false} autoComplete="off"
      />

      {/* ─── 3-COLUMN LAYOUT ─── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '1.5rem', maxWidth: 1700, margin: '0 auto', width: '100%', padding: '2.5rem 2rem', height: '100vh' }}>

        {/* ── LEFT ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${SK.yellow}22`, border: `1px solid ${SK.yellow}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2H6v11h3v9l9-12h-5l3-8z" fill={SK.yellow} />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>TypeFlow</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: SK.sub }}>Serika Dark</div>
            </div>
          </div>

          {/* Wiki info card */}
          <div style={{ ...panel, flex: 1, overflow: 'hidden' }}>
            {wikiData && !loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'auto' }}>
                {wikiData.thumbnail && (
                  <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', height: 160 }}>
                    <img src={wikiData.thumbnail.source} alt={wikiData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${SK.surface}, transparent)` }} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: SK.yellow, marginBottom: 4 }}>Article</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{wikiData.title}</h3>
                  {wikiData.description && (
                    <p style={{ fontSize: '0.75rem', color: SK.sub, marginTop: 4, fontStyle: 'italic' }}>{wikiData.description}</p>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: SK.sub, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                  {wikiData.extract}
                </p>
                {wikiData.content_urls?.desktop.page && (
                  <a href={wikiData.content_urls.desktop.page} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: SK.sub, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${SK.border}` }}
                  >
                    Read on Wikipedia →
                  </a>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${SK.border}`, borderTopColor: SK.yellow, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: SK.sub }}>Loading…</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER ── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem' }}>

          {/* Top controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sk-tab-group">
                {DURATIONS.map(d => (
                  <button key={d} className={`sk-tab ${duration === d ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setDuration(d); load(language, d); }}>
                    {d}s
                  </button>
                ))}
              </div>
              <div style={{ width: 1, height: 20, background: SK.border }} />
              <div className="sk-tab-group">
                {LANGS.map(l => (
                  <button key={l} className={`sk-tab ${language === l ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setLanguage(l); }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => load()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, color: SK.sub, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}
              title="Restart (ESC)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Restart
            </button>
          </div>

          {/* Metrics bar — visible on start */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, opacity: isStarted && !finished ? 1 : 0, transform: isStarted && !finished ? 'none' : 'translateY(-8px)', transition: 'all 0.4s ease', pointerEvents: 'none' }}>
            <div className="sk-metric"><span className="sk-val">{stats.wpm}</span><span className="sk-label">wpm</span></div>
            <div className="sk-metric"><span className="sk-val">{stats.acc}%</span><span className="sk-label">acc</span></div>
            <div className="sk-metric"><span className="sk-val">{timeLeft}</span><span className="sk-label">sec</span></div>
          </div>

          {/* Progress bar */}
          <div className="sk-track">
            <div className="sk-fill" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
          </div>

          {/* Typing zone */}
          <div style={{ ...panel, flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4em', color: SK.sub, animation: 'pulse 2s infinite' }}>Fetching content…</span>
              </div>
            ) : finished ? (
              <div className="sk-result" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: SK.yellow, marginBottom: 16 }}>Test Complete</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '6rem', fontWeight: 900, lineHeight: 1, color: SK.yellow }}>{stats.wpm}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: SK.sub }}>WPM</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 12 }}>
                    <div><span style={{ fontWeight: 800, fontSize: '1.25rem', color: SK.text }}>{stats.acc}%</span><span style={{ fontSize: '0.65rem', display: 'block', color: SK.sub, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Accuracy</span></div>
                    <div><span style={{ fontWeight: 800, fontSize: '1.25rem', color: SK.text }}>{stats.chars}</span><span style={{ fontSize: '0.65rem', display: 'block', color: SK.sub, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Chars</span></div>
                  </div>
                </div>
                <button onClick={() => load()} className="sk-btn">
                  Try Again
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            ) : (
              <>
                <div ref={zoneRef} className="sk-typing" style={{ overflow: 'auto', height: '100%' }}>
                  <div className="sk-caret" style={{ left: caretPos.left, top: caretPos.top + caretPos.height * 0.1, height: caretPos.height * 0.8 }} />
                  {characters.map((ch, i) => {
                    let cls = 'c-untyped';
                    if (i < userInput.length) cls = userInput[i] === ch ? 'c-correct' : 'c-wrong';
                    return <span key={i} ref={el => { charRefs.current[i] = el; }} className={cls}>{ch}</span>;
                  })}
                </div>

                {/* Start hint */}
                {!isStarted && (
                  <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.35em', color: SK.sub }}>
                      start typing to begin
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom: source + shortcuts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: 4, opacity: 0.5 }}>
            {wikiData && !loading ? (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: SK.sub, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {wikiData.title}
              </span>
            ) : <span />}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.65rem', color: SK.sub, fontWeight: 700 }}>
              <span className="sk-kbd">ESC</span><span style={{ marginLeft: -10 }}>reset</span>
              <span className="sk-kbd">TAB</span><span style={{ marginLeft: -10 }}>lang</span>
            </div>
          </div>
        </main>

        {/* ── RIGHT ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: SK.sub, paddingBottom: 8 }}>
            Recent Sessions
          </div>
          <div style={{ ...panel, flex: 1, overflow: 'hidden', gap: '1rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: 2 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: `rgba(0,0,0,0.12)`, border: `1px solid ${SK.border}`, borderRadius: '0.75rem' }}>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: '1.25rem', color: SK.text }}>{h.wpm} <span style={{ fontSize: '0.6rem', color: SK.sub, fontWeight: 700 }}>WPM</span></div>
                      <div style={{ fontSize: '0.6rem', color: SK.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>{h.date}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.9rem', fontWeight: 800, color: SK.yellow }}>{h.acc}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: SK.sub, textAlign: 'center' }}>No sessions yet</span>
              </div>
            )}
          </div>

          {/* Tips card */}
          <div style={{ ...panel, background: `${SK.yellow}08`, border: `1px solid ${SK.yellow}22`, gap: '1rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: SK.yellow }}>Quick Reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[['ESC', 'Restart session'], ['TAB', 'Switch language'], ['Click', 'Focus input']].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: SK.sub }}>{desc}</span>
                  <span className="sk-kbd">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

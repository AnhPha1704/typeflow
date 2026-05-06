'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWikiPage, WikiPageData } from '@/utils/fetchWikiText';

export default function Home() {
  const [wikiData, setWikiData] = useState<WikiPageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('vi');
  const [userInput, setUserInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [stats, setStats] = useState({ wpm: 0, acc: 0 });
  const [hasError, setHasError] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingAreaRef = useRef<HTMLDivElement>(null);

  const loadNewText = useCallback(async () => {
    setLoading(true);
    setFinished(false);
    setUserInput('');
    setStartTime(null);
    setIsStarted(false);
    setTimeLeft(60);
    setStats({ wpm: 0, acc: 0 });
    setHasError(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const data = await fetchWikiPage(language);
      setWikiData(data);
      if (inputRef.current) {
        inputRef.current.value = '';
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { loadNewText(); }, [loadNewText]);

  useEffect(() => {
    if (isStarted && timeLeft > 0 && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { finishTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, finished]);

  const finishTest = () => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const calculateStats = useCallback((input: string) => {
    if (!wikiData) return;
    const norm = input.normalize('NFC');
    const target = wikiData.extract.normalize('NFC');
    let correct = 0;
    const len = Math.min(norm.length, target.length);
    for (let i = 0; i < len; i++) if (norm[i] === target[i]) correct++;
    const acc = norm.length > 0 ? Math.round((correct / norm.length) * 100) : 0;
    let wpm = 0;
    if (startTime) {
      const mins = (Date.now() - startTime) / 60000;
      if (mins > 0) wpm = Math.round((correct / 5) / mins);
    }
    setStats({ wpm, acc });
  }, [wikiData, startTime]);

  useEffect(() => {
    calculateStats(userInput);
    const caret = document.querySelector('.caret') as HTMLElement;
    const area = typingAreaRef.current;
    if (caret && area) {
      const caretTop = caret.offsetTop;
      const half = area.offsetHeight / 2;
      if (caretTop > half) area.scrollTo({ top: caretTop - half, behavior: 'smooth' });
    }
  }, [userInput, calculateStats]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const raw = e.currentTarget.value;
    if (finished || loading || !wikiData) { e.currentTarget.value = ''; return; }
    if (!isStarted && raw.length > 0) { setIsStarted(true); setStartTime(Date.now()); }
    const norm = raw.normalize('NFC');
    const target = wikiData.extract.normalize('NFC');
    if (norm.length > 0) {
      const last = norm.length - 1;
      setHasError(norm[last] !== target[last]);
    } else setHasError(false);
    setUserInput(norm);
    calculateStats(norm);
    if (norm.length >= wikiData.extract.length) finishTest();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') loadNewText();
      if (e.key === 'Tab') {
        e.preventDefault();
        const langs = ['vi', 'en', 'ja'];
        setLanguage(langs[(langs.indexOf(language) + 1) % langs.length]);
      }
      if (!finished && !loading) inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [language, finished, loading, loadNewText]);

  const timePercent = (timeLeft / 60) * 100;
  const timerColor = timePercent > 50
    ? 'linear-gradient(90deg,#7c3aed,#a78bfa)'
    : timePercent > 20
    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    : 'linear-gradient(90deg,#ef4444,#f87171)';

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', cursor: 'text' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Orbs */}
      <div style={{
        position: 'fixed', top: '-160px', left: '-160px', width: '600px', height: '600px',
        borderRadius: '9999px', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0, opacity: 0.35,
        background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
        animation: 'orb-drift 12s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', right: '-80px', width: '500px', height: '500px',
        borderRadius: '9999px', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0, opacity: 0.2,
        background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
        animation: 'orb-drift 12s ease-in-out infinite alternate-reverse',
      }} />

      {/* Hidden input */}
      <textarea
        ref={inputRef}
        onInput={handleInput}
        style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1, resize: 'none', cursor: 'default' }}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '860px', margin: '0 auto', padding: '32px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 0 20px rgba(124,58,237,0.45)'
          }}>
            <svg style={{ width: '18px', height: '18px', color: 'white', fill: 'white' }} viewBox="0 0 24 24">
              <path d="M13 2H6v11h3v9l9-12h-5l3-8z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>TypeFlow</h1>
            <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Glass Edition</p>
          </div>
        </div>

        {/* Right: Stats + Lang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Stats card */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '10px 20px' }}>
            {[
              { label: 'WPM', value: stats.wpm, g: 'linear-gradient(135deg,#a78bfa,#818cf8)' },
              { label: 'ACC', value: stats.acc + '%', g: 'linear-gradient(135deg,#34d399,#06b6d4)' },
              { label: 'TIME', value: timeLeft + 's', g: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <span style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', background: s.g, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {s.value}
                </span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Language */}
          <div className="glass-card" style={{ display: 'flex', padding: '4px', gap: '2px' }}>
            {['vi', 'en', 'ja'].map(lang => (
              <button key={lang} className={`lang-btn ${language === lang ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setLanguage(lang); }}>
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: '2px', width: '100%', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', transition: 'width 1s linear, background 0.5s ease', width: `${timePercent}%`, background: timerColor }} />
        </div>
      </div>

      {/* Main */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Typing Area */}
          <div
            ref={typingAreaRef}
            className={`typing-area ${isStarted ? 'active' : ''}`}
            style={{
              height: '340px', padding: '36px 40px',
              boxShadow: hasError ? '0 0 0 1px rgba(244,63,94,0.3), 0 20px 60px rgba(244,63,94,0.07)' : undefined,
            }}
            aria-live="polite"
          >
            {loading ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                <div className="spinner" />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>Fetching context…</span>
              </div>
            ) : finished ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>Session Complete</p>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>Great job! 🎉</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="result-stat">
                    <span className="result-value" style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats.wpm}</span>
                    <span className="result-label">Words / Min</span>
                  </div>
                  <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />
                  <div className="result-stat">
                    <span className="result-value" style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats.acc}%</span>
                    <span className="result-label">Accuracy</span>
                  </div>
                </div>
                <button onClick={loadNewText} className="primary-btn">
                  <svg style={{ width: '16px', height: '16px', fill: 'white' }} viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                  Try Again
                </button>
              </div>
            ) : (
            <div className="font-mono-code" style={{ 
              fontSize: '1.4rem', 
              lineHeight: '1.6', 
              letterSpacing: '0.02em', 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word', 
              userSelect: 'none', 
              width: '100%', 
              textAlign: 'left' 
            }}>
              {wikiData?.extract.split('').map((char, i) => {
                const isCurrent = i === userInput.length;
                let cls = 'char-untyped';
                if (i < userInput.length) cls = userInput[i] === char ? 'char-correct' : 'char-incorrect';
                return (
                  <span key={i} className={`relative ${cls}`}>
                    {isCurrent && <span className="caret" style={{ position: 'absolute', left: 0, top: '15%', height: '70%' }} />}
                    {char}
                  </span>
                );
              })}
              {userInput.length === wikiData?.extract.length && (
                <span style={{ position: 'relative' }}>
                  <span className="caret" style={{ position: 'absolute', left: 0, top: '15%', height: '70%' }} />
                  {' '}
                </span>
              )}
            </div>
            )}
          </div>

          {/* Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'rgba(255,255,255,0.3)' }}>
              {[['ESC', 'Restart'], ['TAB', 'Language']].map(([k, label]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                  <kbd className="kbd">{k}</kbd>{label}
                </span>
              ))}
            </div>
            <button onClick={loadNewText} className="action-btn" style={{ pointerEvents: 'all' }}>
              <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
              New Text
            </button>
          </div>

          {/* Start hint - Fixed position to avoid jumping */}
          <div style={{ 
            height: '20px', 
            opacity: (!isStarted && !loading && !finished) ? 1 : 0, 
            transition: 'opacity 0.3s ease',
            textAlign: 'center' 
          }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
              Bắt đầu gõ để khởi động bộ đếm thời gian ✦
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
          TypeFlow · Glass Edition · Wikipedia
        </p>
      </footer>
    </div>
  );
}

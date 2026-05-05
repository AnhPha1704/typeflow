'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWikiPage, WikiPageData } from '@/utils/fetchWikiText';
import { VirtualKeyboard } from '@/components/Keyboard/Visualizer';

export default function Home() {
  const [wikiData, setWikiData] = useState<WikiPageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('vi');
  
  const [userInput, setUserInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [stats, setStats] = useState({ wpm: 0, acc: 0 });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadNewText = useCallback(async () => {
    setLoading(true);
    setFinished(false);
    setUserInput('');
    setStartTime(null);
    setIsStarted(false);
    setTimeLeft(30);
    setStats({ wpm: 0, acc: 0 });
    
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


  useEffect(() => {
    loadNewText();
  }, [loadNewText]);

  useEffect(() => {
    if (isStarted && timeLeft > 0 && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, finished]);

  const finishTest = () => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const calculateStats = useCallback((input: string) => {
    if (!wikiData) return;
    
    // Normalize both for comparison to handle different Vietnamese IMEs
    const normalizedInput = input.normalize('NFC');
    const targetText = wikiData.extract.normalize('NFC');
    
    let correctChars = 0;
    const compareLength = Math.min(normalizedInput.length, targetText.length);
    for (let i = 0; i < compareLength; i++) {
      if (normalizedInput[i] === targetText[i]) {
        correctChars++;
      }
    }

    const acc = normalizedInput.length > 0 ? Math.round((correctChars / normalizedInput.length) * 100) : 0;
    let wpm = 0;
    if (startTime) {
      const timeElapsedMinutes = (Date.now() - startTime) / 60000;
      if (timeElapsedMinutes > 0) {
        wpm = Math.round((correctChars / 5) / timeElapsedMinutes);
      }
    }
    setStats({ wpm, acc });
  }, [wikiData, startTime]);

  useEffect(() => {
    calculateStats(userInput);
    
    // Auto-scroll to caret (Vertical Only)
    const caretElement = document.querySelector('.caret') as HTMLElement;
    const workspace = document.querySelector('.typing-workspace') as HTMLElement;
    
    if (caretElement && workspace) {
      const caretTop = caretElement.offsetTop;
      const workspaceHeight = workspace.offsetHeight;
      const scrollThreshold = workspaceHeight / 2;

      if (caretTop > scrollThreshold) {
        workspace.scrollTo({
          top: caretTop - scrollThreshold,
          behavior: 'smooth'
        });
      }
    }
  }, [userInput, calculateStats]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const rawValue = e.currentTarget.value;
    
    if (finished || loading || !wikiData) {
      e.currentTarget.value = '';
      return;
    }
    
    if (!isStarted && rawValue.length > 0) {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    // Always normalize input to NFC for consistent internal state
    const normalizedValue = rawValue.normalize('NFC');
    setUserInput(normalizedValue);
    calculateStats(normalizedValue);

    if (normalizedValue.length >= wikiData.extract.length) {
      finishTest();
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        loadNewText();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const langs = ['vi', 'en', 'ja'];
        const nextIdx = (langs.indexOf(language) + 1) % langs.length;
        setLanguage(langs[nextIdx]);
      }
      if (!finished && !loading) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [language, finished, loading, loadNewText]);

  return (
    <div 
      className="min-h-screen flex flex-col bg-background text-foreground relative font-pixel overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      <textarea
        ref={inputRef}
        onInput={handleInput}
        className="fixed left-0 top-0 w-full h-full opacity-0 cursor-default resize-none z-0"
        autoFocus
        spellCheck={false}
        autoComplete="off"
        aria-hidden="true"
      />
      
      {/* Top Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 py-10 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-primary border-4 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13 2H6v11h3v9l9-12h-5l3-8z" />
            </svg>
          </div>
          <div className="pointer-events-auto">
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase" style={{ textShadow: '4px 4px 0px #000' }}>TYPEFLOW</h1>
            <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-1">Retro Neural Engine v2.6</p>
          </div>
        </div>

        <div className="flex gap-12 items-center pointer-events-auto">
          <div className="flex gap-10" aria-label="Typing statistics">
            {[
              { label: 'WPM', value: stats.wpm, color: 'text-primary' },
              { label: 'ACC', value: stats.acc + '%', color: 'text-secondary' },
              { label: 'TIME', value: timeLeft + 'S', color: 'text-white' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xs font-bold text-sub uppercase mb-1">{item.label}</span>
                <span className={`text-4xl font-bold ${item.color} tabular-nums`} style={{ textShadow: '2px 2px 0px #000' }}>{item.value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex bg-black border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            {['vi', 'en', 'ja'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-6 py-2 text-sm font-bold uppercase transition-all ${
                  language === lang 
                    ? 'bg-primary text-white' 
                    : 'text-sub hover:text-white hover:bg-white/5'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 z-10 -mt-10 pointer-events-none">
        <div className="w-full max-w-[1200px] flex flex-col gap-12 items-center">
          
          <div 
            className="typing-workspace w-full px-12 md:px-24 py-12 md:py-16 h-[400px] flex flex-col items-center relative overflow-y-auto custom-scrollbar pointer-events-auto"
            aria-live="polite"
          >
            {loading ? (
              <div className="flex-1 w-full flex flex-col items-center justify-center gap-6" role="status">
                <div className="w-16 h-16 border-8 border-white/10 border-t-primary animate-[spin_1s_steps(8)_infinite]"></div>
                <span className="text-xl font-bold text-primary tracking-widest uppercase animate-pulse">Syncing Wikipedia Context…</span>
              </div>
            ) : (
              <div className="relative w-full text-left">
                {finished ? (
                  <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 min-h-[300px] animate-in fade-in zoom-in duration-500">
                    <h2 className="text-6xl font-bold text-secondary uppercase" style={{ textShadow: '4px 4px 0px #000' }}>Test Complete!</h2>
                    <div className="flex gap-16 mt-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-sub uppercase">Final Speed</span>
                        <span className="text-7xl font-bold text-primary">{stats.wpm} WPM</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-sub uppercase">Accuracy</span>
                        <span className="text-7xl font-bold text-secondary">{stats.acc}%</span>
                      </div>
                    </div>
                    <button 
                      onClick={loadNewText}
                      className="pixel-btn mt-8 text-xl px-12 py-4 bg-primary text-white"
                    >
                      TRY AGAIN (ESC)
                    </button>
                  </div>
                ) : (
                  <div className="text-4xl md:text-5xl leading-[1.6] text-white/80 select-none text-left whitespace-pre-wrap break-words w-full">
                    {wikiData?.extract.split('').map((char, index) => {
                      const isCurrent = index === userInput.length;
                      let colorClass = 'char-untyped';
                      if (index < userInput.length) {
                        colorClass = userInput[index] === char ? 'char-correct' : 'char-incorrect';
                      }
                      return (
                        <span key={index} className={`relative ${colorClass}`}>{isCurrent && <span className="caret absolute left-0 top-[10%]"></span>}{char}</span>
                      );
                    })}
                    {userInput.length === wikiData?.extract.length && (
                      <span className="relative">
                        <span className="caret absolute left-0 top-[10%]"></span>
                        {' '}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!finished && (
            <div className="w-full flex flex-col items-center gap-10">
              <div className="pixel-card p-10 flex flex-col items-center w-full max-w-5xl pointer-events-auto">
                <VirtualKeyboard />
                
                <div className="w-full mt-10 pt-10 border-t-4 border-black/20 flex justify-between items-center text-xs font-bold text-sub uppercase">
                  <div className="flex gap-10 items-center">
                    <span className="flex items-center gap-3">
                      <kbd className="bg-black text-white px-3 py-1 border-2 border-white/20">ESC</kbd> RESTART
                    </span>
                    <span className="flex items-center gap-3">
                      <kbd className="bg-black text-white px-3 py-1 border-2 border-white/20">TAB</kbd> LANGUAGE
                    </span>
                  </div>
                  
                  <button
                    onClick={loadNewText}
                    className="pixel-btn text-white flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                    </svg>
                    <span>REBOOT ENGINE</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 text-center text-[10px] font-bold text-sub/30 uppercase tracking-[0.5em] mt-auto">
        TypeFlow // 8-Bit High-Performance Typing Studio
      </footer>
    </div>
  );
}

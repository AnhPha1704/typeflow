'use client';

import { useState, useEffect } from 'react';
import { fetchWikiText } from '@/utils/fetchWikiText';

export default function Home() {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('vi');
  const [stats, setStats] = useState({ wpm: 0, acc: 0, time: 30 });

  const loadNewText = async () => {
    setLoading(true);
    try {
      const newText = await fetchWikiText(language);
      setText(newText || "Không thể tải văn bản. Vui lòng thử lại.");
    } catch (err) {
      setText("Lỗi kết nối API Wikipedia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewText();
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      
      {/* Top Header - Wide Layout */}
      <header className="w-full max-w-[1400px] mx-auto px-6 py-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">SWIFTTYPE</h1>
            <p className="text-[9px] uppercase tracking-[0.4em] text-sub font-bold">Neural Engine v2.6</p>
          </div>
        </div>

        <div className="flex gap-16 items-center">
          <div className="flex gap-12">
            {[
              { label: 'WPM', value: stats.wpm, color: 'text-primary' },
              { label: 'ACCURACY', value: `${stats.acc}%`, color: 'text-secondary' },
              { label: 'TIMER', value: `${stats.time}s`, color: 'text-white' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] font-black text-sub tracking-widest uppercase mb-1">{item.label}</span>
                <span className={`text-3xl font-mono font-bold ${item.color} tabular-nums`}>{item.value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            {['vi', 'en', 'ja'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all ${
                  language === lang 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-sub hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace - Shifted up slightly for better ergonomics */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-20">
        <div className="w-full max-w-5xl flex flex-col gap-10 items-center">
          
          <div className="typing-workspace w-full p-12 md:p-20 min-h-[400px] flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

            {loading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-2 border-white/10 border-t-primary rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-sub tracking-[0.5em] uppercase animate-pulse">Syncing Wikipedia Context</span>
              </div>
            ) : (
              <div className="relative w-full text-center">
                <div className="font-mono text-2xl md:text-4xl leading-[1.8] opacity-90 text-white/80">
                  <span className="caret"></span>
                  {text.split('').map((char, index) => (
                    <span key={index} className="char-untyped">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Action & Tips */}
          <div className="w-full flex justify-between items-center text-[10px] font-bold text-sub uppercase tracking-[0.3em]">
            <div className="flex gap-12 items-center">
              <span className="flex items-center gap-3">
                <kbd className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-white font-sans">ESC</kbd> RESTART TEST
              </span>
              <span className="flex items-center gap-3">
                <kbd className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-white font-sans">TAB</kbd> NEXT LANGUAGE
              </span>
            </div>
            
            <button
              onClick={loadNewText}
              className="flex items-center gap-3 text-primary hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Recalibrate Engine</span>
            </button>
          </div>
        </div>
      </main>

      {/* Background Mesh Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[150px]"></div>
      </div>

      <footer className="w-full py-6 text-center text-[9px] font-bold text-sub/20 uppercase tracking-[0.8em] mt-auto z-20">
        Designed for High Performance & Zen Focus
      </footer>
    </div>
  );
}

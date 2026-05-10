// ─── Language & Duration ──────────────────────────────────────────────────────

export const LANGS = ['vi', 'en', 'ja'] as const;
export const DURATIONS = [15, 30, 60] as const;

export type Lang = typeof LANGS[number];
export type Duration = typeof DURATIONS[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Stats {
  wpm:   number;
  acc:   number;
  chars: number;
}

export interface HistoryEntry {
  wpm:  number;
  acc:  number;
  date: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

/** Sage Forest palette — single source of truth */
export const C = {
  bg:      '#161e1b',
  surface: '#1e2a25',
  border:  '#2d3d37',
  text:    '#EAE7D6',
  sub:     '#5D7B6F',
  accent:  '#D7F9FA',
  error:   '#e07070',
} as const;

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

export const SHORTCUTS: [string, string][] = [
  ['ESC',   'Restart session'],
  ['Click', 'Focus input'],
];

// ─── localStorage key ─────────────────────────────────────────────────────────

export const HISTORY_KEY = 'tf_history';
export const HISTORY_MAX = 6;

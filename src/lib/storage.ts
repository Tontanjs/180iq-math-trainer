import { TrainingSession, DailyStats, PuzzleResult } from './types';

const SESSIONS_KEY = '180iq_sessions';
const PENDING_KEY = '180iq_pending_session';

export function getSessions(): TrainingSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch { return []; }
}

export function saveSession(session: TrainingSession): void {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function setPendingSession(data: unknown): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function getPendingSession<T>(): T | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearPendingSession(): void {
  localStorage.removeItem(PENDING_KEY);
}

export function getDailyStats(): DailyStats[] {
  const sessions = getSessions();
  const map: Record<string, DailyStats> = {};
  for (const s of sessions) {
    const date = s.date.split('T')[0];
    if (!map[date]) map[date] = { date, accuracy: 0, questionsAnswered: 0, avgTime: 0, streak: 0 };
    const d = map[date];
    d.questionsAnswered += s.results.length;
    d.accuracy = (d.accuracy + s.accuracy) / 2;
    d.avgTime = (d.avgTime + s.avgTime) / 2;
    if (s.maxStreak > d.streak) d.streak = s.maxStreak;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const daily = getDailyStats();
  return daily.find(d => d.date === today) || { date: today, accuracy: 0, questionsAnswered: 0, avgTime: 0, streak: 0 };
}

export function getCurrentStreak(): number {
  const sessions = getSessions();
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
  let streak = 0;
  let check = new Date();
  for (const day of days) {
    const d = new Date(day);
    const diff = Math.floor((check.getTime() - d.getTime()) / 86400000);
    if (diff <= 1) { streak++; check = d; }
    else break;
  }
  return streak;
}

export function clearAllData(): void {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(PENDING_KEY);
}

const PUZZLE_RESULTS_KEY = '180iq_puzzle_results';

export function getPuzzleResults(): PuzzleResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PUZZLE_RESULTS_KEY) || '[]');
  } catch { return []; }
}

export function savePuzzleResult(result: PuzzleResult): void {
  const results = getPuzzleResults();
  results.push(result);
  localStorage.setItem(PUZZLE_RESULTS_KEY, JSON.stringify(results));
}

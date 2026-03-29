import type { SessionSummary, StoredSession } from '../types/session';
import { SESSION_STORAGE_KEY, MAX_STORED_SESSIONS } from '../types/session';

export function saveSession(summary: SessionSummary | null | undefined): StoredSession | null {
  if (!summary || typeof summary.endedAt !== 'number') return null;
  const stored: StoredSession = {
    ...summary,
    id: `s-${summary.endedAt}-${Math.random().toString(36).slice(2, 8)}`,
  };
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const list: StoredSession[] = raw ? JSON.parse(raw) : [];
    list.unshift(stored);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED_SESSIONS)));
  } catch { /* ignore */ }
  return stored;
}

export function getRecentSessions(limit = 20): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const list: unknown[] = raw ? JSON.parse(raw) : [];
    return list
      .filter((s): s is StoredSession =>
        s != null && typeof s === 'object' &&
        typeof (s as StoredSession).endedAt === 'number' &&
        typeof (s as StoredSession).game === 'string'
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function getLastSession(): StoredSession | null {
  return getRecentSessions(1)[0] ?? null;
}

function getWeekStart(ts: number): string {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export function getSessionsThisWeek(): StoredSession[] {
  const all = getRecentSessions(MAX_STORED_SESSIONS);
  const thisWeekStart = getWeekStart(Date.now());
  return all.filter((s) => typeof s.endedAt === 'number' && getWeekStart(s.endedAt) === thisWeekStart);
}

export function getCurrentStreak(): number {
  const all = getRecentSessions(MAX_STORED_SESSIONS);
  const seen = new Set<string>();
  for (const s of all) {
    if (typeof s.endedAt !== 'number') continue;
    seen.add(new Date(s.endedAt).toISOString().slice(0, 10));
  }
  const sorted = Array.from(seen).sort().reverse();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sorted[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }
  return streak;
}

export function getTotalMinutes(): number {
  return getRecentSessions(MAX_STORED_SESSIONS).reduce((a, s) => a + s.durationSeconds / 60, 0);
}

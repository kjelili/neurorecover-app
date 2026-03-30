import type { SessionSummary, StoredSession } from '../types/session';
import { SESSION_STORAGE_KEY, MAX_STORED_SESSIONS } from '../types/session';
import { computeQualityScore, estimateCompensationRisk } from './recoveryInsights';
import { getActiveProfileId } from './patientProfiles';

const MAX_NOTES_LENGTH = 300;

function getScopedSessionStorageKey(): string {
  return `${SESSION_STORAGE_KEY}-${getActiveProfileId()}`;
}

function migrateLegacySessionsIfNeeded(scopedKey: string): void {
  try {
    const scopedRaw = localStorage.getItem(scopedKey);
    if (scopedRaw) return;
    const legacyRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!legacyRaw) return;
    localStorage.setItem(scopedKey, legacyRaw);
  } catch {
    // ignore migration errors
  }
}

export function saveSession(summary: SessionSummary | null | undefined): StoredSession | null {
  if (!summary || typeof summary.endedAt !== 'number') return null;
  const metrics = {
    ...summary.metrics,
    qualityScore: summary.metrics.qualityScore ?? computeQualityScore(summary.metrics),
    compensationRisk: summary.metrics.compensationRisk ?? estimateCompensationRisk(summary.metrics),
    sessionIntegrity: summary.metrics.sessionIntegrity ?? (
      summary.durationSeconds < 30
        ? 'short-session'
        : (summary.metrics.cameraQualityScore != null && summary.metrics.cameraQualityScore < 45)
            ? 'low-tracking'
            : 'ok'
    ),
  };
  const notes = summary.annotations?.notes?.trim();
  const stored: StoredSession = {
    ...summary,
    metrics,
    annotations: {
      ...summary.annotations,
      notes: notes ? notes.slice(0, MAX_NOTES_LENGTH) : undefined,
    },
    id: `s-${summary.endedAt}-${Math.random().toString(36).slice(2, 8)}`,
  };
  try {
    const storageKey = getScopedSessionStorageKey();
    migrateLegacySessionsIfNeeded(storageKey);
    const raw = localStorage.getItem(storageKey);
    const list: StoredSession[] = raw ? JSON.parse(raw) : [];
    list.unshift(stored);
    localStorage.setItem(storageKey, JSON.stringify(list.slice(0, MAX_STORED_SESSIONS)));
  } catch { /* ignore */ }
  return stored;
}

export function getRecentSessions(limit = 20): StoredSession[] {
  try {
    const storageKey = getScopedSessionStorageKey();
    migrateLegacySessionsIfNeeded(storageKey);
    const raw = localStorage.getItem(storageKey);
    const list: unknown[] = raw ? JSON.parse(raw) : [];
    return list
      .filter((s): s is StoredSession =>
        s != null && typeof s === 'object' &&
        typeof (s as StoredSession).endedAt === 'number' &&
        typeof (s as StoredSession).game === 'string'
      )
      .map((s) => {
        const session = s as StoredSession;
        return {
          ...session,
          metrics: {
            ...session.metrics,
            qualityScore: session.metrics.qualityScore ?? computeQualityScore(session.metrics),
            compensationRisk: session.metrics.compensationRisk ?? estimateCompensationRisk(session.metrics),
            sessionIntegrity: session.metrics.sessionIntegrity ?? (
              session.durationSeconds < 30
                ? 'short-session'
                : (session.metrics.cameraQualityScore != null && session.metrics.cameraQualityScore < 45)
                    ? 'low-tracking'
                    : 'ok'
            ),
          },
        };
      })
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

export function getAllSessions(): StoredSession[] {
  return getRecentSessions(MAX_STORED_SESSIONS);
}

export function removeSessionsOlderThan(cutoffTs: number): number {
  try {
    const sessions = getAllSessions();
    const filtered = sessions.filter((s) => s.endedAt >= cutoffTs);
    localStorage.setItem(getScopedSessionStorageKey(), JSON.stringify(filtered));
    return sessions.length - filtered.length;
  } catch {
    return 0;
  }
}

export function clearAllSessionsForActiveProfile(): void {
  try {
    localStorage.setItem(getScopedSessionStorageKey(), JSON.stringify([]));
  } catch {
    // ignore
  }
}

export function updateSessionAnnotations(
  sessionId: string,
  patch: { notes?: string; painLevel?: number; fatigueLevel?: number; therapistReviewed?: boolean },
): boolean {
  if (!sessionId) return false;
  try {
    const sessions = getAllSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return false;
    const current = sessions[idx];
    sessions[idx] = {
      ...current,
      annotations: {
        ...current.annotations,
        notes: patch.notes != null ? patch.notes.trim().slice(0, MAX_NOTES_LENGTH) : current.annotations?.notes,
        painLevel: typeof patch.painLevel === 'number' ? Math.max(0, Math.min(10, patch.painLevel)) : current.annotations?.painLevel,
        fatigueLevel: typeof patch.fatigueLevel === 'number' ? Math.max(0, Math.min(10, patch.fatigueLevel)) : current.annotations?.fatigueLevel,
        therapistReviewed: typeof patch.therapistReviewed === 'boolean'
          ? patch.therapistReviewed
          : current.annotations?.therapistReviewed,
      },
    };
    localStorage.setItem(getScopedSessionStorageKey(), JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}

export function exportSessionsJson(): string {
  const payload = {
    exportedAt: Date.now(),
    app: 'NeuroRecover',
    version: 1,
    sessions: getAllSessions(),
  };
  return JSON.stringify(payload, null, 2);
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function exportSessionsCsv(): string {
  const rows = getAllSessions();
  const headers = [
    'id', 'date', 'game', 'durationSeconds', 'score', 'qualityScore',
    'reactionTimeMs', 'tremorEstimate', 'smoothnessEstimate', 'painLevel', 'fatigueLevel', 'notes',
  ];
  const lines = [headers.join(',')];
  for (const s of rows) {
    const row = [
      s.id,
      new Date(s.endedAt).toISOString(),
      s.game,
      String(s.durationSeconds),
      String(s.metrics.score ?? ''),
      String(s.metrics.qualityScore ?? ''),
      String(s.metrics.reactionTimeMs ?? ''),
      String(s.metrics.tremorEstimate ?? ''),
      String(s.metrics.smoothnessEstimate ?? ''),
      String(s.annotations?.painLevel ?? ''),
      String(s.annotations?.fatigueLevel ?? ''),
      s.annotations?.notes ?? '',
    ];
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export function importSessionsFromJson(jsonText: string): { imported: number; skipped: number } {
  try {
    const parsed = JSON.parse(jsonText) as { sessions?: unknown[] };
    const incoming = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    const existing = getAllSessions();
    const existingIds = new Set(existing.map((s) => s.id));
    let imported = 0;
    let skipped = 0;
    const merged = [...existing];

    for (const item of incoming) {
      const s = item as StoredSession;
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.endedAt !== 'number' || typeof s.game !== 'string') {
        skipped++;
        continue;
      }
      if (existingIds.has(s.id)) {
        skipped++;
        continue;
      }
      merged.push({
        ...s,
        metrics: {
          ...s.metrics,
          qualityScore: s.metrics.qualityScore ?? computeQualityScore(s.metrics),
        },
      });
      existingIds.add(s.id);
      imported++;
    }

    merged.sort((a, b) => b.endedAt - a.endedAt);
    localStorage.setItem(getScopedSessionStorageKey(), JSON.stringify(merged.slice(0, MAX_STORED_SESSIONS)));
    return { imported, skipped };
  } catch {
    return { imported: 0, skipped: 0 };
  }
}

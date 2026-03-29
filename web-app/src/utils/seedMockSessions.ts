import type { StoredSession } from '../types/session';
import { SESSION_STORAGE_KEY } from '../types/session';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function make(
  game: StoredSession['game'], endedAt: number, dur: number, score: number,
  reactionTimeMs?: number, romPerFinger?: number[], tremorEstimate?: number, smoothnessEstimate?: number
): StoredSession {
  return {
    id: `s-${endedAt}-${Math.random().toString(36).slice(2, 8)}`,
    game, startedAt: endedAt - dur * 1000, endedAt, durationSeconds: dur,
    metrics: { score, reactionTimeMs, romPerFinger, tremorEstimate, smoothnessEstimate },
  };
}

export function seedMockSessions(): void {
  const sessions: StoredSession[] = [
    make('piano', now - 0 * day, 178, 42, 380, [0.75, 0.9, 0.88, 0.82, 0.72], 0.08, 0.82),
    make('bubbles', now - 1 * day, 165, 28, undefined, [0.7, 0.85, 0.8, 0.75, 0.65], 0.12, 0.75),
    make('piano', now - 2 * day, 180, 38, 420, [0.75, 0.9, 0.88, 0.82, 0.72], 0.09, 0.78),
    make('bubbles', now - 3 * day, 142, 22),
    make('piano', now - 4 * day, 175, 35, 450, [0.7, 0.85, 0.8, 0.75, 0.65], 0.11, 0.72),
    make('grab-cup', now - 5 * day, 120, 8, undefined, [0.7, 0.85, 0.8, 0.75, 0.65], 0.15, 0.68),
    make('bubbles', now - 6 * day, 158, 25),
    make('piano', now - 7 * day, 170, 32, 480, [0.7, 0.85, 0.8, 0.75, 0.65], 0.13, 0.7),
  ];
  try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions)); } catch { /* */ }
}

/**
 * Core session and metrics types for NeuroRecover.
 */

export type GameType = 'piano' | 'bubbles' | 'grab-cup';

export const GAME_LABELS: Record<GameType, string> = {
  piano: 'Virtual Piano',
  bubbles: 'Bubble Pop',
  'grab-cup': 'Cup Grasp',
};

export const GAME_ICONS: Record<GameType, string> = {
  piano: '🎹',
  bubbles: '🫧',
  'grab-cup': '🥤',
};

export const GAME_DESCRIPTIONS: Record<GameType, string> = {
  piano: 'Improve finger isolation and reaction time by pressing piano keys with individual fingers.',
  bubbles: 'Build reach and pinch control by popping bubbles that adapt to your ability.',
  'grab-cup': 'Strengthen hand closure and grip by holding a fist to grasp a virtual cup.',
};

export interface SessionMetrics {
  score?: number;
  reactionTimeMs?: number;
  romPerFinger?: number[];
  tremorEstimate?: number;
  smoothnessEstimate?: number;
}

export interface SessionSummary {
  game: GameType;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  metrics: SessionMetrics;
}

export interface StoredSession extends SessionSummary {
  id: string;
}

export const SESSION_STORAGE_KEY = 'neurorecover-sessions';
export const MAX_STORED_SESSIONS = 200;

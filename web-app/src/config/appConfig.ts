/**
 * Central app configuration for NeuroRecover.
 */

import type { GameType } from '../types/session';

export interface GameConfig {
  id: GameType;
  path: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export const SESSION_DURATION_PRESETS = {
  short: 2,
  standard: 3,
  longer: 5,
} as const;

export type DurationPreset = keyof typeof SESSION_DURATION_PRESETS;

export interface AppConfig {
  sessionDurationMinutes: number;
  voiceEnabled: boolean;
  pdfExportEnabled: boolean;
  weeklyGoalSessions: number;
  games: GameConfig[];
}

export const defaultAppConfig: AppConfig = {
  sessionDurationMinutes: 3,
  voiceEnabled: true,
  pdfExportEnabled: true,
  weeklyGoalSessions: 3,
  games: [
    {
      id: 'piano',
      path: '/app/piano',
      label: 'Virtual Piano',
      description: 'Finger isolation and reaction time. Each finger maps to a key.',
      icon: '🎹',
      color: 'primary',
      enabled: true,
    },
    {
      id: 'bubbles',
      path: '/app/bubbles',
      label: 'Bubble Pop',
      description: 'Reach, pinch, and pop. Builds hand-eye coordination.',
      icon: '🫧',
      color: 'accent',
      enabled: true,
    },
    {
      id: 'grab-cup',
      path: '/app/grab-cup',
      label: 'Cup Grasp',
      description: 'Strengthen grip by holding a fist to grasp a virtual cup.',
      icon: '🥤',
      color: 'primary',
      enabled: true,
    },
  ],
};

let config: AppConfig = defaultAppConfig;

export function getAppConfig(): AppConfig {
  return config;
}

export function getEnabledGames(): GameConfig[] {
  return config.games.filter((g) => g.enabled);
}

export function getSessionDurationMinutes(): number {
  return config.sessionDurationMinutes;
}

export interface AppSettings {
  displayName: string;
  activeProfileId: string;
  language: string;
  voiceActionsEnabled: boolean;
  userRole: 'patient' | 'therapist' | 'admin';
  onboardingCompleted: boolean;
  consentAccepted: boolean;
  retentionDays: number;
  weeklyGoalSessions: number;
  therapistMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceCoaching: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
}

const SETTINGS_KEY = 'neurorecover-settings-v1';

export const defaultSettings: AppSettings = {
  displayName: '',
  activeProfileId: 'default-profile',
  language: 'en',
  voiceActionsEnabled: true,
  userRole: 'patient',
  onboardingCompleted: false,
  consentAccepted: false,
  retentionDays: 365,
  weeklyGoalSessions: 3,
  therapistMode: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  voiceCoaching: false,
  reminderEnabled: true,
  reminderHour: 18,
};

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      weeklyGoalSessions: clamp(parsed.weeklyGoalSessions, 1, 14, defaultSettings.weeklyGoalSessions),
      reminderHour: clamp(parsed.reminderHour, 0, 23, defaultSettings.reminderHour),
      retentionDays: clamp(parsed.retentionDays, 7, 3650, defaultSettings.retentionDays),
    };
  } catch {
    return defaultSettings;
  }
}

function clamp(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage failures
  }
}

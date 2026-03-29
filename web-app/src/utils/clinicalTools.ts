import { getActiveProfileId } from './patientProfiles';
import { getActiveProfile } from './patientProfiles';
import { getAllSessions } from './sessionStorage';
import { loadAppSettings } from './appSettings';

export interface ProtocolTemplate {
  id: string;
  name: string;
  focus: string;
  sessionMinutes: number;
  weeklySessions: number;
  breakdown: Array<{ game: 'piano' | 'bubbles' | 'grab-cup'; minutes: number }>;
}

export interface ClinicalAssessment {
  id: string;
  createdAt: number;
  assessor: string;
  protocolId: string;
  prePain: number;
  postPain: number;
  preFatigue: number;
  postFatigue: number;
  fmaHandEstimate: number;
  aratEstimate: number;
  notes: string;
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: 'control-foundation',
    name: 'Control Foundation',
    focus: 'Improve smoothness and finger isolation with low fatigue load.',
    sessionMinutes: 10,
    weeklySessions: 4,
    breakdown: [
      { game: 'piano', minutes: 4 },
      { game: 'bubbles', minutes: 3 },
      { game: 'grab-cup', minutes: 3 },
    ],
  },
  {
    id: 'reach-and-precision',
    name: 'Reach and Precision',
    focus: 'Increase reach accuracy and controlled pinch response.',
    sessionMinutes: 12,
    weeklySessions: 4,
    breakdown: [
      { game: 'bubbles', minutes: 6 },
      { game: 'piano', minutes: 4 },
      { game: 'grab-cup', minutes: 2 },
    ],
  },
  {
    id: 'grip-endurance',
    name: 'Grip Endurance',
    focus: 'Build sustained hand closure and ADL-ready endurance.',
    sessionMinutes: 12,
    weeklySessions: 5,
    breakdown: [
      { game: 'grab-cup', minutes: 6 },
      { game: 'piano', minutes: 3 },
      { game: 'bubbles', minutes: 3 },
    ],
  },
];

function getAssessmentsKey(): string {
  return `neurorecover-clinical-assessments-${getActiveProfileId()}`;
}

export function getAssessments(limit = 40): ClinicalAssessment[] {
  try {
    const raw = localStorage.getItem(getAssessmentsKey());
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    return list
      .filter((a): a is ClinicalAssessment => {
        if (!a || typeof a !== 'object') return false;
        const x = a as ClinicalAssessment;
        return typeof x.id === 'string' && typeof x.createdAt === 'number' && typeof x.protocolId === 'string';
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function saveAssessment(
  payload: Omit<ClinicalAssessment, 'id' | 'createdAt'>,
): ClinicalAssessment {
  const next: ClinicalAssessment = {
    id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...payload,
  };
  const list = getAssessments(400);
  list.unshift(next);
  try {
    localStorage.setItem(getAssessmentsKey(), JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore
  }
  return next;
}

export interface TherapistExportBundle {
  app: 'NeuroRecover';
  version: 1;
  exportedAt: number;
  profile: {
    id: string;
    name: string;
  };
  settingsSnapshot: {
    weeklyGoalSessions: number;
    therapistMode: boolean;
    reminderEnabled: boolean;
    reminderHour: number;
  };
  sessions: ReturnType<typeof getAllSessions>;
  assessments: ClinicalAssessment[];
}

export function exportTherapistBundleJson(): string {
  const profile = getActiveProfile();
  const settings = loadAppSettings();
  const bundle: TherapistExportBundle = {
    app: 'NeuroRecover',
    version: 1,
    exportedAt: Date.now(),
    profile: {
      id: profile.id,
      name: profile.name,
    },
    settingsSnapshot: {
      weeklyGoalSessions: settings.weeklyGoalSessions,
      therapistMode: settings.therapistMode,
      reminderEnabled: settings.reminderEnabled,
      reminderHour: settings.reminderHour,
    },
    sessions: getAllSessions(),
    assessments: getAssessments(500),
  };
  return JSON.stringify(bundle, null, 2);
}

import { getProfiles } from './patientProfiles';

export interface TherapistUser {
  id: string;
  name: string;
  role: 'therapist' | 'admin';
  createdAt: number;
}

export interface CaseloadAssignment {
  profileId: string;
  therapistId: string;
  assignedAt: number;
}

const THERAPISTS_KEY = 'neurorecover-therapists-v1';
const ASSIGNMENTS_KEY = 'neurorecover-caseload-v1';

export function getTherapists(): TherapistUser[] {
  try {
    const raw = localStorage.getItem(THERAPISTS_KEY);
    const list = raw ? (JSON.parse(raw) as TherapistUser[]) : [];
    return list.filter((t) => t && typeof t.id === 'string');
  } catch {
    return [];
  }
}

export function addTherapist(name: string, role: 'therapist' | 'admin' = 'therapist'): TherapistUser {
  const user: TherapistUser = {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim().slice(0, 50) || `Therapist ${getTherapists().length + 1}`,
    role,
    createdAt: Date.now(),
  };
  const next = [user, ...getTherapists()];
  localStorage.setItem(THERAPISTS_KEY, JSON.stringify(next.slice(0, 100)));
  return user;
}

export function getAssignments(): CaseloadAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    const list = raw ? (JSON.parse(raw) as CaseloadAssignment[]) : [];
    return list.filter((a) => a && typeof a.profileId === 'string' && typeof a.therapistId === 'string');
  } catch {
    return [];
  }
}

export function assignProfileToTherapist(profileId: string, therapistId: string): boolean {
  if (!profileId || !therapistId) return false;
  const existing = getAssignments();
  const duplicate = existing.find((a) => a.profileId === profileId && a.therapistId === therapistId);
  if (duplicate) return true;
  const next: CaseloadAssignment = { profileId, therapistId, assignedAt: Date.now() };
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify([next, ...existing].slice(0, 500)));
  return true;
}

export function getCaseloadSummary() {
  const profiles = getProfiles();
  const therapists = getTherapists();
  const assignments = getAssignments();
  return therapists.map((t) => {
    const profileIds = assignments.filter((a) => a.therapistId === t.id).map((a) => a.profileId);
    const assignedProfiles = profiles.filter((p) => profileIds.includes(p.id));
    return {
      therapist: t,
      count: assignedProfiles.length,
      profiles: assignedProfiles,
    };
  });
}

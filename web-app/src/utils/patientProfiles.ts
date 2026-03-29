export interface PatientProfile {
  id: string;
  name: string;
  createdAt: number;
}

const PROFILES_KEY = 'neurorecover-patient-profiles-v1';
const ACTIVE_PROFILE_KEY = 'neurorecover-active-profile-id';

function fallbackProfile(): PatientProfile {
  return {
    id: 'default-profile',
    name: 'Default Profile',
    createdAt: Date.now(),
  };
}

function loadRawProfiles(): PatientProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    return list.filter((p): p is PatientProfile => {
      if (!p || typeof p !== 'object') return false;
      const x = p as PatientProfile;
      return typeof x.id === 'string' && typeof x.name === 'string' && typeof x.createdAt === 'number';
    });
  } catch {
    return [];
  }
}

function saveProfiles(profiles: PatientProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // ignore storage failures
  }
}

export function ensureProfilesBootstrap(): PatientProfile[] {
  const profiles = loadRawProfiles();
  if (profiles.length > 0) return profiles;
  const first = fallbackProfile();
  saveProfiles([first]);
  setActiveProfileId(first.id);
  return [first];
}

export function getProfiles(): PatientProfile[] {
  return ensureProfilesBootstrap().slice().sort((a, b) => a.createdAt - b.createdAt);
}

export function getActiveProfileId(): string {
  const profiles = ensureProfilesBootstrap();
  const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
  const found = raw && profiles.find((p) => p.id === raw);
  if (found) return found.id;
  setActiveProfileId(profiles[0].id);
  return profiles[0].id;
}

export function setActiveProfileId(profileId: string): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  } catch {
    // ignore storage failures
  }
}

export function createProfile(name: string): PatientProfile {
  const trimmed = name.trim().slice(0, 50) || `Profile ${getProfiles().length + 1}`;
  const profile: PatientProfile = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    createdAt: Date.now(),
  };
  const next = [...getProfiles(), profile];
  saveProfiles(next);
  return profile;
}

export function renameProfile(profileId: string, name: string): boolean {
  const nextName = name.trim().slice(0, 50);
  if (!nextName) return false;
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx < 0) return false;
  profiles[idx] = { ...profiles[idx], name: nextName };
  saveProfiles(profiles);
  return true;
}

export function deleteProfile(profileId: string): boolean {
  const profiles = getProfiles();
  if (profiles.length <= 1) return false;
  const next = profiles.filter((p) => p.id !== profileId);
  if (next.length === profiles.length) return false;
  saveProfiles(next);
  if (getActiveProfileId() === profileId) {
    setActiveProfileId(next[0].id);
  }
  return true;
}

export function getActiveProfile(): PatientProfile {
  const activeId = getActiveProfileId();
  return getProfiles().find((p) => p.id === activeId) ?? fallbackProfile();
}

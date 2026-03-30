/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../utils/appSettings';
import { loadAppSettings, saveAppSettings } from '../utils/appSettings';
import { ensureProfilesBootstrap, getActiveProfileId, setActiveProfileId } from '../utils/patientProfiles';
import { applyRetentionPolicy, logAuditEvent } from '../utils/governance';

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    ensureProfilesBootstrap();
    const loaded = loadAppSettings();
    const activeProfileId = loaded.activeProfileId || getActiveProfileId();
    setActiveProfileId(activeProfileId);
    return { ...loaded, activeProfileId };
  });

  useEffect(() => {
    saveAppSettings(settings);
    setActiveProfileId(settings.activeProfileId);
    document.documentElement.lang = settings.language || 'en';
    document.body.classList.toggle('a11y-high-contrast', settings.highContrast);
    document.body.classList.toggle('a11y-large-text', settings.largeText);
    document.body.classList.toggle('a11y-reduced-motion', settings.reducedMotion);
  }, [settings]);

  useEffect(() => {
    applyRetentionPolicy(settings.retentionDays);
  }, [settings.retentionDays, settings.activeProfileId]);

  const value = useMemo<AppSettingsContextValue>(() => ({
    settings,
    updateSettings: (patch) => {
      if (patch.activeProfileId) setActiveProfileId(patch.activeProfileId);
      if (patch.userRole && patch.userRole !== settings.userRole) {
        logAuditEvent('role.changed', `Role changed to ${patch.userRole}.`);
      }
      setSettings((prev) => ({ ...prev, ...patch }));
    },
  }), [settings]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}

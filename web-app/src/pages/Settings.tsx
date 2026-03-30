import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { clearAllSessionsForActiveProfile, getLastSession } from '../utils/sessionStorage';
import { createProfile, deleteProfile, getProfiles, renameProfile } from '../utils/patientProfiles';
import { applyRetentionPolicy, logAuditEvent } from '../utils/governance';
import { clearAssessmentsForActiveProfile } from '../utils/clinicalTools';
import { LANGUAGE_OPTIONS, t } from '../utils/i18n';

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description: string;
}) {
  return (
    <label className="flex items-start justify-between gap-3 border border-warm-200 rounded-xl p-3">
      <div>
        <p className="text-sm font-semibold text-warm-800">{label}</p>
        <p className="text-xs text-warm-500 mt-0.5">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4" />
    </label>
  );
}

export function Settings() {
  const { settings, updateSettings } = useAppSettings();
  const [profiles, setProfiles] = useState(() => getProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const [toast, setToast] = useState('');
  const last = getLastSession();

  const sendReminderNow = async () => {
    if (!('Notification' in window)) {
      setToast('Browser notifications are not supported on this device.');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      setToast('Notification permission is not granted.');
      return;
    }
    new Notification('NeuroRecover reminder', {
      body: 'A short session today can keep your recovery momentum.',
    });
    setToast('Reminder sent.');
  };

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
            ← Back to dashboard
          </Link>
          <h1 className="section-title">{t(settings.language, 'settings.title')}</h1>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">{t(settings.language, 'settings.language')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-warm-500">
              {t(settings.language, 'settings.language')}
              <select
                className="input-field mt-1"
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">Patient profiles (local)</h2>
          <div className="space-y-3 mb-4">
            {profiles.map((p) => (
              <div key={p.id} className="border border-warm-200 rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-warm-800">{p.name}</p>
                    <p className="text-xs text-warm-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn-ghost text-xs ${settings.activeProfileId === p.id ? 'bg-primary-100 text-primary-700' : ''}`}
                      onClick={() => {
                        updateSettings({ activeProfileId: p.id });
                        setToast(`Active profile: ${p.name}`);
                      }}
                    >
                      {settings.activeProfileId === p.id ? 'Active' : 'Switch'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => {
                        const nextName = renameDraft.trim() || `${p.name} Updated`;
                        const ok = renameProfile(p.id, nextName);
                        setProfiles(getProfiles());
                        if (ok) setToast('Profile renamed.');
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs text-red-600"
                      onClick={() => {
                        const ok = deleteProfile(p.id);
                        setProfiles(getProfiles());
                        if (ok) {
                          setToast('Profile deleted.');
                          if (settings.activeProfileId === p.id) {
                            const first = getProfiles()[0];
                            if (first) updateSettings({ activeProfileId: first.id });
                          }
                        } else {
                          setToast('Cannot delete the last remaining profile.');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
            <label className="text-sm text-warm-500">
              Rename/new profile name
              <input
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value.slice(0, 50))}
                className="input-field mt-1"
                placeholder="Enter profile name"
              />
            </label>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                setNewProfileName(renameDraft);
              }}
            >
              Use as draft
            </button>
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                const created = createProfile((newProfileName || renameDraft).trim() || `Profile ${profiles.length + 1}`);
                setProfiles(getProfiles());
                updateSettings({ activeProfileId: created.id });
                setNewProfileName('');
                setRenameDraft('');
                setToast(`Profile created: ${created.name}`);
              }}
            >
              Add profile
            </button>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">Profile and goals</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-warm-500">
              Display name
              <input
                value={settings.displayName}
                onChange={(e) => updateSettings({ displayName: e.target.value.slice(0, 40) })}
                className="input-field mt-1"
                placeholder="Your name"
              />
            </label>
            <label className="text-sm text-warm-500">
              User role
              <select
                value={settings.userRole}
                onChange={(e) => updateSettings({ userRole: e.target.value as typeof settings.userRole, therapistMode: e.target.value !== 'patient' })}
                className="input-field mt-1"
              >
                <option value="patient">Patient</option>
                <option value="therapist">Therapist</option>
                <option value="admin">Clinic Admin</option>
              </select>
            </label>
            <label className="text-sm text-warm-500">
              Weekly goal (sessions)
              <input
                type="number"
                min={1}
                max={14}
                value={settings.weeklyGoalSessions}
                onChange={(e) => updateSettings({ weeklyGoalSessions: Math.max(1, Math.min(14, Number(e.target.value) || 1)) })}
                className="input-field mt-1"
              />
            </label>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">Accessibility</h2>
          <div className="space-y-3">
            <Toggle
              label="High contrast mode"
              checked={settings.highContrast}
              onChange={(v) => updateSettings({ highContrast: v })}
              description="Increase contrast for clearer visual separation."
            />
            <Toggle
              label="Large text mode"
              checked={settings.largeText}
              onChange={(v) => updateSettings({ largeText: v })}
              description="Increase base font size for easier reading."
            />
            <Toggle
              label="Reduced motion mode"
              checked={settings.reducedMotion}
              onChange={(v) => updateSettings({ reducedMotion: v })}
              description="Reduce visual motion effects."
            />
            <Toggle
              label="Voice coaching"
              checked={settings.voiceCoaching}
              onChange={(v) => updateSettings({ voiceCoaching: v })}
              description="Speak short motivational prompts during sessions."
            />
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">Reminder and therapist mode</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-3">
            <Toggle
              label="Daily reminder"
              checked={settings.reminderEnabled}
              onChange={(v) => updateSettings({ reminderEnabled: v })}
              description="Show a daily session reminder in the app."
            />
            <Toggle
              label="Therapist mode"
              checked={settings.therapistMode}
              onChange={(v) => updateSettings({ therapistMode: v, userRole: v ? settings.userRole : 'patient' })}
              description="Enable therapist-oriented notes and review workflows."
            />
            <Toggle
              label={t(settings.language, 'settings.voiceActions')}
              checked={settings.voiceActionsEnabled}
              onChange={(v) => updateSettings({ voiceActionsEnabled: v })}
              description={t(settings.language, 'settings.voiceActionsDesc')}
            />
          </div>
          <label className="text-sm text-warm-500">
            Reminder hour (24h format)
            <input
              type="number"
              min={0}
              max={23}
              value={settings.reminderHour}
              onChange={(e) => updateSettings({ reminderHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })}
              className="input-field mt-1 max-w-[160px]"
            />
          </label>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button type="button" className="btn-secondary text-sm" onClick={() => void sendReminderNow()}>
              Send test reminder
            </button>
            {last && <p className="text-xs text-warm-400">Last session: {new Date(last.endedAt).toLocaleString()}</p>}
          </div>
          {toast && <p className="text-sm text-warm-500 mt-2">{toast}</p>}
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-4">Governance and data controls</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-3">
            <label className="text-sm text-warm-500">
              Retention policy (days)
              <input
                type="number"
                min={7}
                max={3650}
                value={settings.retentionDays}
                onChange={(e) => updateSettings({ retentionDays: Math.max(7, Math.min(3650, Number(e.target.value) || 365)) })}
                className="input-field mt-1"
              />
            </label>
            <Toggle
              label="Consent acknowledged"
              checked={settings.consentAccepted}
              onChange={(v) => {
                updateSettings({ consentAccepted: v });
                if (v) logAuditEvent('consent.accepted', 'Consent acknowledged in settings.');
              }}
              description="Required for continuing app use in healthcare workflows."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                const res = applyRetentionPolicy(settings.retentionDays);
                setToast(`Retention applied. Removed ${res.sessionsRemoved} sessions and ${res.assessmentsRemoved} assessments.`);
              }}
            >
              Run retention now
            </button>
            <button
              type="button"
              className="btn-ghost text-sm text-red-600"
              onClick={() => {
                clearAllSessionsForActiveProfile();
                clearAssessmentsForActiveProfile();
                logAuditEvent('data.retention.purge', 'Manual clear data for active profile.');
                setToast('Active profile data cleared.');
              }}
            >
              Clear active profile data
            </button>
            {settings.userRole === 'admin' && <Link to="/app/admin" className="btn-ghost text-sm">Open admin console</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}

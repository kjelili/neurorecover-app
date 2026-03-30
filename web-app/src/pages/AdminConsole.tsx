import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addTherapist, assignProfileToTherapist, getCaseloadSummary, getTherapists } from '../utils/clinicAdmin';
import { getProfiles } from '../utils/patientProfiles';
import { getAuditEvents } from '../utils/governance';
import { useAppSettings } from '../context/AppSettingsContext';
import { t } from '../utils/i18n';

export function AdminConsole() {
  const { settings } = useAppSettings();
  const [therapistName, setTherapistName] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const therapists = getTherapists();
  const profiles = getProfiles();
  const caseload = getCaseloadSummary();
  const audits = getAuditEvents(50);
  void refreshTick;

  if (settings.userRole !== 'admin') {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto card p-6">
          <h1 className="section-title mb-2">{t(settings.language, 'admin.title')}</h1>
          <p className="text-warm-500 mb-4">{t(settings.language, 'admin.noAccess')}</p>
          <Link to="/app/settings" className="btn-primary text-sm">{t(settings.language, 'admin.openSettings')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
            ← {t(settings.language, 'common.backDashboard')}
          </Link>
          <h1 className="section-title">{t(settings.language, 'admin.title')}</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-5">
            <h2 className="font-display font-semibold text-warm-800 mb-3">Therapist users</h2>
            <div className="flex gap-2 mb-3">
              <input
                className="input-field"
                placeholder="Therapist name"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value.slice(0, 50))}
              />
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => {
                  addTherapist(therapistName || `Therapist ${therapists.length + 1}`);
                  setTherapistName('');
                  setRefreshTick((x) => x + 1);
                }}
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {therapists.map((t) => (
                <div key={t.id} className="border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-700">
                  {t.name} <span className="text-xs text-warm-400">({t.role})</span>
                </div>
              ))}
              {therapists.length === 0 && <p className="text-sm text-warm-500">No therapist users yet.</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display font-semibold text-warm-800 mb-3">Caseload assignment</h2>
            <div className="space-y-3">
              <label className="text-sm text-warm-500 block">
                Therapist
                <select className="input-field mt-1" value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)}>
                  <option value="">Select therapist</option>
                  {therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-warm-500 block">
                Patient profile
                <select className="input-field mt-1" value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
                  <option value="">Select profile</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => {
                  assignProfileToTherapist(selectedProfileId, selectedTherapistId);
                  setRefreshTick((x) => x + 1);
                }}
              >
                Assign profile
              </button>
            </div>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-3">Caseload summary</h2>
          <div className="space-y-3">
            {caseload.map((c) => (
              <div key={c.therapist.id} className="border border-warm-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-warm-800">{c.therapist.name} ({c.count})</p>
                <p className="text-xs text-warm-500 mt-1">
                  {c.profiles.length ? c.profiles.map((p) => p.name).join(', ') : 'No assigned profiles'}
                </p>
              </div>
            ))}
            {caseload.length === 0 && <p className="text-sm text-warm-500">No caseload assignments yet.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-warm-800 mb-3">Audit trail</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {audits.map((a) => (
              <div key={a.id} className="border border-warm-200 rounded-lg px-3 py-2">
                <p className="text-sm text-warm-700">{a.action}</p>
                <p className="text-xs text-warm-500">{new Date(a.ts).toLocaleString()} • {a.detail}</p>
              </div>
            ))}
            {audits.length === 0 && <p className="text-sm text-warm-500">No audit events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

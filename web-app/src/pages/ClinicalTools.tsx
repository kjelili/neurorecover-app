import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportTherapistBundleJson, getAssessments, PROTOCOL_TEMPLATES, saveAssessment } from '../utils/clinicalTools';
import { useAppSettings } from '../context/AppSettingsContext';
import { getActiveProfile } from '../utils/patientProfiles';
import { exportClinicianReportPdf } from '../utils/exportPdf';
import { getAllSessions } from '../utils/sessionStorage';
import { exportFhirLikeBundleJson } from '../utils/interoperability';
import { logAuditEvent } from '../utils/governance';
import { t } from '../utils/i18n';

export function ClinicalTools() {
  const { settings } = useAppSettings();
  const profile = getActiveProfile();
  const [, setReloadTick] = useState(0);
  const [assessor, setAssessor] = useState('');
  const [protocolId, setProtocolId] = useState(PROTOCOL_TEMPLATES[0].id);
  const [prePain, setPrePain] = useState(0);
  const [postPain, setPostPain] = useState(0);
  const [preFatigue, setPreFatigue] = useState(0);
  const [postFatigue, setPostFatigue] = useState(0);
  const [fmaHandEstimate, setFmaHandEstimate] = useState(0);
  const [aratEstimate, setAratEstimate] = useState(0);
  const [malAmount, setMalAmount] = useState(0);
  const [malQuality, setMalQuality] = useState(0);
  const [promPainInterference, setPromPainInterference] = useState(0);
  const [promFatigue, setPromFatigue] = useState(0);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState('');

  const selectedProtocol = useMemo(
    () => PROTOCOL_TEMPLATES.find((p) => p.id === protocolId) ?? PROTOCOL_TEMPLATES[0],
    [protocolId],
  );
  const assessments = getAssessments(60);
  const downloadBundle = () => {
    const content = exportTherapistBundleJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeProfile = profile.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() || 'profile';
    a.download = `neurorecover-therapist-bundle-${safeProfile}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logAuditEvent('data.export', 'Therapist bundle exported.');
    setSaved('Therapist export bundle downloaded.');
  };
  const downloadFhirBundle = () => {
    const content = exportFhirLikeBundleJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurorecover-fhir-like-${profile.name.replace(/\s+/g, '-').toLowerCase() || 'profile'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logAuditEvent('data.export', 'FHIR-like bundle exported.');
    setSaved('FHIR-like bundle exported.');
  };

  if (!settings.therapistMode) {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto card p-6">
          <h1 className="section-title mb-2">{t(settings.language, 'clinical.title')}</h1>
          <p className="text-warm-500 mb-4">
            Enable therapist mode in Settings to access protocol templates and structured assessments.
          </p>
          <Link to="/app/settings" className="btn-primary text-sm">Open settings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
            ← {t(settings.language, 'common.backDashboard')}
          </Link>
          <h1 className="section-title">{t(settings.language, 'clinical.title')}</h1>
          <p className="text-sm text-warm-500 mt-1">{t(settings.language, 'common.activeProfile')}: {profile.name}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn-secondary text-sm" onClick={downloadBundle}>
              Export therapist bundle (JSON)
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={downloadFhirBundle}>
              Export FHIR-like bundle
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => void exportClinicianReportPdf(getAllSessions(), getAssessments(120), profile.name)}
            >
              Export clinician report PDF
            </button>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-3">Therapist quick onboarding</h2>
          <ol className="text-sm text-warm-600 list-decimal ml-5 space-y-1">
            <li>Select or create patient profile in Settings.</li>
            <li>Pick stage-appropriate protocol template.</li>
            <li>Record baseline structured assessment.</li>
            <li>Run session block and review risk alerts weekly.</li>
            <li>Export clinician report for documentation.</li>
          </ol>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-3">{t(settings.language, 'clinical.protocols')}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {PROTOCOL_TEMPLATES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProtocolId(p.id)}
                className={`text-left border rounded-xl p-3 transition ${
                  protocolId === p.id ? 'border-primary-300 bg-primary-50' : 'border-warm-200 bg-white'
                }`}
              >
                <p className="font-semibold text-warm-800 text-sm">{p.name}</p>
                <p className="text-xs text-warm-500 mt-1">{p.focus}</p>
                <p className="text-xs text-primary-700 mt-2">{p.sessionMinutes} min/session • {p.weeklySessions}x/week</p>
                <p className="text-[11px] text-warm-500 mt-1">Stage: {p.stage} • Profile: {p.targetProfile}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 border border-warm-200 rounded-xl p-3 bg-warm-50">
            <p className="text-xs font-semibold text-warm-700 mb-1">Selected protocol breakdown</p>
            <p className="text-xs text-warm-600">
              {selectedProtocol.breakdown.map((b) => `${b.game.replace('-', ' ')} ${b.minutes}m`).join(' • ')}
            </p>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold text-warm-800 mb-3">{t(settings.language, 'clinical.assessment')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-warm-500">
              Assessor
              <input value={assessor} onChange={(e) => setAssessor(e.target.value.slice(0, 40))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              Protocol
              <select value={protocolId} onChange={(e) => setProtocolId(e.target.value)} className="input-field mt-1">
                {PROTOCOL_TEMPLATES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-warm-500">
              Pre-session pain (0-10)
              <input type="number" min={0} max={10} value={prePain} onChange={(e) => setPrePain(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              Post-session pain (0-10)
              <input type="number" min={0} max={10} value={postPain} onChange={(e) => setPostPain(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              Pre-session fatigue (0-10)
              <input type="number" min={0} max={10} value={preFatigue} onChange={(e) => setPreFatigue(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              Post-session fatigue (0-10)
              <input type="number" min={0} max={10} value={postFatigue} onChange={(e) => setPostFatigue(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              FMA-hand estimate (0-14)
              <input type="number" min={0} max={14} value={fmaHandEstimate} onChange={(e) => setFmaHandEstimate(Math.max(0, Math.min(14, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              ARAT estimate (0-57)
              <input type="number" min={0} max={57} value={aratEstimate} onChange={(e) => setAratEstimate(Math.max(0, Math.min(57, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              MAL amount of use (0-5)
              <input type="number" min={0} max={5} step={0.1} value={malAmount} onChange={(e) => setMalAmount(Math.max(0, Math.min(5, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              MAL quality of movement (0-5)
              <input type="number" min={0} max={5} step={0.1} value={malQuality} onChange={(e) => setMalQuality(Math.max(0, Math.min(5, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              PROMIS pain interference (0-40)
              <input type="number" min={0} max={40} value={promPainInterference} onChange={(e) => setPromPainInterference(Math.max(0, Math.min(40, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
            <label className="text-sm text-warm-500">
              PROMIS fatigue (0-40)
              <input type="number" min={0} max={40} value={promFatigue} onChange={(e) => setPromFatigue(Math.max(0, Math.min(40, Number(e.target.value) || 0)))} className="input-field mt-1" />
            </label>
          </div>
          <label className="text-sm text-warm-500 block mt-4">
            Clinical note
            <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} className="input-field mt-1 min-h-[100px]" />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                saveAssessment({
                  assessor: assessor.trim() || 'Unknown',
                  protocolId,
                  prePain,
                  postPain,
                  preFatigue,
                  postFatigue,
                  fmaHandEstimate,
                  aratEstimate,
                  malAmount,
                  malQuality,
                  promPainInterference,
                  promFatigue,
                  notes: notes.trim(),
                });
                logAuditEvent('assessment.save', `Assessment saved using protocol ${protocolId}.`);
                setReloadTick((x) => x + 1);
                setSaved('Assessment saved.');
              }}
            >
              Save assessment
            </button>
            {saved && <span className="text-sm text-green-700">{saved}</span>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-warm-800 mb-3">{t(settings.language, 'clinical.history')}</h2>
          {assessments.length === 0 ? (
            <p className="text-sm text-warm-500">No assessments saved yet for this profile.</p>
          ) : (
            <div className="space-y-3">
              {assessments.map((a) => (
                <div key={a.id} className="border border-warm-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-warm-800">
                    {new Date(a.createdAt).toLocaleString()} • {PROTOCOL_TEMPLATES.find((p) => p.id === a.protocolId)?.name ?? a.protocolId}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">
                    Assessor: {a.assessor} • Pain {a.prePain}{'->'}{a.postPain} • Fatigue {a.preFatigue}{'->'}{a.postFatigue}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">
                    FMA-hand: {a.fmaHandEstimate}/14 • ARAT: {a.aratEstimate}/57 • MAL: {a.malAmount.toFixed(1)}/{a.malQuality.toFixed(1)}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">
                    PROMIS pain/fatigue: {a.promPainInterference}/{a.promFatigue}
                  </p>
                  {a.notes && <p className="text-sm text-warm-600 mt-2">{a.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

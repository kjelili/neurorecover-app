import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  exportSessionsCsv,
  exportSessionsJson,
  getRecentSessions,
  getSessionsThisWeek,
  getCurrentStreak,
  getTotalMinutes,
  importSessionsFromJson,
  updateSessionAnnotations,
} from '../utils/sessionStorage';
import { exportProgressPdf } from '../utils/exportPdf';
import { GAME_LABELS } from '../types/session';
import type { StoredSession } from '../types/session';
import { computeQualityScore, getRiskAlerts } from '../utils/recoveryInsights';
import { useAppSettings } from '../context/AppSettingsContext';
import { getActiveProfile } from '../utils/patientProfiles';
import { logAuditEvent } from '../utils/governance';
import { t } from '../utils/i18n';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Progress() {
  const { settings } = useAppSettings();
  const [, setReloadTick] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [painDraft, setPainDraft] = useState(0);
  const [fatigueDraft, setFatigueDraft] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const sessions = getRecentSessions(100);
  const valid = sessions.filter(s => s != null && typeof s.endedAt === 'number');
  const profile = getActiveProfile();
  const totalMinutes = getTotalMinutes();
  const sessionsThisWeek = getSessionsThisWeek();
  const streak = getCurrentStreak();

  const chartData = [...valid]
    .filter(s => s.metrics.score != null)
    .sort((a, b) => a.endedAt - b.endedAt)
    .map(s => ({
      date: formatDate(s.endedAt),
      score: s.metrics.score ?? 0,
      game: GAME_LABELS[s.game] || s.game,
    }));

  // Per-game stats
  const gameStats = (['piano', 'bubbles', 'grab-cup'] as const).map(game => {
    const gameSessions = valid.filter(s => s.game === game);
    const scores = gameSessions.map(s => s.metrics.score ?? 0).filter(s => s > 0);
    return {
      game,
      label: GAME_LABELS[game],
      count: gameSessions.length,
      bestScore: scores.length ? Math.max(...scores) : 0,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }).filter(g => g.count > 0);

  const qualityTrend = valid.length
    ? Math.round(valid.reduce((sum, s) => sum + (s.metrics.qualityScore ?? computeQualityScore(s.metrics)), 0) / valid.length)
    : 0;

  const baselineQuality = valid.length > 12
    ? Math.round(valid.slice(12, 30).reduce((sum, s) => sum + (s.metrics.qualityScore ?? computeQualityScore(s.metrics)), 0) / Math.max(1, valid.slice(12, 30).length))
    : qualityTrend;
  const qualityDelta = qualityTrend - baselineQuality;
  const riskAlerts = getRiskAlerts(valid, settings.weeklyGoalSessions, sessionsThisWeek.length);

  const downloadTextFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logAuditEvent('data.export', `Exported file ${filename}.`);
  };

  const startEdit = (session: StoredSession) => {
    setSelectedSessionId(session.id);
    setNotesDraft(session.annotations?.notes ?? '');
    setPainDraft(session.annotations?.painLevel ?? 0);
    setFatigueDraft(session.annotations?.fatigueLevel ?? 0);
  };

  const saveEdit = () => {
    if (!selectedSessionId) return;
    updateSessionAnnotations(selectedSessionId, {
      notes: notesDraft,
      painLevel: painDraft,
      fatigueLevel: fatigueDraft,
      therapistReviewed: true,
    });
    setReloadTick((x) => x + 1);
    setSelectedSessionId(null);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const { imported, skipped } = importSessionsFromJson(text);
    setImportStatus(`Imported ${imported} session(s), skipped ${skipped}.`);
    logAuditEvent('data.import', `Imported sessions from JSON (${imported} imported, ${skipped} skipped).`);
    setReloadTick((x) => x + 1);
  };

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
              ← {t(settings.language, 'common.backDashboard')}
            </Link>
            <h1 className="section-title">{t(settings.language, 'progress.title')}</h1>
            <p className="text-xs text-warm-400 mt-1">{t(settings.language, 'common.activeProfile')}: {profile.name}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => exportProgressPdf(valid)}
              disabled={valid.length === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t(settings.language, 'common.exportPdf')}
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile('neurorecover-sessions.csv', exportSessionsCsv(), 'text/csv')}
              disabled={valid.length === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t(settings.language, 'common.exportCsv')}
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile('neurorecover-backup.json', exportSessionsJson(), 'application/json')}
              disabled={valid.length === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t(settings.language, 'common.backupJson')}
            </button>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.totalTime')}</p>
            <span className="font-display font-bold text-2xl text-warm-800">{Math.round(totalMinutes)} min</span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.sessions')}</p>
            <span className="font-display font-bold text-2xl text-warm-800">{valid.length}</span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.thisWeek')}</p>
            <span className={`font-display font-bold text-2xl ${sessionsThisWeek.length >= settings.weeklyGoalSessions ? 'text-green-600' : 'text-warm-800'}`}>
              {sessionsThisWeek.length}/{settings.weeklyGoalSessions}
            </span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.streak')}</p>
            <span className="font-display font-bold text-2xl text-warm-800">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="card p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'progress.qualityTrend')}</p>
              <p className="font-display font-bold text-2xl text-primary-700">{qualityTrend}/100</p>
              <p className="text-xs text-warm-500 mt-1">
                Baseline: {baselineQuality}/100 ({qualityDelta >= 0 ? '+' : ''}{qualityDelta})
              </p>
            </div>
            <label className="btn-ghost cursor-pointer text-sm">
              {t(settings.language, 'common.importBackup')}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleImportFile(file);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
          {importStatus && <p className="text-sm text-warm-500 mt-2">{importStatus}</p>}
        </div>

        <div className="card p-4 mb-8">
          <h2 className="font-display font-semibold text-warm-800 mb-3">{t(settings.language, 'progress.riskMonitor')}</h2>
          <div className="space-y-2">
            {riskAlerts.map((r) => (
              <p key={r.id} className="text-sm text-warm-600">
                <span className="font-semibold text-warm-800">{r.title}:</span> {r.detail}
              </p>
            ))}
          </div>
        </div>

        {/* Score chart */}
        {chartData.length >= 2 && (
          <div className="card p-5 sm:p-6 mb-8">
            <h2 className="font-display font-semibold text-warm-800 mb-4">{t(settings.language, 'progress.scoreOverTime')}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7e4" />
                  <XAxis dataKey="date" stroke="#a8a5a0" fontSize={12} />
                  <YAxis stroke="#a8a5a0" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e8e7e4',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#07c4af"
                    strokeWidth={2.5}
                    dot={{ fill: '#07c4af', r: 4 }}
                    activeDot={{ r: 6, fill: '#07c4af' }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Per-game breakdown */}
        {gameStats.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-semibold text-warm-800 mb-4">{t(settings.language, 'progress.exerciseBreakdown')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {gameStats.map(g => (
                <div key={g.game} className="card p-5">
                  <p className="font-semibold text-warm-800 mb-3">{g.label}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-400">Sessions</span>
                      <span className="font-medium text-warm-700">{g.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-400">Best score</span>
                      <span className="font-medium text-primary-700">{g.bestScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-400">Average</span>
                      <span className="font-medium text-warm-700">{g.avgScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session history table */}
        {valid.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-semibold text-warm-800 mb-4">{t(settings.language, 'progress.history')}</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-warm-200 bg-warm-50">
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Date</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Exercise</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Score</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Duration</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Quality</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Tracking</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valid.slice(0, 30).map((s, i) => (
                      <tr key={s.id} className={`${i > 0 ? 'border-t border-warm-100' : ''} text-warm-700`}>
                        <td className="p-3">{formatDate(s.endedAt)}</td>
                        <td className="p-3 capitalize">{s.game.replace(/-/g, ' ')}</td>
                        <td className="p-3 font-medium">{s.metrics.score ?? '—'}</td>
                        <td className="p-3">{Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s</td>
                        <td className="p-3">{s.metrics.qualityScore ?? computeQualityScore(s.metrics)}</td>
                        <td className="p-3">
                          {s.metrics.cameraQualityScore != null ? `${Math.round(s.metrics.cameraQualityScore)}/100` : '—'}
                          {s.metrics.sessionIntegrity && s.metrics.sessionIntegrity !== 'ok' && (
                            <span className="text-xs text-red-600 ml-1">({s.metrics.sessionIntegrity})</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button type="button" className="text-primary-600 hover:underline" onClick={() => startEdit(s)}>
                            {s.annotations?.notes ? t(settings.language, 'progress.editNote') : t(settings.language, 'progress.addNote')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedSessionId && (
          <div className="card p-5 mb-8">
            <h3 className="font-display font-semibold text-warm-800 mb-3">Therapist annotation</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-3">
              <label className="text-sm text-warm-500">
                Pain level ({painDraft}/10)
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={painDraft}
                  onChange={(e) => setPainDraft(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
              <label className="text-sm text-warm-500">
                Fatigue level ({fatigueDraft}/10)
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={fatigueDraft}
                  onChange={(e) => setFatigueDraft(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
            </div>
            <label className="text-sm text-warm-500 block mb-3">
              Clinical note
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value.slice(0, 300))}
                className="input-field mt-1 min-h-[96px]"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" className="btn-primary text-sm" onClick={saveEdit}>{t(settings.language, 'progress.saveAnnotation')}</button>
              <button type="button" className="btn-ghost text-sm" onClick={() => setSelectedSessionId(null)}>{t(settings.language, 'common.cancel')}</button>
            </div>
          </div>
        )}

        {valid.length === 0 && (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-warm-500 font-medium">{t(settings.language, 'progress.noSessions')}</p>
            <p className="text-warm-400 text-sm mt-1">Complete your first exercise to start tracking progress.</p>
            <Link to="/app" className="btn-primary mt-4 text-sm">
              {t(settings.language, 'progress.goExercises')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

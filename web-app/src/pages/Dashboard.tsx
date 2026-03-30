import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLastSession, getRecentSessions, getSessionsThisWeek, getCurrentStreak, getTotalMinutes } from '../utils/sessionStorage';
import { getEnabledGames } from '../config/appConfig';
import type { StoredSession } from '../types/session';
import { GAME_LABELS } from '../types/session';
import { computeQualityScore, getRecoveryRecommendations, getRiskAlerts } from '../utils/recoveryInsights';
import { useAppSettings } from '../context/AppSettingsContext';
import { getActiveProfile } from '../utils/patientProfiles';
import { t } from '../utils/i18n';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Dashboard() {
  const { settings } = useAppSettings();
  const activeProfile = getActiveProfile();
  const [nowTs, setNowTs] = useState(() => new Date().getTime());
  const games = getEnabledGames();
  const sessionsThisWeek = getSessionsThisWeek();
  const streak = getCurrentStreak();
  const totalMinutes = getTotalMinutes();
  const weeklyGoal = settings.weeklyGoalSessions;

  useEffect(() => {
    const timer = setInterval(() => setNowTs(new Date().getTime()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const lastSession: StoredSession | null = getLastSession();
  const recentSessions: StoredSession[] = getRecentSessions(10);
  const totalSessions = getRecentSessions(200).length;
  const averageQuality = recentSessions.length
    ? Math.round(recentSessions.reduce((sum, s) => sum + (s.metrics.qualityScore ?? computeQualityScore(s.metrics)), 0) / recentSessions.length)
    : 0;
  const recommendations = getRecoveryRecommendations(recentSessions);
  const riskAlerts = getRiskAlerts(recentSessions, weeklyGoal, sessionsThisWeek.length);
  const lastSessionDaysAgo = lastSession
    ? Math.floor((nowTs - lastSession.endedAt) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title mb-1">
            {new Date().getHours() < 12
              ? t(settings.language, 'dash.greetingMorning')
              : new Date().getHours() < 18
                ? t(settings.language, 'dash.greetingAfternoon')
                : t(settings.language, 'dash.greetingEvening')}
          </h1>
          <p className="text-warm-500">
            {totalSessions === 0
              ? t(settings.language, 'dash.startFirst')
              : t(settings.language, 'dash.completed', { count: totalSessions })}
          </p>
          <p className="text-sm text-primary-700 mt-1">
            {t(settings.language, 'common.activeProfile')}: {activeProfile.name}{settings.displayName ? ` • ${settings.displayName}` : ''}
          </p>
        </div>

        {lastSessionDaysAgo != null && lastSessionDaysAgo >= 2 && (
          <div className="card p-4 mb-6 border-accent-200 bg-accent-50">
            <p className="text-sm text-accent-800">
              It has been {lastSessionDaysAgo} days since your last session. A short 2-minute session today can help maintain momentum.
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">This week</p>
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.thisWeek')}</p>
            <div className="flex items-end gap-1">
              <span className={`font-display font-bold text-2xl ${sessionsThisWeek.length >= weeklyGoal ? 'text-green-600' : 'text-warm-800'}`}>
                {sessionsThisWeek.length}
              </span>
              <span className="text-warm-400 text-sm mb-0.5">/ {weeklyGoal}</span>
            </div>
            {sessionsThisWeek.length >= weeklyGoal && (
              <p className="text-green-600 text-xs font-medium mt-1">Goal reached!</p>
            )}
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.streak')}</p>
            <div className="flex items-end gap-1">
              <span className="font-display font-bold text-2xl text-warm-800">{streak}</span>
              <span className="text-warm-400 text-sm mb-0.5">day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.totalTime')}</p>
            <div className="flex items-end gap-1">
              <span className="font-display font-bold text-2xl text-warm-800">{Math.round(totalMinutes)}</span>
              <span className="text-warm-400 text-sm mb-0.5">min</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">{t(settings.language, 'dash.sessions')}</p>
            <span className="font-display font-bold text-2xl text-warm-800">{totalSessions}</span>
          </div>
        </div>

        {/* Quality */}
        {recentSessions.length > 0 && (
          <div className="card p-5 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Recovery quality (last 10)</p>
                <p className="font-display font-bold text-3xl text-primary-700">{averageQuality}/100</p>
              </div>
              <div className={`badge ${averageQuality >= 70 ? 'bg-green-100 text-green-700' : averageQuality >= 45 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {averageQuality >= 70 ? 'Strong trend' : averageQuality >= 45 ? 'Building' : 'Needs consistency'}
              </div>
            </div>
          </div>
        )}

        {/* Exercises grid */}
        <div className="mb-8">
          <h2 className="font-display font-semibold text-lg text-warm-800 mb-4">{t(settings.language, 'dash.exercises')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                to={game.path}
                className="card-hover p-6 group"
              >
                <span className="text-3xl mb-3 block">{game.icon}</span>
                <h3 className="font-display font-semibold text-warm-900 mb-1 group-hover:text-primary-700 transition-colors">
                  {game.label}
                </h3>
                <p className="text-warm-400 text-sm leading-relaxed">{game.description}</p>
                <div className="mt-4 flex items-center gap-1 text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t(settings.language, 'progress.goExercises')}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Last session */}
        {lastSession && typeof lastSession.endedAt === 'number' && (
          <div className="mb-8">
            <h2 className="font-display font-semibold text-lg text-warm-800 mb-4">{t(settings.language, 'dash.lastSession')}</h2>
            <div className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-xl">
                  {lastSession.game === 'piano' ? '🎹' : lastSession.game === 'bubbles' ? '🫧' : '🥤'}
                </div>
                <div>
                  <p className="font-semibold text-warm-800">{GAME_LABELS[lastSession.game]}</p>
                  <p className="text-warm-400 text-sm">
                    {Math.floor(lastSession.durationSeconds / 60)}m {lastSession.durationSeconds % 60}s
                    {lastSession.metrics.score != null && ` · Score: ${lastSession.metrics.score}`}
                  </p>
                </div>
              </div>
              <span className="text-warm-400 text-xs">{formatDate(lastSession.endedAt)}</span>
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-warm-800">{t(settings.language, 'dash.recentActivity')}</h2>
              <Link to="/app/progress" className="text-sm text-primary-600 font-medium hover:text-primary-700">
                {t(settings.language, 'dash.viewAll')} →
              </Link>
            </div>
            <div className="card overflow-hidden">
              {recentSessions.filter(s => s != null && typeof s.endedAt === 'number').slice(0, 5).map((s, i) => (
                <div key={s.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-warm-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.game === 'piano' ? '🎹' : s.game === 'bubbles' ? '🫧' : '🥤'}</span>
                    <span className="text-warm-700 text-sm font-medium capitalize">{s.game.replace(/-/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-warm-500 text-sm">
                      {s.metrics.score != null ? `${s.metrics.score} pts` : `${Math.floor(s.durationSeconds / 60)}m`}
                    </span>
                    <span className="text-warm-400 text-xs">{formatDate(s.endedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="card p-5 bg-primary-50 border-primary-100 mb-8">
          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-primary-900">
              <strong>Tip:</strong> For best results, position your hand in view of the camera with good lighting. 
              You can also tap or click to play if the camera is unavailable.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-lg text-warm-800 mb-3">{t(settings.language, 'dash.recommendedNext')}</h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.title} className="border border-warm-200 rounded-xl p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-warm-800">{rec.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : rec.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-warm-500">{rec.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 mt-8">
          <h2 className="font-display font-semibold text-lg text-warm-800 mb-3">{t(settings.language, 'dash.riskAlerts')}</h2>
          <div className="space-y-3">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="border border-warm-200 rounded-xl p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-warm-800">{alert.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    alert.severity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : alert.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-warm-500">{alert.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

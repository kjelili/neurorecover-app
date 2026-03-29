import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLastSession, getRecentSessions, getSessionsThisWeek, getCurrentStreak, getTotalMinutes } from '../utils/sessionStorage';
import { getEnabledGames } from '../config/appConfig';
import type { StoredSession } from '../types/session';
import { GAME_LABELS } from '../types/session';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Dashboard() {
  const [lastSession, setLastSession] = useState<StoredSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<StoredSession[]>([]);
  const games = getEnabledGames();
  const sessionsThisWeek = getSessionsThisWeek();
  const streak = getCurrentStreak();
  const totalMinutes = getTotalMinutes();
  const weeklyGoal = 3;

  useEffect(() => {
    setLastSession(getLastSession());
    setRecentSessions(getRecentSessions(10));
  }, []);

  const totalSessions = getRecentSessions(200).length;

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</h1>
          <p className="text-warm-500">
            {totalSessions === 0
              ? 'Start your first exercise below to begin tracking your recovery.'
              : `You've completed ${totalSessions} session${totalSessions !== 1 ? 's' : ''}. Keep going!`}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">This week</p>
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
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Streak</p>
            <div className="flex items-end gap-1">
              <span className="font-display font-bold text-2xl text-warm-800">{streak}</span>
              <span className="text-warm-400 text-sm mb-0.5">day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Total time</p>
            <div className="flex items-end gap-1">
              <span className="font-display font-bold text-2xl text-warm-800">{Math.round(totalMinutes)}</span>
              <span className="text-warm-400 text-sm mb-0.5">min</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Sessions</p>
            <span className="font-display font-bold text-2xl text-warm-800">{totalSessions}</span>
          </div>
        </div>

        {/* Exercises grid */}
        <div className="mb-8">
          <h2 className="font-display font-semibold text-lg text-warm-800 mb-4">Exercises</h2>
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
                  <span>Start exercise</span>
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
            <h2 className="font-display font-semibold text-lg text-warm-800 mb-4">Last session</h2>
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
              <h2 className="font-display font-semibold text-lg text-warm-800">Recent activity</h2>
              <Link to="/app/progress" className="text-sm text-primary-600 font-medium hover:text-primary-700">
                View all →
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
        <div className="card p-5 bg-primary-50 border-primary-100">
          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-primary-900">
              <strong>Tip:</strong> For best results, position your hand in view of the camera with good lighting. 
              You can also tap or click to play if the camera is unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

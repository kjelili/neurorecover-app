import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRecentSessions, getSessionsThisWeek, getCurrentStreak, getTotalMinutes } from '../utils/sessionStorage';
import { exportProgressPdf } from '../utils/exportPdf';
import { GAME_LABELS } from '../types/session';
import type { StoredSession } from '../types/session';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Progress() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessions(getRecentSessions(100));
  }, []);

  const valid = sessions.filter(s => s != null && typeof s.endedAt === 'number');
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

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
              ← Back to dashboard
            </Link>
            <h1 className="section-title">Progress</h1>
          </div>
          <button
            type="button"
            onClick={() => exportProgressPdf(valid)}
            disabled={valid.length === 0}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Total time</p>
            <span className="font-display font-bold text-2xl text-warm-800">{Math.round(totalMinutes)} min</span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Sessions</p>
            <span className="font-display font-bold text-2xl text-warm-800">{valid.length}</span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">This week</p>
            <span className={`font-display font-bold text-2xl ${sessionsThisWeek.length >= 3 ? 'text-green-600' : 'text-warm-800'}`}>
              {sessionsThisWeek.length}/3
            </span>
          </div>
          <div className="card p-4">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">Streak</p>
            <span className="font-display font-bold text-2xl text-warm-800">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Score chart */}
        {chartData.length >= 2 && (
          <div className="card p-5 sm:p-6 mb-8">
            <h2 className="font-display font-semibold text-warm-800 mb-4">Score over time</h2>
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
            <h2 className="font-display font-semibold text-warm-800 mb-4">Exercise breakdown</h2>
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
            <h2 className="font-display font-semibold text-warm-800 mb-4">Session history</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-warm-200 bg-warm-50">
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Date</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Exercise</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Score</th>
                      <th className="p-3 font-semibold text-warm-500 text-xs uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valid.slice(0, 30).map((s, i) => (
                      <tr key={s.id} className={`${i > 0 ? 'border-t border-warm-100' : ''} text-warm-700`}>
                        <td className="p-3">{formatDate(s.endedAt)}</td>
                        <td className="p-3 capitalize">{s.game.replace(/-/g, ' ')}</td>
                        <td className="p-3 font-medium">{s.metrics.score ?? '—'}</td>
                        <td className="p-3">{Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {valid.length === 0 && (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-warm-500 font-medium">No sessions yet</p>
            <p className="text-warm-400 text-sm mt-1">Complete your first exercise to start tracking progress.</p>
            <Link to="/app" className="btn-primary mt-4 text-sm">
              Go to exercises
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

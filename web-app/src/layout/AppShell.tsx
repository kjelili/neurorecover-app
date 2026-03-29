import { Outlet, Link, NavLink } from 'react-router-dom';
import { useSessionOptional } from '../context/SessionContext';
import { SessionCompleteScreen } from '../components/SessionWrapper';
import { useAppSettings } from '../context/AppSettingsContext';
import { getLastSession } from '../utils/sessionStorage';
import { useEffect, useState } from 'react';

const BASE_NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/piano', label: '🎹 Piano', end: false },
  { to: '/app/bubbles', label: '🫧 Bubbles', end: false },
  { to: '/app/grab-cup', label: '🥤 Grasp', end: false },
  { to: '/app/progress', label: 'Progress', end: false },
  { to: '/app/settings', label: 'Settings', end: false },
];

export function AppShell() {
  const session = useSessionOptional();
  const { settings } = useAppSettings();
  const [nowTs, setNowTs] = useState(() => new Date().getTime());
  const lastCompleted = session?.lastCompletedSummary;
  const clearLastCompleted = session?.clearLastCompleted;
  const last = getLastSession();
  const overdue = !last || (nowTs - last.endedAt > 1000 * 60 * 60 * 24);
  const currentHour = new Date(nowTs).getHours();
  const showReminder = settings.reminderEnabled && currentHour >= settings.reminderHour && overdue;
  const navItems = settings.therapistMode
    ? [...BASE_NAV_ITEMS, { to: '/app/clinical', label: 'Clinical', end: false }]
    : BASE_NAV_ITEMS;

  useEffect(() => {
    const timer = setInterval(() => setNowTs(new Date().getTime()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-warm-50 text-warm-950 flex flex-col">
      {lastCompleted && clearLastCompleted && typeof lastCompleted.endedAt === 'number' && (
        <SessionCompleteScreen summary={lastCompleted} onClose={clearLastCompleted} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-warm-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 gap-6">
            {/* Logo */}
            <Link to="/app" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="font-display font-bold text-warm-900 hidden sm:inline">NeuroRecover</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide" aria-label="Main">
              {navItems.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `tap-target rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-warm-500 hover:text-warm-700 hover:bg-warm-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/"
                className="text-xs text-warm-400 hover:text-primary-600 transition-colors hidden sm:block"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {showReminder && (
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
            <div className="card p-3 border-accent-200 bg-accent-50">
              <p className="text-sm text-accent-900">
                Daily reminder: a short rehab session today can help maintain your recovery progress.
              </p>
            </div>
          </div>
        )}
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-warm-400">
            NeuroRecover — Camera-based hand rehabilitation for stroke recovery
          </p>
        </div>
      </footer>
    </div>
  );
}

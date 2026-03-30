import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useSessionOptional } from '../context/SessionContext';
import { SessionCompleteScreen } from '../components/SessionWrapper';
import { useAppSettings } from '../context/AppSettingsContext';
import { getLastSession } from '../utils/sessionStorage';
import { useEffect, useState } from 'react';
import { LANGUAGE_OPTIONS, getSpeechLocale, t } from '../utils/i18n';
import { useVoiceActions } from '../hooks/useVoiceActions';

const BASE_NAV_ITEMS = [
  { to: '/app', labelKey: 'nav.dashboard', icon: '', end: true },
  { to: '/app/piano', labelKey: 'nav.piano', icon: '🎹', end: false },
  { to: '/app/bubbles', labelKey: 'nav.bubbles', icon: '🫧', end: false },
  { to: '/app/grab-cup', labelKey: 'nav.grasp', icon: '🥤', end: false },
  { to: '/app/progress', labelKey: 'nav.progress', icon: '', end: false },
  { to: '/app/settings', labelKey: 'nav.settings', icon: '', end: false },
  { to: '/app/evidence', labelKey: 'nav.evidence', icon: '', end: false },
];

export function AppShell() {
  const navigate = useNavigate();
  const session = useSessionOptional();
  const { settings, updateSettings } = useAppSettings();
  const [nowTs, setNowTs] = useState(() => new Date().getTime());
  const speechLocale = getSpeechLocale(settings.language);
  const [voiceState, startVoice, stopVoice] = useVoiceActions(
    navigate,
    settings.voiceActionsEnabled,
    speechLocale,
  );
  const lastCompleted = session?.lastCompletedSummary;
  const clearLastCompleted = session?.clearLastCompleted;
  const last = getLastSession();
  const overdue = !last || (nowTs - last.endedAt > 1000 * 60 * 60 * 24);
  const currentHour = new Date(nowTs).getHours();
  const showReminder = settings.reminderEnabled && currentHour >= settings.reminderHour && overdue;
  let navItems = [...BASE_NAV_ITEMS];
  if (settings.therapistMode || settings.userRole !== 'patient') {
    navItems = [...navItems, { to: '/app/clinical', labelKey: 'nav.clinical', icon: '', end: false }];
  }
  if (settings.userRole === 'admin') {
    navItems = [...navItems, { to: '/app/admin', labelKey: 'nav.admin', icon: '', end: false }];
  }

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
              {navItems.map(({ to, labelKey, icon, end }) => (
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
                  {icon ? `${icon} ` : ''}
                  {t(settings.language, labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="hidden md:flex items-center gap-1 text-xs text-warm-500">
                {t(settings.language, 'lang.label')}
                <select
                  className="border border-warm-200 rounded px-1 py-0.5 bg-white"
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={`btn-ghost text-xs ${voiceState.listening ? 'bg-primary-100 text-primary-700' : ''}`}
                onClick={() => (voiceState.listening ? stopVoice() : startVoice())}
                title={voiceState.supported ? '' : t(settings.language, 'voice.unsupported')}
                disabled={!voiceState.supported || !settings.voiceActionsEnabled}
              >
                {voiceState.listening ? t(settings.language, 'voice.stop') : t(settings.language, 'voice.listen')}
              </button>
              <Link
                to="/"
                className="text-xs text-warm-400 hover:text-primary-600 transition-colors hidden sm:block"
              >
                {t(settings.language, 'nav.about')}
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
                {t(settings.language, 'reminder.daily')}
              </p>
            </div>
          </div>
        )}
        {voiceState.lastHeard && (
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2">
            <p className="text-xs text-warm-400">
              {t(settings.language, 'voice.heard')}: "{voiceState.lastHeard}"
            </p>
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

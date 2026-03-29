import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { AppSettingsProvider } from './context/AppSettingsContext';
import { LandingPage } from './pages/LandingPage';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { ClinicalTools } from './pages/ClinicalTools';

const Progress = lazy(() => import('./pages/Progress').then(m => ({ default: m.Progress })));
const PianoGame = lazy(() => import('./games/PianoGame').then(m => ({ default: m.PianoGame })));
const BubbleGame = lazy(() => import('./games/BubbleGame').then(m => ({ default: m.BubbleGame })));
const GrabCupGame = lazy(() => import('./games/GrabCupGame').then(m => ({ default: m.GrabCupGame })));

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-warm-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-2">Page not found</h1>
        <Link to="/" className="text-primary-600 hover:underline">Go home</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppSettingsProvider>
      <SessionProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="progress" element={<Progress />} />
                <Route path="settings" element={<Settings />} />
                <Route path="clinical" element={<ClinicalTools />} />
                <Route path="piano" element={<PianoGame />} />
                <Route path="bubbles" element={<BubbleGame />} />
                <Route path="grab-cup" element={<GrabCupGame />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SessionProvider>
    </AppSettingsProvider>
  );
}

export default App;

import React, { useCallback, useEffect, useState } from 'react';
import type { GameType, SessionMetrics, SessionSummary } from '../types/session';
import { saveSession } from '../utils/sessionStorage';
import { computeQualityScore } from '../utils/recoveryInsights';
import { useSession } from '../context/SessionContext';
import { SESSION_DURATION_PRESETS, type DurationPreset } from '../config/appConfig';

interface SessionWrapperProps {
  game: GameType;
  children: React.ReactNode;
  getCurrentMetrics: () => SessionMetrics;
}

export function SessionWrapper({ game, children, getCurrentMetrics }: SessionWrapperProps) {
  const {
    sessionActive, game: ctxGame, durationSeconds, elapsedSeconds,
    startSession, endSession, setOnSessionComplete, setGetCurrentMetrics, setGetCurrentAnnotations,
    isPaused, pauseRemainingSeconds, startPause,
  } = useSession();

  const [preset, setPreset] = useState<DurationPreset>('standard');
  const [painLevel, setPainLevel] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [notes, setNotes] = useState('');

  const handleComplete = useCallback((summary: SessionSummary | null | undefined) => {
    if (summary != null && typeof summary.endedAt === 'number') saveSession(summary);
  }, []);

  useEffect(() => {
    setOnSessionComplete(handleComplete);
    return () => setOnSessionComplete(null);
  }, [setOnSessionComplete, handleComplete]);

  useEffect(() => {
    if (sessionActive && ctxGame === game) setGetCurrentMetrics(getCurrentMetrics);
    return () => setGetCurrentMetrics(null);
  }, [sessionActive, ctxGame, game, setGetCurrentMetrics, getCurrentMetrics]);

  useEffect(() => {
    if (sessionActive && ctxGame === game) {
      setGetCurrentAnnotations(() => ({
        painLevel,
        fatigueLevel,
        notes: notes.trim() || undefined,
      }));
    }
    return () => setGetCurrentAnnotations(null);
  }, [sessionActive, ctxGame, game, setGetCurrentAnnotations, painLevel, fatigueLevel, notes]);

  const handleStart = useCallback(() => {
    setPainLevel(0);
    setFatigueLevel(0);
    setNotes('');
    startSession(game, SESSION_DURATION_PRESETS[preset] * 60);
  }, [game, preset, startSession]);

  const handleEnd = useCallback(() => {
    endSession({
      metrics: getCurrentMetrics(),
      annotations: {
        painLevel,
        fatigueLevel,
        notes: notes.trim() || undefined,
      },
    });
  }, [endSession, getCurrentMetrics, painLevel, fatigueLevel, notes]);

  if (!sessionActive || ctxGame !== game) {
    return (
      <>
        <div className="mb-6">
          <p className="text-sm text-warm-500 font-medium mb-3">Session length</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['short', 'standard', 'longer'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`tap-target rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  preset === p
                    ? 'bg-primary-600 text-white shadow-glow-primary'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {p === 'short' ? '2 min' : p === 'standard' ? '3 min' : '5 min'}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleStart} className="btn-primary w-full sm:w-auto">
            Start {SESSION_DURATION_PRESETS[preset]}-minute session
          </button>
        </div>
        {children}
      </>
    );
  }

  const remaining = Math.max(0, durationSeconds - elapsedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = Math.min(100, (elapsedSeconds / durationSeconds) * 100);

  return (
    <>
      <div className="mb-6">
        {/* Progress bar */}
        <div className="w-full h-2 bg-warm-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-warm-200 px-4 py-2 shadow-soft">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse-soft' : 'bg-primary-500'}`} />
            <span className="font-mono text-warm-800 font-semibold text-lg">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
          {!isPaused && (
            <button type="button" onClick={() => startPause(60)} className="btn-ghost text-sm">
              Pause 1 min
            </button>
          )}
          {isPaused && (
            <div className="badge bg-amber-100 text-amber-800">
              Rest: {pauseRemainingSeconds}s
            </div>
          )}
          <button type="button" onClick={handleEnd} className="btn-ghost text-sm text-warm-500">
            End session
          </button>
        </div>
      </div>
      <div className="card p-4 mb-6">
        <p className="text-sm font-semibold text-warm-700 mb-3">Session check-in (optional)</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-3">
          <label className="text-sm text-warm-500">
            Pain level: <span className="font-semibold text-warm-700">{painLevel}/10</span>
            <input
              type="range"
              min={0}
              max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="w-full mt-1"
            />
          </label>
          <label className="text-sm text-warm-500">
            Fatigue level: <span className="font-semibold text-warm-700">{fatigueLevel}/10</span>
            <input
              type="range"
              min={0}
              max={10}
              value={fatigueLevel}
              onChange={(e) => setFatigueLevel(Number(e.target.value))}
              className="w-full mt-1"
            />
          </label>
        </div>
        <label className="text-sm text-warm-500">
          Notes for therapist
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 300))}
            placeholder="How did this session feel? (optional)"
            className="input-field mt-1 min-h-[88px]"
          />
        </label>
      </div>
      {children}
    </>
  );
}

interface SessionCompleteScreenProps {
  summary: SessionSummary;
  onClose: () => void;
}

export function SessionCompleteScreen({ summary, onClose }: SessionCompleteScreenProps) {
  const { game, durationSeconds, metrics } = summary;
  const quality = metrics.qualityScore ?? computeQualityScore(metrics);

  useEffect(() => {
    import('../utils/gameSounds').then(({ playSuccess }) => playSuccess());
  }, []);

  const handleExportPdf = () => {
    import('../utils/exportPdf').then(({ exportSessionPdf }) => exportSessionPdf(summary));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-950/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-elevated p-8 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-2xl text-warm-950 mb-1">Well done!</h2>
          <p className="text-primary-600 font-medium">Session complete</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-b border-warm-100">
            <span className="text-warm-500">Exercise</span>
            <span className="font-semibold text-warm-800 capitalize">{game.replace(/-/g, ' ')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-warm-100">
            <span className="text-warm-500">Duration</span>
            <span className="font-semibold text-warm-800">{Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s</span>
          </div>
          {metrics.score != null && (
            <div className="flex justify-between py-2 border-b border-warm-100">
              <span className="text-warm-500">Score</span>
              <span className="font-bold text-primary-700 text-lg">{metrics.score}</span>
            </div>
          )}
          {metrics.reactionTimeMs != null && (
            <div className="flex justify-between py-2 border-b border-warm-100">
              <span className="text-warm-500">Reaction time</span>
              <span className="font-semibold text-warm-800">{metrics.reactionTimeMs} ms</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-warm-100">
            <span className="text-warm-500">Quality score</span>
            <span className="font-semibold text-warm-800">{quality}/100</span>
          </div>
          {summary.annotations?.notes && (
            <div className="pt-2">
              <p className="text-xs text-warm-400 mb-1">Session note</p>
              <p className="text-sm text-warm-700 bg-warm-50 border border-warm-200 rounded-lg px-3 py-2">
                {summary.annotations.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={handleExportPdf} className="btn-secondary flex-1 text-sm">
            Export PDF
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

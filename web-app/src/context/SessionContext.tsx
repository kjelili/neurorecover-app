import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { GameType, SessionMetrics, SessionSummary } from '../types/session';

interface SessionContextValue {
  sessionActive: boolean;
  game: GameType | null;
  durationSeconds: number;
  elapsedSeconds: number;
  startSession: (game: GameType, durationSeconds?: number) => void;
  endSession: (partial: { metrics: SessionMetrics }) => void;
  setGetCurrentMetrics: (fn: (() => SessionMetrics) | null) => void;
  lastCompletedSummary: SessionSummary | null;
  clearLastCompleted: () => void;
  onSessionComplete: ((summary: SessionSummary) => void) | null;
  setOnSessionComplete: (fn: ((summary: SessionSummary) => void) | null) => void;
  isPaused: boolean;
  pauseRemainingSeconds: number;
  startPause: (seconds: number) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const DEFAULT_DURATION = 3 * 60;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [game, setGame] = useState<GameType | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [onSessionComplete, setOnSessionComplete] = useState<((s: SessionSummary) => void) | null>(null);
  const [lastCompletedSummary, setLastCompletedSummary] = useState<SessionSummary | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseEndsAt, setPauseEndsAt] = useState(0);
  const [pauseRemainingSeconds, setPauseRemainingSeconds] = useState(0);
  const getCurrentMetricsRef = useRef<(() => SessionMetrics) | null>(null);
  const startedAtRef = useRef(0);
  const elapsedAtPauseRef = useRef(0);

  const setGetCurrentMetrics = useCallback((fn: (() => SessionMetrics) | null) => {
    getCurrentMetricsRef.current = fn;
  }, []);

  const startSession = useCallback((g: GameType, duration?: number) => {
    const now = Date.now();
    setGame(g);
    setDurationSeconds(duration ?? DEFAULT_DURATION);
    setElapsedSeconds(0);
    setStartedAt(now);
    startedAtRef.current = now;
    setSessionActive(true);
    setIsPaused(false);
  }, []);

  const startPause = useCallback((seconds: number) => {
    elapsedAtPauseRef.current = Math.floor((Date.now() - startedAtRef.current) / 1000);
    setPauseEndsAt(Date.now() + seconds * 1000);
    setIsPaused(true);
    setPauseRemainingSeconds(seconds);
  }, []);

  const clearPause = useCallback(() => {
    startedAtRef.current = Date.now() - elapsedAtPauseRef.current * 1000;
    setStartedAt(startedAtRef.current);
    setIsPaused(false);
    setPauseEndsAt(0);
    setPauseRemainingSeconds(0);
  }, []);

  const endSession = useCallback((partial: { metrics: SessionMetrics }) => {
    if (!game || !sessionActive) return;
    const endedAt = Date.now();
    const summary: SessionSummary = {
      game,
      startedAt,
      endedAt,
      durationSeconds: Math.round((endedAt - startedAt) / 1000),
      metrics: partial.metrics,
    };
    setSessionActive(false);
    setGame(null);
    setElapsedSeconds(0);
    setLastCompletedSummary(summary);
    onSessionComplete?.(summary);
  }, [game, sessionActive, startedAt, onSessionComplete]);

  const clearLastCompleted = useCallback(() => setLastCompletedSummary(null), []);

  // Timer effect
  React.useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      if (isPaused) {
        const rem = Math.max(0, Math.ceil((pauseEndsAt - Date.now()) / 1000));
        setPauseRemainingSeconds(rem);
        if (rem <= 0) clearPause();
        return;
      }
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= durationSeconds) {
        const g = game;
        const metrics = getCurrentMetricsRef.current?.() ?? {};
        setSessionActive(false);
        setGame(null);
        setElapsedSeconds(0);
        if (g) {
          const endedAt = Date.now();
          const summary: SessionSummary = {
            game: g, startedAt, endedAt,
            durationSeconds: Math.round((endedAt - startedAt) / 1000),
            metrics,
          };
          setLastCompletedSummary(summary);
          onSessionComplete?.(summary);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, durationSeconds, startedAt, game, onSessionComplete, isPaused, pauseEndsAt, clearPause]);

  return (
    <SessionContext.Provider value={{
      sessionActive, game, durationSeconds, elapsedSeconds,
      startSession, endSession, setGetCurrentMetrics,
      lastCompletedSummary, clearLastCompleted,
      onSessionComplete, setOnSessionComplete,
      isPaused, pauseRemainingSeconds, startPause,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function useSessionOptional() {
  return useContext(SessionContext);
}

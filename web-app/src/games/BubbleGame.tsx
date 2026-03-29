import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CameraView } from '../components/CameraView';
import { SessionWrapper } from '../components/SessionWrapper';
import { useHandTracking, type HandResult, type Landmark } from '../hooks/useHandTracking';
import type { SessionMetrics } from '../types/session';
import { playPop } from '../utils/gameSounds';
import { useAppSettings } from '../context/AppSettingsContext';
import { speak } from '../utils/voiceCoach';

const ENCOURAGEMENTS = ['Nice pinch!', 'Great reach!', 'Keep going!', 'Well done!'];
const COLORS = ['#07c4af', '#20e0c8', '#52f5dc', '#029e8f', '#f96b45', '#ff8a6b'];

interface Bubble { id: number; x: number; y: number; r: number; color: string; }

function dist(x1: number, y1: number, x2: number, y2: number) { return Math.hypot(x2 - x1, y2 - y1); }

function getPinch(lm: Landmark[]): { x: number; y: number } | null {
  if (lm.length < 9) return null;
  const d = dist(lm[8].x, lm[8].y, lm[4].x, lm[4].y);
  if (d > 0.08) return null;
  return { x: (lm[8].x + lm[4].x) / 2, y: (lm[8].y + lm[4].y) / 2 };
}

export function BubbleGame() {
  const { settings } = useAppSettings();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextIdRef = useRef(0);
  const [score, setScore] = useState(0);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const popTimesRef = useRef<number[]>([]);
  const [spawnMs, setSpawnMs] = useState(1500);
  const sizeMinRef = useRef(0.04);
  const sizeRangeRef = useRef(0.03);

  const spawn = useCallback(() => {
    setBubbles((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, {
        id: nextIdRef.current++,
        x: Math.random() * 0.7 + 0.15,
        y: Math.random() * 0.5 + 0.25,
        r: sizeMinRef.current + Math.random() * sizeRangeRef.current,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }];
    });
  }, []);

  useEffect(() => {
    spawn();
    const t = setInterval(spawn, spawnMs);
    return () => clearInterval(t);
  }, [spawn, spawnMs]);

  // Adaptive difficulty
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      popTimesRef.current = popTimesRef.current.filter((t) => now - t < 10000);
      const pops = popTimesRef.current.length;
      setSpawnMs((prev) => {
        if (pops <= 1) {
          sizeMinRef.current = Math.min(0.06, sizeMinRef.current * 1.05);
          return Math.min(2500, prev * 1.15);
        }
        if (pops >= 5) {
          sizeMinRef.current = Math.max(0.03, sizeMinRef.current * 0.96);
          return Math.max(800, prev * 0.92);
        }
        return prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const popBubble = useCallback((bubble: Bubble) => {
    popTimesRef.current.push(Date.now());
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    setScore((s) => {
      const next = s + 1;
      if (next % 4 === 0) {
        const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        setEncouragement(msg);
        speak(msg, settings.voiceCoaching);
        setTimeout(() => setEncouragement(null), 2000);
      }
      return next;
    });
    playPop();
  }, [settings.voiceCoaching]);

  const onResults = useCallback((results: HandResult[]) => {
    if (!results.length) return;
    const pinch = getPinch(results[0].landmarks);
    if (!pinch) return;
    setBubbles((prev) => {
      const hit = prev.find((b) => dist(pinch.x, pinch.y, b.x, b.y) < b.r + 0.03);
      if (hit) { popBubble(hit); return prev.filter((b) => b.id !== hit.id); }
      return prev;
    });
  }, [popBubble]);

  useHandTracking({ videoRef, numHands: 1, onResults, enabled: videoReady });

  const getCurrentMetrics = useCallback((): SessionMetrics => ({ score }), [score]);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
          ← Back to dashboard
        </Link>
        <h1 className="section-title">🫧 Bubble Pop</h1>
      </div>

      <SessionWrapper game="bubbles" getCurrentMetrics={getCurrentMetrics}>
        <p className="text-warm-500 text-sm mb-6">
          Pinch (thumb + index) or tap to pop bubbles. Difficulty adapts to your ability — keep going!
        </p>

        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3">
            <CameraView
              onVideoReady={(el) => {
                (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                setVideoReady(!!el);
              }}
              className="w-full aspect-[4/3]"
            >
              <div className="absolute inset-0">
                {bubbles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => popBubble(b)}
                    className="absolute rounded-full transition-transform hover:scale-110 tap-target focus:outline-none focus:ring-2 focus:ring-white/50"
                    style={{
                      left: `${b.x * 100}%`,
                      top: `${b.y * 100}%`,
                      width: `${Math.max(32, b.r * 400)}px`,
                      height: `${Math.max(32, b.r * 400)}px`,
                      backgroundColor: b.color,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: `0 0 15px ${b.color}40, inset 0 -3px 6px rgba(0,0,0,0.1)`,
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                    aria-label="Pop bubble"
                  />
                ))}
              </div>
            </CameraView>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="card p-6 text-center">
              <p className="text-warm-400 text-sm font-medium mb-1">Score</p>
              <p className="font-display font-bold text-5xl text-primary-700 mb-2">{score}</p>
              {encouragement && (
                <p className="text-accent-500 text-sm font-semibold animate-bounce-subtle" role="status">
                  {encouragement}
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-warm-100">
                <p className="text-xs text-warm-400">
                  Difficulty adapts in real-time based on your performance
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-warm-500">
            <strong className="text-warm-700">Rehabilitation focus:</strong> Reach, pinch precision, and hand-eye coordination.
            Bubbles get smaller and faster as you improve.
          </p>
        </div>
      </SessionWrapper>
    </div>
  );
}

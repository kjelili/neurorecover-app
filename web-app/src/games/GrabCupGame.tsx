import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CameraView } from '../components/CameraView';
import { SessionWrapper } from '../components/SessionWrapper';
import { useHandTracking, type HandResult, type Landmark } from '../hooks/useHandTracking';
import type { SessionMetrics } from '../types/session';
import { playGrab } from '../utils/gameSounds';

function distLm(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function isFistClosed(lm: Landmark[]): boolean {
  if (lm.length < 21) return false;
  const wrist = lm[0];
  const tips = [4, 8, 12, 16, 20].map((i) => lm[i]);
  const avg = tips.reduce((a, t) => a + distLm(t, wrist), 0) / tips.length;
  return avg < 0.15;
}

const HOLD_MS = 2000;

export function GrabCupGame() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [score, setScore] = useState(0);
  const holdStartRef = useRef<number | null>(null);

  const onResults = useCallback((results: HandResult[]) => {
    if (!results.length) { setGrabbing(false); holdStartRef.current = null; setHoldProgress(0); return; }
    const closed = isFistClosed(results[0].landmarks);
    if (closed) {
      if (!holdStartRef.current) holdStartRef.current = Date.now();
      const elapsed = Date.now() - holdStartRef.current;
      setHoldProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
      if (elapsed >= HOLD_MS) {
        holdStartRef.current = null;
        setScore((s) => s + 1);
        setHoldProgress(0);
        playGrab();
      }
      setGrabbing(true);
    } else {
      holdStartRef.current = null;
      setGrabbing(false);
      setHoldProgress(0);
    }
  }, []);

  useHandTracking({ videoRef, numHands: 1, onResults, enabled: videoReady });

  const getCurrentMetrics = useCallback((): SessionMetrics => ({ score }), [score]);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
          ← Back to dashboard
        </Link>
        <h1 className="section-title">🥤 Cup Grasp</h1>
      </div>

      <SessionWrapper game="grab-cup" getCurrentMetrics={getCurrentMetrics}>
        <p className="text-warm-500 text-sm mb-6">
          Make a fist and hold for 2 seconds to grab the cup. This exercise strengthens grip and hand closure.
        </p>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <CameraView
            onVideoReady={(el) => {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
              setVideoReady(!!el);
            }}
            className="w-full aspect-[4/3]"
          />

          <div className="flex flex-col items-center justify-center card p-8">
            {/* Cup visual with progress ring */}
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e8e7e4" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={grabbing ? '#07c4af' : '#e8e7e4'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${holdProgress * 2.83} 283`}
                  className="transition-all duration-200"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                🥤
              </div>
            </div>

            <p className="font-display font-semibold text-warm-700 text-lg mb-1">
              {grabbing ? 'Hold your grip…' : 'Make a fist to grab'}
            </p>
            <p className="text-primary-600 font-bold text-3xl mb-4">{score}</p>
            <p className="text-warm-400 text-xs">successful grasps</p>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-warm-500">
            <strong className="text-warm-700">Rehabilitation focus:</strong> Hand closure strength, sustained grip, and Activities of Daily Living (cup grasp).
          </p>
        </div>
      </SessionWrapper>
    </div>
  );
}

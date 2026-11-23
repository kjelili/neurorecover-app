import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from '../components/CameraView';
import { GameHeader } from '../components/GameHeader';
import { SessionWrapper } from '../components/SessionWrapper';
import { useHandTracking, type HandResult, type Landmark } from '../hooks/useHandTracking';
import type { SessionMetrics } from '../types/session';
import { playPop, playSuccess } from '../utils/gameSounds';
import { useAppSettings } from '../context/AppSettingsContext';
import { speak } from '../utils/voiceCoach';
import { getSpeechLocale, t } from '../utils/i18n';

const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

interface Target {
  x: number; // normalized display coords on the ghost (mirror) side
  y: number;
  spawnedAt: number;
}

const HOLD_TO_COLLECT_MS = 350;
const TARGET_TIMEOUT_MS = 9000;

export function MirrorMatchGame() {
  const { settings } = useAppSettings();
  const speechLocale = getSpeechLocale(settings.language);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [tracking, setTracking] = useState(false);

  const landmarksRef = useRef<Landmark[] | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null); // manual fallback, display coords
  const targetRef = useRef<Target | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const ghostSideRef = useRef<'left' | 'right'>('right');
  const [score, setScore] = useState(0);
  const [radius, setRadius] = useState(0.09);
  const scoreRef = useRef(0);
  const reactionRef = useRef<number[]>([]);
  const pathRef = useRef<{ dist: number; last: { x: number; y: number } | null }>({ dist: 0, last: null });

  const spawnTarget = useCallback(() => {
    // Targets live on the side opposite the moving hand (the "mirror" side)
    const side = ghostSideRef.current;
    const x = side === 'right' ? 0.55 + Math.random() * 0.4 : 0.05 + Math.random() * 0.4;
    const y = 0.15 + Math.random() * 0.7;
    targetRef.current = { x, y, spawnedAt: performance.now() };
    holdStartRef.current = null;
    pathRef.current = { dist: 0, last: null };
  }, []);

  const onResults = useCallback((results: HandResult[]) => {
    if (!results.length) { landmarksRef.current = null; setTracking(false); return; }
    setTracking(true);
    landmarksRef.current = results[0].landmarks;
  }, []);

  useHandTracking({ videoRef, numHands: 1, onResults, enabled: videoReady });

  // Main render + game loop
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);

          // Center divider
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();
          ctx.setLineDash([]);

          const lm = landmarksRef.current;
          const pointer = pointerRef.current;

          // Live fingertip position in DISPLAY coords (video is CSS-mirrored)
          let liveTip: { x: number; y: number } | null = null;
          if (lm && lm.length >= 21) {
            liveTip = { x: 1 - lm[8].x, y: lm[8].y };
          } else if (pointer) {
            liveTip = pointer;
          }

          // Ghost (mirrored) fingertip: mirror across vertical center line
          const ghostTip = liveTip ? { x: 1 - liveTip.x, y: liveTip.y } : null;

          if (liveTip) {
            // Track which side the live hand is on; ghost is the other side
            ghostSideRef.current = liveTip.x < 0.5 ? 'right' : 'left';

            // Path distance for smoothness metric
            if (pathRef.current.last) {
              pathRef.current.dist += Math.hypot(liveTip.x - pathRef.current.last.x, liveTip.y - pathRef.current.last.y);
            }
            pathRef.current.last = liveTip;

            // Draw live hand skeleton (mirrored display coords)
            if (lm && lm.length >= 21) {
              ctx.strokeStyle = 'rgba(7,196,175,0.9)';
              ctx.fillStyle = 'rgba(7,196,175,0.9)';
              ctx.lineWidth = 2;
              for (const [a, b] of CONNECTIONS) {
                ctx.beginPath();
                ctx.moveTo((1 - lm[a].x) * w, lm[a].y * h);
                ctx.lineTo((1 - lm[b].x) * w, lm[b].y * h);
                ctx.stroke();
              }
              // Ghost skeleton: mirror of the live hand
              ctx.strokeStyle = 'rgba(129,140,248,0.85)';
              ctx.fillStyle = 'rgba(129,140,248,0.85)';
              for (const [a, b] of CONNECTIONS) {
                ctx.beginPath();
                ctx.moveTo(lm[a].x * w, lm[a].y * h);
                ctx.lineTo(lm[b].x * w, lm[b].y * h);
                ctx.stroke();
              }
            } else {
              // Manual mode cursors
              ctx.beginPath();
              ctx.arc(liveTip.x * w, liveTip.y * h, 10, 0, Math.PI * 2);
              ctx.fill();
              if (ghostTip) {
                ctx.fillStyle = 'rgba(129,140,248,0.85)';
                ctx.beginPath();
                ctx.arc(ghostTip.x * w, ghostTip.y * h, 10, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Target
          const target = targetRef.current;
          if (!target && liveTip) spawnTarget();
          const tgt = targetRef.current;
          if (tgt && ghostTip) {
            const tx = tgt.x * w;
            const ty = tgt.y * h;
            const r = radius * Math.min(w, h);

            // Pulsing orb
            const pulse = 1 + 0.08 * Math.sin(performance.now() / 250);
            ctx.fillStyle = 'rgba(251,191,36,0.9)';
            ctx.beginPath();
            ctx.arc(tx, ty, r * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 2;
            ctx.stroke();

            const d = Math.hypot(ghostTip.x - tgt.x, ghostTip.y - tgt.y);
            const now = performance.now();

            if (d < radius) {
              if (holdStartRef.current == null) holdStartRef.current = now;
              const heldMs = now - holdStartRef.current;
              // Collect progress ring
              ctx.strokeStyle = 'rgba(7,196,175,1)';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(tx, ty, r + 6, -Math.PI / 2, -Math.PI / 2 + (heldMs / HOLD_TO_COLLECT_MS) * Math.PI * 2);
              ctx.stroke();

              if (heldMs >= HOLD_TO_COLLECT_MS) {
                const rt = now - tgt.spawnedAt;
                reactionRef.current.push(rt);
                if (reactionRef.current.length > 50) reactionRef.current.shift();
                scoreRef.current += 1;
                setScore(scoreRef.current);
                playPop();
                if (scoreRef.current % 5 === 0) {
                  playSuccess();
                  speak('Wonderful. Your hand is following the mirror.', settings.voiceCoaching, speechLocale);
                  setRadius((prev) => Math.max(0.05, prev - 0.004));
                }
                spawnTarget();
              }
            } else {
              holdStartRef.current = null;
              if (now - tgt.spawnedAt > TARGET_TIMEOUT_MS) spawnTarget();
            }
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [radius, spawnTarget, settings.voiceCoaching, speechLocale]);

  // Manual fallback: pointer moves the cursor when no hand is tracked
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap || landmarksRef.current) return;
    const rect = wrap.getBoundingClientRect();
    pointerRef.current = {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };
  const onPointerLeave = () => { pointerRef.current = null; };

  const getCurrentMetrics = useCallback((): SessionMetrics => {
    const rts = reactionRef.current;
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : undefined;
    const collected = scoreRef.current;
    const path = pathRef.current.dist;
    // Smoothness: higher when path per collected target is short (fewer corrections)
    const smoothness = collected > 0 && path > 0 ? Math.min(1, 0.6 / (path / collected)) : 0;
    return {
      score,
      reactionTimeMs: avgRt,
      smoothnessEstimate: Number(smoothness.toFixed(3)),
      difficultyLevel: Math.max(0, Math.round((0.09 - radius) * 250)),
      cameraQualityScore: videoReady && tracking ? 80 : videoReady ? 50 : 30,
      sessionIntegrity: videoReady ? 'ok' : 'low-tracking',
    };
  }, [score, radius, videoReady, tracking]);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto w-full">
      <GameHeader game="mirror" title={t(settings.language, 'game.mirror.title')} backLabel={t(settings.language, 'game.back')} />

      <SessionWrapper game="mirror" getCurrentMetrics={getCurrentMetrics}>
        <p className="text-warm-500 text-sm mb-6">
          {t(settings.language, 'game.mirror.instructions')}
        </p>

        <div className="mb-6">
          <div
            ref={wrapRef}
            className="relative w-full aspect-[4/3] touch-none"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <CameraView
              onVideoReady={(el) => {
                (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                setVideoReady(!!el);
              }}
              className="w-full h-full"
            />
            {/* Canvas is a sibling overlay (not a CameraView child) so the game
                remains playable in manual pointer mode when the camera is unavailable. */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl bg-warm-900/40" />
            <div className="absolute top-2 left-3 text-[11px] font-semibold text-white/80 bg-black/30 rounded px-2 py-0.5 pointer-events-none">
              {t(settings.language, 'game.mirror.movingHand')}
            </div>
            <div className="absolute top-2 right-3 text-[11px] font-semibold text-indigo-200 bg-black/30 rounded px-2 py-0.5 pointer-events-none">
              {t(settings.language, 'game.mirror.mirrorHand')}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between card p-4">
            <div>
              <p className="text-warm-400 text-xs">{t(settings.language, 'game.mirror.orbsCollected')}</p>
              <p className="text-primary-600 font-bold text-3xl">{score}</p>
            </div>
            <p className="text-warm-400 text-xs max-w-[55%] text-right">
              {tracking ? t(settings.language, 'game.mirror.trackingOn') : t(settings.language, 'game.mirror.manualHint')}
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-warm-500">
            <strong className="text-warm-700">{t(settings.language, 'game.mirror.focus')}</strong>{' '}
            {t(settings.language, 'game.mirror.focusDetail')}
          </p>
        </div>
      </SessionWrapper>
    </div>
  );
}

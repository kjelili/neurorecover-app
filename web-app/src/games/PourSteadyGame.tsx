import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from '../components/CameraView';
import { GameHeader } from '../components/GameHeader';
import { SessionWrapper } from '../components/SessionWrapper';
import { useHandTracking, type HandResult, type Landmark } from '../hooks/useHandTracking';
import type { SessionMetrics } from '../types/session';
import { playPour, playSuccess } from '../utils/gameSounds';
import { useAppSettings } from '../context/AppSettingsContext';
import { speak } from '../utils/voiceCoach';
import { getSpeechLocale, t } from '../utils/i18n';

/**
 * Estimate hand roll (pronation / supination) in degrees.
 * Uses the axis from index-finger MCP (5) to pinky MCP (17) in
 * displayed (mirrored) coordinates so the teapot tilts the same
 * way the user sees their hand tilt.
 */
function handRollDeg(lm: Landmark[]): number {
  if (lm.length < 21) return 0;
  const dx = lm[5].x - lm[17].x; // mirrored display x
  const dy = lm[17].y - lm[5].y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function PourSteadyGame() {
  const { settings } = useAppSettings();
  const speechLocale = getSpeechLocale(settings.language);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Calibration
  const neutralSamplesRef = useRef<number[]>([]);
  const neutralRef = useRef<number | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  const smoothTiltRef = useRef(0);
  const [tilt, setTilt] = useState(0);

  // Game state
  const [score, setScore] = useState(0);
  const [fill, setFill] = useState(0); // 0..1
  const fillRef = useRef(0);
  const [targetDeg, setTargetDeg] = useState(35); // alternates sign each cup
  const [tolDeg, setTolDeg] = useState(14); // shrinks as you improve
  const [holdMs, setHoldMs] = useState(2200); // grows as you improve
  const [pouring, setPouring] = useState(false);
  const [spilling, setSpilling] = useState(false);
  const [tracking, setTracking] = useState(false);

  const lastFrameRef = useRef(0);
  const holdTiltSamplesRef = useRef<number[]>([]);
  const tiltRangeRef = useRef<{ min: number; max: number }>({ min: 0, max: 0 });
  const manualTiltRef = useRef<number | null>(null);
  const dragRef = useRef<{ startX: number; baseTilt: number } | null>(null);

  const onResults = useCallback((results: HandResult[]) => {
    if (!results.length) { setTracking(false); return; }
    setTracking(true);
    const roll = handRollDeg(results[0].landmarks);

    // Calibrate a neutral wrist orientation from the first ~30 samples
    if (neutralRef.current == null) {
      const samples = neutralSamplesRef.current;
      samples.push(roll);
      if (samples.length >= 30) {
        neutralRef.current = samples.reduce((a, b) => a + b, 0) / samples.length;
        setCalibrated(true);
      }
      return;
    }

    const rawTilt = clamp(roll - neutralRef.current, -75, 75);
    // Exponential smoothing for stability
    smoothTiltRef.current = smoothTiltRef.current * 0.6 + rawTilt * 0.4;
  }, []);

  useHandTracking({ videoRef, numHands: 1, onResults, enabled: videoReady });

  // Game loop
  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      const dt = lastFrameRef.current ? now - lastFrameRef.current : 16;
      lastFrameRef.current = now;

      const currentTilt = manualTiltRef.current ?? smoothTiltRef.current;
      setTilt(currentTilt);
      tiltRangeRef.current.min = Math.min(tiltRangeRef.current.min, currentTilt);
      tiltRangeRef.current.max = Math.max(tiltRangeRef.current.max, currentTilt);

      const err = currentTilt - targetDeg;
      const inBand = Math.abs(err) <= tolDeg;
      const overshoot = Math.sign(currentTilt) === Math.sign(targetDeg) && Math.abs(err) > tolDeg * 2;

      setPouring(inBand);
      setSpilling(!inBand && overshoot);

      if (inBand) {
        holdTiltSamplesRef.current.push(currentTilt);
        if (holdTiltSamplesRef.current.length > 300) holdTiltSamplesRef.current.shift();
        fillRef.current = Math.min(1, fillRef.current + dt / holdMs);
        if (fillRef.current >= 1) {
          fillRef.current = 0;
          playSuccess();
          setScore((s) => {
            const next = s + 1;
            if (next % 3 === 0) speak('Beautiful pour. Nice and steady.', settings.voiceCoaching, speechLocale);
            return next;
          });
          // Adaptive difficulty: longer holds, narrower band, alternate side
          setHoldMs((prev) => Math.min(4500, prev + 120));
          setTolDeg((prev) => Math.max(7, prev - 0.5));
          setTargetDeg((prev) => (prev > 0 ? -35 : 35));
        }
      } else if (!inBand && overshoot) {
        playPour();
        fillRef.current = Math.max(0, fillRef.current - dt * 0.0012);
      }
      setFill(fillRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetDeg, tolDeg, holdMs, settings.voiceCoaching, speechLocale]);

  // Manual fallback: drag horizontally on the card to tilt
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, baseTilt: manualTiltRef.current ?? smoothTiltRef.current };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    manualTiltRef.current = clamp(dragRef.current.baseTilt + (e.clientX - dragRef.current.startX) / 3, -75, 75);
  };
  const onPointerUp = () => { dragRef.current = null; };

  const getCurrentMetrics = useCallback((): SessionMetrics => {
    const samples = holdTiltSamplesRef.current;
    let tremor = 0;
    if (samples.length > 10) {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      tremor = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length) / 30;
    }
    return {
      score,
      tremorEstimate: Number(clamp(tremor, 0, 1).toFixed(3)),
      rotationRangeDeg: Math.round(tiltRangeRef.current.max - tiltRangeRef.current.min),
      difficultyLevel: Math.max(0, Math.round((holdMs - 2000) / 200 + (14 - tolDeg))),
      cameraQualityScore: videoReady && tracking ? 80 : videoReady ? 50 : 30,
      sessionIntegrity: videoReady ? 'ok' : 'low-tracking',
    };
  }, [score, holdMs, tolDeg, videoReady, tracking]);

  const pourRotation = clamp((tilt / 75) * 60, -60, 60);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto w-full">
      <GameHeader game="pour" title={t(settings.language, 'game.pour.title')} backLabel={t(settings.language, 'game.back')} />

      <SessionWrapper game="pour" getCurrentMetrics={getCurrentMetrics}>
        <p className="text-warm-500 text-sm mb-6">
          {t(settings.language, 'game.pour.instructions')}
        </p>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <CameraView
            onVideoReady={(el) => {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
              setVideoReady(!!el);
            }}
            className="w-full aspect-[4/3]"
          />

          <div
            className="flex flex-col items-center justify-center card p-8 select-none touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Teapot + cup scene */}
            <div className="relative w-56 h-48 mb-4">
              {/* Target band */}
              <div
                className="absolute left-1/2 top-0 h-full w-1.5 rounded bg-primary-200"
                style={{
                  transform: `translateX(-50%) rotate(${targetDeg * 0.8}deg)`,
                  transformOrigin: '50% 90%',
                  opacity: 0.5,
                }}
              />
              {/* Teapot */}
              <div
                className="absolute left-1/2 top-2 text-6xl transition-transform duration-100"
                style={{
                  transform: `translateX(-50%) rotate(${pourRotation}deg)`,
                  transformOrigin: '50% 80%',
                }}
              >
                🫖
              </div>
              {/* Pour stream */}
              {pouring && (
                <div
                  className="absolute top-16 w-1 bg-sky-400 rounded"
                  style={{
                    left: `calc(50% + ${Math.sign(targetDeg) * 34}px)`,
                    height: '70px',
                  }}
                />
              )}
              {/* Cup with fill level */}
              <div
                className="absolute bottom-0 text-5xl"
                style={{ left: `calc(50% + ${Math.sign(targetDeg) * 34}px)`, transform: 'translateX(-50%)' }}
              >
                <div className="relative">
                  🥛
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-1 rounded bg-sky-200/80 transition-all"
                    style={{ width: '26px', height: `${Math.round(fill * 30)}px` }}
                  />
                </div>
              </div>
            </div>

            <p className="font-display font-semibold text-warm-700 text-lg mb-1">
              {!calibrated && !tracking
                ? t(settings.language, 'game.pour.calibrating')
                : spilling
                  ? t(settings.language, 'game.pour.tooFar')
                  : pouring
                    ? t(settings.language, 'game.pour.steady')
                    : t(settings.language, 'game.pour.tiltTo', { side: targetDeg > 0 ? t(settings.language, 'game.pour.right') : t(settings.language, 'game.pour.left') })}
            </p>
            <p className="text-primary-600 font-bold text-3xl mb-1">{score}</p>
            <p className="text-warm-400 text-xs">{t(settings.language, 'game.pour.cupsFilled')}</p>
            <p className="text-warm-400 text-xs mt-2">
              {t(settings.language, 'game.pour.currentTilt')}: {Math.round(tilt)}° · {t(settings.language, 'game.pour.target')}: {Math.round(Math.abs(targetDeg))}° ± {Math.round(tolDeg)}°
            </p>
            {!tracking && (
              <p className="text-warm-400 text-xs mt-2">{t(settings.language, 'game.pour.manualHint')}</p>
            )}
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-warm-500">
            <strong className="text-warm-700">{t(settings.language, 'game.pour.focus')}</strong>{' '}
            {t(settings.language, 'game.pour.focusDetail')}
          </p>
        </div>
      </SessionWrapper>
    </div>
  );
}

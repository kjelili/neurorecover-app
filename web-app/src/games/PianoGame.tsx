import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CameraView } from '../components/CameraView';
import { SessionWrapper } from '../components/SessionWrapper';
import { useHandTracking, type HandResult, type Landmark } from '../hooks/useHandTracking';
import { playNote } from '../utils/gameSounds';
import { computeRomPerFinger, computeTremorFromHistory, computeSmoothnessFromHistory } from '../utils/landmarkFeatures';
import type { SessionMetrics } from '../types/session';

const HISTORY_SIZE = 30;

const KEYS = [
  { id: 'C', note: 'C', finger: 1, label: 'C' },
  { id: 'D', note: 'D', finger: 2, label: 'D' },
  { id: 'E', note: 'E', finger: 3, label: 'E' },
  { id: 'F', note: 'F', finger: 4, label: 'F' },
  { id: 'G', note: 'G', finger: 4, label: 'G' },
  { id: 'A', note: 'A', finger: 3, label: 'A' },
  { id: 'B', note: 'B', finger: 2, label: 'B' },
  { id: 'C2', note: 'C', finger: 1, label: 'C\u2082' },
];

const MELODY = ['C', 'E', 'G', 'E', 'C'];
const FINGER_TIPS = [4, 8, 12, 16, 20];

type Mode = 'free' | 'task-index' | 'task-melody';

function isFingerExtended(landmarks: Landmark[], fingerIndex: number): boolean {
  const tipIdx = FINGER_TIPS[fingerIndex];
  const pipIdx = Math.max(0, tipIdx - 2);
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  return tip && pip ? tip.y < pip.y : false;
}

export function PianoGame() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [mode, setMode] = useState<Mode>('free');
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [touchKeys, setTouchKeys] = useState<Set<string>>(new Set());
  const [handReady, setHandReady] = useState(false);
  const countRef = useRef(0);
  const prevKeysRef = useRef<Set<string>>(new Set());
  const taskStartRef = useRef(0);
  const reactionRef = useRef<number | undefined>(undefined);
  const historyRef = useRef<Landmark[][]>([]);
  const [taskSuccess, setTaskSuccess] = useState(false);
  const [melodyStep, setMelodyStep] = useState(0);
  const [melodyDone, setMelodyDone] = useState(false);

  const onResults = useCallback((results: HandResult[]) => {
    if (!results.length) { setPressedKeys(new Set()); setHandReady(false); return; }
    setHandReady(true);
    const lm = results[0].landmarks;
    historyRef.current.push(lm);
    if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();

    const next = new Set<string>();
    KEYS.forEach((key) => { if (isFingerExtended(lm, key.finger)) next.add(key.id); });
    next.forEach((id) => {
      if (!prevKeysRef.current.has(id)) {
        countRef.current += 1;
        playNote(id, 150);
        if (mode === 'task-index' && id === 'C' && next.size === 1 && reactionRef.current == null) {
          reactionRef.current = Date.now() - taskStartRef.current;
          setTaskSuccess(true);
        }
        if (mode === 'task-melody' && melodyStep < MELODY.length && MELODY[melodyStep] === id) {
          if (reactionRef.current == null) reactionRef.current = Date.now() - taskStartRef.current;
          if (melodyStep + 1 >= MELODY.length) setMelodyDone(true);
          setMelodyStep((s) => s + 1);
        }
      }
    });
    prevKeysRef.current = next;
    setPressedKeys(next);
  }, [mode, melodyStep]);

  useHandTracking({ videoRef, numHands: 1, onResults, enabled: videoReady });

  const startTask = (m: Mode) => {
    setMode(m);
    setTaskSuccess(false);
    setMelodyStep(0);
    setMelodyDone(false);
    reactionRef.current = undefined;
    taskStartRef.current = Date.now();
  };

  const handleKeyClick = useCallback((keyId: string) => {
    setTouchKeys((prev) => new Set(prev).add(keyId));
    countRef.current += 1;
    playNote(keyId, 150);
    if (mode === 'task-index' && keyId === 'C' && reactionRef.current == null) {
      reactionRef.current = Date.now() - taskStartRef.current;
      setTaskSuccess(true);
    }
    if (mode === 'task-melody' && melodyStep < MELODY.length && MELODY[melodyStep] === keyId) {
      if (reactionRef.current == null) reactionRef.current = Date.now() - taskStartRef.current;
      if (melodyStep + 1 >= MELODY.length) setMelodyDone(true);
      setMelodyStep((s) => s + 1);
    }
    setTimeout(() => setTouchKeys((prev) => { const n = new Set(prev); n.delete(keyId); return n; }), 200);
  }, [mode, melodyStep]);

  const displayed = new Set([...pressedKeys, ...touchKeys]);

  const getCurrentMetrics = useCallback((): SessionMetrics => {
    const h = historyRef.current;
    const last = h.length ? h[h.length - 1] : null;
    const rom = last ? computeRomPerFinger(last) : undefined;
    return {
      score: countRef.current,
      reactionTimeMs: reactionRef.current,
      romPerFinger: rom?.some((v) => v > 0) ? rom : undefined,
      tremorEstimate: h.length >= 5 ? computeTremorFromHistory(h) : undefined,
      smoothnessEstimate: h.length >= 4 ? computeSmoothnessFromHistory(h) : undefined,
    };
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
            ← Back to dashboard
          </Link>
          <h1 className="section-title">🎹 Virtual Piano</h1>
        </div>
      </div>

      <SessionWrapper game="piano" getCurrentMetrics={getCurrentMetrics}>
        {/* Mode selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([['free', 'Free play'], ['task-index', 'Index finger only'], ['task-melody', '5-note melody']] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => startTask(m as Mode)}
              className={`tap-target rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                mode === m ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'task-index' && (
          <div className={`card p-3 mb-4 ${taskSuccess ? 'border-primary-300 bg-primary-50' : 'border-accent-200 bg-accent-50'}`}>
            <p className="text-sm font-medium text-warm-800">
              {taskSuccess
                ? `✓ Correct! Reaction: ${reactionRef.current ?? 0} ms`
                : 'Press only your index finger (key C)'}
            </p>
          </div>
        )}
        {mode === 'task-melody' && (
          <div className={`card p-3 mb-4 ${melodyDone ? 'border-primary-300 bg-primary-50' : 'border-accent-200 bg-accent-50'}`}>
            <p className="text-sm font-medium text-warm-800">
              {melodyDone
                ? `✓ Melody complete! Reaction: ${reactionRef.current ?? 0} ms`
                : `Play: C → E → G → E → C  |  Next: ${melodyStep < MELODY.length ? MELODY[melodyStep] : '—'}`}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <CameraView
            onVideoReady={(el) => {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
              setVideoReady(!!el);
            }}
            className="w-full aspect-[4/3]"
          />

          <div className="flex flex-col justify-center">
            <div className="flex gap-1 sm:gap-1.5 justify-center mb-4">
              {KEYS.map((key) => {
                const isActive = displayed.has(key.id);
                const isTarget =
                  (mode === 'task-index' && key.id === 'C') ||
                  (mode === 'task-melody' && melodyStep < MELODY.length && key.id === MELODY[melodyStep]);
                return (
                  <button
                    key={key.id}
                    type="button"
                    onClick={() => handleKeyClick(key.id)}
                    className={`
                      w-11 sm:w-14 h-28 sm:h-36 rounded-b-lg border-2 transition-all tap-target relative
                      ${isActive
                        ? 'bg-primary-100 border-primary-500 scale-y-[0.96] shadow-inner'
                        : 'bg-white border-warm-200 hover:border-primary-300 shadow-soft'}
                      ${isTarget ? 'ring-2 ring-accent-400 ring-offset-1' : ''}
                    `}
                    aria-label={`Key ${key.label}`}
                  >
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-warm-400">
                      {key.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-sm text-warm-400">
              {handReady ? '✋ Hand detected — extend fingers to play' : 'Show your hand or tap keys to play'}
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm text-warm-500">
            <strong className="text-warm-700">Rehabilitation focus:</strong> Finger isolation, range of motion, and reaction time.
            Use guided tasks to track improvement over sessions.
          </p>
        </div>
      </SessionWrapper>
    </div>
  );
}

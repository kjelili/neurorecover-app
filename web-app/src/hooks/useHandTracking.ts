import { useCallback, useEffect, useRef, useState } from 'react';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  handedness: string;
  landmarks: Landmark[];
}

export interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  numHands?: number;
  onResults?: (results: HandResult[]) => void;
  enabled?: boolean;
}

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

type HLInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
    landmarks: Landmark[][];
    handedness?: Array<{ categoryName?: string }>;
  };
};

export function useHandTracking({ videoRef, numHands = 1, onResults, enabled = true }: UseHandTrackingOptions) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(-1);
  const hlRef = useRef<HLInstance | null>(null);
  const cbRef = useRef(onResults);
  cbRef.current = onResults;

  const init = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const vision = await import('@mediapipe/tasks-vision');
      const wasm = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const hl = await vision.HandLandmarker.createFromOptions(wasm, {
        baseOptions: { modelAssetPath: MODEL_PATH },
        numHands,
        runningMode: 'VIDEO',
      });
      hlRef.current = hl as HLInstance;
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hand tracking');
      setReady(false);
    }
  }, [numHands, enabled]);

  useEffect(() => {
    init();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [init]);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const hl = hlRef.current;
    if (!video || !hl || !ready || video.readyState < 2) return;
    if (video.currentTime === lastTimeRef.current) return;
    lastTimeRef.current = video.currentTime;
    try {
      const r = hl.detectForVideo(video, performance.now());
      if (!r?.landmarks?.length) return;
      cbRef.current?.(r.landmarks.map((lm, i) => ({
        handedness: r.handedness?.[i]?.categoryName ?? 'Unknown',
        landmarks: lm,
      })));
    } catch { /* ignore frame errors */ }
  }, [videoRef, ready]);

  useEffect(() => {
    if (!ready || !enabled) return;
    const loop = () => { detect(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ready, enabled, detect]);

  return { ready, error };
}

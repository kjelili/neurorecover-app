export interface Landmark {
  x: number;
  y: number;
  z: number;
}

const TIP_INDEX = [4, 8, 12, 16, 20];
const PIP_INDEX = [2, 6, 10, 14, 18];

export function computeRomPerFinger(landmarks: Landmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];
  return TIP_INDEX.map((tipIdx, i) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[PIP_INDEX[i]];
    if (!tip || !pip) return 0;
    return Math.max(0, Math.min(1, (pip.y - tip.y + 0.1) / 0.4));
  });
}

export function computeTremorFromHistory(history: Landmark[][]): number {
  if (!history?.length || history.length < 5) return 0;
  const xs = history.map((h) => h[0]?.x ?? 0);
  const ys = history.map((h) => h[0]?.y ?? 0);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const variance = xs.reduce((s, x) => s + (x - meanX) ** 2, 0) / xs.length +
    ys.reduce((s, y) => s + (y - meanY) ** 2, 0) / ys.length;
  return Math.min(1, Math.sqrt(variance) * 10);
}

export function computeSmoothnessFromHistory(history: Landmark[][]): number {
  if (!history?.length || history.length < 4) return 0;
  const x = history.map((h) => h[0]?.x ?? 0);
  const y = history.map((h) => h[0]?.y ?? 0);
  let jerkSq = 0;
  for (let i = 2; i < x.length - 1; i++) {
    const ax = x[i - 2] - 2 * x[i - 1] + x[i];
    const ay = y[i - 2] - 2 * y[i - 1] + y[i];
    jerkSq += ax * ax + ay * ay;
  }
  const jerk = jerkSq / Math.max(1, x.length - 3);
  return Math.min(1, 1 / (1 + jerk * 100));
}

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.12): void {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch { /* ignore */ }
}

export function playPop(): void {
  playTone(880, 80, 'sine', 0.1);
  setTimeout(() => playTone(1320, 60, 'sine', 0.06), 40);
}

export function playGrab(): void {
  playTone(180, 120, 'sine', 0.15);
  setTimeout(() => playTone(140, 80, 'sine', 0.08), 60);
}

export function playSuccess(): void {
  playTone(523, 120, 'sine', 0.12);
  setTimeout(() => playTone(659, 100, 'sine', 0.1), 80);
  setTimeout(() => playTone(784, 150, 'sine', 0.1), 180);
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  C: 261.63, D: 293.66, E: 329.63, F: 349.23,
  G: 392.0, A: 440.0, B: 493.88, C2: 523.25,
};

export function playNote(keyId: string, durationMs = 150): void {
  const freq = NOTE_FREQUENCIES[keyId];
  if (freq == null) return;
  playTone(freq, durationMs, 'sine', 0.15);
}

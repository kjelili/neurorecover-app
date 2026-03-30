import { useEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';

export interface VoiceActionState {
  listening: boolean;
  supported: boolean;
  lastHeard: string;
  error: string | null;
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

const COMMANDS: Array<{ intent: string; patterns: RegExp[] }> = [
  { intent: 'open-dashboard', patterns: [/\b(open|go|show)\b.*\b(dashboard|home)\b/, /\bdashboard\b/] },
  { intent: 'open-piano', patterns: [/\b(open|go|show)\b.*\b(piano)\b/, /\bpiano\b/] },
  { intent: 'open-bubbles', patterns: [/\b(open|go|show)\b.*\b(bubble|bubbles)\b/, /\bbubbles?\b/] },
  { intent: 'open-grab', patterns: [/\b(open|go|show)\b.*\b(grab|cup|grasp)\b/, /\b(grab|grasp)\b/] },
  { intent: 'open-progress', patterns: [/\b(open|go|show)\b.*\b(progress)\b/, /\bprogress\b/] },
  { intent: 'open-settings', patterns: [/\b(open|go|show)\b.*\b(settings?)\b/, /\bsettings?\b/] },
  { intent: 'open-clinical', patterns: [/\b(open|go|show)\b.*\b(clinic|clinical)\b/, /\bclinical\b/] },
  { intent: 'open-admin', patterns: [/\b(open|go|show)\b.*\b(admin)\b/, /\badmin\b/] },
  { intent: 'start-session', patterns: [/\b(start|begin)\b.*\b(session|exercise|game)\b/, /\bstart session\b/] },
  { intent: 'end-session', patterns: [/\b(stop|end|finish)\b.*\b(session|exercise|game)\b/, /\bend session\b/] },
  { intent: 'pause-session', patterns: [/\bpause\b.*\b(session)?\b/, /\brest\b/] },
  // Nigerian pidgin-friendly
  { intent: 'open-progress', patterns: [/\bshow progress\b/, /\bopen progress\b/] },
  { intent: 'open-piano', patterns: [/\bopen piano\b/] },
  { intent: 'open-settings', patterns: [/\bopen settings\b/] },
  // French
  { intent: 'open-progress', patterns: [/\bouvrir\b.*\bprogres\b/, /\bprogres\b/] },
  { intent: 'open-settings', patterns: [/\bouvrir\b.*\bparametres?\b/, /\bparametres?\b/] },
  // Spanish/Portuguese
  { intent: 'open-progress', patterns: [/\babrir\b.*\bprogreso\b/, /\babrir\b.*\bprogresso\b/] },
  { intent: 'open-settings', patterns: [/\babrir\b.*\bconfiguracion\b/, /\babrir\b.*\bdefinicoes\b/] },
  // Swahili
  { intent: 'open-progress', patterns: [/\bfungua\b.*\bmaendeleo\b/] },
  { intent: 'open-settings', patterns: [/\bfungua\b.*\bmipangilio\b/] },
  // Hausa / Yoruba
  { intent: 'open-settings', patterns: [/\bbude\b.*\bsaituna\b/, /\bsi\b.*\beto\b/] },
];

function detectIntent(text: string): string | null {
  const x = normalize(text);
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some((p) => p.test(x))) return cmd.intent;
  }
  return null;
}

function executeIntent(intent: string, navigate: NavigateFunction): void {
  switch (intent) {
    case 'open-dashboard': navigate('/app'); return;
    case 'open-piano': navigate('/app/piano'); return;
    case 'open-bubbles': navigate('/app/bubbles'); return;
    case 'open-grab': navigate('/app/grab-cup'); return;
    case 'open-progress': navigate('/app/progress'); return;
    case 'open-settings': navigate('/app/settings'); return;
    case 'open-clinical': navigate('/app/clinical'); return;
    case 'open-admin': navigate('/app/admin'); return;
    case 'start-session': window.dispatchEvent(new CustomEvent('voice:start-session')); return;
    case 'end-session': window.dispatchEvent(new CustomEvent('voice:end-session')); return;
    case 'pause-session': window.dispatchEvent(new CustomEvent('voice:pause-session')); return;
    default:
  }
}

function getSpeechCtor():
  | typeof SpeechRecognition
  | typeof webkitSpeechRecognition
  | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & typeof globalThis & {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export function useVoiceActions(
  navigate: NavigateFunction,
  enabled: boolean,
  locale: string,
): [VoiceActionState, () => void, () => void] {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const supported = !!getSpeechCtor();

  useEffect(() => {
    if (!supported || !enabled) return;
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = locale;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript ?? '';
      if (!transcript) return;
      setLastHeard(transcript);
      const intent = detectIntent(transcript);
      if (intent) executeIntent(intent, navigate);
    };
    rec.onerror = () => setError('Voice recognition error');
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, [supported, enabled, locale, navigate]);

  const start = () => {
    if (!enabled || !supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.lang = locale;
      recognitionRef.current.start();
      setListening(true);
      setError(null);
    } catch {
      setError('Unable to start voice recognition');
    }
  };
  const stop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch { /* ignore */ }
    setListening(false);
  };

  return [{ listening, supported, lastHeard, error }, start, stop];
}

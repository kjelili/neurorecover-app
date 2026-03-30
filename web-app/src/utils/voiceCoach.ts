export function speak(text: string, enabled: boolean, lang = 'en-US'): void {
  if (!enabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 0.8;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore browser speech failures
  }
}

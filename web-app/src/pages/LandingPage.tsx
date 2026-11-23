import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { t } from '../utils/i18n';
import { GameIcon } from '../components/GameIcon';
import type { GameType } from '../types/session';

/* ------------------------------------------------------------------ */
/* Hand-landmark illustration (code-drawn, on-brand)                   */
/* ------------------------------------------------------------------ */

const HAND_CHAINS: number[][][] = [
  // thumb
  [[150, 282], [112, 236], [86, 206], [66, 180], [52, 158]],
  // index
  [[150, 282], [134, 208], [128, 152], [125, 108], [123, 72]],
  // middle
  [[150, 282], [153, 202], [154, 142], [154, 98], [154, 62]],
  // ring
  [[150, 282], [172, 208], [180, 152], [185, 110], [188, 78]],
  // pinky
  [[150, 282], [192, 220], [206, 178], [217, 142], [226, 112]],
];

function HandIllustration() {
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-hidden>
      {/* viewfinder corners */}
      <g stroke="#1a4a48" strokeWidth="3" strokeLinecap="round" opacity="0.55">
        <path d="M18 42V24a6 6 0 0 1 6-6h18" />
        <path d="M258 18h18a6 6 0 0 1 6 6v18" />
        <path d="M282 258v18a6 6 0 0 1-6 6h-18" />
        <path d="M42 282H24a6 6 0 0 1-6-6v-18" />
      </g>
      {/* skeleton lines */}
      <g stroke="#1a4a48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85">
        {HAND_CHAINS.map((chain, i) => (
          <path key={i} d={chain.map((p, j) => `${j === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')} />
        ))}
        {/* palm cross-links */}
        <path d="M134 208 153 202 172 208 192 220" />
      </g>
      {/* joints */}
      {HAND_CHAINS.map((chain, i) =>
        chain.map((p, j) => {
          const isTip = j === chain.length - 1;
          return (
            <circle
              key={`${i}-${j}`}
              cx={p[0]}
              cy={p[1]}
              r={isTip ? 6 : 4}
              fill={isTip ? '#e85a3c' : '#ffffff'}
              stroke={isTip ? '#e85a3c' : '#1a4a48'}
              strokeWidth="2.5"
              className="animate-pulse-dot"
              style={{ animationDelay: `${(i * 5 + j) * 0.09}s` }}
            />
          );
        })
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const EXERCISES: Array<{ game: GameType; title: string; desc: string; cardClass: string; iconClass: string }> = [
  {
    game: 'piano',
    title: 'Virtual Piano',
    desc: 'Each finger mapped to a key. Guided tasks measure isolation, extension, and reaction time.',
    cardClass: 'bg-white text-warm-900',
    iconClass: 'bg-primary-100 text-primary-700',
  },
  {
    game: 'bubbles',
    title: 'Bubble Pop',
    desc: 'Reach, pinch, and pop. Difficulty adapts in real time to your current ability level.',
    cardClass: 'bg-accent-500 text-white',
    iconClass: 'bg-white/20 text-white',
  },
  {
    game: 'grab-cup',
    title: 'Cup Grasp',
    desc: 'Close your hand and hold to grip. Directly trains the cup-grasp pattern of daily living.',
    cardClass: 'bg-primary-700 text-white',
    iconClass: 'bg-white/15 text-white',
  },
  {
    game: 'pour',
    title: 'Pour & Steady',
    desc: 'Rotate your forearm to pour from a virtual teapot — pronation and supination with graded, spill-aware control.',
    cardClass: 'bg-blush-200 text-warm-900',
    iconClass: 'bg-white/70 text-primary-700',
  },
  {
    game: 'mirror',
    title: 'Mirror Match',
    desc: 'Virtual mirror therapy: move your stronger hand and guide its reflection — your recovering hand — to each target.',
    cardClass: 'bg-marigold-400 text-warm-900',
    iconClass: 'bg-white/60 text-primary-700',
  },
];

const METRICS: Array<[string, string]> = [
  ['Range of Motion', 'Finger extension measured frame-by-frame'],
  ['Tremor Index', 'Micro-oscillations detected from wrist movement'],
  ['Smoothness', 'Motion jerk analysis for movement quality'],
  ['Reaction Time', 'Stimulus-to-response measurement in guided tasks'],
  ['Rotation Range', 'Forearm pronation and supination in degrees'],
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const { settings } = useAppSettings();

  // Scroll-reveal
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-accent-50 text-warm-950 overflow-x-hidden">
      {/* Header */}
      <header className="relative px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between max-w-6xl mx-auto py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center">
              <span className="text-white text-lg font-bold font-display">N</span>
            </div>
            <span className="font-display font-bold text-xl text-primary-800">NeuroRecover</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#exercises" className="text-sm font-medium text-primary-700 hover:text-primary-800 hidden sm:inline">
              Exercises
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-primary-700 hover:text-primary-800 hidden sm:inline">
              How it works
            </a>
            <Link to="/app" className="btn-primary text-sm !px-5 !py-2.5">
              {t(settings.language, 'landing.open')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-20 sm:pt-16 sm:pb-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-accent-200 px-4 py-1.5 mb-7 shadow-soft">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" />
              <span className="text-xs font-semibold text-primary-700 tracking-wide">
                {t(settings.language, 'landing.badge')}
              </span>
            </div>
            <h1 className="font-display font-semibold text-5xl sm:text-6xl lg:text-[4.2rem] leading-[1.08] tracking-tight text-primary-800 mb-6">
              Recovery is hard.
              <br />
              Make it <span className="underline-wavy text-accent-500 italic">play.</span>
            </h1>
            <p className="text-lg text-warm-600 leading-relaxed max-w-lg mb-9">
              NeuroRecover turns repetitive hand therapy into adaptive games, using only your device
              camera. No wearables, no clinic visits, no accounts — just you, rebuilding movement
              one session at a time.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <Link to="/app" className="btn-primary text-base">
                {t(settings.language, 'landing.cta1')}
              </Link>
              <a href="#how-it-works" className="btn-secondary text-base">
                {t(settings.language, 'landing.cta2')}
              </a>
            </div>
            <p className="text-warm-400 text-sm">
              No account needed · Works on any device with a camera · Data stays on your device
            </p>
          </div>

          {/* Illustration */}
          <div className="relative reveal hidden lg:block" style={{ transitionDelay: '0.15s' }}>
            {/* organic blobs */}
            <div className="absolute -top-8 -right-6 w-72 h-72 bg-blush-200 rounded-[46%_54%_60%_40%/50%_45%_55%_50%] animate-floaty-slow" aria-hidden />
            <div className="absolute -bottom-10 -left-4 w-56 h-56 bg-primary-200 rounded-[55%_45%_42%_58%/48%_56%_44%_52%] animate-floaty" aria-hidden />
            <div className="absolute top-6 left-10 w-10 h-10 rounded-full bg-marigold-400 animate-floaty" aria-hidden />
            <div className="absolute bottom-16 right-4 w-6 h-6 rounded-full bg-accent-400 animate-floaty-slow" aria-hidden />
            {/* tracking card */}
            <div className="relative mx-auto w-[22rem] h-[22rem] bg-white rounded-[2rem] shadow-elevated p-6 animate-floaty">
              <HandIllustration />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 badge bg-primary-50 text-primary-700 border border-primary-100">
                21 landmarks · 30+ fps
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-y border-accent-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center reveal">
            {[
              ['5', 'Targeted exercises'],
              ['21', 'Hand landmarks tracked'],
              ['< 2s', 'Response latency'],
              ['100%', 'Private & offline'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display font-bold text-4xl text-accent-500 mb-1">{value}</p>
                <p className="text-warm-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section id="exercises" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12 reveal">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-primary-800 tracking-tight mb-4">
              Five exercises, <span className="underline-wavy-teal">real results</span>
            </h2>
            <p className="text-warm-500 text-lg">
              Each exercise trains a specific movement your therapist cares about. Complete sessions
              to build a picture of your recovery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXERCISES.map((item, i) => (
              <div
                key={item.game}
                className={`reveal rounded-2xl p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated ${item.cardClass} ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.iconClass}`}>
                  <GameIcon game={item.game} className="w-6 h-6" />
                </span>
                <h3 className="font-display font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed opacity-80">{item.desc}</p>
              </div>
            ))}

            {/* Progress tile fills the grid */}
            <div className="reveal rounded-2xl p-7 shadow-soft bg-white border-2 border-dashed border-primary-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated" style={{ transitionDelay: '0.35s' }}>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-accent-100 text-accent-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l5-5 4 4 6-7 3 3" />
                  <path d="M3 21h18" strokeWidth={1.2} opacity="0.5" />
                </svg>
              </span>
              <h3 className="font-display font-semibold text-xl mb-2 text-warm-900">Progress Tracking</h3>
              <p className="text-sm leading-relaxed text-warm-500">
                ROM, smoothness, tremor, and scores tracked across sessions — with exportable PDF
                reports your therapist can actually use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white border-y border-accent-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="reveal">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-primary-800 tracking-tight mb-5">
              Precise hand tracking,
              <br />
              no extra hardware
            </h2>
            <p className="text-warm-500 leading-relaxed mb-8">
              NeuroRecover detects 21 landmarks on each hand straight from your camera feed.
              From these landmarks, we compute clinical metrics in real time:
            </p>
            <div className="space-y-4">
              {METRICS.map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 mt-0.5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-warm-800 text-sm">{title}</p>
                    <p className="text-warm-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="bg-accent-50 rounded-[2rem] p-8 sm:p-10 border border-accent-100">
              <div className="space-y-5">
                {[
                  ['🎯', 'Adaptive difficulty', 'Exercises ease off when you struggle and level up as you improve — always the right challenge.'],
                  ['🔒', 'Private & offline', 'All data stays on your device. No account required. Works without internet after first load.'],
                  ['🤝', 'Therapist-ready', 'Protocol templates, clinical assessments, and reports designed to be shared with your care team.'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="bg-white rounded-2xl p-5 shadow-soft flex gap-4">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="font-semibold text-warm-900 text-sm mb-1">{title}</p>
                      <p className="text-warm-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative bg-primary-800 text-white overflow-hidden">
        <svg className="absolute top-0 left-0 w-full text-white" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden>
          <path d="M0 0h1440v12c-240 24-480 30-720 18S240 8 0 24V0Z" fill="currentColor" />
        </svg>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-32 sm:pb-24 reveal">
          <h2 className="font-display font-semibold text-3xl sm:text-5xl tracking-tight mb-5">
            Start your <span className="text-accent-300 italic">recovery journey</span> today
          </h2>
          <p className="text-primary-100 text-lg max-w-xl mx-auto mb-9">
            Allow camera access and begin your first session in under a minute. Progress is saved
            locally on your device.
          </p>
          <Link to="/app" className="btn-primary text-base !px-9 !py-3.5">
            Open NeuroRecover
          </Link>
          <p className="text-primary-200 text-sm mt-6">
            Free · No sign-up · Works on phone, tablet, and desktop
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-950 text-primary-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">N</span>
            </div>
            <span className="font-display font-semibold text-white">NeuroRecover</span>
          </div>
          <p className="text-xs">
            Camera-based hand rehabilitation for stroke recovery · A rehabilitation support tool, not a diagnostic device
          </p>
        </div>
      </footer>
    </div>
  );
}

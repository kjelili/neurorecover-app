import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎹',
    title: 'Virtual Piano',
    desc: 'Each finger mapped to a key. Guided tasks measure isolation, extension, and reaction time.',
  },
  {
    icon: '🫧',
    title: 'Bubble Pop',
    desc: 'Reach, pinch, and pop. Difficulty adapts in real-time to your current ability level.',
  },
  {
    icon: '🥤',
    title: 'Cup Grasp',
    desc: 'Close your hand and hold to grip. Directly trains the cup-grasp pattern of daily living.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'ROM, smoothness, tremor, and scores tracked across sessions with exportable PDF reports.',
  },
  {
    icon: '🎯',
    title: 'Adaptive Difficulty',
    desc: 'Exercises become easier when you struggle and harder when you improve — always the right challenge.',
  },
  {
    icon: '🔒',
    title: 'Private & Offline',
    desc: 'All data stays on your device. No account required. Works without internet after first load.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50 text-warm-950 overflow-x-hidden">
      {/* Nav */}
      <header className="relative px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between max-w-6xl mx-auto py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <span className="font-display font-bold text-xl text-warm-900">NeuroRecover</span>
          </div>
          <Link to="/app" className="btn-primary text-sm px-5 py-2.5">
            Open App
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-primary-800 text-sm font-semibold">Camera-based hand rehabilitation</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-950 leading-[1.1] mb-6 tracking-tight">
            Turn recovery into
            <br />
            <span className="text-primary-600">meaningful progress</span>
          </h1>

          <p className="text-lg sm:text-xl text-warm-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            NeuroRecover uses your device camera to track hand movements and turn rehabilitation exercises into
            adaptive games — with real metrics your therapist can use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/app" className="btn-primary text-base px-8 py-4 w-full sm:w-auto shadow-elevated">
              Start your first session
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
              See how it works
            </a>
          </div>

          <p className="text-warm-400 text-sm mt-6">
            No account needed · Works on any device with a camera · Data stays on your device
          </p>
        </div>

        {/* Background decoration */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden />
      </section>

      {/* Stats bar */}
      <section className="border-y border-warm-200 bg-white py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ['3', 'Targeted exercises'],
              ['21', 'Hand landmarks tracked'],
              ['< 2s', 'Response latency'],
              ['100%', 'Private & offline'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display font-bold text-3xl text-primary-700 mb-1">{value}</p>
                <p className="text-warm-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">Three exercises, real results</h2>
            <p className="text-warm-500 max-w-xl mx-auto">
              Each exercise targets a specific motor skill. Complete sessions to build a picture of your recovery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((item, i) => (
              <div
                key={item.title}
                className="card-hover p-6 sm:p-8 animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="font-display font-semibold text-lg text-warm-900 mb-2">{item.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How tracking works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white border-y border-warm-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-4">Precise hand tracking, no extra hardware</h2>
              <p className="text-warm-500 leading-relaxed mb-6">
                NeuroRecover uses MediaPipe to detect 21 landmarks on each hand from your camera feed.
                From these landmarks, we compute clinical metrics in real-time:
              </p>
              <div className="space-y-3">
                {[
                  ['Range of Motion', 'Finger extension measured frame-by-frame'],
                  ['Tremor Index', 'Micro-oscillations detected from wrist movement'],
                  ['Smoothness', 'Motion jerk analysis for movement quality'],
                  ['Reaction Time', 'Stimulus-to-response measurement in guided tasks'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-warm-800 text-sm">{title}</p>
                      <p className="text-warm-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-warm-50 rounded-3xl p-8 border border-warm-200">
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">✋</div>
                  <p className="text-warm-500 text-sm font-medium">21 landmarks per hand</p>
                  <p className="text-warm-400 text-xs mt-1">Real-time at 30+ FPS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="section-title mb-4">Start your recovery journey</h2>
          <p className="text-warm-500 mb-8">
            Allow camera access and begin your first session. Progress is saved locally on your device.
          </p>
          <Link to="/app" className="btn-primary text-base px-8 py-4 shadow-elevated">
            Open NeuroRecover
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-warm-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-warm-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-display font-semibold text-warm-600">NeuroRecover</span>
          </div>
          <span>AI-powered hand rehabilitation for stroke recovery</span>
        </div>
      </footer>
    </div>
  );
}

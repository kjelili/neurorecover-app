import { Link } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { t } from '../utils/i18n';

export function ClinicalEvidence() {
  const { settings } = useAppSettings();
  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-1 inline-block">
            ← {t(settings.language, 'common.backDashboard')}
          </Link>
          <h1 className="section-title">{t(settings.language, 'evidence.title')}</h1>
        </div>
        <div className="card p-5 space-y-4 text-sm text-warm-600">
          <p>{t(settings.language, 'evidence.desc')}</p>
          <div>
            <p className="font-semibold text-warm-800 mb-1">{t(settings.language, 'evidence.methodology')}</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>ROM: derived from finger tip and joint landmark geometry.</li>
              <li>Tremor index: wrist micro-oscillation variance over short windows.</li>
              <li>Smoothness: jerk-based proxy from landmark trajectory.</li>
              <li>Quality score: weighted synthesis of control and performance metrics.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-warm-800 mb-1">{t(settings.language, 'evidence.safety')}</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Stop sessions if pain increases significantly or dizziness occurs.</li>
              <li>Use therapist judgment for protocol progression and interpretation.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-warm-800 mb-1">{t(settings.language, 'evidence.intended')}</p>
            <p>
              Home and clinic rehabilitation support for upper-limb motor training, with optional therapist-supervised workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

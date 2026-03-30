import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { logAuditEvent } from '../utils/governance';
import { t } from '../utils/i18n';

export function Onboarding() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppSettings();
  const [name, setName] = useState(settings.displayName);
  const [role, setRole] = useState(settings.userRole);
  const [consent, setConsent] = useState(settings.consentAccepted);

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-10">
      <div className="max-w-2xl mx-auto card p-6 sm:p-8">
        <h1 className="section-title mb-2">{t(settings.language, 'onboarding.title')}</h1>
        <p className="text-sm text-warm-500 mb-6">
          {t(settings.language, 'onboarding.desc')}
        </p>

        <div className="space-y-4">
          <label className="text-sm text-warm-500 block">
            {t(settings.language, 'onboarding.displayName')}
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder={t(settings.language, 'onboarding.displayName')}
            />
          </label>

          <label className="text-sm text-warm-500 block">
            {t(settings.language, 'onboarding.role')}
            <select className="input-field mt-1" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="patient">{t(settings.language, 'onboarding.rolePatient')}</option>
              <option value="therapist">{t(settings.language, 'onboarding.roleTherapist')}</option>
              <option value="admin">{t(settings.language, 'onboarding.roleAdmin')}</option>
            </select>
          </label>

          <label className="flex items-start gap-2 text-sm text-warm-600">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>
              {t(settings.language, 'onboarding.consentText')}
            </span>
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!consent}
              onClick={() => {
                updateSettings({
                  displayName: name.trim(),
                  userRole: role,
                  consentAccepted: consent,
                  onboardingCompleted: true,
                  therapistMode: role !== 'patient',
                });
                logAuditEvent('consent.accepted', 'User completed onboarding and accepted consent.');
                navigate('/app');
              }}
            >
              {t(settings.language, 'onboarding.finish')}
            </button>
            <Link to="/" className="btn-ghost text-sm">{t(settings.language, 'onboarding.backLanding')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { getAssessments } from './clinicalTools';
import { getActiveProfile } from './patientProfiles';
import { getAllSessions } from './sessionStorage';

export function exportFhirLikeBundleJson(): string {
  const profile = getActiveProfile();
  const sessions = getAllSessions();
  const assessments = getAssessments(500);

  const entries = [
    {
      resourceType: 'Patient',
      id: profile.id,
      name: [{ text: profile.name }],
    },
    ...sessions.map((s) => ({
      resourceType: 'Observation',
      id: s.id,
      status: 'final',
      code: { text: `NeuroRecover Session ${s.game}` },
      effectiveDateTime: new Date(s.endedAt).toISOString(),
      valueQuantity: { value: s.metrics.qualityScore ?? 0, unit: 'qualityScore' },
      component: [
        { code: { text: 'score' }, valueQuantity: { value: s.metrics.score ?? 0 } },
        { code: { text: 'reactionTimeMs' }, valueQuantity: { value: s.metrics.reactionTimeMs ?? 0, unit: 'ms' } },
        { code: { text: 'tremor' }, valueQuantity: { value: s.metrics.tremorEstimate ?? 0 } },
        { code: { text: 'smoothness' }, valueQuantity: { value: s.metrics.smoothnessEstimate ?? 0 } },
      ],
    })),
    ...assessments.map((a) => ({
      resourceType: 'QuestionnaireResponse',
      id: a.id,
      authored: new Date(a.createdAt).toISOString(),
      item: [
        { linkId: 'assessor', answer: [{ valueString: a.assessor }] },
        { linkId: 'fmaHandEstimate', answer: [{ valueInteger: a.fmaHandEstimate }] },
        { linkId: 'aratEstimate', answer: [{ valueInteger: a.aratEstimate }] },
        { linkId: 'malAmount', answer: [{ valueDecimal: a.malAmount }] },
        { linkId: 'malQuality', answer: [{ valueDecimal: a.malQuality }] },
        { linkId: 'promPainInterference', answer: [{ valueInteger: a.promPainInterference }] },
        { linkId: 'promFatigue', answer: [{ valueInteger: a.promFatigue }] },
      ],
    })),
  ];

  return JSON.stringify({
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries.map((resource) => ({ resource })),
  }, null, 2);
}

import type { SessionMetrics, StoredSession } from '../types/session';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function safeNumber(v: number | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeQualityScore(metrics: SessionMetrics): number {
  const rom = metrics.romPerFinger?.length ? clamp01(mean(metrics.romPerFinger)) : null;
  const smoothness = safeNumber(metrics.smoothnessEstimate) != null ? clamp01(metrics.smoothnessEstimate ?? 0) : null;
  const tremor = safeNumber(metrics.tremorEstimate) != null ? clamp01(1 - (metrics.tremorEstimate ?? 0)) : null;
  const reaction = safeNumber(metrics.reactionTimeMs) != null
    ? clamp01(1 - Math.min(1, (metrics.reactionTimeMs ?? 0) / 1800))
    : null;
  const scoreNorm = safeNumber(metrics.score) != null
    ? clamp01(Math.min(1, (metrics.score ?? 0) / 60))
    : null;

  const components = [
    rom != null ? rom * 0.25 : null,
    smoothness != null ? smoothness * 0.25 : null,
    tremor != null ? tremor * 0.2 : null,
    reaction != null ? reaction * 0.15 : null,
    scoreNorm != null ? scoreNorm * 0.15 : null,
  ].filter((x): x is number => x != null);

  if (!components.length) return 0;

  const usedWeight = [
    rom != null ? 0.25 : 0,
    smoothness != null ? 0.25 : 0,
    tremor != null ? 0.2 : 0,
    reaction != null ? 0.15 : 0,
    scoreNorm != null ? 0.15 : 0,
  ].reduce((a, b) => a + b, 0);

  return Math.round((components.reduce((a, b) => a + b, 0) / Math.max(0.01, usedWeight)) * 100);
}

export interface RecoveryRecommendation {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export function getRecoveryRecommendations(sessions: StoredSession[]): RecoveryRecommendation[] {
  if (!sessions.length) {
    return [{
      title: 'Start with consistency',
      detail: 'Complete 3 short sessions this week to establish a baseline.',
      priority: 'high',
    }];
  }

  const recent = sessions.slice(0, 8);
  const avgQuality = mean(recent.map((s) => s.metrics.qualityScore ?? computeQualityScore(s.metrics)));
  const avgTremor = mean(recent.map((s) => s.metrics.tremorEstimate ?? 0));
  const avgSmoothness = mean(recent.map((s) => s.metrics.smoothnessEstimate ?? 0));
  const avgRom = mean(recent.flatMap((s) => s.metrics.romPerFinger ?? []));
  const avgPain = mean(recent.map((s) => s.annotations?.painLevel ?? 0).filter((p) => p > 0));

  const recommendations: RecoveryRecommendation[] = [];

  if (avgPain >= 6) {
    recommendations.push({
      title: 'Reduce intensity next session',
      detail: 'Recent pain ratings are elevated. Shorten session duration and prioritize smooth movement quality.',
      priority: 'high',
    });
  }

  if (avgTremor > 0.45 || avgSmoothness < 0.35) {
    recommendations.push({
      title: 'Focus on control before speed',
      detail: 'Use slower, deliberate movements in Bubble Pop and Cup Grasp to improve stability.',
      priority: 'high',
    });
  }

  if (avgRom > 0 && avgRom < 0.35) {
    recommendations.push({
      title: 'Add ROM-focused warmup',
      detail: 'Start with 1-2 minutes of gentle finger extension before playing to improve range of motion.',
      priority: 'medium',
    });
  }

  if (avgQuality >= 70) {
    recommendations.push({
      title: 'Progress challenge level',
      detail: 'Quality trend is strong. Increase duration to 5 minutes or use guided piano tasks more often.',
      priority: 'low',
    });
  } else if (avgQuality < 45) {
    recommendations.push({
      title: 'Keep sessions shorter and frequent',
      detail: 'Aim for 2-minute blocks with rest to build consistency and confidence.',
      priority: 'medium',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: 'Maintain current plan',
      detail: 'Your recent trends are stable. Continue with a balanced mix of all three exercises.',
      priority: 'low',
    });
  }

  return recommendations.slice(0, 3);
}

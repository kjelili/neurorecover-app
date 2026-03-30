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

export function estimateCompensationRisk(metrics: SessionMetrics): number {
  const tremor = metrics.tremorEstimate ?? 0;
  const smoothness = metrics.smoothnessEstimate ?? 0.5;
  const romAvg = metrics.romPerFinger?.length ? mean(metrics.romPerFinger) : 0.5;
  const score = metrics.score ?? 0;
  const highSpeedLowControl = score > 18 && smoothness < 0.35;
  let risk = 0;
  risk += tremor * 0.45;
  risk += (1 - smoothness) * 0.35;
  risk += (romAvg < 0.3 ? 0.2 : 0);
  if (highSpeedLowControl) risk += 0.15;
  return Math.round(clamp01(risk) * 100);
}

export interface RiskAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

export function getRiskAlerts(
  sessions: StoredSession[],
  weeklyGoal: number,
  sessionsThisWeek: number,
): RiskAlert[] {
  if (!sessions.length) {
    return [{
      id: 'no-data',
      severity: 'low',
      title: 'No baseline yet',
      detail: 'Complete 3 sessions to establish a baseline before risk monitoring.',
    }];
  }

  const alerts: RiskAlert[] = [];
  const recent = sessions.slice(0, 6);
  const baseline = sessions.slice(6, 18);
  const recentQuality = mean(recent.map((s) => s.metrics.qualityScore ?? computeQualityScore(s.metrics)));
  const baselineQuality = baseline.length
    ? mean(baseline.map((s) => s.metrics.qualityScore ?? computeQualityScore(s.metrics)))
    : recentQuality;
  const recentPain = mean(recent.map((s) => s.annotations?.painLevel ?? 0).filter((x) => x > 0));
  const compensation = mean(recent.map((s) => s.metrics.compensationRisk ?? estimateCompensationRisk(s.metrics)));

  if (recentQuality + 10 < baselineQuality) {
    alerts.push({
      id: 'quality-drop',
      severity: 'high',
      title: 'Quality trend declined',
      detail: `Recent quality (${Math.round(recentQuality)}) is below baseline (${Math.round(baselineQuality)}).`,
    });
  }
  if (recentPain >= 6) {
    alerts.push({
      id: 'pain-high',
      severity: 'high',
      title: 'Elevated pain reports',
      detail: 'Recent pain check-ins are high. Consider reducing intensity and reviewing protocol.',
    });
  }
  if (compensation >= 55) {
    alerts.push({
      id: 'compensation',
      severity: 'medium',
      title: 'Compensation risk rising',
      detail: 'Movement pattern suggests control issues. Prioritize smoothness and slower guided tasks.',
    });
  }
  if (sessionsThisWeek < weeklyGoal) {
    alerts.push({
      id: 'adherence',
      severity: 'medium',
      title: 'Adherence below weekly goal',
      detail: `This week ${sessionsThisWeek}/${weeklyGoal} sessions completed.`,
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'stable',
      severity: 'low',
      title: 'Risk status stable',
      detail: 'No major risk patterns detected from current trends.',
    });
  }
  return alerts.slice(0, 4);
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

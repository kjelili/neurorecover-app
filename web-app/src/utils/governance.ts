import { getActiveProfileId } from './patientProfiles';
import { removeAssessmentsOlderThan } from './clinicalTools';
import { removeSessionsOlderThan } from './sessionStorage';

export type AuditAction =
  | 'consent.accepted'
  | 'data.export'
  | 'data.import'
  | 'data.retention.purge'
  | 'assessment.save'
  | 'session.save'
  | 'role.changed';

export interface AuditEvent {
  id: string;
  ts: number;
  action: AuditAction;
  detail: string;
  profileId: string;
}

function getAuditKey(): string {
  return 'neurorecover-audit-events-v1';
}

export function logAuditEvent(action: AuditAction, detail: string): void {
  try {
    const raw = localStorage.getItem(getAuditKey());
    const list = raw ? (JSON.parse(raw) as AuditEvent[]) : [];
    list.unshift({
      id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      action,
      detail: detail.slice(0, 240),
      profileId: getActiveProfileId(),
    });
    localStorage.setItem(getAuditKey(), JSON.stringify(list.slice(0, 500)));
  } catch {
    // ignore audit failures
  }
}

export function getAuditEvents(limit = 80): AuditEvent[] {
  try {
    const raw = localStorage.getItem(getAuditKey());
    const list = raw ? (JSON.parse(raw) as AuditEvent[]) : [];
    return list
      .filter((e) => e && typeof e.id === 'string' && typeof e.ts === 'number')
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function applyRetentionPolicy(retentionDays: number): { sessionsRemoved: number; assessmentsRemoved: number } {
  const days = Math.max(7, Math.min(3650, retentionDays));
  const cutoffTs = Date.now() - days * 24 * 60 * 60 * 1000;
  const sessionsRemoved = removeSessionsOlderThan(cutoffTs);
  const assessmentsRemoved = removeAssessmentsOlderThan(cutoffTs);
  if (sessionsRemoved > 0 || assessmentsRemoved > 0) {
    logAuditEvent(
      'data.retention.purge',
      `Retention purge removed ${sessionsRemoved} sessions and ${assessmentsRemoved} assessments (>${days} days).`,
    );
  }
  return { sessionsRemoved, assessmentsRemoved };
}

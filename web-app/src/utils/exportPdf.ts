import type { SessionSummary, StoredSession } from '../types/session';
import type { ClinicalAssessment } from './clinicalTools';

export async function exportSessionPdf(session: SessionSummary | StoredSession): Promise<void> {
  if (!session || typeof session.endedAt !== 'number') return;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const CX = 105;
  const dateStr = new Date(session.endedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const gameLabel = session.game.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  doc.setFontSize(24);
  doc.setTextColor(7, 196, 175);
  doc.text('NeuroRecover', CX, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Session Report', CX, 30, { align: 'center' });

  let y = 48;
  doc.setFontSize(11);
  doc.setTextColor(50);
  doc.text(`Date: ${dateStr}`, CX, y, { align: 'center' }); y += 8;
  doc.text(`Exercise: ${gameLabel}`, CX, y, { align: 'center' }); y += 8;
  doc.text(`Duration: ${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`, CX, y, { align: 'center' }); y += 8;
  if (session.metrics.score != null) {
    doc.text(`Score: ${session.metrics.score}`, CX, y, { align: 'center' }); y += 8;
  }
  if (session.metrics.reactionTimeMs != null) {
    doc.text(`Reaction time: ${session.metrics.reactionTimeMs} ms`, CX, y, { align: 'center' }); y += 10;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('NeuroRecover — AI Hand Rehabilitation', CX, 285, { align: 'center' });
  doc.save(`neurorecover-session-${session.game}-${session.endedAt}.pdf`);
}

export async function exportProgressPdf(sessions: StoredSession[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const CX = 105;
  const valid = sessions.filter((s) => s != null && typeof s.endedAt === 'number');

  doc.setFontSize(24);
  doc.setTextColor(7, 196, 175);
  doc.text('NeuroRecover', CX, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Progress Report', CX, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Sessions: ${valid.length}`, CX, 38, { align: 'center' });

  let y = 54;
  const colW = 40;
  const headers = ['Date', 'Exercise', 'Score', 'Duration'];
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, 24 + i * colW, y));
  doc.setFont('helvetica', 'normal');
  y += 8;

  for (const s of valid.slice(0, 30)) {
    const row = [
      new Date(s.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      s.game.replace(/-/g, ' '),
      String(s.metrics?.score ?? '-'),
      `${Math.floor(s.durationSeconds / 60)}m`,
    ];
    row.forEach((cell, i) => doc.text(cell, 24 + i * colW, y));
    y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('NeuroRecover — AI Hand Rehabilitation', CX, 285, { align: 'center' });
  doc.save('neurorecover-progress-report.pdf');
}

export async function exportClinicianReportPdf(
  sessions: StoredSession[],
  assessments: ClinicalAssessment[],
  profileName: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const CX = 105;
  const valid = sessions.filter((s) => s != null && typeof s.endedAt === 'number');
  const recent = valid.slice(0, 10);
  const qualityAvg = recent.length
    ? Math.round(recent.reduce((a, s) => a + (s.metrics.qualityScore ?? 0), 0) / recent.length)
    : 0;
  const baseline = valid.slice(10, 25);
  const baselineAvg = baseline.length
    ? Math.round(baseline.reduce((a, s) => a + (s.metrics.qualityScore ?? 0), 0) / baseline.length)
    : qualityAvg;

  doc.setFontSize(22);
  doc.setTextColor(7, 196, 175);
  doc.text('NeuroRecover Clinician Report', CX, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`Profile: ${profileName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  let y = 48;
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text('Outcome summary', 14, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Sessions recorded: ${valid.length}`, 14, y); y += 6;
  doc.text(`Quality score (recent): ${qualityAvg}/100`, 14, y); y += 6;
  doc.text(`Quality score (baseline): ${baselineAvg}/100`, 14, y); y += 6;
  doc.text(`Delta: ${qualityAvg - baselineAvg >= 0 ? '+' : ''}${qualityAvg - baselineAvg}`, 14, y); y += 10;

  doc.setFontSize(12);
  doc.text('Recent assessments', 14, y); y += 8;
  doc.setFontSize(10);
  if (!assessments.length) {
    doc.text('No assessments recorded.', 14, y); y += 6;
  } else {
    for (const a of assessments.slice(0, 6)) {
      doc.text(`${new Date(a.createdAt).toLocaleDateString()} | FMA ${a.fmaHandEstimate}/14 | ARAT ${a.aratEstimate}/57 | MAL ${a.malAmount.toFixed(1)}/${a.malQuality.toFixed(1)}`, 14, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    }
  }

  y += 2;
  doc.setFontSize(12);
  doc.text('Risk flags', 14, y); y += 8;
  doc.setFontSize(10);
  const highPain = recent.some((s) => (s.annotations?.painLevel ?? 0) >= 6);
  const lowTracking = recent.some((s) => (s.metrics.cameraQualityScore ?? 100) < 45);
  const lowIntegrity = recent.some((s) => s.metrics.sessionIntegrity && s.metrics.sessionIntegrity !== 'ok');
  const flags = [
    highPain ? 'Elevated pain reported in recent sessions.' : 'No high pain flag in recent sessions.',
    lowTracking ? 'Low camera tracking quality detected in recent sessions.' : 'No camera tracking risk detected.',
    lowIntegrity ? 'Some sessions flagged for integrity review.' : 'Session integrity stable.',
  ];
  for (const flag of flags) {
    doc.text(`- ${flag}`, 14, y);
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('For clinical support use only. Not a standalone diagnostic instrument.', CX, 285, { align: 'center' });
  doc.save(`neurorecover-clinician-report-${profileName.replace(/\s+/g, '-').toLowerCase() || 'profile'}.pdf`);
}

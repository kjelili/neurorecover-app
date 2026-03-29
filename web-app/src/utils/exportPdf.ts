import type { SessionSummary, StoredSession } from '../types/session';

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

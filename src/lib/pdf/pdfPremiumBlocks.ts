/**
 * pdfPremiumBlocks.ts — Reusable premium layout blocks for CI-A "SoT Business Premium" PDFs
 * 
 * Shared across MOD-04 (Bewertung), MOD-06 (Exposé), MOD-11 (Finanzierung),
 * MOD-13 (Projekte), MOD-18 (Finanzanalyse).
 * 
 * @version 1.0.0
 */

import type jsPDF from 'jspdf';
import { PAGE, TYPO, COLOR, SPACING, BRAND, TONE_COLORS, type CiTone } from './pdfCiTokens';

// ─── Helpers ──────────────────────────────────────────────────────────

function setFont(doc: jsPDF, spec: { size: number; style: string }) {
  doc.setFontSize(spec.size);
  doc.setFont(TYPO.FONT_FAMILY, spec.style);
}
function setColor(doc: jsPDF, c: readonly [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }
function setFill(doc: jsPDF, c: readonly [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: readonly [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]); }

const ML = PAGE.MARGIN_LEFT;
const MR = PAGE.MARGIN_RIGHT;
const CW = PAGE.CONTENT_WIDTH;
const PW = PAGE.WIDTH;
const PH = PAGE.HEIGHT;

// ─── Premium Cover ───────────────────────────────────────────────────

export interface PremiumCoverOptions {
  /** Main document type, e.g. "KURZGUTACHTEN" */
  documentType: string;
  /** Title, e.g. "Verkehrswertermittlung" */
  title: string;
  /** Address line */
  addressLine: string;
  /** Object summary, e.g. "MFH · Baujahr 1978 · 199 m²" */
  objectSummary: string;
  /** Primary KPI label + value, e.g. "MARKTWERT" / "580.000 €" */
  primaryKpi: { label: string; value: string };
  /** Secondary KPI (optional), e.g. "BELEIHUNGSWERT" */
  secondaryKpi?: { label: string; value: string };
  /** Meta line (date, case ID, etc.) */
  metaLines: string[];
  /** StreetView or hero image as base64 */
  heroImageBase64?: string | null;
}

export function drawPremiumCover(doc: jsPDF, opts: PremiumCoverOptions): number {
  let y = 0;

  // Hero image or accent bar
  if (opts.heroImageBase64) {
    try {
      const fmt = opts.heroImageBase64.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(opts.heroImageBase64, fmt, 0, 0, PW, 82);
      // Gradient overlay for text readability
      setFill(doc, [0, 0, 0]);
      doc.setGState(new (doc as any).GState({ opacity: 0.35 }));
      doc.rect(0, 55, PW, 27, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    } catch {
      setFill(doc, COLOR.ACCENT);
      doc.rect(0, 0, PW, 4, 'F');
    }
    y = 88;
  } else {
    // Elegant accent bar
    setFill(doc, COLOR.ACCENT);
    doc.rect(0, 0, PW, 4, 'F');
    y = 32;
  }

  // Document type label
  setFont(doc, { size: 9, style: 'bold' });
  setColor(doc, COLOR.ACCENT);
  doc.text(opts.documentType, ML, y);
  y += 8;

  // Title
  setFont(doc, TYPO.H1);
  setColor(doc, COLOR.INK);
  const titleLines = doc.splitTextToSize(opts.title, CW);
  doc.text(titleLines, ML, y);
  y += titleLines.length * 8 + 4;

  // Address
  setFont(doc, { size: 11, style: 'normal' });
  setColor(doc, COLOR.MUTED);
  const addrLines = doc.splitTextToSize(opts.addressLine, CW);
  doc.text(addrLines, ML, y);
  y += addrLines.length * 5 + 3;

  // Object summary
  setFont(doc, TYPO.BODY);
  setColor(doc, COLOR.INK);
  doc.text(opts.objectSummary, ML, y);
  y += 10;

  // Accent divider
  setDraw(doc, COLOR.ACCENT);
  doc.setLineWidth(0.6);
  doc.line(ML, y, ML + 50, y);
  doc.setLineWidth(0.2);
  y += 10;

  // KPI boxes
  const boxW = opts.secondaryKpi ? (CW / 2 - 4) : CW;
  const boxH = 32;

  // Primary KPI box
  setFill(doc, TONE_COLORS.accent.bg);
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'F');
  setDraw(doc, COLOR.ACCENT);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'S');
  doc.setLineWidth(0.2);
  setFont(doc, { size: 8, style: 'bold' });
  setColor(doc, COLOR.MUTED);
  doc.text(opts.primaryKpi.label, ML + 8, y + 9);
  setFont(doc, TYPO.KPI_LARGE);
  setColor(doc, COLOR.ACCENT);
  doc.text(opts.primaryKpi.value, ML + 8, y + 22);

  // Secondary KPI box
  if (opts.secondaryKpi) {
    const bx = ML + CW / 2 + 4;
    setFill(doc, TONE_COLORS.success.bg);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'F');
    setDraw(doc, COLOR.SUCCESS);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'S');
    doc.setLineWidth(0.2);
    setFont(doc, { size: 8, style: 'bold' });
    setColor(doc, COLOR.MUTED);
    doc.text(opts.secondaryKpi.label, bx + 8, y + 9);
    setFont(doc, TYPO.KPI_LARGE);
    setColor(doc, COLOR.SUCCESS);
    doc.text(opts.secondaryKpi.value, bx + 8, y + 22);
  }
  y += boxH + 10;

  // Meta lines
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  for (const line of opts.metaLines) {
    doc.text(line, ML, y);
    y += 4;
  }

  return y;
}

// ─── Table of Contents ───────────────────────────────────────────────

export interface TocEntry {
  number: string;
  title: string;
  page: number;
}

export function drawTableOfContents(doc: jsPDF, y: number, entries: TocEntry[]): number {
  setFont(doc, TYPO.H2);
  setColor(doc, COLOR.INK);
  doc.text('INHALTSVERZEICHNIS', ML, y);
  y += 3;
  setDraw(doc, COLOR.BORDER);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  for (const entry of entries) {
    setFont(doc, { size: 10, style: 'normal' });
    setColor(doc, COLOR.INK);
    doc.text(`${entry.number}`, ML, y);
    doc.text(entry.title, ML + 12, y);

    // Dotted leader
    setColor(doc, COLOR.BORDER);
    const titleW = doc.getTextWidth(entry.title);
    const dotsStart = ML + 12 + titleW + 2;
    const dotsEnd = PW - MR - 12;
    if (dotsEnd > dotsStart) {
      const dots = '.'.repeat(Math.floor((dotsEnd - dotsStart) / 1.5));
      setFont(doc, { size: 8, style: 'normal' });
      doc.text(dots, dotsStart, y);
    }

    setFont(doc, { size: 10, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text(String(entry.page), PW - MR, y, { align: 'right' });
    y += 6;
  }

  return y + 4;
}

// ─── Premium Result Box ──────────────────────────────────────────────

export interface ResultBoxOptions {
  primary: { label: string; value: string };
  secondary?: { label: string; value: string };
  /** Confidence band text, e.g. "396.743 € – 484.908 €" */
  bandText?: string;
}

export function drawResultBox(doc: jsPDF, y: number, opts: ResultBoxOptions): number {
  const boxH = opts.bandText ? 42 : 36;

  // Full-width gradient box
  setFill(doc, [239, 246, 255]);
  doc.roundedRect(ML, y, CW, boxH, 2.5, 2.5, 'F');
  setDraw(doc, COLOR.ACCENT);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW, boxH, 2.5, 2.5, 'S');
  doc.setLineWidth(0.2);

  const halfW = opts.secondary ? CW / 2 : CW;

  // Primary
  setFont(doc, { size: 8, style: 'bold' });
  setColor(doc, COLOR.MUTED);
  doc.text(opts.primary.label, ML + 10, y + 9);
  setFont(doc, TYPO.KPI_LARGE);
  setColor(doc, COLOR.ACCENT);
  doc.text(opts.primary.value, ML + 10, y + 22);

  if (opts.bandText) {
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(`Wertband: ${opts.bandText}`, ML + 10, y + 30);
  }

  // Secondary
  if (opts.secondary) {
    const sx = ML + halfW + 10;
    setFont(doc, { size: 8, style: 'bold' });
    setColor(doc, COLOR.MUTED);
    doc.text(opts.secondary.label, sx, y + 9);
    setFont(doc, TYPO.KPI_LARGE);
    setColor(doc, COLOR.SUCCESS);
    doc.text(opts.secondary.value, sx, y + 22);

    // Vertical separator
    setDraw(doc, COLOR.BORDER);
    doc.line(ML + halfW, y + 6, ML + halfW, y + boxH - 6);
  }

  return y + boxH + 6;
}

// ─── Audit Trail Table ───────────────────────────────────────────────

export interface AuditEntry {
  date: string;
  version: string;
  change: string;
}

export function drawAuditTrail(doc: jsPDF, y: number, entries: AuditEntry[]): number {
  // Import-safe: we use inline table drawing
  setFont(doc, { size: 8, style: 'bold' });
  setColor(doc, COLOR.MUTED);
  setFill(doc, COLOR.SURFACE);
  doc.rect(ML, y - 3, CW, 6, 'F');
  doc.text('Datum', ML + 2, y);
  doc.text('Version', ML + 32, y);
  doc.text('Änderung', ML + 55, y);
  y += 6;

  setFont(doc, { size: 8, style: 'normal' });
  setColor(doc, COLOR.INK);
  for (const e of entries) {
    doc.text(e.date, ML + 2, y);
    doc.text(e.version, ML + 32, y);
    const changeLines = doc.splitTextToSize(e.change, CW - 57);
    doc.text(changeLines, ML + 55, y);
    y += changeLines.length * 4 + 1;
  }

  setDraw(doc, COLOR.BORDER);
  doc.line(ML, y, PW - MR, y);
  return y + 4;
}

// ─── Legal Disclaimer Block ──────────────────────────────────────────

export function drawLegalDisclaimer(doc: jsPDF, y: number, purpose: 'valuation' | 'expose' | 'finance' | 'report'): number {
  const texts: Record<string, string[]> = {
    valuation: [
      'Dieses Kurzgutachten dient der internen Werteinschätzung und stellt kein Verkehrswertgutachten nach §194 BauGB dar.',
      'Es ersetzt nicht die Bewertung durch einen öffentlich bestellten und vereidigten Sachverständigen.',
      'KI-gestützte Marktdaten basieren auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen.',
      'Die Weitergabe an Dritte bedarf der schriftlichen Genehmigung des Auftraggebers.',
    ],
    expose: [
      'Alle Angaben sind ohne Gewähr und basieren auf Informationen des Eigentümers.',
      'Irrtümer und Zwischenverkauf vorbehalten.',
      'Dieses Exposé begründet keinen Vertrag und kein verbindliches Angebot.',
    ],
    finance: [
      'Die dargestellten Finanzanalysen stellen keine Anlage- oder Finanzberatung dar.',
      'Vergangene Wertentwicklungen sind kein Indikator für zukünftige Ergebnisse.',
      'Die Weitergabe an Dritte bedarf der schriftlichen Genehmigung des Auftraggebers.',
    ],
    report: [
      'Die in diesem Bericht enthaltenen Informationen sind vertraulich und nur für den Adressaten bestimmt.',
      'Jegliche Vervielfältigung oder Weitergabe bedarf der ausdrücklichen Zustimmung.',
    ],
  };

  const lines = texts[purpose] || texts.report;

  setFill(doc, COLOR.SURFACE);
  const lineH = 4;
  const totalH = 8 + lines.length * (lineH + 1) + 4;
  doc.roundedRect(ML, y, CW, totalH, 1.5, 1.5, 'F');
  setDraw(doc, COLOR.BORDER);
  doc.roundedRect(ML, y, CW, totalH, 1.5, 1.5, 'S');

  y += 6;
  setFont(doc, { size: 8, style: 'bold' });
  setColor(doc, COLOR.MUTED);
  doc.text('RECHTLICHE HINWEISE', ML + 5, y);
  y += 5;

  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.INK);
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, CW - 10);
    doc.text(wrapped, ML + 5, y);
    y += wrapped.length * lineH + 1;
  }

  return y + 6;
}

// ─── Document Property Table (compact, like Kurzgutachten p.1) ──────

export interface PropertyRow {
  label: string;
  value: string;
  bold?: boolean;
}

export function drawPropertyTable(doc: jsPDF, y: number, rows: PropertyRow[], title?: string): number {
  if (title) {
    setFont(doc, { size: 9, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text(title, ML, y);
    y += 5;
  }

  const labelW = 65;

  for (let i = 0; i < rows.length; i++) {
    if (i % 2 === 0) {
      setFill(doc, COLOR.SURFACE);
      doc.rect(ML, y - 3, CW, 5, 'F');
    }
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(rows[i].label, ML + 3, y);
    setFont(doc, { size: 8, style: rows[i].bold ? 'bold' : 'normal' });
    setColor(doc, rows[i].bold ? COLOR.ACCENT : COLOR.INK);
    doc.text(rows[i].value, ML + labelW, y);
    y += 5;
  }

  setDraw(doc, COLOR.BORDER);
  doc.line(ML, y - 1, PW - MR, y - 1);
  return y + 3;
}

// ─── Section Number Badge ────────────────────────────────────────────

export function drawNumberedSection(doc: jsPDF, y: number, number: string, title: string, subtitle?: string): number {
  // Number circle
  setFill(doc, COLOR.ACCENT);
  doc.circle(ML + 4, y - 1.5, 3.5, 'F');
  setFont(doc, { size: 8, style: 'bold' });
  setColor(doc, COLOR.WHITE);
  doc.text(number, ML + 4, y, { align: 'center' });

  // Title
  setFont(doc, TYPO.H2);
  setColor(doc, COLOR.INK);
  doc.text(title.toUpperCase(), ML + 12, y);
  y += 2;

  // Line
  setDraw(doc, COLOR.BORDER);
  doc.line(ML + 12, y, PW - MR, y);
  y += 4;

  if (subtitle) {
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(subtitle, ML + 12, y);
    y += 5;
  }

  return y;
}

// ─── Confidential Watermark (light) ──────────────────────────────────

export function drawConfidentialWatermark(doc: jsPDF): void {
  setFont(doc, { size: 50, style: 'bold' });
  setColor(doc, [240, 240, 245]);
  doc.text('VERTRAULICH', PW / 2, PH / 2, {
    align: 'center',
    angle: 45,
  });
}

// ─── Safe Image Embed ────────────────────────────────────────────────

export function addImageSafe(doc: jsPDF, img: string | null, x: number, y: number, w: number, h: number): boolean {
  if (!img) return false;
  try {
    const fmt = img.includes('image/png') ? 'PNG' : 'JPEG';
    doc.addImage(img, fmt, x, y, w, h);
    setDraw(doc, [230, 232, 236]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 1, 1, 'S');
    return true;
  } catch { return false; }
}

// ─── "No Data" placeholder ──────────────────────────────────────────

export function drawNoData(doc: jsPDF, y: number, message: string): number {
  setFill(doc, COLOR.SURFACE);
  doc.roundedRect(ML, y, CW, 14, 1.5, 1.5, 'F');
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(message, ML + CW / 2, y + 8, { align: 'center' });
  return y + 18;
}

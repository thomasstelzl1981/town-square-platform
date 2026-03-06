/**
 * pdfCiKit.ts — SSOT Primitives for CI-A "SoT Business Premium" PDF Templates
 * 
 * All drawing functions receive a jsPDF `doc` instance and return the updated `y` position.
 * Pure functions — no React, no Supabase, no side effects.
 * 
 * @version 1.0.0
 */

import type jsPDF from 'jspdf';
import { PAGE, TYPO, COLOR, SPACING, BRAND, TONE_COLORS, type CiTone } from './pdfCiTokens';

// ─── Helpers ──────────────────────────────────────────────────────────

const EUR = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const DATE_DE = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

function setFont(doc: jsPDF, spec: { size: number; style: 'bold' | 'normal'; lineHeight?: number }) {
  doc.setFontSize(spec.size);
  doc.setFont(TYPO.FONT_FAMILY, spec.style);
}

function setColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function setFillColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setDrawColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

// ─── Page Break Logic ─────────────────────────────────────────────────

/** Ensure minimum space remains on current page; adds new page + header if not. Returns new y. */
export function ensurePageBreak(doc: jsPDF, y: number, minSpace: number): number {
  const maxY = PAGE.HEIGHT - PAGE.MARGIN_BOTTOM - SPACING.FOOTER_HEIGHT;
  if (y + minSpace > maxY) {
    doc.addPage();
    return PAGE.MARGIN_TOP + SPACING.HEADER_HEIGHT + 4;
  }
  return y;
}

// ─── CI Header (pages 2+) ─────────────────────────────────────────────

export interface CiHeaderOptions {
  title: string;
  subtitle?: string;
  caseId?: string;
  objectId?: string;
  date?: string;
}

/** Draw CI header bar. Typically used on page 2+ (cover is page 1). Returns y after header. */
export function drawCiHeader(doc: jsPDF, opts: CiHeaderOptions): number {
  const y = PAGE.MARGIN_TOP;
  const date = opts.date || DATE_DE();

  // Accent bar top
  setFillColor(doc, COLOR.ACCENT);
  doc.rect(0, 0, PAGE.WIDTH, SPACING.COVER_ACCENT_HEIGHT, 'F');

  // Title left
  setFont(doc, TYPO.H3);
  setColor(doc, COLOR.INK);
  doc.text(opts.title, PAGE.MARGIN_LEFT, y);

  // Subtitle below
  if (opts.subtitle) {
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(opts.subtitle, PAGE.MARGIN_LEFT, y + 4);
  }

  // Right side: date + IDs
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  const rightX = PAGE.WIDTH - PAGE.MARGIN_RIGHT;
  doc.text(date, rightX, y, { align: 'right' });
  if (opts.caseId) {
    doc.text(opts.caseId, rightX, y + 3.5, { align: 'right' });
  }

  // Divider
  setDrawColor(doc, COLOR.BORDER);
  const divY = y + (opts.subtitle ? 7 : 4);
  doc.line(PAGE.MARGIN_LEFT, divY, rightX, divY);

  return divY + 4;
}

// ─── CI Footer (every page) ──────────────────────────────────────────

export interface CiFooterOptions {
  page: number;
  totalPages: number;
  confidential?: boolean;
  org?: string;
  version?: string;
}

/** Draw CI footer. Call this for every page. */
export function drawCiFooter(doc: jsPDF, opts: CiFooterOptions): void {
  const footerY = PAGE.HEIGHT - PAGE.MARGIN_BOTTOM;

  // Divider line
  setDrawColor(doc, COLOR.BORDER);
  doc.line(PAGE.MARGIN_LEFT, footerY - 4, PAGE.WIDTH - PAGE.MARGIN_RIGHT, footerY - 4);

  setFont(doc, TYPO.CAPTION);

  // Left: Brand + confidential
  setColor(doc, COLOR.MUTED);
  const leftText = opts.confidential !== false
    ? `${BRAND.COMPANY_NAME} · ${BRAND.CONFIDENTIAL}`
    : BRAND.COMPANY_NAME;
  doc.text(leftText, PAGE.MARGIN_LEFT, footerY);

  // Center: Page number
  const pageText = `${opts.page} / ${opts.totalPages}`;
  doc.text(pageText, PAGE.WIDTH / 2, footerY, { align: 'center' });

  // Right: Org + version
  const rightParts: string[] = [];
  if (opts.org) rightParts.push(opts.org);
  if (opts.version) rightParts.push(opts.version);
  if (rightParts.length > 0) {
    doc.text(rightParts.join(' · '), PAGE.WIDTH - PAGE.MARGIN_RIGHT, footerY, { align: 'right' });
  }
}

// ─── Cover Page ──────────────────────────────────────────────────────

export interface CoverOptions {
  title: string;
  subtitle?: string;
  date?: string;
  caseId?: string;
  heroImageBase64?: string;
}

/** Draw a full cover page. Returns y after cover content. */
export function drawCover(doc: jsPDF, opts: CoverOptions): number {
  const date = opts.date || DATE_DE();

  // Top accent band
  setFillColor(doc, COLOR.ACCENT);
  doc.rect(0, 0, PAGE.WIDTH, SPACING.COVER_ACCENT_HEIGHT, 'F');

  // Brand name
  let y = 40;
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(BRAND.COMPANY_NAME.toUpperCase(), PAGE.MARGIN_LEFT, y);
  y += 12;

  // Title
  setFont(doc, TYPO.H1);
  setColor(doc, COLOR.INK);
  const titleLines = doc.splitTextToSize(opts.title, PAGE.CONTENT_WIDTH);
  doc.text(titleLines, PAGE.MARGIN_LEFT, y);
  y += titleLines.length * (TYPO.H1.size * 0.35) + 6;

  // Subtitle
  if (opts.subtitle) {
    setFont(doc, { size: 12, style: 'normal' });
    setColor(doc, COLOR.MUTED);
    const subLines = doc.splitTextToSize(opts.subtitle, PAGE.CONTENT_WIDTH);
    doc.text(subLines, PAGE.MARGIN_LEFT, y);
    y += subLines.length * 5 + 4;
  }

  // Divider
  y += 4;
  setDrawColor(doc, COLOR.ACCENT);
  doc.setLineWidth(0.5);
  doc.line(PAGE.MARGIN_LEFT, y, PAGE.MARGIN_LEFT + 40, y);
  doc.setLineWidth(0.2);
  y += 8;

  // Date + Case-ID
  setFont(doc, TYPO.BODY);
  setColor(doc, COLOR.MUTED);
  doc.text(`Erstellt: ${date}`, PAGE.MARGIN_LEFT, y);
  if (opts.caseId) {
    doc.text(opts.caseId, PAGE.WIDTH - PAGE.MARGIN_RIGHT, y, { align: 'right' });
  }
  y += 8;

  // Hero image (if provided)
  if (opts.heroImageBase64) {
    const imgW = PAGE.CONTENT_WIDTH;
    const imgH = 80;
    y = ensurePageBreak(doc, y, imgH + 10);
    try {
      doc.addImage(opts.heroImageBase64, 'JPEG', PAGE.MARGIN_LEFT, y, imgW, imgH);
      y += imgH + 6;
    } catch {
      // Skip if image fails
    }
  }

  return y;
}

// ─── Section Title ───────────────────────────────────────────────────

export function drawSectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string): number {
  y = ensurePageBreak(doc, y, 16);
  y += SPACING.SECTION_GAP;

  setFont(doc, TYPO.H2);
  setColor(doc, COLOR.INK);
  doc.text(title.toUpperCase(), PAGE.MARGIN_LEFT, y);
  y += 2;

  // Divider under title
  setDrawColor(doc, COLOR.BORDER);
  doc.line(PAGE.MARGIN_LEFT, y, PAGE.WIDTH - PAGE.MARGIN_RIGHT, y);
  y += 4;

  if (subtitle) {
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(subtitle, PAGE.MARGIN_LEFT, y);
    y += 5;
  }

  return y;
}

// ─── KPI Row ─────────────────────────────────────────────────────────

export interface KpiItem {
  label: string;
  value: string;
  tone?: CiTone;
}

/** Draw 3-4 KPI cards in a row. Returns y after cards. */
export function drawKpiRow(doc: jsPDF, y: number, kpis: KpiItem[]): number {
  y = ensurePageBreak(doc, y, SPACING.KPI_CARD_HEIGHT + 6);

  const count = Math.min(kpis.length, 4);
  const totalGap = (count - 1) * SPACING.KPI_CARD_GAP;
  const cardW = (PAGE.CONTENT_WIDTH - totalGap) / count;

  for (let i = 0; i < count; i++) {
    const kpi = kpis[i];
    const x = PAGE.MARGIN_LEFT + i * (cardW + SPACING.KPI_CARD_GAP);
    const tone = TONE_COLORS[kpi.tone || 'default'];

    // Card background
    setFillColor(doc, tone.bg);
    doc.roundedRect(x, y, cardW, SPACING.KPI_CARD_HEIGHT, 1.5, 1.5, 'F');

    // Value
    setFont(doc, TYPO.KPI_MEDIUM);
    setColor(doc, tone.text);
    const valueText = doc.splitTextToSize(kpi.value, cardW - 6);
    doc.text(valueText[0], x + cardW / 2, y + 10, { align: 'center' });

    // Label
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text(kpi.label, x + cardW / 2, y + 17, { align: 'center' });
  }

  return y + SPACING.KPI_CARD_HEIGHT + 4;
}

// ─── Table ───────────────────────────────────────────────────────────

export interface TableSpec {
  headers: string[];
  rows: string[][];
  colWidths?: number[];
  alignRight?: number[]; // column indices to right-align
  stripeRows?: boolean;
}

/** Draw a data table with header fill and optional row stripes. Auto page-breaks. Returns y. */
export function drawTable(doc: jsPDF, y: number, spec: TableSpec): number {
  const { headers, rows, stripeRows = true, alignRight = [] } = spec;
  const colCount = headers.length;

  // Calculate column widths
  const colWidths = spec.colWidths || Array(colCount).fill(PAGE.CONTENT_WIDTH / colCount);

  // Header
  y = ensurePageBreak(doc, y, SPACING.TABLE_HEADER_HEIGHT + SPACING.TABLE_ROW_HEIGHT * 2);
  setFillColor(doc, COLOR.SURFACE);
  doc.rect(PAGE.MARGIN_LEFT, y - 3, PAGE.CONTENT_WIDTH, SPACING.TABLE_HEADER_HEIGHT, 'F');

  setFont(doc, TYPO.TABLE_HEADER);
  setColor(doc, COLOR.MUTED);

  let xOffset = PAGE.MARGIN_LEFT;
  for (let i = 0; i < colCount; i++) {
    const align = alignRight.includes(i) ? 'right' : 'left';
    const textX = align === 'right' ? xOffset + colWidths[i] - 2 : xOffset + 2;
    doc.text(headers[i], textX, y, { align });
    xOffset += colWidths[i];
  }
  y += SPACING.TABLE_HEADER_HEIGHT;

  // Rows
  setFont(doc, TYPO.TABLE_BODY);
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    y = ensurePageBreak(doc, y, SPACING.TABLE_ROW_HEIGHT + 2);

    // Stripe
    if (stripeRows && rowIdx % 2 === 1) {
      setFillColor(doc, [252, 252, 253]);
      doc.rect(PAGE.MARGIN_LEFT, y - 3, PAGE.CONTENT_WIDTH, SPACING.TABLE_ROW_HEIGHT, 'F');
    }

    setColor(doc, COLOR.INK);
    xOffset = PAGE.MARGIN_LEFT;
    for (let i = 0; i < colCount; i++) {
      const cellText = rows[rowIdx][i] || '';
      const maxW = colWidths[i] - 4;
      const truncated = doc.splitTextToSize(cellText, maxW)[0] || '';
      const align = alignRight.includes(i) ? 'right' : 'left';
      const textX = align === 'right' ? xOffset + colWidths[i] - 2 : xOffset + 2;
      doc.text(truncated, textX, y, { align });
      xOffset += colWidths[i];
    }
    y += SPACING.TABLE_ROW_HEIGHT;
  }

  // Bottom border
  setDrawColor(doc, COLOR.BORDER);
  doc.line(PAGE.MARGIN_LEFT, y - 2, PAGE.WIDTH - PAGE.MARGIN_RIGHT, y - 2);

  return y + 2;
}

// ─── Info Card ───────────────────────────────────────────────────────

export function drawInfoCard(doc: jsPDF, y: number, title: string, lines: string[]): number {
  const lineHeight = 4;
  const totalHeight = 8 + lines.length * lineHeight + 4;
  y = ensurePageBreak(doc, y, totalHeight);

  // Border
  setDrawColor(doc, COLOR.BORDER);
  setFillColor(doc, COLOR.SURFACE);
  doc.roundedRect(PAGE.MARGIN_LEFT, y, PAGE.CONTENT_WIDTH, totalHeight, 1.5, 1.5, 'FD');

  // Title
  y += 5;
  setFont(doc, TYPO.TABLE_HEADER);
  setColor(doc, COLOR.MUTED);
  doc.text(title, PAGE.MARGIN_LEFT + 4, y);
  y += 5;

  // Lines
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.INK);
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, PAGE.CONTENT_WIDTH - 8);
    doc.text(wrapped, PAGE.MARGIN_LEFT + 4, y);
    y += wrapped.length * lineHeight;
  }

  return y + 4;
}

// ─── List ────────────────────────────────────────────────────────────

export function drawList(doc: jsPDF, y: number, items: string[], numbered = false): number {
  setFont(doc, TYPO.BODY);
  setColor(doc, COLOR.INK);

  for (let i = 0; i < items.length; i++) {
    y = ensurePageBreak(doc, y, 6);
    const prefix = numbered ? `${i + 1}. ` : '• ';
    const text = doc.splitTextToSize(`${prefix}${items[i]}`, PAGE.CONTENT_WIDTH - 8);
    doc.text(text, PAGE.MARGIN_LEFT + 4, y);
    y += text.length * 4 + 2;
  }

  return y;
}

// ─── Divider ─────────────────────────────────────────────────────────

export function drawDivider(doc: jsPDF, y: number): number {
  y += SPACING.DIVIDER_GAP;
  setDrawColor(doc, COLOR.BORDER);
  doc.line(PAGE.MARGIN_LEFT, y, PAGE.WIDTH - PAGE.MARGIN_RIGHT, y);
  return y + SPACING.DIVIDER_GAP;
}

// ─── Badge ───────────────────────────────────────────────────────────

export function drawBadge(doc: jsPDF, x: number, y: number, label: string, tone: CiTone = 'default'): number {
  const colors = TONE_COLORS[tone];
  const textW = doc.getTextWidth(label) + 4;

  setFillColor(doc, colors.bg);
  doc.roundedRect(x, y - 2.5, textW + 4, 4, 1, 1, 'F');

  setFont(doc, { size: 6.5, style: 'bold' });
  setColor(doc, colors.text);
  doc.text(label, x + 2, y);

  return x + textW + 6;
}

// ─── Body Text ───────────────────────────────────────────────────────

export function drawBodyText(doc: jsPDF, y: number, text: string): number {
  y = ensurePageBreak(doc, y, 10);
  setFont(doc, TYPO.BODY);
  setColor(doc, COLOR.INK);
  const lines = doc.splitTextToSize(text, PAGE.CONTENT_WIDTH);
  doc.text(lines, PAGE.MARGIN_LEFT, y);
  return y + lines.length * (TYPO.BODY.size * 0.35) + SPACING.PARAGRAPH_GAP;
}

// ─── Utility: Add footers to all pages ───────────────────────────────

export function addFootersToAllPages(doc: jsPDF, opts: Omit<CiFooterOptions, 'page' | 'totalPages'>): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCiFooter(doc, { ...opts, page: i, totalPages });
  }
}

// ─── Utility: Add headers to pages 2+ ───────────────────────────────

export function addHeadersToPages(doc: jsPDF, opts: CiHeaderOptions, startPage = 2): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = startPage; i <= totalPages; i++) {
    doc.setPage(i);
    drawCiHeader(doc, opts);
  }
}

// ─── Currency / Formatting ──────────────────────────────────────────

export { EUR, DATE_DE };

export const PCT = (v: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';

export const NUM = (v: number) =>
  v.toLocaleString('de-DE', { maximumFractionDigits: 0 });

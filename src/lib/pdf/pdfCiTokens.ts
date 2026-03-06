/**
 * pdfCiTokens.ts — SSOT Design Tokens for CI-A "SoT Business Premium" PDF Templates
 * 
 * All jsPDF-based Report/Dossier PDFs (Typ B/C) MUST use these tokens.
 * CI-B (DIN 5008 Brief) and CI-C (Juristisch) are intentionally separate.
 * 
 * @version 1.0.0
 */

// ─── Page Setup (A4) ──────────────────────────────────────────────────
export const PAGE = {
  WIDTH: 210,
  HEIGHT: 297,
  MARGIN_TOP: 18,
  MARGIN_RIGHT: 16,
  MARGIN_BOTTOM: 16,
  MARGIN_LEFT: 18,
  get CONTENT_WIDTH() { return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT; },
  get CONTENT_HEIGHT() { return this.HEIGHT - this.MARGIN_TOP - this.MARGIN_BOTTOM; },
} as const;

// ─── 8px Baseline Grid ────────────────────────────────────────────────
export const GRID = {
  BASE: 2.82, // 8px ≈ 2.82mm at 72dpi
  HALF: 1.41,
  DOUBLE: 5.64,
  TRIPLE: 8.46,
} as const;

// ─── Typography ───────────────────────────────────────────────────────
// Using Helvetica (jsPDF native) — no TTF embedding needed
export const TYPO = {
  FONT_FAMILY: 'helvetica',
  H1: { size: 22, style: 'bold' as const, lineHeight: 1.15 },
  H2: { size: 14, style: 'bold' as const, lineHeight: 1.25 },
  H3: { size: 11, style: 'bold' as const, lineHeight: 1.25 },
  BODY: { size: 10, style: 'normal' as const, lineHeight: 1.45 },
  CAPTION: { size: 8, style: 'normal' as const, lineHeight: 1.3 },
  KPI_LARGE: { size: 26, style: 'bold' as const, lineHeight: 1.1 },
  KPI_MEDIUM: { size: 18, style: 'bold' as const, lineHeight: 1.15 },
  TABLE_HEADER: { size: 8, style: 'bold' as const, lineHeight: 1.3 },
  TABLE_BODY: { size: 8, style: 'normal' as const, lineHeight: 1.3 },
} as const;

// ─── Colors (RGB tuples for jsPDF) ────────────────────────────────────
export const COLOR = {
  INK:       [11, 18, 32] as const,    // #0B1220
  MUTED:     [85, 96, 112] as const,   // #556070
  BORDER:    [230, 232, 236] as const, // #E6E8EC
  SURFACE:   [247, 248, 250] as const, // #F7F8FA
  WHITE:     [255, 255, 255] as const, // #FFFFFF
  ACCENT:    [30, 64, 175] as const,   // #1E40AF
  SUCCESS:   [15, 118, 110] as const,  // #0F766E
  WARNING:   [180, 83, 9] as const,    // #B45309
  DANGER:    [185, 28, 28] as const,   // #B91C1C
} as const;

// ─── Spacing (mm) ─────────────────────────────────────────────────────
export const SPACING = {
  SECTION_GAP: 12,
  PARAGRAPH_GAP: 4,
  ROW_GAP: 1.5,
  TABLE_ROW_HEIGHT: 5,
  TABLE_HEADER_HEIGHT: 6,
  DIVIDER_GAP: 3,
  KPI_CARD_HEIGHT: 22,
  KPI_CARD_GAP: 4,
  COVER_ACCENT_HEIGHT: 3,
  HEADER_HEIGHT: 14,
  FOOTER_HEIGHT: 10,
} as const;

// ─── Branding ─────────────────────────────────────────────────────────
export const BRAND = {
  COMPANY_NAME: 'System of a Town',
  CONFIDENTIAL: 'Vertraulich',
  COPYRIGHT: () => `© ${new Date().getFullYear()} System of a Town`,
} as const;

// ─── Tone map for badges/KPI ──────────────────────────────────────────
export type CiTone = 'default' | 'success' | 'warning' | 'danger' | 'accent';

export const TONE_COLORS: Record<CiTone, { bg: readonly [number, number, number]; text: readonly [number, number, number] }> = {
  default: { bg: COLOR.SURFACE, text: COLOR.MUTED },
  success: { bg: [236, 253, 245], text: COLOR.SUCCESS },
  warning: { bg: [255, 251, 235], text: COLOR.WARNING },
  danger:  { bg: [254, 242, 242], text: COLOR.DANGER },
  accent:  { bg: [239, 246, 255], text: COLOR.ACCENT },
};

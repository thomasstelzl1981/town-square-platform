/**
 * Design Manifest V3.0 — Single Source of Truth für das gesamte Layout-System
 * 
 * REGELN:
 * 1. Jeder Grid-Container MUSS `WidgetGrid` verwenden — keine ad-hoc grid-Klassen
 * 2. Jede Widget-Zelle MUSS die hier definierten Dimensionen einhalten
 * 3. Maximal 4 Spalten auf Desktop — KEINE Ausnahme
 * 4. Widgets sind auf Desktop IMMER quadratisch (aspect-square)
 * 5. Mobile nutzt einheitliche Höhe statt aspect-square
 * 6. Container-Breite ist IMMER max-w-7xl (außer Split-View → max-w-full)
 * 
 * VERWENDUNG:
 * ```tsx
 * import { DESIGN } from '@/config/designManifest';
 * // Dann: className={DESIGN.WIDGET_GRID.CLASSES}
 * ```
 */

// ─── CONTAINER ────────────────────────────────────────────
export const CONTAINER = {
  /** Standard-Breite für alle Module */
  MAX_WIDTH: 'max-w-7xl',
  /** Split-View Breite (bei aktivem Split-Modus) */
  FULL_WIDTH: 'max-w-full',
  /** Mobile Padding */
  PADDING_MOBILE: 'px-2 py-3',
  /** Desktop Padding */
  PADDING_DESKTOP: 'md:p-6',
  /** Kombiniertes Padding */
  PADDING: 'px-2 py-3 md:p-6',
  /** Spacing zwischen Sektionen */
  SPACING: 'space-y-4 md:space-y-6',
} as const;

// ─── WIDGET GRID (Dashboard + Module-Kacheln) ─────────────
export const WIDGET_GRID = {
  /** Max 4 Spalten: 1 → 2 → 4 */
  COLS: 4,
  CLASSES: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  GAP: 'gap-4 md:gap-6',
  /** Kombinierte Grid-Klassen */
  FULL: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
} as const;

// ─── WIDGET CELL (Einzelne Zelle) ─────────────────────────
export const WIDGET_CELL = {
  /** Desktop: quadratisch */
  ASPECT_DESKTOP: 'md:aspect-square',
  /** Mobile: feste Höhe */
  HEIGHT_MOBILE: 'h-[260px]',
  /** Kombiniert: Mobile Höhe + Desktop Square */
  DIMENSIONS: 'h-[260px] md:h-auto md:aspect-square',
  /** Für doppelt-breite Widgets (span-2) */
  SPAN_2: 'md:col-span-2',
} as const;

// ─── KPI GRID (Kompakte Kennzahlen-Zeilen) ────────────────
export const KPI_GRID = {
  CLASSES: 'grid grid-cols-2 md:grid-cols-4',
  GAP: 'gap-3 md:gap-4',
  FULL: 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4',
} as const;

// ─── FORM GRID (Formulare & Detail-Ansichten) ─────────────
export const FORM_GRID = {
  CLASSES: 'grid grid-cols-1 md:grid-cols-2',
  GAP: 'gap-4 md:gap-6',
  FULL: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
} as const;

// ─── HEADER HIERARCHIE ────────────────────────────────────
export const HEADER = {
  /** Seiten-Titel (ModulePageHeader) */
  PAGE_TITLE: 'text-xl md:text-2xl font-bold tracking-tight uppercase',
  /** Widget-Header Titel */
  WIDGET_TITLE: 'text-sm font-semibold',
  /** Widget Icon-Box */
  WIDGET_ICON_BOX: 'h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0',
  /** Section-Header innerhalb von Widgets/Cards */
  SECTION_TITLE: 'text-sm font-semibold',
  /** Beschreibungstext */
  DESCRIPTION: 'text-muted-foreground mt-1 text-sm',
} as const;

// ─── CARD STANDARD ────────────────────────────────────────
export const CARD = {
  /** Basis-Klasse für alle Widget-Cards */
  BASE: 'glass-card overflow-hidden rounded-xl',
  /** Hover-Effekt */
  INTERACTIVE: 'cursor-pointer transition-all hover:shadow-lg',
  /** Border-Farbe Standard */
  BORDER: 'border-primary/20',
} as const;

// ─── EXPORT ALS EINHEITLICHES OBJEKT ──────────────────────
export const DESIGN = {
  CONTAINER,
  WIDGET_GRID,
  WIDGET_CELL,
  KPI_GRID,
  FORM_GRID,
  HEADER,
  CARD,
} as const;

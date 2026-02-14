/**
 * Design Manifest V4.0 — Single Source of Truth für das gesamte Layout-System
 * 
 * REGELN:
 * 1. Jeder Grid-Container MUSS `WidgetGrid` verwenden — keine ad-hoc grid-Klassen
 * 2. Jede Widget-Zelle MUSS die hier definierten Dimensionen einhalten
 * 3. Maximal 4 Spalten auf Desktop — KEINE Ausnahme
 * 4. Widgets sind auf Desktop IMMER quadratisch (aspect-square)
 * 5. Mobile nutzt einheitliche Höhe statt aspect-square
 * 6. Container-Breite ist IMMER max-w-7xl (außer Split-View → max-w-full)
 * 7. Keine ad-hoc Tailwind-Klassen für Layout/Typografie — ALLES aus dem Manifest
 * 8. Tabellen, Karten, Banner und Formulare nutzen die hier definierten Standards
 */

// ─── CONTAINER ────────────────────────────────────────────
export const CONTAINER = {
  MAX_WIDTH: 'max-w-7xl',
  FULL_WIDTH: 'max-w-full',
  PADDING_MOBILE: 'px-2 py-3',
  PADDING_DESKTOP: 'md:p-6',
  PADDING: 'px-2 py-3 md:p-6',
  SPACING: 'space-y-4 md:space-y-6',
} as const;

// ─── WIDGET GRID (Dashboard + Module-Kacheln) ─────────────
export const WIDGET_GRID = {
  COLS: 4,
  CLASSES: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  GAP: 'gap-4 md:gap-6',
  FULL: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
} as const;

// ─── WIDGET CELL (Einzelne Zelle) ─────────────────────────
export const WIDGET_CELL = {
  ASPECT_DESKTOP: 'md:aspect-square',
  HEIGHT_MOBILE: 'h-[260px]',
  DIMENSIONS: 'h-[260px] md:h-auto md:aspect-square',
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
  PAGE_TITLE: 'text-2xl md:text-3xl font-bold tracking-tight uppercase',
  WIDGET_TITLE: 'text-base font-semibold',
  WIDGET_ICON_BOX: 'h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0',
  SECTION_TITLE: 'text-base font-semibold',
} as const;

// ─── CARD (erweitert V4.0) ────────────────────────────────
export const CARD = {
  /** Basis-Klasse für alle Widget-Cards */
  BASE: 'glass-card overflow-hidden rounded-xl',
  /** KPI-Zahlenkarten (via KPICard-Komponente) */
  KPI: 'glass-card',
  /** Große Content-Kacheln (Vermietereinheit, Bewertung, Sanierung) */
  CONTENT: 'glass-card p-6 rounded-xl',
  /** Full-width Sektionskarten (Premium-Status, Automatisierung) */
  SECTION: 'glass-card p-4 rounded-xl',
  /** Einheitlicher Card-Header-Bereich */
  SECTION_HEADER: 'px-4 py-2.5 border-b border-border/30 bg-muted/20',
  /** Hover-Effekt */
  INTERACTIVE: 'cursor-pointer transition-all hover:shadow-lg',
  /** Border-Farbe Standard */
  BORDER: 'border-primary/20',
} as const;

// ─── TABLE (NEU V4.0) ─────────────────────────────────────
export const TABLE = {
  /** Äußerer Rahmen für alle Datentabellen */
  WRAPPER: 'glass-card rounded-xl overflow-hidden',
  /** Header-Zelle */
  HEADER_CELL: 'text-sm font-medium text-muted-foreground uppercase tracking-wide px-4 py-3',
  /** Body-Zelle */
  BODY_CELL: 'px-4 py-3 text-sm',
  /** Zeilen-Hover */
  ROW_HOVER: 'hover:bg-muted/30 transition-colors',
  /** Zeilen-Trenner */
  ROW_BORDER: 'border-b border-border/30',
  /** Header-Hintergrund */
  HEADER_BG: 'bg-muted/30',
} as const;

// ─── TABULAR_FORM (NEU V4.0) ──────────────────────────────
/** Bank-Stil: 3-Spalten-Tabelle (Label | AS1 | AS2) — Gold-Standard aus Selbstauskunft */
export const TABULAR_FORM = {
  /** Label-Spalte (links) */
  LABEL_CELL: 'w-[180px] border-r border-border/30 py-1.5 px-3 text-sm text-muted-foreground font-medium whitespace-nowrap',
  /** Wert-Zelle */
  VALUE_CELL: 'py-1.5 px-3 border-r border-border/30',
  /** Kompakter Inline-Input */
  INPUT: 'h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1',
  /** Section-Header-Zeile */
  SECTION_ROW: 'bg-muted/40 text-sm font-semibold uppercase tracking-wide py-1.5 px-3',
  /** Tabellen-Rahmen */
  TABLE_BORDER: 'border border-border/30 rounded-lg overflow-hidden',
  /** Zeilen-Trenner */
  ROW_BORDER: 'border-b border-border/30',
} as const;

// ─── STORAGE (NEU V4.0) ───────────────────────────────────
/** Spaltenansicht mit sichtbarem Gitter — Gold-Standard aus ColumnView */
export const STORAGE = {
  /** Standard-Ansicht ist immer Spalten */
  DEFAULT_VIEW: 'columns' as const,
  /** Spaltenbreite für Drag-and-Drop */
  COLUMN_WIDTH: 'w-[260px] min-w-[260px]',
  /** Zeilenhöhe für greifbare Drag-Targets */
  ROW_PADDING: 'px-3 py-2.5',
  /** Sichtbares Gitter — Spalten-Trenner */
  COLUMN_BORDER: 'border-r border-border/60 dark:border-border/50',
  /** Zeilen-Trenner */
  ROW_BORDER: 'border-b border-border/20 dark:border-border/30',
  /** Äußerer Rahmen */
  CONTAINER: 'glass-card rounded-xl overflow-hidden',
  /** Mindesthöhe für Drop-Zonen */
  MIN_HEIGHT: 'min-h-[400px]',
} as const;

// ─── INFO_BANNER (NEU V4.0) ──────────────────────────────
export const INFO_BANNER = {
  /** Basis für alle Banner */
  BASE: 'rounded-xl border p-4',
  /** Hinweis-Banner (neutral) */
  HINT: 'bg-muted/20 border-dashed border-muted-foreground/20',
  /** Premium-/Feature-Banner */
  PREMIUM: 'bg-primary/5 border-primary/20',
  /** Warn-Banner */
  WARNING: 'bg-destructive/5 border-destructive/20',
  /** Erfolg-Banner */
  SUCCESS: 'bg-emerald-500/5 border-emerald-500/20',
} as const;

// ─── TYPOGRAPHY (NEU V4.0) ────────────────────────────────
export const TYPOGRAPHY = {
  /** Seiten-Titel (ModulePageHeader) */
  PAGE_TITLE: 'text-2xl md:text-3xl font-bold tracking-tight uppercase',
  /** Sektions-Titel (PREMIUM-STATUS, AUTOMATISIERUNG) */
  SECTION_TITLE: 'text-base font-semibold uppercase tracking-wide',
  /** Widget-/Card-Titel */
  CARD_TITLE: 'text-base font-semibold',
  /** KPI-Labels, Formular-Labels */
  LABEL: 'text-sm text-muted-foreground',
  /** KPI-Werte */
  VALUE: 'text-2xl font-bold',
  /** Standardtext */
  BODY: 'text-base',
  /** Gedämpfter Standardtext */
  MUTED: 'text-sm text-muted-foreground',
  /** Hinweistexte (alias für MUTED) */
  HINT: 'text-sm text-muted-foreground',
} as const;

// ─── LIST (NEU V4.0) ──────────────────────────────────────
export const LIST = {
  /** Standard-Listenzeile */
  ROW: 'flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30',
  /** Hover-Effekt für klickbare Zeilen */
  ROW_HOVER: 'hover:border-primary/20 transition-colors cursor-pointer',
  /** Zeilen-Trenner (flat list ohne Cards) */
  DIVIDER: 'border-b border-border/30',
  /** Abstand zwischen Listenzeilen */
  GAP: 'space-y-2',
} as const;

// ─── SPACING (NEU V4.0) ──────────────────────────────────
export const SPACING = {
  /** Zwischen Sektionen */
  SECTION: 'space-y-4 md:space-y-6',
  /** Innerhalb von Cards */
  CARD: 'space-y-3',
  /** Innerhalb von Listen */
  COMPACT: 'space-y-2',
  /** Zwischen KPI-Grid und nächster Sektion */
  AFTER_KPI: 'mt-4 md:mt-6',
} as const;

// ─── MOBILE (NEU V4.1) ───────────────────────────────────
/** Mobile-spezifische Standards für Instagram-Style Feed */
export const MOBILE = {
  /** Scroll-Snap Container (nur Dashboard) */
  SNAP_CONTAINER: 'snap-y snap-mandatory',
  /** Scroll-Snap Item */
  SNAP_ITEM: 'snap-start snap-always',
  /** Card-Stack Fallback für Tabellen */
  CARD_STACK: 'space-y-3',
  /** Einzelne Card im Stack */
  CARD_ITEM: 'glass-card rounded-xl p-4 space-y-2',
  /** Label:Value Paar in Card */
  CARD_LABEL: 'text-sm text-muted-foreground',
  CARD_VALUE: 'text-sm font-medium',
} as const;

// ─── DASHBOARD HEADER (NEU V4.2) ──────────────────────────
/** Standard für Manager-Dashboards: Visitenkarte + Kontext-Widget nebeneinander */
export const DASHBOARD_HEADER = {
  /** 2-Spalten-Grid für Visitenkarte + Ticker/KPI */
  GRID: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  /** Beide Kacheln identische Mindesthöhe */
  CARD_HEIGHT: 'min-h-[280px]',
  /** Gradient-Streifen oben */
  GRADIENT_BAR: 'h-2',
  /** Exakt 4 Zeilen im Ticker/KPI-Widget */
  TICKER_ROWS: 4,
} as const;

// ─── DEMO WIDGET (NEU V4.3) ───────────────────────────────
/** Glasig-grünes Styling für alle Demo-Widgets zur visuellen Unterscheidung */
export const DEMO_WIDGET = {
  /** Card-Klassen für Demo-Widgets */
  CARD: 'bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-emerald-300/60 before:via-emerald-400/40 before:to-emerald-300/60 before:rounded-t-xl',
  /** Hover-Effekt für Demo-Widgets */
  HOVER: 'hover:border-emerald-300/80 dark:hover:border-emerald-700/60',
  /** Badge-Klassen für Demo-Label */
  BADGE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40',
} as const;

// ─── RECORD CARD (NEU V4.4) ──────────────────────────────
/** Universelle Akten-Komponente: Geschlossen = quadratisch, Offen = volle Breite */
export const RECORD_CARD = {
  /** 2-Spalten-Grid für halbe Breite pro Card */
  GRID: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
  /** Geschlossene Card: QUADRATISCH wie alle Widgets */
  CLOSED: 'glass-card rounded-xl cursor-pointer transition-all hover:shadow-lg h-[260px] md:h-auto md:aspect-square overflow-hidden',
  /** Geöffnete Akte: volle Breite, keine feste Höhe */
  OPEN: 'glass-card rounded-xl p-6 md:col-span-2',
  /** Thumbnail im Closed State */
  THUMBNAIL: 'h-14 w-14 rounded-full object-cover shrink-0',
  THUMBNAIL_FALLBACK: 'h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center',
  /** Galerie im Open State */
  GALLERY: 'grid grid-cols-4 gap-2',
  GALLERY_IMG: 'aspect-square rounded-lg object-cover cursor-pointer hover:ring-2 ring-primary/40',
  /** Sektions-Header */
  SECTION_TITLE: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/30 pb-1 mb-3',
  /** Felder-Grid */
  FIELD_GRID: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3',
  /** Datenraum-Sektion */
  DATAROOM: 'border border-dashed border-border/50 rounded-lg p-4 min-h-[80px]',
  /** Actions */
  ACTIONS: 'flex gap-2 pt-4 border-t border-border/30 mt-4 justify-end',
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
  TABLE,
  TABULAR_FORM,
  STORAGE,
  INFO_BANNER,
  TYPOGRAPHY,
  LIST,
  SPACING,
  MOBILE,
  DASHBOARD_HEADER,
  DEMO_WIDGET,
  RECORD_CARD,
} as const;

/**
 * PDF Template Registry — SSOT for all Typ-B/C PDF templates in Zone 2
 * 
 * Every report/dossier template MUST be registered here.
 * Use `getTemplate(key)` to resolve a template at runtime.
 * 
 * @version 1.0.0
 */

export type PdfTemplateType = 'B' | 'C';

export interface PdfTemplateEntry {
  /** Unique key, e.g. 'FIN_REPORT_V1' */
  key: string;
  /** Human-readable label */
  label: string;
  /** Module identifier, e.g. 'MOD-18' */
  module: string;
  /** B = Report, C = Dossier */
  type: PdfTemplateType;
  /** Max page count before Appendix Light + QR */
  pageLimit: number;
  /** Required scopes for access (role/consent gate) */
  requiredScopes?: string[];
  /** Simple heuristic to estimate pages from data count */
  estimatePages?: (dataCount: number) => number;
  /** Status of template implementation */
  status: 'active' | 'planned' | 'skeleton';
}

// ─── Registry ────────────────────────────────────────────────────────

const TEMPLATES: PdfTemplateEntry[] = [
  {
    key: 'FIN_REPORT_V1',
    label: 'Finanzreport / Vermögensauskunft',
    module: 'MOD-18',
    type: 'B',
    pageLimit: 10,
    requiredScopes: ['finance:read', 'consent:finance_report'],
    estimatePages: (n) => Math.min(Math.ceil(n / 8) + 3, 10),
    status: 'active',
  },
  {
    key: 'SALES_EXPOSE_V1',
    label: 'Verkaufsexposé',
    module: 'MOD-06',
    type: 'B',
    pageLimit: 6,
    requiredScopes: ['property:read'],
    estimatePages: (n) => Math.min(4 + Math.ceil(n / 4), 6),
    status: 'active',
  },
  {
    key: 'PORTFOLIO_DOSSIER_V1',
    label: 'Portfolio-Report',
    module: 'MOD-04',
    type: 'C',
    pageLimit: 10,
    requiredScopes: ['property:read'],
    estimatePages: (n) => Math.min(3 + Math.ceil(n / 3), 10),
    status: 'active',
  },
  {
    key: 'VALUATION_REPORT_V1',
    label: 'Bewertungsgutachten',
    module: 'MOD-04',
    type: 'B',
    pageLimit: 12,
    requiredScopes: ['property:read', 'valuation:read'],
    status: 'active', // Already implemented in ValuationPdfGenerator.ts
  },
  {
    key: 'NK_SETTLEMENT_V1',
    label: 'Nebenkostenabrechnung',
    module: 'MOD-04',
    type: 'B',
    pageLimit: 4,
    status: 'active', // Already implemented in nkAbrechnung/pdfExport.ts
  },
  {
    key: 'PROJECT_REPORT_V1',
    label: 'Projektvertriebsreport',
    module: 'MOD-13',
    type: 'B',
    pageLimit: 4,
    status: 'active', // Already implemented in generateProjectReportPdf.ts
  },
  {
    key: 'ACQ_PROFILE_V1',
    label: 'Ankaufsprofil',
    module: 'MOD-12',
    type: 'B',
    pageLimit: 2,
    status: 'active', // Already implemented in acqPdfExport.ts
  },
  {
    key: 'LOGBOOK_V1',
    label: 'Fahrtenbuch',
    module: 'MOD-17',
    type: 'B',
    pageLimit: 6,
    status: 'active', // Already implemented in LogbookExport.tsx
  },
  // ─── Planned ────────────────────────────────────────────────────
  {
    key: 'INVEST_SIM_V1',
    label: 'Investment-Simulation',
    module: 'MOD-08',
    type: 'B',
    pageLimit: 6,
    status: 'planned',
  },
  {
    key: 'FINANCE_PACKAGE_V1',
    label: 'Finanzierungspaket / Selbstauskunft',
    module: 'MOD-07',
    type: 'B',
    pageLimit: 10,
    status: 'planned',
  },
];

// ─── API ─────────────────────────────────────────────────────────────

export function getTemplate(key: string): PdfTemplateEntry | undefined {
  return TEMPLATES.find(t => t.key === key);
}

export function getTemplatesByModule(module: string): PdfTemplateEntry[] {
  return TEMPLATES.filter(t => t.module === module);
}

export function getActiveTemplates(): PdfTemplateEntry[] {
  return TEMPLATES.filter(t => t.status === 'active');
}

export function getAllTemplates(): PdfTemplateEntry[] {
  return [...TEMPLATES];
}

/**
 * ARMSTRONG KB TAXONOMY — Phase 6.3
 * 
 * Single Source of Truth for Knowledge Base categories and content types.
 * Used by both Zone 1 UI and Armstrong context injection.
 */

import type { KBCategory, KBContentType, KBConfidence } from '@/types/armstrong';

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

export interface CategoryDefinition {
  code: KBCategory;
  label_de: string;
  description_de: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  subcategories: string[];
  requires_disclaimer: boolean;
}

export const KB_CATEGORIES: Record<KBCategory, CategoryDefinition> = {
  system: {
    code: 'system',
    label_de: 'System',
    description_de: 'SOT-spezifisches Wissen: Module, Golden Path, SSOT, Rollen',
    icon: 'Settings',
    color: 'bg-slate-500',
    subcategories: ['modules', 'workflows', 'roles', 'architecture', 'api'],
    requires_disclaimer: false,
  },
  real_estate: {
    code: 'real_estate',
    label_de: 'Immobilien',
    description_de: 'Fachwissen zu deutschen Immobilienthemen',
    icon: 'Building2',
    color: 'bg-blue-500',
    subcategories: [
      'kauf_verkauf',
      'notar_grundbuch',
      'weg_verwaltung',
      'mietrecht',
      'bewertung',
      'nebenkosten',
      'sanierung',
    ],
    requires_disclaimer: false,
  },
  tax_legal: {
    code: 'tax_legal',
    label_de: 'Steuern & Recht',
    description_de: 'Steuerliche und rechtliche Hinweise (keine Beratung)',
    icon: 'Scale',
    color: 'bg-purple-500',
    subcategories: [
      'v_und_v', // Vermietung und Verpachtung
      'afa',
      'werbungskosten',
      'spekulationsfrist',
      'grunderwerbsteuer',
      'mietrecht_basics',
    ],
    requires_disclaimer: true,
  },
  finance: {
    code: 'finance',
    label_de: 'Finanzierung',
    description_de: 'Finanzierungswissen für deutsche Immobilienkäufe',
    icon: 'Landmark',
    color: 'bg-green-500',
    subcategories: [
      'annuitaet',
      'zinsbindung',
      'beleihung',
      'haushaltsrechnung',
      'selbstauskunft',
      'kfw_foerderung',
    ],
    requires_disclaimer: true,
  },
  sales: {
    code: 'sales',
    label_de: 'Vertrieb',
    description_de: 'Verkaufskommunikation und Kundenberatung',
    icon: 'MessageSquare',
    color: 'bg-orange-500',
    subcategories: [
      'einwandbehandlung',
      'closing',
      'bedarfsanalyse',
      'praesentation',
      'follow_up',
    ],
    requires_disclaimer: false,
  },
  templates: {
    code: 'templates',
    label_de: 'Vorlagen',
    description_de: 'Wiederverwendbare Dokumente und Checklisten',
    icon: 'FileText',
    color: 'bg-cyan-500',
    subcategories: ['checklisten', 'email_vorlagen', 'leitfaeden', 'formulare'],
    requires_disclaimer: false,
  },
  research: {
    code: 'research',
    label_de: 'Research',
    description_de: 'Armstrong-generierte Recherche-Ergebnisse (Review erforderlich)',
    icon: 'Search',
    color: 'bg-amber-500',
    subcategories: ['marktanalyse', 'standort', 'trends', 'regulierung'],
    requires_disclaimer: true,
  },
};

// =============================================================================
// CONTENT TYPE DEFINITIONS
// =============================================================================

export interface ContentTypeDefinition {
  code: KBContentType;
  label_de: string;
  description_de: string;
  icon: string;
  template_hint: string;
}

export const KB_CONTENT_TYPES: Record<KBContentType, ContentTypeDefinition> = {
  article: {
    code: 'article',
    label_de: 'Artikel',
    description_de: 'Erklärender Text zu einem Thema',
    icon: 'FileText',
    template_hint: 'Strukturierter Fließtext mit Überschriften und Absätzen',
  },
  playbook: {
    code: 'playbook',
    label_de: 'Playbook',
    description_de: 'Schritt-für-Schritt-Anleitung',
    icon: 'BookOpen',
    template_hint: 'Nummerierte Schritte mit klaren Handlungsanweisungen',
  },
  checklist: {
    code: 'checklist',
    label_de: 'Checkliste',
    description_de: 'Prüfliste zur Validierung',
    icon: 'CheckSquare',
    template_hint: 'Liste mit abhakbaren Punkten und Kategorien',
  },
  script: {
    code: 'script',
    label_de: 'Skript',
    description_de: 'Gesprächsvorlage für Kundenkontakt',
    icon: 'MessageCircle',
    template_hint: 'Dialog-Blöcke mit Varianten für verschiedene Reaktionen',
  },
  faq: {
    code: 'faq',
    label_de: 'FAQ',
    description_de: 'Häufig gestellte Fragen',
    icon: 'HelpCircle',
    template_hint: 'Frage-Antwort-Paare, thematisch gruppiert',
  },
  research_memo: {
    code: 'research_memo',
    label_de: 'Research Memo',
    description_de: 'Recherche-Ergebnis (benötigt Review)',
    icon: 'Search',
    template_hint: 'Zusammenfassung, Kernpunkte, Quellen, Confidence, Gültigkeit',
  },
};

// =============================================================================
// CONFIDENCE LEVELS
// =============================================================================

export interface ConfidenceDefinition {
  code: KBConfidence;
  label_de: string;
  description_de: string;
  color: string;
}

export const KB_CONFIDENCE_LEVELS: Record<KBConfidence, ConfidenceDefinition> = {
  verified: {
    code: 'verified',
    label_de: 'Verifiziert',
    description_de: 'Von Experten geprüft und bestätigt',
    color: 'bg-status-success',
  },
  high: {
    code: 'high',
    label_de: 'Hoch',
    description_de: 'Aus offiziellen Quellen mit klarer Belastbarkeit',
    color: 'bg-blue-500',
  },
  medium: {
    code: 'medium',
    label_de: 'Mittel',
    description_de: 'Aus seriösen Quellen, aber nicht offiziell bestätigt',
    color: 'bg-amber-500',
  },
  low: {
    code: 'low',
    label_de: 'Niedrig',
    description_de: 'Vorläufig oder aus unverifizierten Quellen',
    color: 'bg-status-error',
  },
};

// =============================================================================
// SOURCE TYPES
// =============================================================================

export const KB_SOURCE_TYPES = {
  official: {
    code: 'official',
    label_de: 'Offiziell',
    description_de: 'Gesetzestexte, Behörden, amtliche Statistiken',
    examples: ['.gov.de', 'destatis.de', 'bundesbank.de', 'bmf.de'],
  },
  professional: {
    code: 'professional',
    label_de: 'Fachquelle',
    description_de: 'Banken, IHK, Verbände, Fachportale',
    examples: ['ihk.de', 'vdp.de', 'immobilienscout24.de', 'sparda.de'],
  },
  general: {
    code: 'general',
    label_de: 'Allgemein',
    description_de: 'Nachrichtenportale, Blogs, allgemeine Webseiten',
    examples: ['handelsblatt.com', 'faz.net', 'spiegel.de'],
  },
} as const;

// =============================================================================
// EDITORIAL WORKFLOW
// =============================================================================

export const KB_STATUS_WORKFLOW = {
  draft: {
    code: 'draft',
    label_de: 'Entwurf',
    description_de: 'In Bearbeitung, noch nicht zur Prüfung freigegeben',
    next_states: ['review'],
    allowed_roles: ['org_member', 'org_admin', 'platform_admin'],
  },
  review: {
    code: 'review',
    label_de: 'In Prüfung',
    description_de: 'Wartet auf Freigabe durch Reviewer',
    next_states: ['published', 'draft'],
    allowed_roles: ['org_admin', 'platform_admin'], // Visibility
    reviewer_roles: ['org_admin', 'platform_admin'], // Can approve
  },
  published: {
    code: 'published',
    label_de: 'Veröffentlicht',
    description_de: 'Aktiv und für Armstrong verfügbar',
    next_states: ['deprecated'],
    allowed_roles: ['*'], // All authenticated can read
  },
  deprecated: {
    code: 'deprecated',
    label_de: 'Archiviert',
    description_de: 'Nicht mehr aktiv, nur noch historisch verfügbar',
    next_states: [],
    allowed_roles: ['platform_admin'],
  },
} as const;

// =============================================================================
// RESEARCH MEMO DEFAULTS
// =============================================================================

export const RESEARCH_MEMO_DEFAULTS = {
  valid_days: 90,
  min_sources: 1,
  confidence_default: 'medium' as KBConfidence,
  requires_review: true,
  auto_category: 'research' as KBCategory,
  auto_content_type: 'research_memo' as KBContentType,
};

// =============================================================================
// DISCLAIMER TEMPLATES
// =============================================================================

export const KB_DISCLAIMERS = {
  tax_legal: `
**Wichtiger Hinweis:** Diese Information dient nur zur allgemeinen Orientierung und stellt 
keine Rechts- oder Steuerberatung dar. Für verbindliche Auskünfte wenden Sie sich bitte 
an einen Steuerberater oder Rechtsanwalt.
  `.trim(),
  
  finance: `
**Wichtiger Hinweis:** Diese Informationen zu Finanzierungsthemen dienen nur zur 
allgemeinen Orientierung. Für eine verbindliche Beratung wenden Sie sich bitte an 
Ihre Bank oder einen unabhängigen Finanzierungsberater.
  `.trim(),
  
  research: `
**Research Memo:** Diese Information basiert auf einer automatisierten Web-Recherche. 
Die Quellen sind angegeben, aber die Inhalte wurden möglicherweise noch nicht von 
einem Experten geprüft. Bitte verifizieren Sie wichtige Informationen unabhängig.
  `.trim(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get category definition by code
 */
export function getCategory(code: KBCategory): CategoryDefinition {
  return KB_CATEGORIES[code];
}

/**
 * Get content type definition by code
 */
export function getContentType(code: KBContentType): ContentTypeDefinition {
  return KB_CONTENT_TYPES[code];
}

/**
 * Get all categories as array
 */
export function getAllCategories(): CategoryDefinition[] {
  return Object.values(KB_CATEGORIES);
}

/**
 * Get all content types as array
 */
export function getAllContentTypes(): ContentTypeDefinition[] {
  return Object.values(KB_CONTENT_TYPES);
}

/**
 * Check if a category requires disclaimer
 */
export function requiresDisclaimer(category: KBCategory): boolean {
  return KB_CATEGORIES[category]?.requires_disclaimer ?? false;
}

/**
 * Get the appropriate disclaimer for a category
 */
export function getDisclaimer(category: KBCategory): string | null {
  if (category === 'tax_legal') return KB_DISCLAIMERS.tax_legal;
  if (category === 'finance') return KB_DISCLAIMERS.finance;
  if (category === 'research') return KB_DISCLAIMERS.research;
  return null;
}

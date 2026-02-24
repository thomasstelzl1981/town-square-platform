/**
 * ENG-MKTDIR — Market Directory Engine
 * spec.ts — Typen, Interfaces, Konstanten, Taxonomie (SSOT)
 * 
 * Keine Logik hier. Nur Definitionen.
 * Version: 1.0.0
 */

export const ENGINE_VERSION_MKTDIR = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// 1. KATEGORIE-TAXONOMIE (Discovery Targets)
// ═══════════════════════════════════════════════════════════════

export type CategoryGroupCode = 'FINANZ' | 'PET' | 'IMMOBILIEN' | 'ALLGEMEIN';

export interface CategoryDefinition {
  code: string;
  label: string;
  group: CategoryGroupCode;
  /** Provider-Mappings (Google Places types, Apify tags, etc.) */
  providerMappings: Record<string, string[]>;
}

export interface CategoryGroup {
  code: CategoryGroupCode;
  label: string;
  color: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { code: 'FINANZ', label: 'Finanzdienstleister', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { code: 'PET', label: 'Tier & Hund', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { code: 'IMMOBILIEN', label: 'Immobilien', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { code: 'ALLGEMEIN', label: 'Allgemein', color: 'bg-muted text-muted-foreground' },
];

export const CATEGORY_REGISTRY: CategoryDefinition[] = [
  // ── FINANZ ──
  { code: 'family_office', label: 'Family Office', group: 'FINANZ', providerMappings: { google_places: ['financial_institution'], apify: ['family office'] } },
  { code: 'bank_retail', label: 'Filialbank', group: 'FINANZ', providerMappings: { google_places: ['bank'], apify: ['bank', 'sparkasse', 'volksbank'] } },
  { code: 'bank_private', label: 'Privatbank', group: 'FINANZ', providerMappings: { google_places: ['bank'], apify: ['privatbank'] } },
  { code: 'mortgage_broker_34i', label: 'Immobiliardarlehensvermittler (§34i)', group: 'FINANZ', providerMappings: { google_places: ['finance'], apify: ['immobiliardarlehensvermittler', '34i', 'baufinanzierung'] } },
  { code: 'insurance_broker_34d', label: 'Versicherungsmakler (§34d)', group: 'FINANZ', providerMappings: { google_places: ['insurance_agency'], apify: ['versicherungsmakler', '34d'] } },
  { code: 'financial_broker_34f', label: 'Finanzanlagenvermittler (§34f)', group: 'FINANZ', providerMappings: { google_places: ['finance'], apify: ['finanzanlagenvermittler', '34f'] } },
  { code: 'fee_advisor_34h', label: 'Honorar-Berater (§34h)', group: 'FINANZ', providerMappings: { google_places: ['finance'], apify: ['honorar-finanzanlagenberater', '34h'] } },
  { code: 'financial_advisor', label: 'Finanzberater allgemein', group: 'FINANZ', providerMappings: { google_places: ['financial_planner', 'finance'], apify: ['finanzberater', 'finanzdienstleister'] } },
  { code: 'loan_broker', label: 'Kreditvermittler', group: 'FINANZ', providerMappings: { google_places: ['finance'], apify: ['kreditvermittler'] } },

  // ── PET ──
  { code: 'dog_boarding', label: 'Hundepension', group: 'PET', providerMappings: { google_places: ['pet_store', 'lodging'], apify: ['hundepension', 'hundehotel'] } },
  { code: 'dog_daycare', label: 'Hundetagesstätte', group: 'PET', providerMappings: { google_places: ['pet_store'], apify: ['hundetagesstätte', 'huta'] } },
  { code: 'dog_grooming', label: 'Hundefriseur', group: 'PET', providerMappings: { google_places: ['pet_store'], apify: ['hundefriseur', 'hundesalon'] } },
  { code: 'dog_training', label: 'Hundeschule', group: 'PET', providerMappings: { google_places: ['pet_store'], apify: ['hundeschule', 'hundetrainer'] } },
  { code: 'pet_shop', label: 'Zoofachhandel', group: 'PET', providerMappings: { google_places: ['pet_store'], apify: ['zoofachhandel', 'tierbedarf'] } },
  { code: 'veterinary', label: 'Tierarzt / Tierklinik', group: 'PET', providerMappings: { google_places: ['veterinary_care'], apify: ['tierarzt', 'tierklinik'] } },
  { code: 'pet_sitting', label: 'Petsitter / Gassi-Service', group: 'PET', providerMappings: { google_places: [], apify: ['petsitter', 'gassi-service', 'hundebetreuung'] } },

  // ── IMMOBILIEN ──
  { code: 'property_management', label: 'Hausverwaltung', group: 'IMMOBILIEN', providerMappings: { google_places: ['real_estate_agency'], apify: ['hausverwaltung'] } },
  { code: 'real_estate_agent', label: 'Maklerbüro', group: 'IMMOBILIEN', providerMappings: { google_places: ['real_estate_agency'], apify: ['immobilienmakler', 'maklerbüro'] } },
  { code: 'tax_advisor_re', label: 'Steuerberater (Immo)', group: 'IMMOBILIEN', providerMappings: { google_places: ['accounting'], apify: ['steuerberater'] } },

  // ── ALLGEMEIN (bestehend) ──
  { code: 'Offen', label: 'Offen', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Mieter', label: 'Mieter', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Eigentümer', label: 'Eigentümer', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Verwalter', label: 'Verwalter', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Makler', label: 'Makler', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Bank', label: 'Bank', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Handwerker', label: 'Handwerker', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Partner', label: 'Partner', group: 'ALLGEMEIN', providerMappings: {} },
  { code: 'Sonstige', label: 'Sonstige', group: 'ALLGEMEIN', providerMappings: {} },
];

// ═══════════════════════════════════════════════════════════════
// 2. GOLDEN RECORD INTERFACES (Ziel-Datenpunkte)
// ═══════════════════════════════════════════════════════════════

/** 2.1 Identität & Einordnung */
export interface ContactIdentity {
  displayName: string;
  legalName?: string;
  categoryPrimary: string;
  categoriesSecondary: string[];
  entityType: 'company' | 'sole_trader' | 'public_body' | 'association' | 'unknown';
  shortDescription?: string;
}

/** 2.2 Standort & Geo */
export interface ContactAddress {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  regionState?: string;
  country: string;
  geoLat?: number;
  geoLng?: number;
  serviceArea?: string;
}

/** 2.3 Kontaktkanäle */
export interface ContactChannels {
  phoneE164?: string;
  phonesAdditional: string[];
  emailPublic?: string;
  websiteUrl?: string;
  domain?: string;
  socialLinks: string[];
}

/** 2.5 Compliance / Contactability Flags */
export interface ComplianceFlags {
  doNotContactEmail: boolean;
  doNotContactPhone: boolean;
  suppressionReason?: 'unsubscribed' | 'bounced' | 'complaint' | 'manual' | 'blocklist';
  lastOutreachAt?: string;
  lastInboundAt?: string;
  consentBasis: 'unknown' | 'legitimate_interest' | 'explicit_opt_in';
}

/** 2.6 Provenance / Quality */
export interface FieldProvenance {
  fieldName: string;
  source: string;
  providerObjectId?: string;
  fetchedAt: string;
}

export type QualityStatus = 'candidate' | 'enriched' | 'needs_review' | 'approved' | 'rejected' | 'blocked';

/** 2.7 Spezifische Zusatzdaten */
export interface FinanzExtras {
  has34d?: boolean;
  has34i?: boolean;
  has34f?: boolean;
  has34h?: boolean;
  licenseRegistryRefs: string[];
  organizationTypeHint?: string;
}

export interface PetExtras {
  capacityHint?: string;
  petTypesSupported: string[];
  servicesOffered: string[];
}

/** Vollständiger Golden Record */
export interface ContactRecord {
  contactId?: string;
  identity: ContactIdentity;
  address: ContactAddress;
  channels: ContactChannels;
  compliance: ComplianceFlags;
  provenance: FieldProvenance[];
  confidenceScore: number;
  qualityStatus: QualityStatus;
  finanzExtras?: FinanzExtras;
  petExtras?: PetExtras;
  // Raw fields for direct DB mapping
  salutation?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

// ═══════════════════════════════════════════════════════════════
// 3. CONFIDENCE & QUALITY GATE
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceComponents {
  identityMatch: number;    // 0..1: Name/Firma vorhanden und konsistent
  addressQuality: number;   // 0..1: Adresse vollständig und plausibel
  phoneValidity: number;    // 0..1: Telefon vorhanden und E.164-konform
  domainValidity: number;   // 0..1: Website/Domain verfügbar
  sourceCount: number;      // 0..1: normalisiert (1 Quelle = 0.3, 2+ = 0.6, 3+ = 1.0)
  consistency: number;      // 0..1: Daten über Quellen konsistent
}

export const CONFIDENCE_WEIGHTS: Record<keyof ConfidenceComponents, number> = {
  identityMatch: 0.25,
  addressQuality: 0.20,
  phoneValidity: 0.15,
  domainValidity: 0.15,
  sourceCount: 0.10,
  consistency: 0.15,
};

export interface QualityGateThresholds {
  autoApprove: number;
  needsReview: number;
  reject: number;
}

export const QUALITY_THRESHOLDS: QualityGateThresholds = {
  autoApprove: 0.85,
  needsReview: 0.60,
  reject: 0.60,  // below this → reject
};

// ═══════════════════════════════════════════════════════════════
// 4. DEDUPE
// ═══════════════════════════════════════════════════════════════

export type DedupeMatchType = 'provider_id' | 'domain' | 'phone' | 'name_address' | 'fuzzy';

export interface DedupeCandidate {
  existingContactId: string;
  matchType: DedupeMatchType;
  matchField: string;
  score: number;
  explanation: string;
}

export interface MergeDecision {
  field: string;
  winnerSource: string;
  reason: string;
  oldValue?: string;
  newValue?: string;
}

export const DEDUPE_PRIORITY: DedupeMatchType[] = [
  'provider_id', 'domain', 'phone', 'name_address', 'fuzzy',
];

// ═══════════════════════════════════════════════════════════════
// 5. DISCOVERY RUN METRICS
// ═══════════════════════════════════════════════════════════════

export interface DiscoveryRunMetrics {
  rawFound: number;
  normalized: number;
  enriched: number;
  duplicates: number;
  approved: number;
  needsReview: number;
  rejected: number;
  blocked: number;
}

// ═══════════════════════════════════════════════════════════════
// 6. NORMALIZATION RESULT
// ═══════════════════════════════════════════════════════════════

export interface NormalizationResult {
  normalized: {
    salutation?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phoneE164?: string;
    domain?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    email?: string;
  };
  changes: Array<{ field: string; from: string; to: string }>;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// 7. UI HELPER CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const SALUTATION_OPTIONS = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
  { value: 'Firma', label: 'Firma' },
] as const;

export const PERMISSION_OPTIONS = [
  { value: 'unknown', label: 'Unbekannt' },
  { value: 'opt_in', label: 'Opt-In' },
  { value: 'legitimate_interest', label: 'Berecht. Interesse' },
  { value: 'no_contact', label: 'Kein Kontakt' },
  { value: 'unsubscribed', label: 'Abgemeldet' },
] as const;

export const QUALITY_STATUS_LABELS: Record<QualityStatus, { label: string; color: string }> = {
  candidate: { label: 'Kandidat', color: 'bg-muted text-muted-foreground' },
  enriched: { label: 'Angereichert', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  needs_review: { label: 'Review', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  approved: { label: 'Freigegeben', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  blocked: { label: 'Gesperrt', color: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-300' },
};

export const DESK_OPTIONS = [
  { code: 'acquiary', label: 'Acquiary' },
  { code: 'sales', label: 'Sales' },
  { code: 'finance', label: 'Finance' },
  { code: 'pet', label: 'Pet' },
  { code: 'banks', label: 'Banken' },
] as const;

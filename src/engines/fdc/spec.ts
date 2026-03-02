/**
 * ENG-FDC — Finance Data Controller: Specification
 *
 * Pure types, interfaces, constants. NO logic, NO side effects.
 *
 * @engine ENG-FDC
 * @version 1.0.0
 * @module MOD-18 (Finanzanalyse)
 */

// ─── Entity Types ─────────────────────────────────────────────
export type FDCEntityType =
  | 'account'
  | 'account_meta'
  | 'insurance_sach'
  | 'insurance_kv'
  | 'vorsorge'
  | 'pension'
  | 'private_loan'
  | 'mortgage'
  | 'miety_home'
  | 'miety_contract'
  | 'miety_loan'
  | 'legal_doc'
  | 'property_finance_ref'
  | 'contract_candidate'
  | 'other';

export const FDC_ENTITY_TYPE_LABELS: Record<FDCEntityType, string> = {
  account: 'Bankkonto',
  account_meta: 'Konto-Metadaten',
  insurance_sach: 'Sachversicherung',
  insurance_kv: 'Krankenversicherung',
  vorsorge: 'Vorsorge',
  pension: 'Rente/DRV',
  private_loan: 'Privatkredit',
  mortgage: 'Immobiliendarlehen',
  miety_home: 'Zuhause',
  miety_contract: 'Zuhause-Vertrag',
  miety_loan: 'Zuhause-Darlehen',
  legal_doc: 'Vorsorgedokument',
  property_finance_ref: 'Immobilie (Ref)',
  contract_candidate: 'Vertragskandidat',
  other: 'Sonstiges',
};

// ─── Link Types ───────────────────────────────────────────────
export type FDCLinkType =
  | 'belongs_to'
  | 'pays_from'
  | 'covers'
  | 'secured_by'
  | 'relates_to'
  | 'owner_of'
  | 'located_at';

export const FDC_LINK_TYPE_LABELS: Record<FDCLinkType, string> = {
  belongs_to: 'Gehört zu',
  pays_from: 'Zahlt über',
  covers: 'Deckt ab',
  secured_by: 'Besichert durch',
  relates_to: 'Bezieht sich auf',
  owner_of: 'Eigentümer von',
  located_at: 'Standort',
};

// ─── Action Codes ─────────────────────────────────────────────
export type FDCActionCode =
  | 'ACCOUNT_OWNER_MISSING'
  | 'ACCOUNT_META_MISSING'
  | 'CONTRACT_OWNER_MISSING'
  | 'CONTRACT_PAYMENT_SOURCE_MISSING'
  | 'DUPLICATE_CONTRACT_SUSPECT'
  | 'LOAN_PROPERTY_LINK_MISSING'
  | 'PROPERTY_LOAN_MISMATCH'
  | 'PENSION_DATA_MISSING'
  | 'HOME_CONTRACT_LINK_MISSING'
  | 'LEGAL_DOCS_MISSING'
  | 'CONSENT_MISSING'
  | 'CANDIDATE_REVIEW_REQUIRED';

export type FDCSeverity = 'info' | 'warn' | 'block';

export const FDC_ACTION_DEFINITIONS: Record<FDCActionCode, {
  severity: FDCSeverity;
  label: string;
  description: string;
  ownerRole: string;
}> = {
  ACCOUNT_OWNER_MISSING: {
    severity: 'warn',
    label: 'Kontoinhaber fehlt',
    description: 'Einem Bankkonto ist kein Inhaber zugeordnet.',
    ownerRole: 'user',
  },
  ACCOUNT_META_MISSING: {
    severity: 'warn',
    label: 'Konto-Kategorie fehlt',
    description: 'Einem Bankkonto fehlt die Kategorisierung (Girokonto, Sparkonto etc.).',
    ownerRole: 'user',
  },
  CONTRACT_OWNER_MISSING: {
    severity: 'warn',
    label: 'Vertragsinhaber fehlt',
    description: 'Einem Versicherungs-/Vorsorgevertrag ist kein Inhaber zugeordnet.',
    ownerRole: 'user',
  },
  CONTRACT_PAYMENT_SOURCE_MISSING: {
    severity: 'info',
    label: 'Zahlungsquelle fehlt',
    description: 'Einem Vertrag ist kein Zahlungskonto zugeordnet.',
    ownerRole: 'user',
  },
  DUPLICATE_CONTRACT_SUSPECT: {
    severity: 'warn',
    label: 'Duplikatsverdacht',
    description: 'Zwei Verträge mit ähnlichem Anbieter und Betrag gefunden.',
    ownerRole: 'user',
  },
  LOAN_PROPERTY_LINK_MISSING: {
    severity: 'warn',
    label: 'Darlehen ohne Immobilie',
    description: 'Ein Immobiliendarlehen ist keiner Immobilie zugeordnet.',
    ownerRole: 'user',
  },
  PROPERTY_LOAN_MISMATCH: {
    severity: 'warn',
    label: 'Darlehen-Restschuld Abweichung',
    description: 'Restschuld des Darlehens weicht von der Immobilien-Finanzierung ab.',
    ownerRole: 'user',
  },
  PENSION_DATA_MISSING: {
    severity: 'info',
    label: 'Rentendaten fehlen',
    description: 'Keine DRV-/Rentendaten hinterlegt.',
    ownerRole: 'user',
  },
  HOME_CONTRACT_LINK_MISSING: {
    severity: 'info',
    label: 'Zuhause-Vertrag nicht verknüpft',
    description: 'Ein Zuhause-Vertrag ist keinem Zuhause zugeordnet.',
    ownerRole: 'user',
  },
  LEGAL_DOCS_MISSING: {
    severity: 'warn',
    label: 'Vorsorgedokumente fehlen',
    description: 'Testament oder Patientenverfügung nicht hinterlegt.',
    ownerRole: 'user',
  },
  CONSENT_MISSING: {
    severity: 'warn',
    label: 'Einwilligung fehlt',
    description: 'Die Einwilligung zur Finanzanalyse fehlt.',
    ownerRole: 'user',
  },
  CANDIDATE_REVIEW_REQUIRED: {
    severity: 'info',
    label: 'Vertragskandidat prüfen',
    description: 'Ein automatisch erkannter Vertragskandidat wartet auf Bestätigung.',
    ownerRole: 'user',
  },
};

// ─── Coverage Scoring ─────────────────────────────────────────
export type FDCCoverageCategory =
  | 'konten'
  | 'sachversicherungen'
  | 'kv'
  | 'vorsorge'
  | 'darlehen'
  | 'zuhause'
  | 'immobilien'
  | 'rechtliches'
  | 'rente';

export const FDC_COVERAGE_WEIGHTS: Record<FDCCoverageCategory, number> = {
  konten: 15,
  sachversicherungen: 12,
  kv: 12,
  vorsorge: 10,
  darlehen: 15,
  zuhause: 10,
  immobilien: 12,
  rechtliches: 6,
  rente: 8,
};

export const FDC_COVERAGE_LABELS: Record<FDCCoverageCategory, string> = {
  konten: 'Konten',
  sachversicherungen: 'Sachversicherungen',
  kv: 'Krankenversicherung',
  vorsorge: 'Vorsorge',
  darlehen: 'Darlehen',
  zuhause: 'Zuhause',
  immobilien: 'Immobilien',
  rechtliches: 'Rechtliches',
  rente: 'Rente',
};

// ─── Snapshot Types (input for engine) ────────────────────────
export interface FDCSnapshotCounts {
  accounts: number;
  accountsWithMeta: number;
  accountsWithOwner: number;
  insuranceSach: number;
  insuranceSachWithOwner: number;
  insuranceKv: number;
  insuranceKvWithOwner: number;
  vorsorge: number;
  vorsorgeWithOwner: number;
  pensions: number;
  privateLoans: number;
  mortgages: number;
  mortgagesWithProperty: number;
  mietyHomes: number;
  mietyContracts: number;
  mietyContractsLinkedToHome: number;
  mietyLoans: number;
  legalDocs: number;
  legalDocsTestament: number;
  legalDocsPatVfg: number;
  properties: number;
  propertiesWithLoan: number;
  contractCandidatesPending: number;
  hasFinanceConsent: boolean;
}

export interface FDCRegistryEntry {
  id: string;
  tenant_id: string;
  entity_type: FDCEntityType;
  entity_id: string;
  source_module: string;
  owner_person_id: string | null;
  linked_account_id: string | null;
  linked_property_id: string | null;
  status: string;
  confidence: number | null;
}

export interface FDCLink {
  id: string;
  tenant_id: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  link_type: FDCLinkType;
  confidence: number | null;
}

export interface FDCRepairAction {
  id?: string;
  tenant_id: string;
  severity: FDCSeverity;
  code: FDCActionCode;
  scope_key: string;
  entity_type: FDCEntityType;
  entity_id: string;
  message: string;
  status: string;
  owner_role: string;
  metadata: Record<string, unknown>;
}

export interface FDCCategoryScore {
  category: FDCCoverageCategory;
  label: string;
  score: number;       // 0–100
  weight: number;
  entityCount: number;
  issueCount: number;
}

export interface FDCIntegrityResult {
  coverageScore: number; // 0–100 weighted
  categoryScores: FDCCategoryScore[];
  actionsToUpsert: FDCRepairAction[];
}

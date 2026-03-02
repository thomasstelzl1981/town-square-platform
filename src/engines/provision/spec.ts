/**
 * Provisions-Engine — Typen & Konstanten (SSOT)
 */

export interface CommissionInput {
  dealValue: number;
  /** Kaeufer-Provision in % */
  buyerCommissionPercent: number;
  /** Verkaeufer-Provision in % */
  sellerCommissionPercent: number;
  /** MwSt-Satz (Standard 19%) */
  vatPercent?: number;
}

export interface CommissionPartyResult {
  brutto: number;
  netto: number;
  vat: number;
}

export interface CommissionResult {
  buyer: CommissionPartyResult;
  seller: CommissionPartyResult;
  total: CommissionPartyResult;
}

export interface PartnerShareInput {
  commissionNetto: number;
  /** Anteil des Partners in % */
  partnerSharePercent: number;
  /** Fixbetrag-Anteil (alternativ) */
  partnerFixAmount?: number;
}

export interface PartnerShareResult {
  partnerAmount: number;
  houseAmount: number;
}

export interface TippgeberInput {
  commissionNetto: number;
  /** SoT-Anteil des Hauses in % (Standard: 50%) */
  sotSharePercent?: number;
  /** Tippgeber-Anteil am SoT-Anteil in % (Standard: 25%) */
  tippgeberSharePercent?: number;
}

export interface TippgeberResult {
  sotAmount: number;
  tippgeberFee: number;
  remaining: number;
}

/** Eingabe fuer die Plattformanteil-Berechnung (ehemals Systemgebuehr) */
export interface PlatformShareInput {
  /** Brutto-Provision des Managers */
  grossCommission: number;
  /** Plattformanteil in % (Standard: 25%) */
  platformSharePct?: number;
}

/** Ergebnis der Plattformanteil-Berechnung */
export interface PlatformShareResult {
  /** Plattformanteil der an SoT abgefuehrt wird */
  platformShare: number;
  /** Netto-Betrag der beim Manager verbleibt */
  managerNetto: number;
}

/** Typ-Konfiguration fuer die Manager-Provisionsvereinbarung */
export interface ManagerCommissionConfig {
  commissionType: 'finance_tipp' | 'immo_vermittlung' | 'acq_erfolgsgebuehr';
  agreementTemplateCode: string;
  platformSharePct: number;
  managerLabel: string;
  description: string;
}

// ─── Legacy Aliases (Uebergangsphase, nicht in neuem Code verwenden) ────
/** @deprecated Use PlatformShareInput */
export type SystemFeeInput = PlatformShareInput;
/** @deprecated Use PlatformShareResult */
export type SystemFeeResult = PlatformShareResult;
/** @deprecated Use ManagerCommissionConfig */
export type SystemFeeConfig = ManagerCommissionConfig;

export const PROVISION_DEFAULTS = {
  buyerCommissionPercent: 3.57,
  sellerCommissionPercent: 3.57,
  vatPercent: 19,
  partnerSharePercent: 50,
  sotSharePercent: 50,
  tippgeberSharePercent: 25,
  /** Standard-Plattformanteil fuer alle Manager-Module (25%) */
  platformSharePct: 25,
  /** @deprecated Use platformSharePct */
  systemFeePct: 25,
} as const;

/** Vorkonfigurierte Provisions-Configs pro Manager */
export const MANAGER_COMMISSION_CONFIGS: Record<string, ManagerCommissionConfig> = {
  finance: {
    commissionType: 'finance_tipp',
    agreementTemplateCode: 'FINANCE_TIPP_AGREEMENT',
    platformSharePct: PROVISION_DEFAULTS.platformSharePct,
    managerLabel: 'Finanzierungs',
    description: 'Als Finanzierungsmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats werden 25% Ihrer Provision als Plattformanteil fällig.',
  },
  immo: {
    commissionType: 'immo_vermittlung',
    agreementTemplateCode: 'IMMO_SYSTEM_FEE_AGREEMENT',
    platformSharePct: PROVISION_DEFAULTS.platformSharePct,
    managerLabel: 'Immobilien',
    description: 'Als Immobilienmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats werden 25% Ihrer Provision als Plattformanteil fällig.',
  },
  akquise: {
    commissionType: 'acq_erfolgsgebuehr',
    agreementTemplateCode: 'ACQ_SYSTEM_FEE_AGREEMENT',
    platformSharePct: PROVISION_DEFAULTS.platformSharePct,
    managerLabel: 'Akquise',
    description: 'Als Akquisemanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats werden 25% Ihrer Provision als Plattformanteil fällig.',
  },
} as const;

/** @deprecated Use MANAGER_COMMISSION_CONFIGS */
export const SYSTEM_FEE_CONFIGS = MANAGER_COMMISSION_CONFIGS;

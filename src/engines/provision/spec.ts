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

/** Eingabe fuer die Systemgebuehr-Berechnung */
export interface SystemFeeInput {
  /** Brutto-Provision des Managers */
  grossCommission: number;
  /** Systemgebuehr-Satz in % (Standard: 25%) */
  systemFeePct?: number;
}

/** Ergebnis der Systemgebuehr-Berechnung */
export interface SystemFeeResult {
  /** Systemgebuehr die an SoT abgefuehrt wird */
  systemFee: number;
  /** Netto-Betrag der beim Manager verbleibt */
  managerNetto: number;
}

/** Typ-Konfiguration fuer die ManagerSystemgebuehr-Komponente */
export interface SystemFeeConfig {
  commissionType: 'finance_tipp' | 'immo_vermittlung' | 'acq_erfolgsgebuehr';
  agreementTemplateCode: string;
  systemFeePct: number;
  managerLabel: string;
  description: string;
}

export const PROVISION_DEFAULTS = {
  buyerCommissionPercent: 3.57,
  sellerCommissionPercent: 3.57,
  vatPercent: 19,
  partnerSharePercent: 50,
  sotSharePercent: 50,
  tippgeberSharePercent: 25,
  /** Standard-Systemgebuehr fuer alle Manager-Module */
  systemFeePct: 25,
} as const;

/** Vorkonfigurierte Systemgebuehr-Configs pro Manager */
export const SYSTEM_FEE_CONFIGS: Record<string, SystemFeeConfig> = {
  finance: {
    commissionType: 'finance_tipp',
    agreementTemplateCode: 'FINANCE_TIPP_AGREEMENT',
    systemFeePct: PROVISION_DEFAULTS.systemFeePct,
    managerLabel: 'Finanzierungs',
    description: 'Als Finanzierungsmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig.',
  },
  immo: {
    commissionType: 'immo_vermittlung',
    agreementTemplateCode: 'IMMO_SYSTEM_FEE_AGREEMENT',
    systemFeePct: PROVISION_DEFAULTS.systemFeePct,
    managerLabel: 'Immobilien',
    description: 'Als Immobilienmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig.',
  },
  akquise: {
    commissionType: 'acq_erfolgsgebuehr',
    agreementTemplateCode: 'ACQ_SYSTEM_FEE_AGREEMENT',
    systemFeePct: PROVISION_DEFAULTS.systemFeePct,
    managerLabel: 'Akquise',
    description: 'Als Akquisemanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig.',
  },
} as const;

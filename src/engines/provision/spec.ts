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

export const PROVISION_DEFAULTS = {
  buyerCommissionPercent: 3.57,
  sellerCommissionPercent: 3.57,
  vatPercent: 19,
  partnerSharePercent: 50,
  sotSharePercent: 50,
  tippgeberSharePercent: 25,
} as const;

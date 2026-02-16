/**
 * Engine 9: Vorsorge-Lückenrechner — Typen & Konstanten
 * Strikte Datenisolation: Nur household_persons, pension_records, vorsorge_contracts
 */

// ─── Konstanten ──────────────────────────────────────────────
export const DEFAULT_NEED_PERCENT = 0.75;
export const DEFAULT_ANNUITY_YEARS = 25;
export const DEFAULT_GROWTH_RATE = 0.04;
export const DEFAULT_FALLBACK_YEARS_TO_RETIREMENT = 15;
export const BEAMTE_MAX_VERSORGUNGSSATZ = 0.7175;
export const BEAMTE_SATZ_PRO_JAHR = 0.0179375;
export const EM_FALLBACK_PERCENT = 0.35;

export const ALTERSVORSORGE_TYPES = [
  'bAV',
  'Betriebliche Altersvorsorge',
  'Riester',
  'Rürup',
  'Ruerup',
  'Basisrente',
  'Lebensversicherung',
  'Rentenversicherung',
  'Fondsgebundene',
  'Kapitalbildende',
  'Versorgungswerk',
  'Privat',
  'Sonstige',
] as const;

export const BU_TYPES = [
  'Berufsunfähigkeit',
  'Berufsunfaehigkeit',
  'Dienstunfähigkeitsversicherung',
  'Dienstunfaehigkeitsversicherung',
] as const;

// ─── Eingabetypen ────────────────────────────────────────────

export interface VLPersonInput {
  id: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
  employment_status: string | null;     // 'employee' | 'civil_servant' | 'self_employed' | deutsche Varianten
  net_income_monthly: number | null;
  gross_income_monthly: number | null;
  ruhegehaltfaehiges_grundgehalt: number | null;
  ruhegehaltfaehige_dienstjahre: number | null;
  planned_retirement_date: string | null;
  business_income_monthly: number | null;
}

export interface VLPensionInput {
  person_id: string;
  projected_pension: number | null;     // DRV Regelaltersrente / Beamtenpension
  disability_pension: number | null;    // DRV Erwerbsminderungsrente
  pension_type: string | null;          // 'drv' | 'beamte'
}

export interface VLContractInput {
  id: string;
  person_id: string | null;
  contract_type: string | null;
  monthly_benefit: number | null;       // Garantierte monatliche Rente
  bu_monthly_benefit: number | null;    // BU-Rente (auch bei Kombiprodukten)
  insured_sum: number | null;           // Ablaufleistung / Kapital
  current_balance: number | null;
  premium: number | null;               // Laufende Sparleistung
  payment_interval: string | null;
  status: string | null;
  category: string | null;
  projected_end_value: number | null;
  growth_rate_override: number | null;
}

// ─── Ausgabetypen ────────────────────────────────────────────

export type GesetzlicheQuelleAlter = 'drv' | 'pension' | 'missing';
export type GesetzlicheQuelleBU = 'drv_em' | 'dienstunfaehigkeit' | 'fallback' | 'missing';

export interface AltersvorsorgeResult {
  gesetzliche_versorgung: number;
  gesetzliche_quelle: GesetzlicheQuelleAlter;
  private_renten: number;
  private_verrentung: number;
  expected_total: number;
  retirement_need: number;
  retirement_need_percent: number;
  gap: number;
  surplus: number;
  capital_needed: number;
}

export interface BuLueckeResult {
  gesetzliche_absicherung: number;
  gesetzliche_quelle: GesetzlicheQuelleBU;
  private_bu: number;
  total_absicherung: number;
  bu_need: number;
  bu_need_percent: number;
  bu_gap: number;
  bu_surplus: number;
}

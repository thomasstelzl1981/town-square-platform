/**
 * Bewirtschaftungs-/BWA-Engine — Typen & Konstanten (SSOT)
 */

export interface BWACostItem {
  label: string;
  amount: number;
  category: 'verwaltung' | 'instandhaltung' | 'versicherung' | 'grundsteuer' | 'sonstig';
}

export interface BWAInput {
  /** Brutto-Mieteinnahmen p.a. */
  grossRentalIncome: number;
  /** Nicht umlagefaehige Kosten p.a. */
  nonRecoverableCosts: BWACostItem[];
  /** Jaehrlicher Schuldendienst */
  annualDebtService: number;
  /** AfA p.a. */
  depreciation: number;
}

export interface BWAResult {
  grossIncome: number;
  totalCosts: number;
  noi: number;
  cashflowBeforeTax: number;
  cashflowAfterDepreciation: number;
  bruttoRendite: number;
  nettoRendite: number;
  costRatio: number;
}

export interface InstandhaltungInput {
  /** Herstellungskosten des Gebaeudes */
  buildingCost: number;
  /** Baujahr */
  yearBuilt: number;
  /** Aktuelles Jahr */
  currentYear?: number;
}

export interface InstandhaltungResult {
  /** Empfohlene jaehrliche Ruecklage */
  annualReserve: number;
  monthlyReserve: number;
  /** Peters'scher Faktor (abhaengig vom Alter) */
  petersFactor: number;
  buildingAge: number;
}

export interface LeaseInfo {
  unitId: string;
  isVacant: boolean;
  /** Leerstand in Tagen im Betrachtungszeitraum */
  vacantDays: number;
  totalDays: number;
}

export interface LeerstandResult {
  vacancyRate: number;
  vacantUnits: number;
  totalUnits: number;
  /** Geschaetzte Mietausfaelle p.a. */
  estimatedLoss: number;
}

export interface MietpotenzialResult {
  currentRent: number;
  marketRent: number;
  delta: number;
  deltaPercent: number;
  potential: 'above_market' | 'at_market' | 'below_market';
}

export const BEWIRTSCHAFTUNG_DEFAULTS = {
  /** Peters'sche Formel: Faktor nach Alter */
  petersFactorByAge: [
    { maxAge: 10, factor: 0.007 },
    { maxAge: 20, factor: 0.009 },
    { maxAge: 30, factor: 0.011 },
    { maxAge: 50, factor: 0.013 },
    { maxAge: Infinity, factor: 0.015 },
  ] as const,
  marketRentTolerance: 0.05,
} as const;

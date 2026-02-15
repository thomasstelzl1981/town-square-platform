/**
 * ProjektCalc-Engine — Typen & Konstanten (SSOT)
 */

export interface ProjektCostItem {
  label: string;
  amount: number;
  category: 'grundstueck' | 'bau' | 'nebenkosten' | 'finanzierung' | 'vermarktung' | 'sonstig';
}

export interface ProjektUnit {
  id: string;
  label: string;
  areaSqm: number;
  targetPricePerSqm: number;
  /** Ist-Verkaufspreis (null = noch nicht verkauft) */
  soldPrice?: number | null;
  status: 'available' | 'reserved' | 'sold';
}

export interface ProjektKalkInput {
  units: ProjektUnit[];
  costs: ProjektCostItem[];
  /** Fremdkapitalkosten p.a. (Zins + Tilgung) */
  financingCostAnnual?: number;
  /** Projektlaufzeit in Monaten */
  durationMonths?: number;
}

export interface ProjektKalkResult {
  totalCosts: number;
  costsByCategory: Record<string, number>;
  totalRevenue: number;
  margin: number;
  marginPercent: number;
  revenuePerSqm: number;
  costPerSqm: number;
  totalAreaSqm: number;
}

export interface UnitPricingInput {
  areaSqm: number;
  basePricePerSqm: number;
  floorPremiumPercent?: number;
  balconyPremiumFlat?: number;
  /** Rabatt in % */
  discountPercent?: number;
}

export interface UnitPricingResult {
  basePrice: number;
  premiums: number;
  discount: number;
  finalPrice: number;
  finalPricePerSqm: number;
}

export interface VertriebsStatusResult {
  totalUnits: number;
  sold: number;
  reserved: number;
  available: number;
  soldPercent: number;
  reservedPercent: number;
  soldRevenue: number;
  expectedTotalRevenue: number;
}

export const PROJEKTCALC_DEFAULTS = {
  defaultPricePerSqm: 4500,
  floorPremiumPercent: 2,
  marginTargetPercent: 15,
} as const;

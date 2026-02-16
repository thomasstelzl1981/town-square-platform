/**
 * German Income Tax Calculator (ESt) - 2024/2025
 * Implements BMF PAP (Programmablaufplan) for Einkommensteuer calculation
 * 
 * Includes: Soli (automatically if applicable), Kirchensteuer, Kinderfreibeträge
 */

// 2024/2025 Tax Brackets (German ESt-Tarif § 32a EStG)
interface TaxBracket {
  min: number;
  max: number;
  rate: (zvE: number) => number;
}

// Grundfreibetrag 2024: 11.604 €, 2025: 12.096 €
const GRUNDFREIBETRAG = 12096;

// Solidaritätszuschlag Freigrenze (ab 2021): 18.130 € (Ledige) / 36.260 € (Verheiratete)
// Wird nur erhoben wenn ESt über dieser Grenze liegt
const SOLI_FREIGRENZE_EINZEL = 18130;
const SOLI_FREIGRENZE_SPLITTING = 36260;
const SOLI_RATE = 0.055; // 5,5%

// Kirchensteuersatz (BY/BW: 8%, Rest: 9%)
const KIRCHENSTEUER_RATE = 0.09;

// Kinderfreibetrag 2024: 3.192 € pro Kind (Existenzminimum)
// + Betreuungsfreibetrag: 1.464 € pro Kind
// Gesamt: 4.656 € pro Kind pro Elternteil
const KINDERFREIBETRAG_PRO_KIND = 4656;

export type TaxAssessmentType = 'EINZEL' | 'SPLITTING';

export interface TaxCalculationInput {
  taxableIncome: number; // zu versteuerndes Einkommen (zVE)
  assessmentType: TaxAssessmentType;
  churchTax: boolean;
  childrenCount: number;
}

export interface TaxCalculationResult {
  taxableIncome: number;
  incomeTax: number; // Einkommensteuer
  solidaritySurcharge: number; // Solidaritätszuschlag
  churchTax: number; // Kirchensteuer
  totalTax: number; // Gesamtsteuer
  marginalTaxRate: number; // Grenzsteuersatz in %
  effectiveTaxRate: number; // Effektiver Steuersatz in %
  netIncome: number; // Netto nach Steuern
  childAllowanceUsed: boolean; // Günstigerprüfung: Kinderfreibetrag statt Kindergeld
}

/**
 * Calculate German income tax (ESt) using 2024/2025 tariff
 * Based on § 32a EStG
 */
function calculateIncomeTax(zvE: number): number {
  if (zvE <= GRUNDFREIBETRAG) {
    return 0;
  }
  
  // Zone 2: 12.097 € - 17.005 €
  if (zvE <= 17005) {
    const y = (zvE - GRUNDFREIBETRAG) / 10000;
    return Math.floor((922.98 * y + 1400) * y);
  }
  
  // Zone 3: 17.006 € - 66.760 €
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000;
    return Math.floor((181.19 * z + 2397) * z + 1025.38);
  }
  
  // Zone 4: 66.761 € - 277.825 €
  if (zvE <= 277825) {
    return Math.floor(0.42 * zvE - 10602.13);
  }
  
  // Zone 5: > 277.825 € (Spitzensteuersatz 45%)
  return Math.floor(0.45 * zvE - 18936.88);
}

/**
 * Calculate marginal tax rate at given income level
 */
function calculateMarginalRate(zvE: number): number {
  if (zvE <= GRUNDFREIBETRAG) return 0;
  if (zvE <= 17005) {
    const y = (zvE - GRUNDFREIBETRAG) / 10000;
    // BMF-Formel gibt Promille zurück, daher Division durch 10000 für Dezimalwert
    return (2 * 922.98 * y + 1400) / 10000;
  }
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000;
    // BMF-Formel gibt Promille zurück, daher Division durch 10000 für Dezimalwert
    return (2 * 181.19 * z + 2397) / 10000;
  }
  if (zvE <= 277825) return 0.42;
  return 0.45;
}

/**
 * Full tax calculation including Soli, Kirchensteuer, and Kinderfreibetrag
 */
export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const { taxableIncome, assessmentType, churchTax, childrenCount } = input;
  
  const zvE = taxableIncome;
  let zvEForTax = zvE;
  
  // Apply Kinderfreibetrag (Günstigerprüfung wird vereinfacht angenommen)
  // Bei höheren Einkommen ist der Kinderfreibetrag meist günstiger als Kindergeld
  const childAllowanceTotal = childrenCount * KINDERFREIBETRAG_PRO_KIND;
  const childAllowanceUsed = childrenCount > 0 && zvE > 60000;
  
  if (childAllowanceUsed) {
    zvEForTax = Math.max(0, zvE - childAllowanceTotal);
  }
  
  // Calculate ESt based on assessment type
  let incomeTax: number;
  let soliFreigrenze: number;
  
  if (assessmentType === 'SPLITTING') {
    // Ehegattensplitting: zvE halbieren, Steuer verdoppeln
    const halfZvE = zvEForTax / 2;
    incomeTax = calculateIncomeTax(halfZvE) * 2;
    soliFreigrenze = SOLI_FREIGRENZE_SPLITTING;
  } else {
    incomeTax = calculateIncomeTax(zvEForTax);
    soliFreigrenze = SOLI_FREIGRENZE_EINZEL;
  }
  
  // Solidaritätszuschlag (nur wenn ESt über Freigrenze)
  let solidaritySurcharge = 0;
  if (incomeTax > soliFreigrenze) {
    // Gleitzone: Soli steigt graduell an
    const ueberFreigrenze = incomeTax - soliFreigrenze;
    const maxSoli = incomeTax * SOLI_RATE;
    // Soli ist gedeckelt auf 11,9% des Überschreitungsbetrags (Milderungszone)
    const milderungsSoli = ueberFreigrenze * 0.119;
    solidaritySurcharge = Math.min(maxSoli, milderungsSoli);
    solidaritySurcharge = Math.floor(solidaritySurcharge * 100) / 100;
  }
  
  // Kirchensteuer
  const churchTaxAmount = churchTax 
    ? Math.floor(incomeTax * KIRCHENSTEUER_RATE * 100) / 100 
    : 0;
  
  // Totals
  const totalTax = incomeTax + solidaritySurcharge + churchTaxAmount;
  const marginalTaxRate = calculateMarginalRate(
    assessmentType === 'SPLITTING' ? zvEForTax / 2 : zvEForTax
  ) * 100;
  const effectiveTaxRate = zvE > 0 ? (totalTax / zvE) * 100 : 0;
  const netIncome = zvE - totalTax;
  
  return {
    taxableIncome: zvE,
    incomeTax: Math.round(incomeTax),
    solidaritySurcharge: Math.round(solidaritySurcharge),
    churchTax: Math.round(churchTaxAmount),
    totalTax: Math.round(totalTax),
    marginalTaxRate: Math.round(marginalTaxRate * 10) / 10,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    netIncome: Math.round(netIncome),
    childAllowanceUsed,
  };
}

/**
 * Get effective tax rate for quick display
 */
export function getEffectiveTaxRate(input: TaxCalculationInput): number {
  const result = calculateTax(input);
  return result.effectiveTaxRate;
}

/**
 * Get marginal tax rate for investment calculations
 */
export function getMarginalTaxRate(input: TaxCalculationInput): number {
  const result = calculateTax(input);
  return result.marginalTaxRate;
}

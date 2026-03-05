/**
 * R-5: Extracted types and options from AnfrageFormV2.tsx
 */

export interface FinanceRequestData {
  id: string;
  tenant_id: string;
  status: string;
  property_id: string | null;
  object_source: string | null;
  purpose: string | null;
  object_address: string | null;
  object_type: string | null;
  object_construction_year: number | null;
  object_living_area_sqm: number | null;
  object_land_area_sqm: number | null;
  object_equipment_level: string | null;
  object_location_quality: string | null;
  purchase_price: number | null;
  modernization_costs: number | null;
  notary_costs: number | null;
  transfer_tax: number | null;
  broker_fee: number | null;
  equity_amount: number | null;
  loan_amount_requested: number | null;
  fixed_rate_period_years: number | null;
  repayment_rate_percent: number | null;
  max_monthly_rate: number | null;
}

export const purposeOptions = [
  { value: 'kauf', label: 'Kauf einer Bestandsimmobilie' },
  { value: 'neubau', label: 'Neubau / Errichtung' },
  { value: 'modernisierung', label: 'Modernisierung / Renovierung' },
  { value: 'umschuldung', label: 'Umschuldung / Anschlussfinanzierung' },
];

export const objectTypeOptions = [
  { value: 'eigentumswohnung', label: 'Eigentumswohnung' },
  { value: 'einfamilienhaus', label: 'Einfamilienhaus' },
  { value: 'zweifamilienhaus', label: 'Zweifamilienhaus' },
  { value: 'mehrfamilienhaus', label: 'Mehrfamilienhaus' },
  { value: 'grundstueck', label: 'Grundstück' },
  { value: 'gewerbe', label: 'Gewerbeobjekt' },
];

export const equipmentLevelOptions = [
  { value: 'einfach', label: 'Einfach' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'gehoben', label: 'Gehoben' },
  { value: 'luxus', label: 'Luxus' },
];

export const locationQualityOptions = [
  { value: 'einfach', label: 'Einfache Lage' },
  { value: 'mittel', label: 'Mittlere Lage' },
  { value: 'gut', label: 'Gute Lage' },
  { value: 'sehr_gut', label: 'Sehr gute Lage' },
];

export const fixedRatePeriodOptions = [
  { value: 5, label: '5 Jahre' },
  { value: 10, label: '10 Jahre' },
  { value: 15, label: '15 Jahre' },
  { value: 20, label: '20 Jahre' },
  { value: 25, label: '25 Jahre' },
  { value: 30, label: '30 Jahre' },
];

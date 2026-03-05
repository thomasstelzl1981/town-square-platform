/**
 * R-2: Extracted types and helpers from ExposeDetail.tsx
 */

export interface UnitData {
  id: string;
  unit_number: string | null;
  area_sqm: number | null;
  current_monthly_rent: number | null;
  property_id: string;
}

export interface PropertyData {
  id: string;
  code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  total_area_sqm: number | null;
  year_built: number | null;
  renovation_year: number | null;
  energy_source: string | null;
  heating_type: string | null;
  market_value: number | null;
  purchase_price: number | null;
  tenant_id: string;
}

export interface PropertyAccountingData {
  afa_rate_percent: number | null;
  afa_method: string | null;
  book_value_eur: number | null;
  land_share_percent: number | null;
  building_share_percent: number | null;
}

export interface ListingData {
  id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string;
  title: string;
  description: string | null;
  asking_price: number | null;
  commission_rate: number | null;
  status: string;
  partner_visibility: string | null;
  sales_mandate_consent_id: string | null;
}

export interface PublicationData {
  channel: string;
  status: string;
}

export interface ExposeFormData {
  title: string;
  description: string;
  asking_price: string;
  commission_rate: number[];
}

export const formatCurrency = (value: number | null | undefined) => {
  if (!value) return '—';
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercent = (value: number | null | undefined) => {
  if (!value) return '—';
  return `${value.toFixed(2)} %`;
};

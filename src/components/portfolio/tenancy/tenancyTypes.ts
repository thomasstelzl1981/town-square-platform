/**
 * Shared types and constants for TenancyTab sub-components
 */

export interface Lease {
  id: string;
  status: string;
  monthly_rent: number;
  start_date: string;
  end_date: string | null;
  tenant_since: string | null;
  rent_increase: string | null;
  renter_org_id: string | null;
  tenant_contact_id: string;
  lease_type?: string;
  rent_cold_eur?: number;
  nk_advance_eur?: number;
  heating_advance_eur?: number;
  deposit_amount_eur?: number;
  deposit_status?: string;
  payment_due_day?: number;
  rent_model?: string;
  next_rent_adjustment_date?: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

export type LeaseWithContact = Lease & { tenant_contact?: Contact };

export interface LeaseEdits {
  [leaseId: string]: Partial<{
    lease_type: string;
    rent_cold_eur: string;
    nk_advance_eur: string;
    heating_advance_eur: string;
    deposit_amount_eur: string;
    deposit_status: string;
    payment_due_day: string;
    rent_model: string;
    next_rent_adjustment_date: string;
    start_date: string;
    end_date: string;
    tenant_contact_id: string;
  }>;
}

export type LetterType = 'kuendigung' | 'mieterhoehung' | 'abmahnung';

export const LEASE_TYPES = [
  { value: 'unbefristet', label: 'Unbefristet' },
  { value: 'befristet', label: 'Befristet' },
  { value: 'staffel', label: 'Staffelmiete' },
  { value: 'index', label: 'Indexmiete' },
  { value: 'gewerbe', label: 'Gewerbe' },
];

export const DEPOSIT_STATUSES = [
  { value: 'PAID', label: 'Gezahlt' },
  { value: 'OPEN', label: 'Offen' },
  { value: 'PARTIAL', label: 'Teilweise' },
];

export const RENT_MODELS = [
  { value: 'FIX', label: 'Festmiete' },
  { value: 'INDEX', label: 'Indexmiete' },
  { value: 'STAFFEL', label: 'Staffelmiete' },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export const calculateWarmRent = (cold: string, nk: string, heating: string) =>
  (parseFloat(cold) || 0) + (parseFloat(nk) || 0) + (parseFloat(heating) || 0);

export const getField = (lease: Lease, edits: LeaseEdits, field: string): string => {
  const leaseEdits = edits[lease.id];
  if (leaseEdits && field in leaseEdits) return (leaseEdits as any)[field];
  const val = (lease as any)[field];
  return val != null ? String(val) : '';
};

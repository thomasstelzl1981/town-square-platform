/**
 * R-4: Extracted types and helpers from KontexteTab.tsx
 */
import type { TaxAssessmentType } from '@/lib/taxCalculator';

export interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  tax_regime: string | null;
  is_default: boolean | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  tax_rate_percent: number | null;
  managing_director: string | null;
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
  md_salutation?: string | null;
  md_first_name?: string | null;
  md_last_name?: string | null;
  tax_number?: string | null;
  registry_court?: string | null;
}

export interface ContextMember {
  id: string;
  context_id: string;
  first_name: string;
  last_name: string;
  ownership_share: number | null;
  birth_name: string | null;
  birth_date: string | null;
  tax_class: string | null;
  profession: string | null;
  gross_income_yearly: number | null;
  church_tax: boolean | null;
}

export interface ContextFormData {
  name: string;
  context_type: 'PRIVATE' | 'BUSINESS';
  tax_rate_percent: number;
  taxable_income_yearly: number | null;
  tax_assessment_type: TaxAssessmentType;
  church_tax: boolean;
  children_count: number;
  managing_director: string;
  legal_form: string;
  hrb_number: string;
  ust_id: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  md_salutation: string;
  md_first_name: string;
  md_last_name: string;
  tax_number: string;
  registry_court: string;
}

export interface OwnerData {
  id?: string;
  first_name: string;
  last_name: string;
  tax_class: string;
  ownership_share: number;
  gross_income_yearly: number | null;
  profession: string;
}

export const formatAddress = (ctx: LandlordContext) => {
  const parts = [ctx.street, ctx.house_number].filter(Boolean).join(' ');
  const cityParts = [ctx.postal_code, ctx.city].filter(Boolean).join(' ');
  return [parts, cityParts].filter(Boolean).join(', ') || null;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

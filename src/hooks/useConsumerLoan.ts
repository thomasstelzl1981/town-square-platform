/**
 * useConsumerLoan — CRUD + Mock Offers for consumer_loan_cases
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calcConsumerLoanOffers } from '@/engines/finanzierung/engine';

// ── Types ──
export interface ConsumerLoanCase {
  id: string;
  tenant_id: string;
  user_id: string;
  source_profile_id: string | null;
  employment_status: string;
  requested_amount: number | null;
  requested_term_months: number | null;
  selected_offer_id: string | null;
  selected_offer_data: Record<string, unknown> | null;
  status: string;
  provider: string;
  provider_case_ref: string | null;
  consent_data_correct: boolean;
  consent_credit_check: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockOffer {
  id: string;
  bank_name: string;
  apr: number;
  monthly_rate: number;
  total_amount: number;
  term_months: number;
  recommended: boolean;
}

export interface ConsumerLoanFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  salutation: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  email: string;
  phone: string;
  nationality: string;
  employer_name: string;
  employed_since: string;
  contract_type: string;
  position: string;
  net_income_monthly: string;
  current_rent_monthly: string;
  marital_status: string;
  children_count: string;
}

export const EMPTY_FORM_DATA: ConsumerLoanFormData = {
  first_name: '', last_name: '', birth_date: '', salutation: '',
  address_street: '', address_postal_code: '', address_city: '',
  email: '', phone: '', nationality: '',
  employer_name: '', employed_since: '', contract_type: '', position: '',
  net_income_monthly: '', current_rent_monthly: '', marital_status: '', children_count: '',
};

const QUERY_KEY = ['consumer-loan-case'];

// ── Query: Load current draft case ──
export function useConsumerLoanCase() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumer_loan_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ConsumerLoanCase | null;
    },
  });
}

// ── Mutation: Create new case ──
export function useCreateConsumerLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tenant_id: string; user_id: string; source_profile_id?: string }) => {
      const { data, error } = await supabase
        .from('consumer_loan_cases')
        .insert({
          tenant_id: input.tenant_id,
          user_id: input.user_id,
          source_profile_id: input.source_profile_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ConsumerLoanCase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ── Mutation: Update case fields ──
export function useUpdateConsumerLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConsumerLoanCase> & { id: string }) => {
      const { error } = await supabase
        .from('consumer_loan_cases')
        .update(updates as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ── Mutation: Submit case ──
export function useSubmitConsumerLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consumer_loan_cases')
        .update({ status: 'submitted' } as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
      // Adapter stub — will be replaced
      // await europace_submit_consumer_loan_case(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Antrag eingereicht');
    },
  });
}

// ── Mock Offer Calculator (delegates to Engine, maps to legacy shape) ──
const MOCK_BANKS = [
  { name: 'SWK Bank', minRate: 5.49, maxRate: 6.29 },
  { name: 'SKG Bank', minRate: 5.59, maxRate: 6.39 },
  { name: 'DKB', minRate: 5.99, maxRate: 6.79 },
  { name: 'ING', minRate: 6.19, maxRate: 6.99 },
  { name: 'Targobank', minRate: 6.59, maxRate: 7.49 },
  { name: 'Commerzbank', minRate: 7.09, maxRate: 7.99 },
  { name: 'Postbank', minRate: 6.69, maxRate: 7.49 },
  { name: 'Santander', minRate: 7.59, maxRate: 8.49 },
];

export function calculateMockOffers(amount: number, termMonths: number): MockOffer[] {
  // Use 8-bank spread logic for consumer loan UI (differs from engine's generic 5-bank model)
  const offers = MOCK_BANKS.map((bank, idx) => {
    const spread = bank.maxRate - bank.minRate;
    const factor = ((amount * 7 + idx * 1337) % 100) / 100;
    const apr = Math.round((bank.minRate + spread * factor) * 100) / 100;

    const monthlyRate = apr / 100 / 12;
    const monthly = monthlyRate > 0
      ? amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths))
      : amount / termMonths;

    return {
      id: `mock-${bank.name.toLowerCase().replace(/\s/g, '-')}-${idx}`,
      bank_name: bank.name,
      apr,
      monthly_rate: Math.round(monthly * 100) / 100,
      total_amount: Math.round(monthly * termMonths * 100) / 100,
      term_months: termMonths,
      recommended: false,
    };
  });

  const cheapest = offers.reduce((a, b) => a.apr < b.apr ? a : b);
  cheapest.recommended = true;

  return offers.sort((a, b) => a.apr - b.apr);
}

/** Engine-backed offers (5 generic banks) */
export { calcConsumerLoanOffers };

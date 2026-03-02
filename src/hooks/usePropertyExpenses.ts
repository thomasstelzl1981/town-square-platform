/**
 * usePropertyExpenses — CRUD hook for property_expenses table (MOD-04)
 * Tracks manual and bank-matched expenses per property for NK, Steuer, BWA flows.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ExpenseCategory =
  | 'instandhaltung'
  | 'handwerker'
  | 'versicherung'
  | 'verwalterkosten'
  | 'rechtsberatung'
  | 'fahrtkosten'
  | 'bankgebuehren'
  | 'weg_hausgeld'
  | 'grundsteuer'
  | 'sonstige';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  instandhaltung: 'Instandhaltung / Reparatur',
  handwerker: 'Handwerkerleistung',
  versicherung: 'Versicherung (nicht umlf.)',
  verwalterkosten: 'Verwalterkosten',
  rechtsberatung: 'Rechtsberatung',
  fahrtkosten: 'Fahrtkosten',
  bankgebuehren: 'Bankgebühren',
  weg_hausgeld: 'WEG-Hausgeld',
  grundsteuer: 'Grundsteuer',
  sonstige: 'Sonstige Ausgaben',
};

/** Maps expense categories → Anlage V cost field names */
export const CATEGORY_TO_TAX_FIELD: Record<ExpenseCategory, string> = {
  instandhaltung: 'costMaintenance',
  handwerker: 'costMaintenance',
  versicherung: 'costInsuranceNonRecoverable',
  verwalterkosten: 'costManagementFee',
  rechtsberatung: 'costLegalAdvisory',
  fahrtkosten: 'costTravel',
  bankgebuehren: 'costBankFees',
  weg_hausgeld: 'costOther',
  grundsteuer: 'costOther', // Grundsteuer usually comes from NK, but manual fallback
  sonstige: 'costOther',
};

export interface PropertyExpense {
  id: string;
  tenant_id: string;
  user_id: string;
  property_id: string;
  unit_id: string | null;
  lease_id: string | null;
  category: ExpenseCategory;
  amount: number;
  tax_deductible: boolean;
  is_apportionable: boolean;
  label: string;
  description: string | null;
  expense_date: string;
  period_from: string | null;
  period_to: string | null;
  bank_transaction_id: string | null;
  source: 'manual' | 'bank_matched';
  receipt_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  property_id: string;
  unit_id?: string;
  lease_id?: string;
  category: ExpenseCategory;
  amount: number;
  label: string;
  description?: string;
  expense_date: string;
  period_from?: string;
  period_to?: string;
  tax_deductible?: boolean;
  is_apportionable?: boolean;
  bank_transaction_id?: string;
  source?: 'manual' | 'bank_matched';
}

export function usePropertyExpenses(propertyId?: string, year?: number) {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['property-expenses', activeTenantId, propertyId, year];

  const { data: expenses = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeTenantId || !propertyId) return [];
      let query = (supabase as any)
        .from('property_expenses')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('property_id', propertyId)
        .order('expense_date', { ascending: false });

      if (year) {
        query = query
          .gte('expense_date', `${year}-01-01`)
          .lte('expense_date', `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PropertyExpense[];
    },
    enabled: !!activeTenantId && !!propertyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
  };

  const createExpense = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await (supabase as any).from('property_expenses').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        ...input,
        tax_deductible: input.tax_deductible ?? true,
        is_apportionable: input.is_apportionable ?? false,
        source: input.source ?? 'manual',
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateExpense = useMutation({
    mutationFn: async (input: { id: string } & Partial<CreateExpenseInput>) => {
      const { id, ...rest } = input;
      const { error } = await (supabase as any).from('property_expenses').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('property_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Aggregate expenses by tax field for Anlage V pre-fill */
  const taxAggregation = expenses.reduce((acc, exp) => {
    if (!exp.tax_deductible) return acc;
    const field = CATEGORY_TO_TAX_FIELD[exp.category] || 'costOther';
    acc[field] = (acc[field] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return { expenses, isLoading, createExpense, updateExpense, deleteExpense, taxAggregation };
}

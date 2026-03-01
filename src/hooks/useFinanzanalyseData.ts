/**
 * MOD-18 Finanzanalyse — Zentraler Daten-Hook
 * Liest read-only aus MOD-11 SSOT-Tabellen (bank_transactions, fm_*)
 * und eigene Analyse-Tabellen (analytics_*)
 * + CRUD für household_persons + pension_records
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';

// ─── Types ───────────────────────────────────────────────────
export interface FinanzKPI {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  fixedCosts: number;
  subscriptionCount: number;
  insuranceCount: number;
  insuranceMonthlyCost: number;
  topCategories: { category: string; total: number }[];
  topMerchants: { merchant: string; total: number; count: number }[];
}

export interface MonthlyFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface BudgetSetting {
  id: string;
  category: string;
  monthly_target: number;
}

const CATEGORIES = ['Wohnen', 'Mobilität', 'Lebensmittel', 'Freizeit', 'Abos', 'Versicherungen', 'Telekom', 'Sonstiges'] as const;
export { CATEGORIES };

// ─── Kategorisierung ────────────────────────────────────────
function categorizeTransaction(purpose: string, merchant: string): string {
  const text = `${purpose} ${merchant}`.toLowerCase();
  if (text.match(/miete|wohnung|immobilien|hausgeld/)) return 'Wohnen';
  if (text.match(/tank|benzin|auto|bahn|db |flixbus|uber|taxi|leasing/)) return 'Mobilität';
  if (text.match(/edeka|rewe|aldi|lidl|penny|netto|supermarkt|lebensmittel/)) return 'Lebensmittel';
  if (text.match(/netflix|spotify|disney|prime|abo|subscription|apple\s?music/)) return 'Abos';
  if (text.match(/versicherung|allianz|huk|axa|ergo|signal|gothaer/)) return 'Versicherungen';
  if (text.match(/telekom|vodafone|o2|1&1|mobilfunk|internet|telefon/)) return 'Telekom';
  if (text.match(/kino|restaurant|bar|fitness|sport|hobby|urlaub|reise/)) return 'Freizeit';
  return 'Sonstiges';
}

// ─── Main Hook ───────────────────────────────────────────────
export function useFinanzanalyseData() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');

  // 1) Bank Transactions (12 Monate)
  const twelveMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  }, []);

  const transactionsQuery = useQuery({
    queryKey: ['fa-transactions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .gte('booking_date', twelveMonthsAgo)
        .order('booking_date', { ascending: false });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 2) Budget Settings
  const budgetQuery = useQuery({
    queryKey: ['fa-budgets', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('analytics_budget_settings')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return (data || []) as BudgetSetting[];
    },
    enabled: !!activeTenantId,
  });

  // 3) Category Overrides
  const overridesQuery = useQuery({
    queryKey: ['fa-overrides', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('analytics_category_overrides')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 4) Household Persons
  const personsQuery = useQuery({
    queryKey: ['fa-persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('household_persons')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 5) Pension Records
  const pensionQuery = useQuery({
    queryKey: ['fa-pensions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('pension_records')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Aggregations ──────────────────────────────────────────
  const transactions = transactionsQuery.data || [];
  const overrides = overridesQuery.data || [];

  const categorizedTransactions = useMemo(() => {
    return transactions.map(tx => {
      const override = overrides.find(o =>
        (tx.counterparty || '').toLowerCase().includes(o.merchant_pattern.toLowerCase())
      );
      const category = override?.category || categorizeTransaction(tx.purpose_text || '', tx.counterparty || '');
      return { ...tx, category };
    });
  }, [transactions, overrides]);

  const kpis = useMemo<FinanzKPI>(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const merchantMap = new Map<string, { total: number; count: number }>();
    const categoryMap = new Map<string, number>();

    for (const tx of categorizedTransactions) {
      const amt = tx.amount_eur || 0;
      if (amt > 0) totalIncome += amt;
      else totalExpenses += Math.abs(amt);

      const merchant = tx.counterparty || 'Unbekannt';
      const existing = merchantMap.get(merchant) || { total: 0, count: 0 };
      existing.total += Math.abs(amt);
      existing.count += 1;
      merchantMap.set(merchant, existing);

      if (amt < 0) {
        categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + Math.abs(amt));
      }
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, { total, count }]) => ({ merchant, total, count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      fixedCosts: 0,
      subscriptionCount: 0,
      insuranceCount: 0,
      insuranceMonthlyCost: 0,
      topCategories,
      topMerchants,
    };
  }, [categorizedTransactions]);

  const monthlyFlows = useMemo<MonthlyFlow[]>(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const tx of categorizedTransactions) {
      const month = (tx.booking_date || '').substring(0, 7);
      if (!month) continue;
      const entry = map.get(month) || { income: 0, expenses: 0 };
      const amt = tx.amount_eur || 0;
      if (amt > 0) entry.income += amt;
      else entry.expenses += Math.abs(amt);
      map.set(month, entry);
    }
    return Array.from(map.entries())
      .map(([month, { income, expenses }]) => ({ month, income, expenses, net: income - expenses }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [categorizedTransactions]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; budget: number; transactions: typeof categorizedTransactions }>();
    const budgets = budgetQuery.data || [];

    for (const cat of CATEGORIES) {
      const budget = budgets.find(b => b.category === cat)?.monthly_target || 0;
      const txs = categorizedTransactions.filter(tx => tx.category === cat && (tx.amount_eur || 0) < 0);
      const total = txs.reduce((s, tx) => s + Math.abs(tx.amount_eur || 0), 0);
      map.set(cat, { total, budget, transactions: txs });
    }
    return map;
  }, [categorizedTransactions, budgetQuery.data]);

  // ─── Budget Upsert ─────────────────────────────────────────
  const upsertBudget = useMutation({
    mutationFn: async ({ category, monthly_target }: { category: string; monthly_target: number }) => {
      if (!activeTenantId) throw new Error('No tenant');
      const existing = (budgetQuery.data || []).find(b => b.category === category);
      if (existing) {
        await supabase.from('analytics_budget_settings').update({ monthly_target }).eq('id', existing.id);
      } else {
        await supabase.from('analytics_budget_settings').insert({
          tenant_id: activeTenantId,
          user_id: user?.id || null,
          category,
          monthly_target,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fa-budgets'] }),
  });

  // ─── Person CRUD ───────────────────────────────────────────
  const createPerson = useMutation({
    mutationFn: async (person: {
      role: string;
      salutation?: string;
      first_name: string;
      last_name: string;
      birth_date?: string;
      email?: string;
      phone?: string;
    }) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { data, error } = await supabase.from('household_persons').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        ...person,
        birth_date: person.birth_date || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fa-persons'] });
      queryClient.invalidateQueries({ queryKey: ['fb-household-persons'] });
    },
  });

  const updatePerson = useMutation({
    mutationFn: async (person: Record<string, any>) => {
      const { id, created_at, updated_at, ...rest } = person;
      // Sanitize numeric fields: empty strings → null
      const numericFields = [
        'gross_income_monthly', 'net_income_monthly', 'business_income_monthly',
        'pv_income_monthly', 'other_income_monthly', 'child_allowances',
        'ruhegehaltfaehiges_grundgehalt', 'ruhegehaltfaehige_dienstjahre', 'erfahrungsstufe',
      ];
      for (const field of numericFields) {
        if (field in rest && (rest[field] === '' || rest[field] === undefined)) {
          rest[field] = null;
        } else if (field in rest && rest[field] !== null) {
          rest[field] = Number(rest[field]);
          if (isNaN(rest[field])) rest[field] = null;
        }
      }
      const { error } = await supabase.from('household_persons').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fa-persons'] });
      queryClient.invalidateQueries({ queryKey: ['fb-household-persons'] });
    },
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('household_persons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fa-persons'] });
      queryClient.invalidateQueries({ queryKey: ['fb-household-persons'] });
    },
  });

  // ─── Pension Upsert ────────────────────────────────────────
  const upsertPension = useMutation({
    mutationFn: async (data: {
      personId: string;
      pension_type?: string;
      info_date?: string | null;
      current_pension?: number | null;
      projected_pension?: number | null;
      disability_pension?: number | null;
    }) => {
      if (!activeTenantId) throw new Error('No tenant');
      const existing = (pensionQuery.data || []).find(p => p.person_id === data.personId);
      if (existing) {
        const { error } = await supabase.from('pension_records').update({
          pension_type: data.pension_type || 'drv',
          info_date: data.info_date,
          current_pension: data.current_pension,
          projected_pension: data.projected_pension,
          disability_pension: data.disability_pension,
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pension_records').insert({
          person_id: data.personId,
          tenant_id: activeTenantId,
          pension_type: data.pension_type || 'drv',
          info_date: data.info_date,
          current_pension: data.current_pension,
          projected_pension: data.projected_pension,
          disability_pension: data.disability_pension,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fa-pensions'] }),
  });

  // ─── Setup Health Check ────────────────────────────────────
  const setupStatus = useMemo(() => ({
    hasTransactions: transactions.length > 0,
    hasBudgets: (budgetQuery.data || []).length > 0,
    hasOverrides: overrides.length > 0,
    completionPercent: [
      transactions.length > 0,
      (budgetQuery.data || []).length > 0,
    ].filter(Boolean).length / 2 * 100,
  }), [transactions, budgetQuery.data, overrides]);

  return {
    // Raw
    transactions: categorizedTransactions,
    budgets: budgetQuery.data || [],
    // Persons (filtered by demo toggle)
    persons: demoEnabled
      ? (personsQuery.data || [])
      : (personsQuery.data || []).filter((p: any) => !isDemoId(p.id)),
    pensionRecords: demoEnabled
      ? (pensionQuery.data || [])
      : (pensionQuery.data || []).filter((p: any) => !isDemoId(p.person_id || p.id)),
    // Aggregated
    kpis,
    monthlyFlows,
    categoryBreakdown,
    setupStatus,
    // Mutations
    upsertBudget,
    createPerson,
    updatePerson,
    deletePerson,
    upsertPension,
    // Loading
    isLoading: transactionsQuery.isLoading || budgetQuery.isLoading || personsQuery.isLoading,
  };
}

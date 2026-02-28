/**
 * useFinanzberichtData — Data Fetcher für den Finanzbericht
 * Loads raw data from Supabase and delegates all calculations to the Finanzübersicht engine.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { getDemoKVContracts, isDemoId } from '@/engines/demoData';
import { calcFinanzuebersicht } from '@/engines/finanzuebersicht/engine';
import type { DemoKVContract } from '@/engines/demoData/spec';
import type { FUResult, FUDepotPositionItem } from '@/engines/finanzuebersicht/spec';

// ─── Re-export types for backward compatibility ──────────────
export type FinanzberichtIncome = FUResult['income'];
export type FinanzberichtExpenses = FUResult['expenses'];
export type FinanzberichtAssets = FUResult['assets'];
export type FinanzberichtLiabilities = FUResult['liabilities'];
export type FinanzberichtProjectionYear = FUResult['projection'][number];
export type ContractSummary = FUResult['savingsContracts'][number];
export type SubscriptionsByCategory = FUResult['subscriptionsByCategory'][number];
export type EnergyContract = FUResult['energyContracts'][number];
export type PropertyListItem = FUResult['propertyList'][number];
export type LoanListItem = FUResult['loanList'][number];
export type { FUDepotPositionItem };

export interface FinanzberichtData extends FUResult {
  kvContracts: readonly DemoKVContract[];
  isLoading: boolean;
}

export function useFinanzberichtData(): FinanzberichtData {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const { summary: portfolioSummary, isLoading: portfolioLoading } = usePortfolioSummary();
  const { persons, isLoading: personsLoading } = useFinanzanalyseData();

  // ─── Household Persons (PRIMARY income source) ────────────
  const { data: householdPersons = [], isLoading: hpLoading } = useQuery({
    queryKey: ['fb-household-persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('household_persons')
        .select('id, role, first_name, last_name, net_income_monthly, gross_income_monthly, business_income_monthly, pv_income_monthly, child_allowances, employment_status, other_income_monthly')
        .eq('tenant_id', activeTenantId)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Applicant Profiles (fallback income source) ──────────
  const { data: applicantProfiles = [], isLoading: apLoading } = useQuery({
    queryKey: ['fb-applicant-profiles', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('applicant_profiles')
        .select('net_income_monthly, self_employed_income_monthly, side_job_income_monthly, child_benefit_monthly, other_regular_income_monthly, rental_income_monthly, living_expenses_monthly, current_rent_monthly, health_insurance_monthly, bank_savings, securities_value, life_insurance_value')
        .eq('tenant_id', activeTenantId)
        .eq('profile_type', 'private')
        .is('finance_request_id', null);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Investment Depots ────────────────────────────────────
  const { data: depotAccounts = [] } = useQuery({
    queryKey: ['fb-depot-accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await (supabase as any)
        .from('finapi_depot_accounts')
        .select('id, account_name, bank_name, status')
        .eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  const { data: depotPositions = [] } = useQuery({
    queryKey: ['fb-depot-positions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await (supabase as any)
        .from('finapi_depot_positions')
        .select('id, depot_account_id, name, isin, current_value, purchase_value, profit_or_loss')
        .eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  // ─── Vehicles ─────────────────────────────────────────────
  const { data: vehicles = [] } = useQuery({
    queryKey: ['fb-vehicles', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await (supabase as any)
        .from('cars_vehicles')
        .select('id, make, model, estimated_value_eur')
        .eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  // ─── Manual Expenses ──────────────────────────────────────
  const { data: manualExpenses = [] } = useQuery({
    queryKey: ['fb-manual-expenses', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await (supabase as any)
        .from('manual_expenses')
        .select('id, category, label, monthly_amount')
        .eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  // ─── Zuhause ──────────────────────────────────────────────
  const { data: homes = [], isLoading: homesLoading } = useQuery({
    queryKey: ['fb-miety-homes', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_homes').select('id, name, market_value, ownership_type, city, address').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: portfolioProperties = [] } = useQuery({
    queryKey: ['fb-portfolio-properties', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('properties').select('id, code, city, address, market_value, purchase_price, property_type, status').eq('tenant_id', activeTenantId).eq('status', 'active');
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: mietyLoans = [] } = useQuery({
    queryKey: ['fb-miety-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_loans').select('id, bank_name, loan_amount, remaining_balance, monthly_rate, interest_rate, loan_type').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: tenancies = [] } = useQuery({
    queryKey: ['fb-miety-tenancies', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_tenancies').select('total_rent, base_rent, additional_costs').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: insuranceData = [] } = useQuery({
    queryKey: ['fb-insurance', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('insurance_contracts').select('id, category, insurer, premium, payment_interval, policy_no, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: vorsorgeData = [] } = useQuery({
    queryKey: ['fb-vorsorge', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('vorsorge_contracts').select('id, contract_type, provider, premium, payment_interval, contract_no, status, current_balance').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['fb-subscriptions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('user_subscriptions').select('id, merchant, category, amount, frequency, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: mietyContracts = [] } = useQuery({
    queryKey: ['fb-miety-contracts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_contracts').select('id, category, provider_name, contract_number, monthly_cost, start_date').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: pvPlants = [] } = useQuery({
    queryKey: ['fb-pv-plants', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('pv_plants' as any).select('id, loan_bank, loan_amount, loan_monthly_rate, loan_interest_rate, loan_remaining_balance, annual_yield_kwh, feed_in_tariff_cents, annual_revenue').eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  const { data: privateLoansList = [] } = useQuery({
    queryKey: ['fb-private-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('private_loans' as any).select('id, loan_purpose, bank_name, loan_amount, remaining_balance, interest_rate, monthly_rate, status').eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  const { data: legalDocs = [] } = useQuery({
    queryKey: ['fb-legal-docs', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('legal_documents').select('document_type, is_completed').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: portfolioLoans = [] } = useQuery({
    queryKey: ['fb-portfolio-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('loans').select('id, bank_name, original_amount, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent, property_id').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Aggregation via Engine ───────────────────────────────
  return useMemo(() => {
    const isLoading = portfolioLoading || personsLoading || apLoading || homesLoading || hpLoading;
    const kvContracts = demoEnabled ? getDemoKVContracts() : [];

    // Filter out demo data from DB results when demo is OFF
    const filteredInsurance = demoEnabled ? insuranceData : insuranceData.filter(r => !isDemoId(r.id));
    const filteredVorsorge = demoEnabled ? vorsorgeData : vorsorgeData.filter(r => !isDemoId(r.id));
    const filteredSubscriptions = demoEnabled ? subscriptions : (subscriptions as any[]).filter(r => !isDemoId(r.id));
    const filteredPvPlants = demoEnabled ? pvPlants : (pvPlants as any[]).filter(r => !isDemoId(r.id));
    const filteredPrivateLoans = demoEnabled ? privateLoansList : (privateLoansList as any[]).filter(r => !isDemoId(r.id));
    const filteredPortfolioLoans = demoEnabled ? portfolioLoans : portfolioLoans.filter(r => !isDemoId(r.id));
    const filteredMietyContracts = demoEnabled ? mietyContracts : (mietyContracts as any[]).filter(r => !isDemoId(r.id));
    const filteredDepotAccounts = demoEnabled ? depotAccounts : (depotAccounts as any[]).filter((r: any) => !isDemoId(r.id));
    const filteredDepotPositions = demoEnabled ? depotPositions : (depotPositions as any[]).filter((r: any) => !isDemoId(r.id));
    const filteredVehicles = demoEnabled ? vehicles : (vehicles as any[]).filter((r: any) => !isDemoId(r.id));
    const filteredHouseholdPersons = demoEnabled ? householdPersons : (householdPersons as any[]).filter((r: any) => !isDemoId(r.id));

    const result = calcFinanzuebersicht({
      applicantProfiles,
      householdPersons: filteredHouseholdPersons as any[],
      portfolioSummary: portfolioSummary ? {
        annualIncome: portfolioSummary.annualIncome,
        annualInterest: portfolioSummary.annualInterest,
        annualAmortization: portfolioSummary.annualAmortization,
        totalValue: portfolioSummary.totalValue,
        totalDebt: portfolioSummary.totalDebt,
        avgInterestRate: portfolioSummary.avgInterestRate,
      } : null,
      homes: (demoEnabled ? homes : homes.filter((r: any) => !isDemoId(r.id))) as any[],
      mietyLoans: demoEnabled ? mietyLoans : mietyLoans.filter((r: any) => !isDemoId(r.id)),
      tenancies: demoEnabled ? tenancies : tenancies.filter((r: any) => !isDemoId(r.id)),
      insuranceData: filteredInsurance,
      vorsorgeData: filteredVorsorge,
      subscriptions: filteredSubscriptions as any[],
      mietyContracts: filteredMietyContracts as any[],
      pvPlants: filteredPvPlants as any[],
      privateLoans: filteredPrivateLoans as any[],
      portfolioLoans: filteredPortfolioLoans as any[],
      portfolioProperties: (demoEnabled ? portfolioProperties : portfolioProperties.filter((r: any) => !isDemoId(r.id))) as any[],
      legalDocs: (demoEnabled ? legalDocs : legalDocs.filter((r: any) => !isDemoId(r.id))) as any[],
      kvContracts: kvContracts as any[],
      depotAccounts: filteredDepotAccounts as any[],
      depotPositions: filteredDepotPositions as any[],
      vehicles: filteredVehicles as any[],
      manualExpenses: manualExpenses as any[],
    });

    return {
      ...result,
      kvContracts,
      isLoading,
    };
  }, [portfolioSummary, portfolioLoading, personsLoading, apLoading, homesLoading, hpLoading, applicantProfiles, householdPersons, homes, mietyLoans, tenancies, insuranceData, vorsorgeData, subscriptions, legalDocs, portfolioLoans, pvPlants, mietyContracts, portfolioProperties, privateLoansList, depotAccounts, depotPositions, vehicles, manualExpenses, demoEnabled]);
}

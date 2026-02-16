/**
 * useFinanzberichtData — Zentraler Aggregations-Hook für den Finanzbericht
 * Sammelt Daten aus: Portfolio (MOD-04), Zuhause, Versicherungen, Vorsorge, Abos, Einkommen
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';

// ─── Types ───────────────────────────────────────────────────
export interface FinanzberichtIncome {
  netIncomeTotal: number;
  selfEmployedIncome: number;
  rentalIncomePortfolio: number;
  sideJobIncome: number;
  childBenefit: number;
  otherIncome: number;
  totalIncome: number;
}

export interface FinanzberichtExpenses {
  warmRent: number;
  privateLoans: number;
  portfolioLoans: number;
  insurancePremiums: number;
  savingsContracts: number;
  subscriptions: number;
  livingExpenses: number;
  totalExpenses: number;
}

export interface FinanzberichtAssets {
  propertyValue: number;
  homeValue: number;
  bankSavings: number;
  securities: number;
  surrenderValues: number;
  totalAssets: number;
}

export interface FinanzberichtLiabilities {
  portfolioDebt: number;
  homeDebt: number;
  otherDebt: number;
  totalLiabilities: number;
}

export interface FinanzberichtProjectionYear {
  year: number;
  propertyValue: number;
  cumulativeSavings: number;
  remainingDebt: number;
  netWealth: number;
}

export interface ContractSummary {
  id: string;
  type: string;
  provider: string;
  monthlyAmount: number;
  contractNo?: string;
}

export interface FinanzberichtData {
  income: FinanzberichtIncome;
  expenses: FinanzberichtExpenses;
  assets: FinanzberichtAssets;
  liabilities: FinanzberichtLiabilities;
  monthlyAmortization: number;
  monthlySavings: number;
  netWealth: number;
  liquidityPercent: number;
  projection: FinanzberichtProjectionYear[];
  savingsContracts: ContractSummary[];
  insuranceContracts: ContractSummary[];
  loanContracts: ContractSummary[];
  vorsorgeContracts: ContractSummary[];
  testamentCompleted: boolean;
  patientenverfuegungCompleted: boolean;
  isLoading: boolean;
}

function monthlyFromInterval(premium: number | null, interval: string | null): number {
  if (!premium) return 0;
  switch (interval) {
    case 'jaehrlich': return premium / 12;
    case 'halbjaehrlich': return premium / 6;
    case 'vierteljaehrlich': return premium / 3;
    case 'monatlich': default: return premium;
  }
}

export function useFinanzberichtData(): FinanzberichtData {
  const { activeTenantId } = useAuth();
  const { summary: portfolioSummary, isLoading: portfolioLoading } = usePortfolioSummary();
  const { persons, isLoading: personsLoading } = useFinanzanalyseData();

  // ─── Applicant Profiles (Einkommen/Ausgaben) ──────────────
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

  // ─── Zuhause (miety_homes + loans + tenancies) ────────────
  const { data: homes = [], isLoading: homesLoading } = useQuery({
    queryKey: ['fb-miety-homes', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_homes').select('id, market_value, ownership_type').eq('tenant_id', activeTenantId);
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

  // ─── Versicherungen ───────────────────────────────────────
  const { data: insuranceData = [] } = useQuery({
    queryKey: ['fb-insurance', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('insurance_contracts').select('id, category, insurer, premium, payment_interval, policy_no, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Vorsorge ─────────────────────────────────────────────
  const { data: vorsorgeData = [] } = useQuery({
    queryKey: ['fb-vorsorge', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('vorsorge_contracts').select('id, contract_type, provider, premium, payment_interval, contract_no, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Abonnements ──────────────────────────────────────────
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['fb-subscriptions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('user_subscriptions').select('id, merchant, amount, frequency, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Legal Documents (Testament/Patientenverfügung) ───────
  const { data: legalDocs = [] } = useQuery({
    queryKey: ['fb-legal-docs', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('legal_documents').select('document_type, is_completed').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Portfolio Loans (for contract list) ──────────────────
  const { data: portfolioLoans = [] } = useQuery({
    queryKey: ['fb-portfolio-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('loans').select('id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent, property_id').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── Aggregation ──────────────────────────────────────────
  return useMemo(() => {
    const isLoading = portfolioLoading || personsLoading || apLoading || homesLoading;

    // Income
    const netIncomeTotal = applicantProfiles.reduce((s, p) => s + (p.net_income_monthly || 0), 0);
    const selfEmployedIncome = applicantProfiles.reduce((s, p) => s + (p.self_employed_income_monthly || 0), 0);
    const rentalIncomePortfolio = portfolioSummary ? portfolioSummary.annualIncome / 12 : 0;
    const sideJobIncome = applicantProfiles.reduce((s, p) => s + (p.side_job_income_monthly || 0), 0);
    const childBenefit = applicantProfiles.reduce((s, p) => s + (p.child_benefit_monthly || 0), 0);
    const otherIncome = applicantProfiles.reduce((s, p) => s + (p.other_regular_income_monthly || 0), 0);
    const totalIncome = netIncomeTotal + selfEmployedIncome + rentalIncomePortfolio + sideJobIncome + childBenefit + otherIncome;

    // Expenses
    const warmRent = tenancies.reduce((s, t) => s + (t.total_rent || 0), 0);
    const privateLoansMonthly = mietyLoans.reduce((s, l) => s + (l.monthly_rate || 0), 0);
    const portfolioLoansMonthly = portfolioSummary ? (portfolioSummary.annualInterest + portfolioSummary.annualAmortization) / 12 : 0;
    
    const activeInsurance = insuranceData.filter(i => i.status !== 'gekuendigt');
    const insurancePremiums = activeInsurance.reduce((s, i) => s + monthlyFromInterval(i.premium, i.payment_interval), 0);

    const activeVorsorge = vorsorgeData.filter(v => v.status !== 'gekuendigt');
    const savingsMonthly = activeVorsorge.reduce((s, v) => s + monthlyFromInterval(v.premium, v.payment_interval), 0);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'confirmed');
    const subscriptionTotal = activeSubscriptions.reduce((s, sub) => s + (sub.amount || 0), 0);

    const livingExpenses = applicantProfiles.reduce((s, p) => s + (p.living_expenses_monthly || 0), 0);
    const totalExpenses = warmRent + privateLoansMonthly + portfolioLoansMonthly + insurancePremiums + savingsMonthly + subscriptionTotal + livingExpenses;

    // Assets
    const portfolioPropertyValue = portfolioSummary?.totalValue || 0;
    const homeValue = homes.reduce((s, h) => s + (h.market_value || 0), 0);
    const bankSavings = applicantProfiles.reduce((s, p) => s + (p.bank_savings || 0), 0);
    const securities = applicantProfiles.reduce((s, p) => s + (p.securities_value || 0), 0);
    const surrenderValues = applicantProfiles.reduce((s, p) => s + (p.life_insurance_value || 0), 0);
    const totalAssets = portfolioPropertyValue + homeValue + bankSavings + securities + surrenderValues;

    // Liabilities
    const portfolioDebt = portfolioSummary?.totalDebt || 0;
    const homeDebt = mietyLoans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
    const totalLiabilities = portfolioDebt + homeDebt;

    // KPIs
    const monthlyAmortization = (portfolioSummary?.annualAmortization || 0) / 12 + privateLoansMonthly;
    const monthlySavings = savingsMonthly;
    const netWealth = totalAssets - totalLiabilities;
    const liquidityPercent = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // 40-year projection
    const projection: FinanzberichtProjectionYear[] = [];
    const currentYear = new Date().getFullYear();
    let projPropertyValue = portfolioPropertyValue + homeValue;
    let projDebt = totalLiabilities;
    let cumSavings = bankSavings + securities;
    const annualAnnuity = (portfolioLoansMonthly + privateLoansMonthly) * 12;
    const avgRate = portfolioSummary?.avgInterestRate ? portfolioSummary.avgInterestRate / 100 : 0.03;

    for (let i = 0; i <= 40; i++) {
      const interest = projDebt * avgRate;
      const amort = Math.min(annualAnnuity - interest, projDebt);
      projection.push({
        year: currentYear + i,
        propertyValue: Math.round(projPropertyValue),
        cumulativeSavings: Math.round(cumSavings),
        remainingDebt: Math.max(0, Math.round(projDebt)),
        netWealth: Math.round(projPropertyValue + cumSavings - projDebt),
      });
      projPropertyValue *= 1.02;
      projDebt = Math.max(0, projDebt - amort);
      cumSavings += monthlySavings * 12;
    }

    // Contract lists
    const savingsContracts: ContractSummary[] = activeVorsorge
      .filter(v => (v.contract_type || '').toLowerCase().includes('spar'))
      .map(v => ({ id: v.id, type: v.contract_type || 'Sparvertrag', provider: v.provider || '—', monthlyAmount: monthlyFromInterval(v.premium, v.payment_interval), contractNo: v.contract_no || undefined }));

    const insuranceContracts: ContractSummary[] = activeInsurance
      .map(i => ({ id: i.id, type: i.category || 'Versicherung', provider: i.insurer || '—', monthlyAmount: monthlyFromInterval(i.premium, i.payment_interval), contractNo: i.policy_no || undefined }));

    const loanContracts: ContractSummary[] = [
      ...portfolioLoans.map(l => ({ id: l.id, type: 'Immobiliendarlehen', provider: '—', monthlyAmount: l.annuity_monthly_eur || 0, contractNo: undefined })),
      ...mietyLoans.map(l => ({ id: l.id, type: l.loan_type || 'Privatdarlehen', provider: l.bank_name || '—', monthlyAmount: l.monthly_rate || 0, contractNo: undefined })),
    ];

    const vorsorgeContracts: ContractSummary[] = activeVorsorge
      .filter(v => !(v.contract_type || '').toLowerCase().includes('spar'))
      .map(v => ({ id: v.id, type: v.contract_type || 'Vorsorge', provider: v.provider || '—', monthlyAmount: monthlyFromInterval(v.premium, v.payment_interval), contractNo: v.contract_no || undefined }));

    const testamentCompleted = legalDocs.some((d: any) => d.document_type === 'testament' && d.is_completed);
    const patientenverfuegungCompleted = legalDocs.some((d: any) => d.document_type === 'patientenverfuegung' && d.is_completed);

    return {
      income: { netIncomeTotal, selfEmployedIncome, rentalIncomePortfolio, sideJobIncome, childBenefit, otherIncome, totalIncome },
      expenses: { warmRent, privateLoans: privateLoansMonthly, portfolioLoans: portfolioLoansMonthly, insurancePremiums, savingsContracts: savingsMonthly, subscriptions: subscriptionTotal, livingExpenses, totalExpenses },
      assets: { propertyValue: portfolioPropertyValue, homeValue, bankSavings, securities, surrenderValues, totalAssets },
      liabilities: { portfolioDebt, homeDebt, otherDebt: 0, totalLiabilities },
      monthlyAmortization,
      monthlySavings,
      netWealth,
      liquidityPercent,
      projection,
      savingsContracts,
      insuranceContracts,
      loanContracts,
      vorsorgeContracts,
      testamentCompleted,
      patientenverfuegungCompleted,
      isLoading,
    };
  }, [portfolioSummary, portfolioLoading, personsLoading, apLoading, homesLoading, applicantProfiles, homes, mietyLoans, tenancies, insuranceData, vorsorgeData, subscriptions, legalDocs, portfolioLoans]);
}

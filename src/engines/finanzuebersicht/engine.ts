/**
 * Engine 8: Finanzübersicht — Pure Calculation Functions
 * No React, no Supabase — fully portable and testable.
 */
import type {
  FUInput, FUResult, FUIncome, FUExpenses, FUAssets, FULiabilities,
  FUProjectionYear, FUContractSummary, FUSubscriptionsByCategory, FUEnergyContract,
  FUPropertyListItem, FULoanListItem, FUInsuranceContract, FUVorsorgeContract,
  FUSubscription, FUPvPlant, FUPrivateLoan, FUPortfolioLoan, FUPortfolioProperty,
  FUHome, FUMietyLoan, FUTenancy, FUApplicantProfile, FUKVContract, FULegalDoc,
  FUMietyContract, FUHouseholdPerson, FUDepotAccount, FUDepotPosition, FUVehicle,
  FUDepotPositionItem, FUManualExpense,
} from './spec';
import {
  LIVING_EXPENSE_RATE, PROPERTY_APPRECIATION_RATE, PROJECTION_YEARS,
  BUILDING_VALUE_FRACTION, AFA_RATE, MARGINAL_TAX_RATE, DEFAULT_AVG_INTEREST_RATE,
  SUBSCRIPTION_CATEGORY_LABELS, KINDERGELD_PER_CHILD,
} from './spec';

// ─── Helpers ─────────────────────────────────────────────────

export function monthlyFromInterval(premium: number | null | undefined, interval: string | null | undefined): number {
  if (!premium) return 0;
  switch (interval) {
    case 'jaehrlich': return premium / 12;
    case 'halbjaehrlich': return premium / 6;
    case 'vierteljaehrlich': return premium / 3;
    case 'monatlich': default: return premium;
  }
}

function subscriptionMonthly(amount: number, frequency: string | null | undefined): number {
  const freq = (frequency || '').toLowerCase();
  if (freq.includes('jaehr')) return amount / 12;
  if (freq.includes('halb')) return amount / 6;
  if (freq.includes('viertel')) return amount / 3;
  return amount;
}

function isInvestmentContract(contract: { contract_type?: string | null; category?: string | null }): boolean {
  if (contract.category) return contract.category === 'investment';
  const t = (contract.contract_type || '').toLowerCase();
  return t.includes('etf') || (t.includes('sparplan') && !t.includes('bauspar'));
}

// ─── Income ──────────────────────────────────────────────────

export function calcIncome(
  profiles: FUApplicantProfile[],
  householdPersons: FUHouseholdPerson[],
  portfolioSummary: FUInput['portfolioSummary'],
  portfolioProperties: FUPortfolioProperty[],
  pvPlants: FUPvPlant[],
): FUIncome {
  // Primary source: household_persons (has actual current income data)
  // Fallback: applicant_profiles (legacy, only for finance requests)
  const hasHouseholdIncome = householdPersons.some(p =>
    (p.net_income_monthly || 0) > 0 || (p.business_income_monthly || 0) > 0
  );

  let netIncomeTotal: number;
  let selfEmployedIncome: number;
  let sideJobIncome: number;
  let childBenefit: number;
  let otherIncome: number;
  let pvIncomePersonal: number;

  if (hasHouseholdIncome) {
    // Aggregate from household_persons (adults only for income)
    const adults = householdPersons.filter(p => p.role === 'hauptperson' || p.role === 'partner');
    netIncomeTotal = adults.reduce((s, p) => s + (p.net_income_monthly || 0), 0);
    selfEmployedIncome = adults.reduce((s, p) => s + (p.business_income_monthly || 0), 0);
    pvIncomePersonal = adults.reduce((s, p) => s + (p.pv_income_monthly || 0), 0);
    sideJobIncome = 0; // Not tracked in household_persons
    // Kindergeld: count children via child_allowances on adults
    const totalChildAllowances = adults.reduce((s, p) => s + (p.child_allowances || 0), 0);
    childBenefit = totalChildAllowances * KINDERGELD_PER_CHILD;
    otherIncome = adults.reduce((s, p) => s + (p.other_income_monthly || 0), 0);
  } else {
    // Fallback to applicant_profiles
    netIncomeTotal = profiles.reduce((s, p) => s + (p.net_income_monthly || 0), 0);
    selfEmployedIncome = profiles.reduce((s, p) => s + (p.self_employed_income_monthly || 0), 0);
    sideJobIncome = profiles.reduce((s, p) => s + (p.side_job_income_monthly || 0), 0);
    childBenefit = profiles.reduce((s, p) => s + (p.child_benefit_monthly || 0), 0);
    otherIncome = profiles.reduce((s, p) => s + (p.other_regular_income_monthly || 0), 0);
    pvIncomePersonal = 0;
  }

  const rentalIncomePortfolio = portfolioSummary ? portfolioSummary.annualIncome / 12 : 0;
  // PV income: from plants (feed-in revenue) + personal PV income from household
  const pvIncomePlants = pvPlants.reduce((s, pv) => s + ((pv.annual_revenue || 0) / 12), 0);
  const pvIncome = pvIncomePlants + pvIncomePersonal;

  // Tax benefit from rental properties (AfA + interest deduction)
  const totalPurchasePrice = portfolioProperties.reduce((s, p) => s + (p.purchase_price || 0), 0);
  const buildingValue = totalPurchasePrice * BUILDING_VALUE_FRACTION;
  const annualAfA = buildingValue * AFA_RATE;
  const annualInterest = portfolioSummary?.annualInterest || 0;
  const annualRent = portfolioSummary?.annualIncome || 0;
  const taxLoss = annualRent - annualInterest - annualAfA;
  const taxBenefitRental = taxLoss < 0 ? Math.abs(taxLoss) * MARGINAL_TAX_RATE / 12 : 0;

  const totalIncome = netIncomeTotal + selfEmployedIncome + rentalIncomePortfolio + sideJobIncome + childBenefit + otherIncome + pvIncome + taxBenefitRental;

  return { netIncomeTotal, selfEmployedIncome, rentalIncomePortfolio, sideJobIncome, childBenefit, otherIncome, pvIncome, taxBenefitRental, totalIncome };
}

// ─── Expenses ────────────────────────────────────────────────

export function calcExpenses(input: {
  tenancies: FUTenancy[];
  mietyLoans: FUMietyLoan[];
  portfolioSummary: FUInput['portfolioSummary'];
  pvPlants: FUPvPlant[];
  kvContracts: FUKVContract[];
  insuranceData: FUInsuranceContract[];
  vorsorgeData: FUVorsorgeContract[];
  subscriptions: FUSubscription[];
  privateLoans: FUPrivateLoan[];
  netIncomeTotal: number;
  selfEmployedIncome: number;
  manualExpenses: FUManualExpense[];
}): FUExpenses & {
  activeInsurance: FUInsuranceContract[];
  savingsOnlyContracts: FUVorsorgeContract[];
  investmentVorsorge: FUVorsorgeContract[];
  activeSubscriptions: FUSubscription[];
  activePrivateLoans: FUPrivateLoan[];
  pvMonthlyLoanRate: number;
  portfolioLoansMonthly: number;
  privateLoansMonthly: number;
  privateLoansNewMonthly: number;
} {
  const warmRent = input.tenancies.reduce((s, t) => s + (t.total_rent || 0), 0);
  const privateLoansMonthly = input.mietyLoans.reduce((s, l) => s + (l.monthly_rate || 0), 0);
  const portfolioLoansMonthly = input.portfolioSummary
    ? (input.portfolioSummary.annualInterest + input.portfolioSummary.annualAmortization) / 12
    : 0;
  const pvMonthlyLoanRate = input.pvPlants.reduce((s, pv) => s + (pv.loan_monthly_rate || 0), 0);

  // PKV
  const pkvExpense = input.kvContracts.reduce((s, kv) => {
    if (kv.type === 'PKV') return s + (kv.monthlyPremium - (kv.employerContribution || 0));
    return s;
  }, 0);

  // Insurance
  const activeInsurance = input.insuranceData.filter(i => i.status !== 'gekuendigt');
  const insurancePremiums = activeInsurance.reduce((s, i) => s + monthlyFromInterval(i.premium, i.payment_interval), 0);

  // Vorsorge
  const activeVorsorge = input.vorsorgeData.filter(v => v.status !== 'gekuendigt');
  const savingsOnlyContracts = activeVorsorge.filter(v =>
    (v.contract_type || '').toLowerCase().includes('spar') && !isInvestmentContract(v)
  );
  const investmentVorsorge = activeVorsorge.filter(v => isInvestmentContract(v));
  const savingsMonthly = savingsOnlyContracts.reduce((s, v) => s + monthlyFromInterval(v.premium, v.payment_interval), 0);
  const investmentMonthly = investmentVorsorge.reduce((s, v) => s + monthlyFromInterval(v.premium, v.payment_interval), 0);

  // Subscriptions
  const activeSubscriptions = input.subscriptions.filter(
    s => s.status === 'aktiv' || s.status === 'active' || s.status === 'confirmed'
  );
  const subscriptionTotal = activeSubscriptions.reduce(
    (s, sub) => s + subscriptionMonthly(sub.amount || 0, sub.frequency), 0
  );

  // Private loans (non-property)
  const activePrivateLoans = input.privateLoans.filter(l => l.status === 'aktiv');
  const privateLoansNewMonthly = activePrivateLoans.reduce((s, l) => s + (l.monthly_rate || 0), 0);

  // Living expenses
  const livingExpenses = (input.netIncomeTotal + input.selfEmployedIncome) * LIVING_EXPENSE_RATE;

  // Manual expenses
  const manualRent = input.manualExpenses
    .filter(e => e.category === 'miete')
    .reduce((s, e) => s + (e.monthly_amount || 0), 0);
  const alimony = input.manualExpenses
    .filter(e => e.category === 'unterhalt')
    .reduce((s, e) => s + (e.monthly_amount || 0), 0);
  const otherManualExpenses = input.manualExpenses
    .filter(e => e.category === 'sonstige')
    .reduce((s, e) => s + (e.monthly_amount || 0), 0);

  // Use manual rent if provided, otherwise use contract-based warm rent
  const effectiveRent = manualRent > 0 ? manualRent : warmRent;

  const totalExpenses = effectiveRent + privateLoansMonthly + privateLoansNewMonthly + portfolioLoansMonthly
    + pvMonthlyLoanRate + pkvExpense + insurancePremiums + savingsMonthly + investmentMonthly
    + subscriptionTotal + livingExpenses + alimony + otherManualExpenses;

  return {
    warmRent: effectiveRent,
    privateLoans: privateLoansMonthly + privateLoansNewMonthly,
    portfolioLoans: portfolioLoansMonthly,
    pvLoans: pvMonthlyLoanRate,
    healthInsurance: pkvExpense,
    insurancePremiums,
    savingsContracts: savingsMonthly,
    investmentContracts: investmentMonthly,
    subscriptions: subscriptionTotal,
    livingExpenses,
    manualRent,
    alimony,
    otherManualExpenses,
    totalExpenses,
    activeInsurance,
    savingsOnlyContracts,
    investmentVorsorge,
    activeSubscriptions,
    activePrivateLoans,
    pvMonthlyLoanRate,
    portfolioLoansMonthly,
    privateLoansMonthly,
    privateLoansNewMonthly,
  };
}

// ─── Assets ──────────────────────────────────────────────────

export function calcAssets(
  portfolioSummary: FUInput['portfolioSummary'],
  homes: FUHome[],
  profiles: FUApplicantProfile[],
  depotPositions: FUDepotPosition[],
  vorsorgeData: FUVorsorgeContract[],
  vehicles: FUVehicle[],
): FUAssets {
  const propertyValue = portfolioSummary?.totalValue || 0;
  const homeValue = homes.reduce((s, h) => s + (h.market_value || 0), 0);
  const bankSavings = profiles.reduce((s, p) => s + (p.bank_savings || 0), 0);
  const securities = profiles.reduce((s, p) => s + (p.securities_value || 0), 0);
  const surrenderValues = profiles.reduce((s, p) => s + (p.life_insurance_value || 0), 0);

  // NEW: Investment depot positions
  const depotValue = depotPositions.reduce((s, dp) => s + (dp.current_value || 0), 0);

  // NEW: Vorsorge contract balances (Rückkaufswerte / Guthaben)
  const activeVorsorge = vorsorgeData.filter(v => {
    const status = (v.status || '').toLowerCase();
    return status === 'aktiv' || status === 'active';
  });
  const vorsorgeBalance = activeVorsorge.reduce((s, v) => s + (v.current_balance || 0), 0);

  // NEW: Vehicle values
  const vehicleValue = vehicles.reduce((s, v) => s + (v.estimated_value_eur || 0), 0);

  const totalAssets = propertyValue + homeValue + bankSavings + securities + surrenderValues
    + depotValue + vorsorgeBalance + vehicleValue;

  return { propertyValue, homeValue, bankSavings, securities, surrenderValues, depotValue, vorsorgeBalance, vehicleValue, totalAssets };
}

// ─── Liabilities ─────────────────────────────────────────────

export function calcLiabilities(
  portfolioSummary: FUInput['portfolioSummary'],
  mietyLoans: FUMietyLoan[],
  pvPlants: FUPvPlant[],
  privateLoans: FUPrivateLoan[],
): FULiabilities {
  const portfolioDebt = portfolioSummary?.totalDebt || 0;
  const homeDebt = mietyLoans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
  const pvDebt = pvPlants.reduce((s, pv) => s + (pv.loan_remaining_balance || 0), 0);
  const activePrivateLoans = privateLoans.filter(l => l.status === 'aktiv');
  const otherDebt = activePrivateLoans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
  const totalLiabilities = portfolioDebt + homeDebt + pvDebt + otherDebt;
  return { portfolioDebt, homeDebt, pvDebt, otherDebt, totalLiabilities };
}

// ─── Projection ──────────────────────────────────────────────

export function calcProjection(input: {
  portfolioPropertyValue: number;
  homeValue: number;
  totalLiabilities: number;
  bankSavings: number;
  securities: number;
  depotValue: number;
  vorsorgeBalance: number;
  portfolioLoansMonthly: number;
  privateLoansMonthly: number;
  pvMonthlyLoanRate: number;
  monthlySavings: number;
  avgInterestRate?: number;
}): FUProjectionYear[] {
  const projection: FUProjectionYear[] = [];
  const currentYear = new Date().getFullYear();
  let projPropertyValue = input.portfolioPropertyValue + input.homeValue;
  let projDebt = input.totalLiabilities;
  // Include depot + vorsorge balances in cumulative savings start
  let cumSavings = input.bankSavings + input.securities + input.depotValue + input.vorsorgeBalance;
  const annualAnnuity = (input.portfolioLoansMonthly + input.privateLoansMonthly + input.pvMonthlyLoanRate) * 12;
  const avgRate = input.avgInterestRate ? input.avgInterestRate / 100 : DEFAULT_AVG_INTEREST_RATE;

  for (let i = 0; i <= PROJECTION_YEARS; i++) {
    const interest = projDebt * avgRate;
    const amort = Math.min(annualAnnuity - interest, projDebt);
    projection.push({
      year: currentYear + i,
      propertyValue: Math.round(projPropertyValue),
      cumulativeSavings: Math.round(cumSavings),
      remainingDebt: Math.max(0, Math.round(projDebt)),
      netWealth: Math.round(projPropertyValue + cumSavings - projDebt),
    });
    projPropertyValue *= 1 + PROPERTY_APPRECIATION_RATE;
    projDebt = Math.max(0, projDebt - amort);
    cumSavings += input.monthlySavings * 12;
  }

  return projection;
}

// ─── Contract Lists ──────────────────────────────────────────

export function buildContractLists(input: {
  savingsOnlyContracts: FUVorsorgeContract[];
  investmentVorsorge: FUVorsorgeContract[];
  activeInsurance: FUInsuranceContract[];
  portfolioLoans: FUPortfolioLoan[];
  mietyLoans: FUMietyLoan[];
  pvPlants: FUPvPlant[];
  activePrivateLoans: FUPrivateLoan[];
  activeVorsorge: FUVorsorgeContract[];
}): {
  savingsContracts: FUContractSummary[];
  investmentContracts: FUContractSummary[];
  insuranceContracts: FUContractSummary[];
  loanContracts: FUContractSummary[];
  vorsorgeContracts: FUContractSummary[];
} {
  const savingsContracts = input.savingsOnlyContracts.map(v => ({
    id: v.id, type: v.contract_type || 'Sparvertrag', provider: v.provider || '—',
    monthlyAmount: monthlyFromInterval(v.premium, v.payment_interval), contractNo: v.contract_no || undefined,
  }));

  const investmentContracts = input.investmentVorsorge.map(v => ({
    id: v.id, type: v.contract_type || 'Investment', provider: v.provider || '—',
    monthlyAmount: monthlyFromInterval(v.premium, v.payment_interval), contractNo: v.contract_no || undefined,
  }));

  const insuranceContracts = input.activeInsurance.map(i => ({
    id: i.id, type: i.category || 'Versicherung', provider: i.insurer || '—',
    monthlyAmount: monthlyFromInterval(i.premium, i.payment_interval), contractNo: i.policy_no || undefined,
  }));

  const loanContracts: FUContractSummary[] = [
    ...input.portfolioLoans.map(l => ({ id: l.id, type: 'Immobiliendarlehen', provider: l.bank_name || '—', monthlyAmount: l.annuity_monthly_eur || 0, contractNo: undefined })),
    ...input.mietyLoans.map(l => ({ id: l.id, type: l.loan_type || 'Privatdarlehen', provider: l.bank_name || '—', monthlyAmount: l.monthly_rate || 0, contractNo: undefined })),
    ...input.pvPlants.filter(pv => pv.loan_bank).map(pv => ({ id: pv.id, type: 'PV-Darlehen', provider: pv.loan_bank || '—', monthlyAmount: pv.loan_monthly_rate || 0, contractNo: undefined })),
    ...input.activePrivateLoans.map(l => ({ id: l.id, type: 'Privatkredit', provider: l.bank_name || '—', monthlyAmount: l.monthly_rate || 0, contractNo: undefined })),
  ];

  const vorsorgeContracts = input.activeVorsorge
    .filter(v => !(v.contract_type || '').toLowerCase().includes('spar') && !isInvestmentContract(v))
    .map(v => ({ id: v.id, type: v.contract_type || 'Vorsorge', provider: v.provider || '—', monthlyAmount: monthlyFromInterval(v.premium, v.payment_interval), contractNo: v.contract_no || undefined }));

  return { savingsContracts, investmentContracts, insuranceContracts, loanContracts, vorsorgeContracts };
}

// ─── Subscription Categories ─────────────────────────────────

export function buildSubscriptionCategories(subs: FUSubscription[]): FUSubscriptionsByCategory[] {
  const catMap = new Map<string, { items: any[]; subtotal: number }>();
  subs.forEach(sub => {
    const cat = sub.category || 'other';
    const entry = catMap.get(cat) || { items: [], subtotal: 0 };
    entry.items.push({ id: sub.id, merchant: sub.merchant || '—', amount: sub.amount || 0, status: sub.status || '' });
    entry.subtotal += sub.amount || 0;
    catMap.set(cat, entry);
  });
  return Array.from(catMap.entries())
    .map(([cat, data]) => ({ category: cat, label: SUBSCRIPTION_CATEGORY_LABELS[cat] || cat, items: data.items, subtotal: data.subtotal }))
    .sort((a, b) => b.subtotal - a.subtotal);
}

// ─── Property & Loan Lists ──────────────────────────────────

export function buildPropertyList(
  portfolioProperties: FUPortfolioProperty[],
  homes: FUHome[],
): FUPropertyListItem[] {
  return [
    ...portfolioProperties.map(p => ({
      id: p.id, label: p.code || p.address || '—', city: p.city || '—',
      type: 'Kapitalanlage', marketValue: p.market_value || 0, purchasePrice: p.purchase_price || 0,
    })),
    ...homes.filter(h => h.ownership_type === 'eigentum').map(h => ({
      id: h.id, label: h.name || h.address || 'Eigenheim', city: h.city || '—',
      type: 'Eigengenutzt', marketValue: h.market_value || 0, purchasePrice: 0,
    })),
  ];
}

export function buildLoanList(
  portfolioLoans: FUPortfolioLoan[],
  mietyLoans: FUMietyLoan[],
  pvPlants: FUPvPlant[],
  activePrivateLoans: FUPrivateLoan[],
  portfolioProperties: FUPortfolioProperty[],
): FULoanListItem[] {
  const propCodeMap = new Map<string, string>();
  portfolioProperties.forEach(p => {
    propCodeMap.set(p.id, `${p.code || ''} ${p.city || ''}`.trim() || '—');
  });

  return [
    ...portfolioLoans.map(l => ({
      id: l.id, bank: l.bank_name || '—', assignment: propCodeMap.get(l.property_id) || 'Portfolio',
      loanAmount: l.original_amount || 0, remainingBalance: l.outstanding_balance_eur || 0,
      interestRate: l.interest_rate_percent || 0, monthlyRate: l.annuity_monthly_eur || 0,
    })),
    ...mietyLoans.map(l => ({
      id: l.id, bank: l.bank_name || '—', assignment: 'Eigengenutzt',
      loanAmount: l.loan_amount || 0, remainingBalance: l.remaining_balance || 0,
      interestRate: l.interest_rate || 0, monthlyRate: l.monthly_rate || 0,
    })),
    ...pvPlants.filter(pv => pv.loan_bank).map(pv => ({
      id: pv.id, bank: pv.loan_bank || '—', assignment: 'Photovoltaik',
      loanAmount: pv.loan_amount || 0, remainingBalance: pv.loan_remaining_balance || 0,
      interestRate: pv.loan_interest_rate || 0, monthlyRate: pv.loan_monthly_rate || 0,
    })),
    ...activePrivateLoans.map(l => ({
      id: l.id, bank: l.bank_name || '—', assignment: l.loan_purpose || 'Privatkredit',
      loanAmount: l.loan_amount || 0, remainingBalance: l.remaining_balance || 0,
      interestRate: l.interest_rate || 0, monthlyRate: l.monthly_rate || 0,
    })),
  ];
}

// ─── Depot Position List ─────────────────────────────────────

export function buildDepotPositionList(
  depotAccounts: FUDepotAccount[],
  depotPositions: FUDepotPosition[],
): FUDepotPositionItem[] {
  const accountNameMap = new Map<string, string>();
  depotAccounts.forEach(a => {
    accountNameMap.set(a.id, a.account_name || a.bank_name || '—');
  });

  return depotPositions.map(dp => ({
    id: dp.id,
    depotName: accountNameMap.get(dp.depot_account_id || '') || '—',
    name: dp.name || '—',
    isin: dp.isin || null,
    currentValue: dp.current_value || 0,
    purchaseValue: dp.purchase_value || 0,
    profitOrLoss: dp.profit_or_loss || 0,
  }));
}

// ─── Energy Contracts ────────────────────────────────────────

export function buildEnergyContracts(contracts: FUMietyContract[]): FUEnergyContract[] {
  return contracts.map(c => ({
    id: c.id, category: c.category || '', providerName: c.provider_name || '—',
    contractNumber: c.contract_number || null, monthlyCost: c.monthly_cost || 0, startDate: c.start_date || null,
  }));
}

// ─── Master Aggregation ──────────────────────────────────────

export function calcFinanzuebersicht(input: FUInput): FUResult {
  const income = calcIncome(
    input.applicantProfiles,
    input.householdPersons,
    input.portfolioSummary,
    input.portfolioProperties,
    input.pvPlants,
  );

  const expensesResult = calcExpenses({
    tenancies: input.tenancies,
    mietyLoans: input.mietyLoans,
    portfolioSummary: input.portfolioSummary,
    pvPlants: input.pvPlants,
    kvContracts: input.kvContracts,
    insuranceData: input.insuranceData,
    vorsorgeData: input.vorsorgeData,
    subscriptions: input.subscriptions,
    privateLoans: input.privateLoans,
    netIncomeTotal: income.netIncomeTotal,
    selfEmployedIncome: income.selfEmployedIncome,
    manualExpenses: input.manualExpenses,
  });

  const assets = calcAssets(
    input.portfolioSummary,
    input.homes,
    input.applicantProfiles,
    input.depotPositions,
    input.vorsorgeData,
    input.vehicles,
  );
  const liabilities = calcLiabilities(input.portfolioSummary, input.mietyLoans, input.pvPlants, input.privateLoans);

  const monthlySavings = expensesResult.savingsContracts;
  const monthlyAmortization = (input.portfolioSummary?.annualAmortization || 0) / 12
    + expensesResult.privateLoansMonthly + expensesResult.privateLoansNewMonthly + expensesResult.pvMonthlyLoanRate;
  const netWealth = assets.totalAssets - liabilities.totalLiabilities;
  const liquidityPercent = income.totalIncome > 0
    ? ((income.totalIncome - expensesResult.totalExpenses) / income.totalIncome) * 100
    : 0;

  const projection = calcProjection({
    portfolioPropertyValue: assets.propertyValue,
    homeValue: assets.homeValue,
    totalLiabilities: liabilities.totalLiabilities,
    bankSavings: assets.bankSavings,
    securities: assets.securities,
    depotValue: assets.depotValue,
    vorsorgeBalance: assets.vorsorgeBalance,
    portfolioLoansMonthly: expensesResult.portfolioLoansMonthly,
    privateLoansMonthly: expensesResult.privateLoansMonthly,
    pvMonthlyLoanRate: expensesResult.pvMonthlyLoanRate,
    monthlySavings,
    avgInterestRate: input.portfolioSummary?.avgInterestRate,
  });

  const activeVorsorge = input.vorsorgeData.filter(v => v.status !== 'gekuendigt');
  const contracts = buildContractLists({
    savingsOnlyContracts: expensesResult.savingsOnlyContracts,
    investmentVorsorge: expensesResult.investmentVorsorge,
    activeInsurance: expensesResult.activeInsurance,
    portfolioLoans: input.portfolioLoans,
    mietyLoans: input.mietyLoans,
    pvPlants: input.pvPlants,
    activePrivateLoans: expensesResult.activePrivateLoans,
    activeVorsorge,
  });

  const subscriptionsByCategory = buildSubscriptionCategories(expensesResult.activeSubscriptions);
  const energyContracts = buildEnergyContracts(input.mietyContracts);
  const propertyList = buildPropertyList(input.portfolioProperties, input.homes);
  const loanList = buildLoanList(input.portfolioLoans, input.mietyLoans, input.pvPlants, expensesResult.activePrivateLoans, input.portfolioProperties);
  const depotPositionList = buildDepotPositionList(input.depotAccounts, input.depotPositions);

  const testamentCompleted = input.legalDocs.some(d => d.document_type === 'testament' && d.is_completed);
  const patientenverfuegungCompleted = input.legalDocs.some(d => d.document_type === 'patientenverfuegung' && d.is_completed);

  return {
    income,
    expenses: {
      warmRent: expensesResult.warmRent,
      privateLoans: expensesResult.privateLoans,
      portfolioLoans: expensesResult.portfolioLoans,
      pvLoans: expensesResult.pvLoans,
      healthInsurance: expensesResult.healthInsurance,
      insurancePremiums: expensesResult.insurancePremiums,
      savingsContracts: expensesResult.savingsContracts,
      investmentContracts: expensesResult.investmentContracts,
      subscriptions: expensesResult.subscriptions,
      livingExpenses: expensesResult.livingExpenses,
      manualRent: expensesResult.manualRent,
      alimony: expensesResult.alimony,
      otherManualExpenses: expensesResult.otherManualExpenses,
      totalExpenses: expensesResult.totalExpenses,
    },
    assets,
    liabilities,
    monthlyAmortization,
    monthlySavings,
    netWealth,
    liquidityPercent,
    projection,
    ...contracts,
    subscriptionsByCategory,
    energyContracts,
    propertyList,
    loanList,
    depotPositionList,
    testamentCompleted,
    patientenverfuegungCompleted,
  };
}

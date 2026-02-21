/**
 * E2E Engine Calculation Tests (C-01 to C-14)
 * Tests all 10 client-side calculation engines with realistic inputs.
 */
import { describe, it, expect } from 'vitest';

// Engine 1: ENG-AKQUISE
import {
  calcBestandFull,
  calcBestandQuick,
  calcAufteilerFull,
  calcAufteilerQuick,
  calcAufteilerProject,
} from '../akquiseCalc/engine';

// Engine 2: ENG-FINANCE
import {
  calcHaushaltsrechnung,
  calcBonitaet,
  calcAnnuity,
  calcConsumerLoanOffers,
  calcCompletionScore,
} from '../finanzierung/engine';

// Engine 3: ENG-PROVISION
import {
  calcCommission,
  calcPartnerShare,
  calcTippgeberFee,
  calcSystemFee,
  aggregateCommissions,
} from '../provision/engine';

// Engine 4: ENG-BWA
import {
  calcBWA,
  calcInstandhaltungsruecklage,
  calcLeerstandsquote,
  calcMietpotenzial,
} from '../bewirtschaftung/engine';

// Engine 5: ENG-PROJEKT
import {
  calcProjektKalkulation,
  calcUnitPricing,
  calcVertriebsStatus,
} from '../projektCalc/engine';

// Engine 6: ENG-NK (allocationLogic — pure part)
import {
  calculateLeaseDaysInPeriod,
  allocateCostItem,
  calculateProratedPrepayments,
} from '../nkAbrechnung/allocationLogic';
import { AllocationKeyType, NKCostCategory } from '../nkAbrechnung/spec';

// Engine 8: ENG-FINUEB
import {
  calcIncome,
  calcAssets,
  calcLiabilities,
  calcProjection,
  monthlyFromInterval,
} from '../finanzuebersicht/engine';

// Engine 9: ENG-VORSORGE
import {
  calcAltersvorsorge,
  calcBuLuecke,
} from '../vorsorgeluecke/engine';

// Engine 17: ENG-KONTOMATCH
import {
  unifyCsvTransaction,
  categorizeTransaction,
  matchRentPayment,
  matchPVIncome,
  matchLoanPayment,
} from '../kontoMatch/engine';
import { TransactionCategory, MATCH_TOLERANCES } from '../kontoMatch/spec';

// ============================================================================
// C-01: ENG-AKQUISE — Bestand (Hold)
// ============================================================================
describe('C-01: ENG-AKQUISE Bestand', () => {
  it('calculates 30-year hold with KP 500k, Miete 2k/M', () => {
    const result = calcBestandFull({
      purchasePrice: 500_000,
      monthlyRent: 2_000,
      equityPercent: 20,
      interestRate: 4.0,
      repaymentRate: 2.0,
      rentIncreaseRate: 2.0,
      valueIncreaseRate: 2.0,
      managementCostPercent: 25,
      maintenancePercent: 1.0,
      ancillaryCostPercent: 10,
    });

    // Basic KPIs
    expect(result.totalInvestment).toBe(550_000); // 500k + 10% NK
    expect(result.equity).toBe(110_000); // 20% of 550k
    expect(result.loanAmount).toBe(440_000); // 550k - 110k
    expect(result.grossYield).toBeCloseTo(4.8, 1); // 24k / 500k * 100
    expect(result.yearlyData).toHaveLength(30);
    expect(result.yearlyData[0].year).toBe(1);
    expect(result.yearlyData[29].year).toBe(30);
    expect(result.monthlyRate).toBeGreaterThan(0);
    expect(result.value40).toBeGreaterThan(500_000);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('quick Bestand KPIs', () => {
    const result = calcBestandQuick({
      purchasePrice: 500_000,
      monthlyRent: 2_000,
    });

    expect(result.grossYield).toBeCloseTo(4.8, 1);
    expect(result.netYield).toBeGreaterThan(0);
    expect(result.multiplier).toBeCloseTo(20.8, 0);
    expect(result.dscr).toBeGreaterThan(0);
    expect(result.ltv).toBeGreaterThan(0);
  });
});

// ============================================================================
// C-02: ENG-AKQUISE — Aufteiler (Flip)
// ============================================================================
describe('C-02: ENG-AKQUISE Aufteiler', () => {
  it('calculates flip with KP 1M, 10 WE', () => {
    const result = calcAufteilerFull({
      purchasePrice: 1_000_000,
      yearlyRent: 60_000,
      targetYield: 4.0,
      salesCommission: 8.0,
      holdingPeriodMonths: 24,
      ancillaryCostPercent: 10,
      interestRate: 5.0,
      equityPercent: 30,
      projectCosts: 50_000,
    });

    expect(result.totalAcquisitionCosts).toBe(1_150_000); // 1M + 100k NK + 50k project
    expect(result.salesPriceGross).toBe(1_500_000); // 60k / 4%
    expect(result.factor).toBe(25); // 1.5M / 60k
    expect(result.profit).toBeGreaterThan(0);
    expect(result.sensitivityData).toHaveLength(3);
    expect(result.roiOnEquity).toBeGreaterThan(0);
  });

  it('quick unit-based flip', () => {
    const result = calcAufteilerQuick({
      purchasePrice: 1_000_000,
      unitsCount: 10,
      avgUnitSalePrice: 150_000,
    });

    expect(result.totalSaleProceeds).toBe(1_500_000);
    expect(result.grossProfit).toBeGreaterThan(0);
    expect(result.pricePerUnit).toBe(100_000);
    expect(result.profitPerUnit).toBeGreaterThan(0);
  });

  it('project-level flip', () => {
    const result = calcAufteilerProject({
      purchasePrice: 1_000_000,
      renovationBudget: 200_000,
      targetYield: 4.0,
      salesCommission: 8.0,
      holdingPeriodMonths: 24,
      ancillaryCostPercent: 10,
      interestRate: 5.0,
      equityPercent: 30,
      totalListPrice: 2_000_000,
      totalYearlyRent: 80_000,
      unitsCount: 10,
    });

    expect(result.salesPriceGross).toBe(2_000_000);
    expect(result.profitPerUnit).toBeGreaterThan(0);
    expect(result.breakEvenUnits).toBeLessThanOrEqual(10);
  });
});

// ============================================================================
// C-03: ENG-FINANCE — Haushaltsüberschuss
// ============================================================================
describe('C-03: ENG-FINANCE Haushaltsrechnung', () => {
  it('calculates surplus with income 5k, expenses 2.5k', () => {
    const result = calcHaushaltsrechnung({
      incomes: [
        { label: 'Gehalt', amount: 5_000, category: 'salary' },
      ],
      expenses: [
        { label: 'Miete', amount: 1_500, category: 'rent' },
        { label: 'Lebenshaltung', amount: 1_000, category: 'living' },
      ],
      plannedRate: 1_200,
    });

    expect(result.totalIncome).toBe(5_000);
    expect(result.totalExpenses).toBe(2_500);
    expect(result.surplus).toBe(2_500);
    expect(result.surplusAfterPlannedRate).toBe(1_300);
    expect(result.dsr).toBeCloseTo(0.5, 2);
    expect(result.isViable).toBe(false); // DSR after rate > 0.4
  });

  it('marks viable when DSR ≤ 0.4', () => {
    const result = calcHaushaltsrechnung({
      incomes: [{ label: 'Gehalt', amount: 5_000, category: 'salary' }],
      expenses: [{ label: 'Miete', amount: 800, category: 'rent' }],
      plannedRate: 1_000,
    });

    expect(result.dsrAfterPlannedRate).toBeCloseTo(0.36, 2);
    expect(result.isViable).toBe(true);
  });
});

// ============================================================================
// C-04: ENG-FINANCE — Annuität
// ============================================================================
describe('C-04: ENG-FINANCE Annuität', () => {
  it('calculates annuity: 300k, 3.5%, 10J', () => {
    const result = calcAnnuity({
      loanAmount: 300_000,
      interestRatePercent: 3.5,
      repaymentRatePercent: 2.0,
      fixedRatePeriodYears: 10,
    });

    // Yearly rate = 300k * (3.5% + 2%) = 16,500
    expect(result.yearlyRate).toBeCloseTo(16_500, 0);
    expect(result.monthlyRate).toBeCloseTo(1_375, 0);
    expect(result.schedule).toHaveLength(10);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalRepayment).toBeGreaterThan(0);
    expect(result.remainingDebt).toBeLessThan(300_000);
    expect(result.remainingDebt).toBeGreaterThan(0);

    // First year: interest = 300k * 3.5% = 10,500
    expect(result.schedule[0].interestPaid).toBeCloseTo(10_500, 0);
    expect(result.schedule[0].principalPaid).toBeCloseTo(6_000, 0);
  });
});

// ============================================================================
// C-05: ENG-PROVISION
// ============================================================================
describe('C-05: ENG-PROVISION', () => {
  it('calculates commission split: KP 400k, 3.57% Käufer', () => {
    const result = calcCommission({
      dealValue: 400_000,
      buyerCommissionPercent: 3.57,
      sellerCommissionPercent: 3.57,
    });

    // Buyer netto = 400k * 3.57% = 14,280
    expect(result.buyer.netto).toBeCloseTo(14_280, 0);
    expect(result.buyer.vat).toBeCloseTo(14_280 * 0.19, 0);
    expect(result.buyer.brutto).toBeCloseTo(14_280 * 1.19, 0);
    expect(result.seller.netto).toBeCloseTo(14_280, 0);
    expect(result.total.netto).toBeCloseTo(28_560, 0);
  });

  it('calculates partner share', () => {
    const result = calcPartnerShare({
      commissionNetto: 14_280,
      partnerSharePercent: 50,
    });

    expect(result.partnerAmount).toBeCloseTo(7_140, 0);
    expect(result.houseAmount).toBeCloseTo(7_140, 0);
  });

  it('calculates system fee (25%)', () => {
    const result = calcSystemFee({ grossCommission: 10_000 });

    expect(result.systemFee).toBe(2_500);
    expect(result.managerNetto).toBe(7_500);
  });

  it('aggregates commission line items', () => {
    const result = aggregateCommissions([
      { amount: 5000, status: 'paid' },
      { amount: 3000, status: 'pending' },
      { amount: 2000, status: 'cancelled' },
    ]);

    expect(result.total).toBe(8_000);
    expect(result.paid).toBe(5_000);
    expect(result.pending).toBe(3_000);
    expect(result.paidCount).toBe(1);
    expect(result.pendingCount).toBe(1);
  });
});

// ============================================================================
// C-06: ENG-BWA
// ============================================================================
describe('C-06: ENG-BWA', () => {
  it('calculates BWA with 6 WE data', () => {
    const result = calcBWA({
      grossRentalIncome: 72_000, // 6 units * 1000€/M * 12
      nonRecoverableCosts: [
        { label: 'Verwaltung', amount: 3_600, category: 'verwaltung' },
        { label: 'Instandhaltung', amount: 5_000, category: 'instandhaltung' },
        { label: 'Versicherung', amount: 2_400, category: 'versicherung' },
        { label: 'Grundsteuer', amount: 1_200, category: 'grundsteuer' },
      ],
      annualDebtService: 24_000,
      depreciation: 8_000,
    });

    expect(result.grossIncome).toBe(72_000);
    expect(result.totalCosts).toBe(12_200);
    expect(result.noi).toBe(59_800);
    expect(result.cashflowBeforeTax).toBe(35_800);
    expect(result.costRatio).toBeCloseTo(12_200 / 72_000, 3);
  });

  it('calculates maintenance reserve (Peters)', () => {
    const result = calcInstandhaltungsruecklage({
      buildingCost: 500_000,
      yearBuilt: 1990,
      currentYear: 2026,
    });

    // Age = 36, tier = maxAge 50, factor = 0.013
    expect(result.buildingAge).toBe(36);
    expect(result.petersFactor).toBe(0.013);
    expect(result.annualReserve).toBe(6_500);
    expect(result.monthlyReserve).toBeCloseTo(541.67, 1);
  });

  it('calculates vacancy rate', () => {
    const result = calcLeerstandsquote([
      { unitId: 'u1', isVacant: false, vacantDays: 0, totalDays: 365 },
      { unitId: 'u2', isVacant: false, vacantDays: 30, totalDays: 365 },
      { unitId: 'u3', isVacant: true, vacantDays: 365, totalDays: 365 },
    ], 800);

    expect(result.totalUnits).toBe(3);
    expect(result.vacantUnits).toBe(1);
    expect(result.vacancyRate).toBeCloseTo(1 / 3, 2);
    expect(result.estimatedLoss).toBeGreaterThan(0);
  });

  it('calculates rent potential', () => {
    const result = calcMietpotenzial(800, 950);

    expect(result.delta).toBe(150);
    expect(result.deltaPercent).toBeCloseTo(0.1875, 3);
    expect(result.potential).toBe('below_market');
  });
});

// ============================================================================
// C-08: ENG-PROJEKT
// ============================================================================
describe('C-08: ENG-PROJEKT', () => {
  it('calculates project with 24 WE', () => {
    const units = Array.from({ length: 24 }, (_, i) => ({
      id: `u${i}`,
      label: `WE ${i + 1}`,
      areaSqm: 75,
      targetPricePerSqm: 4_500,
      status: i < 8 ? 'sold' as const : i < 12 ? 'reserved' as const : 'available' as const,
      soldPrice: i < 8 ? 340_000 : null,
    }));

    const result = calcProjektKalkulation({
      units,
      costs: [
        { label: 'Grundstück', amount: 2_000_000, category: 'grundstueck' },
        { label: 'Bau', amount: 4_000_000, category: 'bau' },
        { label: 'Nebenkosten', amount: 500_000, category: 'nebenkosten' },
      ],
    });

    expect(result.totalCosts).toBe(6_500_000);
    expect(result.totalAreaSqm).toBe(1_800); // 24 * 75
    expect(result.totalRevenue).toBeGreaterThan(0);
    expect(result.margin).toBe(result.totalRevenue - result.totalCosts);
    expect(result.revenuePerSqm).toBeGreaterThan(0);
  });

  it('calculates unit pricing with premiums', () => {
    const result = calcUnitPricing({
      areaSqm: 80,
      basePricePerSqm: 4_500,
      floorPremiumPercent: 5,
      balconyPremiumFlat: 10_000,
      discountPercent: 2,
    });

    const base = 80 * 4_500; // 360,000
    expect(result.basePrice).toBe(360_000);
    expect(result.premiums).toBe(18_000 + 10_000); // 5% floor + 10k balcony
    expect(result.finalPrice).toBeCloseTo((360_000 + 28_000) * 0.98, 0);
  });

  it('calculates sales status', () => {
    const result = calcVertriebsStatus([
      { id: '1', label: 'WE1', areaSqm: 75, targetPricePerSqm: 4500, status: 'sold', soldPrice: 350_000 },
      { id: '2', label: 'WE2', areaSqm: 75, targetPricePerSqm: 4500, status: 'reserved' },
      { id: '3', label: 'WE3', areaSqm: 75, targetPricePerSqm: 4500, status: 'available' },
    ]);

    expect(result.sold).toBe(1);
    expect(result.reserved).toBe(1);
    expect(result.available).toBe(1);
    expect(result.soldPercent).toBeCloseTo(33.33, 0);
    expect(result.soldRevenue).toBe(350_000);
  });
});

// ============================================================================
// C-09: ENG-NK (Allocation Logic)
// ============================================================================
describe('C-09: ENG-NK Allocation', () => {
  it('calculates lease days in period', () => {
    const result = calculateLeaseDaysInPeriod({
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      leaseStart: '2025-04-01',
      leaseEnd: null,
    });

    expect(result.totalDays).toBe(365);
    expect(result.leaseDays).toBe(275); // Apr 1 to Dec 31
    expect(result.ratio).toBeCloseTo(275 / 365, 2);
  });

  it('allocates cost by area', () => {
    const row = allocateCostItem({
      costItem: {
        id: 'c1',
        nkPeriodId: 'p1',
        categoryCode: NKCostCategory.WASSER,
        labelRaw: 'Wasser',
        labelDisplay: 'Wasser/Abwasser',
        amountTotalHouse: 3_600,
        amountUnit: null,
        keyType: AllocationKeyType.AREA_SQM,
        keyBasisUnit: null,
        keyBasisTotal: null,
        isApportionable: true,
        reasonCode: null,
        mappingConfidence: 90,
        mappingSource: 'rule',
        sourceDocumentId: null,
        sortOrder: 1,
      },
      unitAreaSqm: 75,
      totalAreaSqm: 600,
      unitMea: 100,
      totalMea: 1000,
      unitPersons: 2,
      totalPersons: 20,
      totalUnits: 8,
    });

    // 3600 * (75/600) = 450
    expect(row.shareUnit).toBe(450);
    expect(row.isApportionable).toBe(true);
  });

  it('calculates prorated prepayments', () => {
    const result = calculateProratedPrepayments(200, 80, {
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      leaseStart: '2025-07-01',
      leaseEnd: null,
    });

    // ~184 days out of 365 = ~6.05 months
    expect(result.prepaidNK).toBeLessThan(200 * 12);
    expect(result.prepaidNK).toBeGreaterThan(200 * 5);
    expect(result.prepaidHeating).toBeGreaterThan(0);
  });
});

// ============================================================================
// C-10: ENG-FINUEB (Finanzübersicht)
// ============================================================================
describe('C-10: ENG-FINUEB', () => {
  it('converts premium intervals correctly', () => {
    expect(monthlyFromInterval(1200, 'jaehrlich')).toBe(100);
    expect(monthlyFromInterval(600, 'halbjaehrlich')).toBe(100);
    expect(monthlyFromInterval(300, 'vierteljaehrlich')).toBe(100);
    expect(monthlyFromInterval(100, 'monatlich')).toBe(100);
    expect(monthlyFromInterval(null, 'monatlich')).toBe(0);
  });

  it('calculates assets with multiple sources', () => {
    const result = calcAssets(
      { totalValue: 800_000, totalDebt: 400_000, annualIncome: 36_000, annualInterest: 16_000, annualAmortization: 8_000 },
      [{ id: 'h1', name: 'Eigenheim', address: '', city: '', ownership_type: 'eigentum', market_value: 350_000 }],
      [{ bank_savings: 20_000, securities_value: 50_000, life_insurance_value: 30_000 } as any],
      [{ current_value: 25_000 } as any],
      [{ status: 'aktiv', current_balance: 15_000 } as any],
      [{ estimated_value_eur: 18_000 } as any],
    );

    expect(result.propertyValue).toBe(800_000);
    expect(result.homeValue).toBe(350_000);
    expect(result.bankSavings).toBe(20_000);
    expect(result.depotValue).toBe(25_000);
    expect(result.vehicleValue).toBe(18_000);
    expect(result.totalAssets).toBe(800_000 + 350_000 + 20_000 + 50_000 + 30_000 + 25_000 + 15_000 + 18_000);
  });

  it('calculates liabilities', () => {
    const result = calcLiabilities(
      { totalValue: 800_000, totalDebt: 400_000, annualIncome: 36_000, annualInterest: 16_000, annualAmortization: 8_000 },
      [{ remaining_balance: 150_000, monthly_rate: 800 } as any],
      [{ loan_remaining_balance: 30_000, loan_monthly_rate: 250 } as any],
      [{ status: 'aktiv', remaining_balance: 5_000 } as any],
    );

    expect(result.portfolioDebt).toBe(400_000);
    expect(result.homeDebt).toBe(150_000);
    expect(result.pvDebt).toBe(30_000);
    expect(result.otherDebt).toBe(5_000);
    expect(result.totalLiabilities).toBe(585_000);
  });

  it('generates 40-year projection', () => {
    const result = calcProjection({
      portfolioPropertyValue: 500_000,
      homeValue: 300_000,
      totalLiabilities: 400_000,
      bankSavings: 20_000,
      securities: 10_000,
      depotValue: 5_000,
      vorsorgeBalance: 3_000,
      portfolioLoansMonthly: 1_500,
      privateLoansMonthly: 500,
      pvMonthlyLoanRate: 200,
      monthlySavings: 500,
    });

    expect(result).toHaveLength(41); // year 0 to 40
    expect(result[0].year).toBe(new Date().getFullYear());
    expect(result[40].propertyValue).toBeGreaterThan(800_000); // appreciation
    expect(result[40].netWealth).toBeGreaterThan(result[0].netWealth);
  });
});

// ============================================================================
// C-11: ENG-VORSORGE
// ============================================================================
describe('C-11: ENG-VORSORGE', () => {
  it('calculates pension gap: Age 35, income 5k', () => {
    const result = calcAltersvorsorge(
      {
        id: 'p1',
        first_name: 'Max',
        last_name: 'Mustermann',
        is_primary: true,
        net_income_monthly: 5_000,
        business_income_monthly: 0,
        employment_status: 'employee',
        gross_income_monthly: 7_000,
        planned_retirement_date: null,
        ruhegehaltfaehiges_grundgehalt: null,
        ruhegehaltfaehige_dienstjahre: null,
      },
      { person_id: 'p1', projected_pension: 1_500, disability_pension: 1_000, pension_type: 'drv' },
      [
        {
          id: 'v1',
          person_id: 'p1',
          contract_type: 'Riester-Rente',
          category: 'vorsorge',
          status: 'aktiv',
          insured_sum: 30_000,
          current_balance: 30_000,
          premium: 175,
          payment_interval: 'monatlich',
          monthly_benefit: null,
          bu_monthly_benefit: null,
          projected_end_value: null,
          growth_rate_override: null,
        },
      ],
      0.8,
    );

    expect(result.gesetzliche_versorgung).toBe(1_500);
    expect(result.gesetzliche_quelle).toBe('drv');
    expect(result.retirement_need).toBe(4_000); // 5k * 80%
    expect(result.gap).toBeGreaterThan(0);
    expect(result.capital_needed).toBeGreaterThan(0);
  });

  it('calculates BU gap', () => {
    const result = calcBuLuecke(
      {
        id: 'p1',
        first_name: 'Max',
        last_name: 'Mustermann',
        is_primary: true,
        net_income_monthly: 5_000,
        business_income_monthly: 0,
        employment_status: 'employee',
        gross_income_monthly: 7_000,
        planned_retirement_date: null,
        ruhegehaltfaehiges_grundgehalt: null,
        ruhegehaltfaehige_dienstjahre: null,
      },
      { person_id: 'p1', projected_pension: 1_500, disability_pension: 1_000, pension_type: 'drv' },
      [
        {
          id: 'bu1',
          person_id: 'p1',
          contract_type: 'Berufsunfähigkeitsversicherung',
          category: 'vorsorge',
          status: 'aktiv',
          insured_sum: null,
          current_balance: null,
          premium: 50,
          payment_interval: 'monatlich',
          monthly_benefit: 2_000,
          bu_monthly_benefit: null,
          projected_end_value: null,
          growth_rate_override: null,
        },
      ],
      0.8,
    );

    expect(result.gesetzliche_absicherung).toBe(1_000);
    expect(result.gesetzliche_quelle).toBe('drv_em');
    expect(result.private_bu).toBe(2_000);
    expect(result.bu_need).toBe(4_000);
    expect(result.bu_gap).toBe(1_000); // 4000 - 1000 - 2000
  });
});

// ============================================================================
// C-13: ENG-KONTOMATCH (Rule-based)
// ============================================================================
describe('C-13: ENG-KONTOMATCH Rule-based', () => {
  it('categorizes rent payment correctly', () => {
    const tx = {
      id: 'tx1', tenantId: 't1', accountRef: 'acc1',
      bookingDate: '2025-06-01', amount: 850,
      purpose: 'Miete Juni 2025', counterparty: 'Mueller',
      source: 'csv' as const,
    };

    const result = categorizeTransaction(tx, { ownerType: 'property' });
    // Should match rent-related rule or at least categorize
    expect(result.transactionId).toBe('tx1');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('matches rent payment with tolerance', () => {
    const tx = {
      id: 'tx1', tenantId: 't1', accountRef: 'acc1',
      bookingDate: '2025-06-01', amount: 848,
      purpose: 'Miete', counterparty: 'Mueller',
      source: 'csv' as const,
    };

    const result = matchRentPayment(tx, {
      leaseId: 'l1',
      tenantId: 't1',
      warmRent: 850,
      tenantLastName: 'Mueller',
      tenantCompany: undefined,
      unitCode: 'WE01',
    });

    expect(result.matched).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.amountDiff).toBeCloseTo(-2, 0);
  });

  it('matches PV feed-in income', () => {
    const tx = {
      id: 'tx2', tenantId: 't1', accountRef: 'acc1',
      bookingDate: '2025-06-01', amount: 180,
      purpose: 'Einspeisevergütung Juni', counterparty: 'Netzbetreiber XY',
      source: 'csv' as const,
    };

    const result = matchPVIncome(tx, {
      plantId: 'pv1',
      gridOperator: 'Netzbetreiber XY',
      expectedMonthlyFeedIn: 175,
    });

    expect(result.matched).toBe(true);
    expect(result.category).toBe(TransactionCategory.EINSPEISEVERGUETUNG);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('matches loan payment', () => {
    const tx = {
      id: 'tx3', tenantId: 't1', accountRef: 'acc1',
      bookingDate: '2025-06-01', amount: -1375,
      purpose: 'Darlehen Tilgung + Zins', counterparty: 'Sparkasse',
      source: 'csv' as const,
    };

    const result = matchLoanPayment(tx, {
      loanId: 'l1',
      bankIban: null,
      monthlyRate: 1375,
    });

    // Pattern 'darlehen' + 'tilgung' give 0.2, amount match gives 0.35 = 0.55
    expect(result.confidence).toBeGreaterThanOrEqual(0.35);
  });

  it('unifies CSV transaction', () => {
    const tx = unifyCsvTransaction({
      id: 'csv1',
      tenant_id: 't1',
      account_ref: 'DE123',
      booking_date: '2025-01-15',
      amount_eur: 1500.50,
      purpose_text: 'Miete Jan',
      counterparty: 'Max Mueller',
      match_status: null,
    });

    expect(tx.amount).toBe(1500.50);
    expect(tx.source).toBe('csv');
    expect(tx.purpose).toBe('Miete Jan');
  });
});

// ============================================================================
// Consumer Loan Offers (additional coverage)
// ============================================================================
describe('ENG-FINANCE Consumer Loans', () => {
  it('generates mock loan offers', () => {
    const offers = calcConsumerLoanOffers(30_000, 60);

    expect(offers.length).toBe(5); // 5 mock banks
    expect(offers[0].bankName).toBe('Sparkasse');
    expect(offers[0].monthlyRate).toBeGreaterThan(0);
    expect(offers[0].totalCost).toBeGreaterThan(30_000);
  });

  it('returns empty for invalid input', () => {
    expect(calcConsumerLoanOffers(0, 60)).toHaveLength(0);
    expect(calcConsumerLoanOffers(10_000, 0)).toHaveLength(0);
  });
});

// ============================================================================
// Completion Score
// ============================================================================
describe('ENG-FINANCE Completion Score', () => {
  it('calculates form completion', () => {
    const result = calcCompletionScore({
      formData: { name: 'Max', email: 'max@test.de', phone: '' },
      requiredFields: ['name', 'email', 'phone', 'address'],
    });

    expect(result.filledCount).toBe(2);
    expect(result.totalRequired).toBe(4);
    expect(result.percent).toBe(50);
  });
});

// ============================================================================
// Bonität
// ============================================================================
describe('ENG-FINANCE Bonität', () => {
  it('rates green for healthy LTV and DSCR', () => {
    const result = calcBonitaet({
      purchasePrice: 400_000,
      loanAmount: 280_000, // 70% LTV
      propertyValue: 400_000,
      annualNetIncome: 60_000,
      annualDebtService: 12_000,
      plannedAnnualDebtService: 16_500,
    });

    expect(result.ltv).toBeCloseTo(0.7, 1);
    expect(result.rating).toBe('green');
  });

  it('rates red for high LTV', () => {
    const result = calcBonitaet({
      purchasePrice: 400_000,
      loanAmount: 380_000, // 95% LTV
      propertyValue: 400_000,
      annualNetIncome: 60_000,
      annualDebtService: 0,
      plannedAnnualDebtService: 20_000,
    });

    expect(result.ltv).toBeCloseTo(0.95, 1);
    expect(result.rating).toBe('red');
  });
});

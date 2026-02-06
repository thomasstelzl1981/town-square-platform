/**
 * Portfolio Summary Hook
 * Extracts MOD-04 portfolio aggregation logic for use in MOD-08 Simulation
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioSummary {
  propertyCount: number;
  unitCount: number;
  totalArea: number;
  totalValue: number;
  totalDebt: number;
  netWealth: number;
  annualIncome: number;
  annualInterest: number;
  annualAmortization: number;
  annualSurplus: number;
  avgYield: number;
  avgInterestRate: number;
}

export interface YearlyProjection {
  year: number;
  rent: number;
  interest: number;
  amortization: number;
  objektwert: number;
  restschuld: number;
  vermoegen: number;
}

export function usePortfolioSummary() {
  const { activeTenantId } = useAuth();

  // Fetch units with properties
  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['portfolio-summary-units', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];

      const { data: units, error } = await supabase
        .from('units')
        .select(`
          id,
          area_sqm,
          current_monthly_rent,
          property_id,
          properties!inner (
            id,
            market_value,
            annual_income,
            status
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('properties.status', 'active');

      if (error) throw error;
      return units || [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch leases for rent calculation
  const { data: leasesData } = useQuery({
    queryKey: ['portfolio-summary-leases', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];

      const { data, error } = await supabase
        .from('leases')
        .select('unit_id, monthly_rent, rent_cold_eur, status')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch loans for debt/financing
  const { data: loansData } = useQuery({
    queryKey: ['portfolio-summary-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];

      const { data, error } = await supabase
        .from('loans')
        .select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
        .eq('tenant_id', activeTenantId);

      if (error) {
        console.warn('Loans query error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Calculate summary
  const summary = useMemo<PortfolioSummary | null>(() => {
    if (!unitsData || unitsData.length === 0) return null;

    // Get unique properties
    const uniquePropertyIds = [...new Set(unitsData.map(u => u.property_id))];
    
    // Get property values (deduplicated by property_id)
    const propertyValues = new Map<string, number>();
    unitsData.forEach(u => {
      const prop = u.properties as any;
      if (prop?.market_value && !propertyValues.has(u.property_id)) {
        propertyValues.set(u.property_id, prop.market_value);
      }
    });

    // Calculate rental income from leases
    const leaseMap = new Map<string, number>();
    leasesData?.forEach(l => {
      const rent = l.rent_cold_eur || l.monthly_rent || 0;
      leaseMap.set(l.unit_id, (leaseMap.get(l.unit_id) || 0) + rent);
    });

    // Aggregate unit data with lease info
    const unitCount = unitsData.length;
    const propertyCount = uniquePropertyIds.length;
    const totalArea = unitsData.reduce((sum, u) => sum + (u.area_sqm || 0), 0);
    const totalValue = Array.from(propertyValues.values()).reduce((a, b) => a + b, 0);

    // Monthly rent → Annual
    let totalMonthlyRent = 0;
    unitsData.forEach(u => {
      totalMonthlyRent += leaseMap.get(u.id) || u.current_monthly_rent || 0;
    });
    const annualIncome = totalMonthlyRent * 12;

    // Loans aggregation
    const relevantLoans = loansData?.filter(l => uniquePropertyIds.includes(l.property_id)) || [];
    const totalDebt = relevantLoans.reduce((sum, l) => sum + (l.outstanding_balance_eur || 0), 0);
    const totalAnnuity = relevantLoans.reduce((sum, l) => sum + ((l.annuity_monthly_eur || 0) * 12), 0);
    const avgInterestRate = relevantLoans.length
      ? relevantLoans.reduce((sum, l) => sum + (l.interest_rate_percent || 0), 0) / relevantLoans.length
      : 0;

    // Derived calculations
    const annualInterest = totalDebt * (avgInterestRate / 100);
    const annualAmortization = totalAnnuity - annualInterest;
    const netWealth = totalValue - totalDebt;
    const avgYield = totalValue > 0 ? (annualIncome / totalValue) * 100 : 0;

    // Surplus: Income - Total Annuity (simplified, no tax)
    const annualSurplus = annualIncome - totalAnnuity;

    return {
      propertyCount,
      unitCount,
      totalArea,
      totalValue,
      totalDebt,
      netWealth,
      annualIncome,
      annualInterest,
      annualAmortization,
      annualSurplus,
      avgYield,
      avgInterestRate,
    };
  }, [unitsData, leasesData, loansData]);

  // Generate 40-year projection
  const projection = useMemo<YearlyProjection[]>(() => {
    if (!summary || summary.totalDebt <= 0) return [];

    const appreciationRate = 0.02; // 2% p.a.
    const rentGrowthRate = 0.015; // 1.5% p.a.
    const years: YearlyProjection[] = [];

    let currentDebt = summary.totalDebt;
    let currentValue = summary.totalValue;
    let currentRent = summary.annualIncome;
    const interestRate = summary.avgInterestRate / 100;
    const annuity = summary.annualInterest + summary.annualAmortization;

    for (let i = 0; i <= 40; i++) {
      const interest = currentDebt * interestRate;
      const amortization = Math.min(annuity - interest, currentDebt);
      const wealth = currentValue - currentDebt;

      years.push({
        year: new Date().getFullYear() + i,
        rent: Math.round(currentRent),
        interest: Math.round(interest),
        amortization: Math.round(amortization),
        objektwert: Math.round(currentValue),
        restschuld: Math.max(0, Math.round(currentDebt)),
        vermoegen: Math.round(wealth),
      });

      // Next year
      currentDebt = Math.max(0, currentDebt - amortization);
      currentValue = currentValue * (1 + appreciationRate);
      currentRent = currentRent * (1 + rentGrowthRate);
    }

    return years;
  }, [summary]);

  return {
    summary,
    projection,
    isLoading: unitsLoading,
    hasData: !!summary && summary.propertyCount > 0,
  };
}

/**
 * Combine current portfolio with a new object
 */
export function combineWithNewObject(
  current: PortfolioSummary,
  newObject: {
    price: number;
    monthlyRent: number;
    equity: number;
    interestRate: number;
    amortizationRate: number;
  }
): PortfolioSummary {
  const newLoan = newObject.price - newObject.equity;
  const newAnnualInterest = newLoan * (newObject.interestRate / 100);
  const newAnnualAmortization = newLoan * (newObject.amortizationRate / 100);
  const newAnnualIncome = newObject.monthlyRent * 12;
  const newAnnuity = newAnnualInterest + newAnnualAmortization;

  const combinedDebt = current.totalDebt + newLoan;
  const combinedValue = current.totalValue + newObject.price;
  const combinedInterest = current.annualInterest + newAnnualInterest;
  const combinedAmortization = current.annualAmortization + newAnnualAmortization;
  const combinedIncome = current.annualIncome + newAnnualIncome;
  const combinedAnnuity = (current.annualInterest + current.annualAmortization) + newAnnuity;

  return {
    propertyCount: current.propertyCount + 1,
    unitCount: current.unitCount + 1,
    totalArea: current.totalArea, // Unknown for new object
    totalValue: combinedValue,
    totalDebt: combinedDebt,
    netWealth: combinedValue - combinedDebt,
    annualIncome: combinedIncome,
    annualInterest: combinedInterest,
    annualAmortization: combinedAmortization,
    annualSurplus: combinedIncome - combinedAnnuity,
    avgYield: combinedValue > 0 ? (combinedIncome / combinedValue) * 100 : 0,
    avgInterestRate: (current.avgInterestRate + newObject.interestRate) / 2, // Simplified avg
  };
}

/**
 * Generate projection for combined portfolio
 */
export function generateCombinedProjection(
  summary: PortfolioSummary,
  appreciationRate: number = 0.02,
  rentGrowthRate: number = 0.015
): YearlyProjection[] {
  if (summary.totalDebt <= 0) return [];

  const years: YearlyProjection[] = [];
  let currentDebt = summary.totalDebt;
  let currentValue = summary.totalValue;
  let currentRent = summary.annualIncome;
  const interestRate = summary.avgInterestRate / 100;
  const annuity = summary.annualInterest + summary.annualAmortization;

  for (let i = 0; i <= 40; i++) {
    const interest = currentDebt * interestRate;
    const amortization = Math.min(annuity - interest, currentDebt);
    const wealth = currentValue - currentDebt;

    years.push({
      year: new Date().getFullYear() + i,
      rent: Math.round(currentRent),
      interest: Math.round(interest),
      amortization: Math.round(amortization),
      objektwert: Math.round(currentValue),
      restschuld: Math.max(0, Math.round(currentDebt)),
      vermoegen: Math.round(wealth),
    });

    currentDebt = Math.max(0, currentDebt - amortization);
    currentValue = currentValue * (1 + appreciationRate);
    currentRent = currentRent * (1 + rentGrowthRate);
  }

  return years;
}

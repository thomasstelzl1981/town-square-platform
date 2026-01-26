import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalculationInput {
  purchasePrice: number;
  monthlyRent: number;
  equity: number;
  termYears: number;
  repaymentRate: number;
  taxableIncome: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  churchTaxState?: string;
  afaModel: 'linear' | '7i' | '7h' | '7b';
  buildingShare: number;
  managementCostMonthly: number;
  valueGrowthRate: number;
  rentGrowthRate: number;
}

export interface YearlyData {
  year: number;
  rent: number;
  interest: number;
  repayment: number;
  remainingDebt: number;
  managementCost: number;
  afa: number;
  taxableRentalIncome: number;
  taxSavings: number;
  cashFlowBeforeTax: number;
  cashFlowAfterTax: number;
  propertyValue: number;
  netWealth: number;
}

export interface CalculationResult {
  summary: {
    monthlyBurden: number;
    totalInvestment: number;
    loanAmount: number;
    ltv: number;
    interestRate: number;
    yearlyRent: number;
    yearlyInterest: number;
    yearlyRepayment: number;
    yearlyAfa: number;
    yearlyTaxSavings: number;
    roiBeforeTax: number;
    roiAfterTax: number;
  };
  projection: YearlyData[];
  inputs: CalculationInput;
}

export const defaultInput: CalculationInput = {
  purchasePrice: 250000,
  monthlyRent: 800,
  equity: 50000,
  termYears: 15,
  repaymentRate: 2,
  taxableIncome: 60000,
  maritalStatus: 'single',
  hasChurchTax: false,
  churchTaxState: undefined,
  afaModel: 'linear',
  buildingShare: 0.8,
  managementCostMonthly: 25,
  valueGrowthRate: 2,
  rentGrowthRate: 1.5,
};

export function useInvestmentEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = useCallback(async (input: CalculationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-investment-engine', {
        body: input,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as CalculationResult);
      return data as CalculationResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Berechnung fehlgeschlagen';
      setError(message);
      console.error('Investment Engine Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    calculate,
    result,
    isLoading,
    error,
  };
}

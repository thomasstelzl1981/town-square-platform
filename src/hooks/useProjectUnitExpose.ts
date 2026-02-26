/**
 * useProjectUnitExpose — Shared hook for project unit Exposé pages
 * Maps dev_project_units + dev_projects data to ExposeListingData
 * Used by InvestEngineExposePage (MOD-13) and ProjectLandingExpose (Zone 3)
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';
import { mapAfaModelToEngine } from '@/lib/mapAfaModel';
import type { ExposeListingData } from '@/components/investment/InvestmentExposeView';

interface UseProjectUnitExposeOptions {
  unitId: string | undefined;
  /** Initial calculator overrides from search params or defaults */
  initialParams?: Partial<{
    equity: number;
    taxableIncome: number;
    maritalStatus: 'single' | 'married';
    hasChurchTax: boolean;
    repaymentRate: number;
  }>;
  /** Auto-calculate on load (true for Zone 3, false for MOD-13 manual trigger) */
  autoCalculate?: boolean;
}

export function useProjectUnitExpose({
  unitId,
  initialParams = {},
  autoCalculate = false,
}: UseProjectUnitExposeOptions) {
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Fetch unit + project
  const { data, isLoading } = useQuery({
    queryKey: ['project-unit-expose', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const { data: unit, error: unitErr } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('id', unitId)
        .maybeSingle();
      if (unitErr || !unit) return null;

      const { data: project, error: projErr } = await supabase
        .from('dev_projects')
        .select('*')
        .eq('id', (unit as any).project_id)
        .maybeSingle();
      if (projErr || !project) return null;

      return { unit: unit as any, project: project as any };
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000,
  });

  const unit = data?.unit;
  const project = data?.project;

  // Calculator params
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    taxableIncome: initialParams.taxableIncome ?? 60000,
    equity: initialParams.equity ?? 50000,
    maritalStatus: initialParams.maritalStatus ?? 'single',
    hasChurchTax: initialParams.hasChurchTax ?? false,
    repaymentRate: initialParams.repaymentRate ?? defaultInput.repaymentRate,
  });

  // Sync unit/project data into params once loaded
  useEffect(() => {
    if (unit && project) {
      setParams(prev => ({
        ...prev,
        purchasePrice: unit.list_price ?? 0,
        monthlyRent: unit.rent_net ?? unit.current_rent ?? 0,
        afaModel: mapAfaModelToEngine(project.afa_model),
        buildingShare: 1 - ((project.land_share_percent ?? project.ground_share_percent ?? 20) / 100),
        managementCostMonthly: unit.hausgeld ?? 25,
        afaRateOverride: project.afa_rate_percent ?? undefined,
      }));
    }
  }, [unit, project]);

  // Auto-calculate when data is ready
  useEffect(() => {
    if (autoCalculate && unit && project && params.purchasePrice > 0) {
      calculate(params);
    }
  }, [autoCalculate, unit, project, params, calculate]);

  // Manual trigger
  const [hasCalculated, setHasCalculated] = useState(false);
  const handleCalculate = useCallback(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
      setHasCalculated(true);
    }
  }, [params, calculate]);

  // Map to ExposeListingData
  const listing: ExposeListingData | null = useMemo(() => {
    if (!unit || !project) return null;
    return {
      id: unit.id,
      public_id: `PRJ-${unit.unit_number}`,
      property_id: unit.property_id || unit.id,
      title: `${project.name} — Einheit ${unit.unit_number}`,
      description: '',
      asking_price: unit.list_price ?? 0,
      property_type: 'ETW',
      address: project.address || '',
      city: project.city || '',
      postal_code: project.postal_code || '',
      total_area_sqm: unit.area_sqm ?? 0,
      year_built: project.construction_year ?? 0,
      monthly_rent: unit.rent_net ?? unit.current_rent ?? 0,
      units_count: 1,
      hero_image_url: null,
      heating_type: project.heating_type || null,
      energy_source: project.energy_source || null,
    };
  }, [unit, project]);

  // Gross yield
  const grossYield = useMemo(() => {
    if (!listing || listing.asking_price <= 0) return 0;
    return ((listing.monthly_rent * 12) / listing.asking_price) * 100;
  }, [listing]);

  return {
    listing,
    isLoading,
    unit,
    project,
    params,
    setParams,
    calcResult,
    isCalculating,
    grossYield,
    hasCalculated,
    handleCalculate,
  };
}

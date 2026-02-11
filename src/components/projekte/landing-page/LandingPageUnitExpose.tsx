/**
 * Landing Page — Unit Exposé Detail (Sub-View)
 * Uses the SSOT InvestmentExposeView from shared components
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import { DEMO_UNIT_DETAIL } from '@/components/projekte/demoProjectData';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';
import { InvestmentExposeView } from '@/components/investment';

interface LandingPageUnitExposeProps {
  unit: DemoUnit;
  isDemo: boolean;
  onBack: () => void;
}

export function LandingPageUnitExpose({ unit, isDemo, onBack }: LandingPageUnitExposeProps) {
  const detail = DEMO_UNIT_DETAIL;
  const { calculate, result, isLoading } = useInvestmentEngine();

  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: unit.list_price,
    monthlyRent: unit.rent_monthly,
    equity: Math.round(unit.list_price * 0.2),
    termYears: 10,
    repaymentRate: 2,
    taxableIncome: 60000,
    maritalStatus: 'single',
    hasChurchTax: false,
    afaModel: 'linear',
    buildingShare: 0.8,
    managementCostMonthly: 25,
    valueGrowthRate: 2,
    rentGrowthRate: 1.5,
  });

  const runCalculation = useCallback(() => {
    calculate(params);
  }, [params, calculate]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // Map DemoUnit → ListingData interface expected by InvestmentExposeView
  const listing = {
    id: unit.id,
    public_id: unit.public_id,
    title: `${unit.unit_number} — ${unit.rooms}-Zimmer-Wohnung`,
    description: detail.description,
    asking_price: unit.list_price,
    property_type: 'apartment' as const,
    address: detail.address,
    city: detail.city,
    postal_code: detail.postal_code,
    total_area_sqm: unit.area_sqm,
    year_built: detail.year_built,
    monthly_rent: unit.rent_monthly,
    units_count: 1,
  };

  const handleParamsChange = (newParams: CalculationInput) => {
    setParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Preisliste
        </Button>
        {isDemo && (
          <Badge variant="secondary" className="opacity-60">Beispielberechnung</Badge>
        )}
      </div>

      {/* SSOT Investment Engine */}
      <InvestmentExposeView
        listing={listing}
        propertyId={unit.id}
        calcResult={result}
        isCalculating={isLoading}
        params={params}
        onParamsChange={handleParamsChange}
        showMap={false}
        showArmstrong={false}
        variant="page"
      />
    </div>
  );
}

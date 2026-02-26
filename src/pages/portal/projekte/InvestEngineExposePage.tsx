/**
 * InvestEngineExposePage — Exposé für Projekt-Einheiten (MOD-13)
 * Konsolidiert auf InvestmentExposeView (SSOT) via useProjectUnitExpose
 */
import { useParams, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Loader2 } from 'lucide-react';
import { InvestmentExposeView } from '@/components/investment/InvestmentExposeView';
import { useProjectUnitExpose } from '@/hooks/useProjectUnitExpose';

export default function InvestEngineExposePage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();

  const projectIdParam = searchParams.get('projectId') || '';
  const backLink = projectIdParam
    ? `/portal/projekte/invest-engine?projectId=${projectIdParam}`
    : '/portal/projekte/invest-engine';

  const {
    listing,
    isLoading,
    project,
    params,
    setParams,
    calcResult,
    isCalculating,
    grossYield,
    hasCalculated,
    handleCalculate,
  } = useProjectUnitExpose({
    unitId,
    initialParams: {
      taxableIncome: Number(searchParams.get('zve')) || 60000,
      equity: Number(searchParams.get('equity')) || 50000,
      maritalStatus: (searchParams.get('marital') as 'single' | 'married') || 'single',
      hasChurchTax: searchParams.get('church') === 'true',
    },
    autoCalculate: false,
  });

  const afaLabel = project?.afa_model || 'linear';
  const buildingPercent = Math.round((1 - ((project?.land_share_percent ?? project?.ground_share_percent ?? 20) / 100)) * 100);

  return (
    <InvestmentExposeView
      listing={listing}
      isLoading={isLoading}
      calcResult={calcResult}
      isCalculating={isCalculating}
      params={params}
      onParamsChange={setParams}
      grossYield={grossYield}
      backLink={{
        to: backLink,
        label: 'Zurück zur InvestEngine',
      }}
      showDocuments={false}
      showFavorite={false}
      calculatorExtras={
        <div className="flex flex-col items-center gap-3">
          <Badge variant="outline" className="text-xs">
            AfA: {afaLabel} · Gebäude: {buildingPercent}%
          </Badge>
          <Button
            size="lg"
            onClick={handleCalculate}
            disabled={isCalculating}
            className="gap-2"
          >
            {isCalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {hasCalculated ? 'Neu berechnen' : 'Jetzt berechnen'}
          </Button>
        </div>
      }
    />
  );
}

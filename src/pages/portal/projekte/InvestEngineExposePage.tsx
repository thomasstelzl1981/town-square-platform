/**
 * InvestEngineExposePage — Vollbild-Exposé für Projekt-Einheiten
 * Strukturell identisch zu InvestmentExposePage (MOD-08),
 * aber mit dev_project_units als Datenquelle + Projekt-Defaults (AfA, Gebäudeanteil)
 * MOD-13 PROJEKTE
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  Calendar,
  Loader2,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';
import {
  MasterGraph,
  Haushaltsrechnung,
  InvestmentSliderPanel,
  DetailTable40Jahre,
  FinanzierungSummary,
} from '@/components/investment';

export default function InvestEngineExposePage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Read search params from InvestEngineTab
  const initialZve = Number(searchParams.get('zve')) || 60000;
  const initialEquity = Number(searchParams.get('equity')) || 50000;
  const initialMarital = (searchParams.get('marital') as 'single' | 'married') || 'single';
  const initialChurch = searchParams.get('church') === 'true';
  const projectIdParam = searchParams.get('projectId') || '';

  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    taxableIncome: initialZve,
    equity: initialEquity,
    maritalStatus: initialMarital,
    hasChurchTax: initialChurch,
  });

  // Fetch unit + project data
  const { data, isLoading } = useQuery({
    queryKey: ['invest-engine-unit', unitId],
    queryFn: async () => {
      if (!unitId) return null;

      // Fetch unit
      const { data: unit, error: unitErr } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('id', unitId)
        .maybeSingle();
      if (unitErr || !unit) return null;

      // Fetch project
      const { data: project, error: projErr } = await supabase
        .from('dev_projects')
        .select('*')
        .eq('id', unit.project_id)
        .maybeSingle();
      if (projErr || !project) return null;

      return { unit, project };
    },
    enabled: !!unitId,
  });

  const unit = data?.unit;
  const project = data?.project;

  // Initialize params with unit + project data
  useEffect(() => {
    if (unit && project) {
      setParams(prev => ({
        ...prev,
        purchasePrice: unit.list_price ?? 0,
        monthlyRent: unit.rent_net ?? unit.current_rent ?? 0,
        taxableIncome: prev.taxableIncome || initialZve,
        equity: prev.equity || initialEquity,
        maritalStatus: prev.maritalStatus || initialMarital,
        hasChurchTax: prev.hasChurchTax ?? initialChurch,
        afaModel: (project.afa_model as CalculationInput['afaModel']) ?? 'linear',
        buildingShare: 1 - ((project.land_share_percent ?? 20) / 100),
        managementCostMonthly: unit.hausgeld ?? 25,
      }));
    }
  }, [unit, project]);

  // Manual calculation trigger
  const [hasCalculated, setHasCalculated] = useState(false);
  const handleCalculate = useCallback(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
      setHasCalculated(true);
    }
  }, [params, calculate]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!unit || !project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Einheit nicht gefunden</p>
        <Link to="/portal/projekte/invest-engine">
          <Button className="mt-4">Zurück zur InvestEngine</Button>
        </Link>
      </div>
    );
  }

  const rentMonthly = unit.rent_net ?? unit.current_rent ?? 0;
  const listPrice = unit.list_price ?? 0;
  const grossYield = listPrice > 0 ? ((rentMonthly * 12) / listPrice) * 100 : 0;
  const addressLine = `${(project as any).postal_code || ''} ${(project as any).city || ''}, ${(project as any).address || ''}`.trim();

  // Build back link with search params preserved
  const backLink = projectIdParam
    ? `/portal/projekte/invest-engine?projectId=${projectIdParam}`
    : '/portal/projekte/invest-engine';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className={cn("border-b bg-card sticky top-0 z-10", isMobile && "px-3")}>
        <div className={cn("flex items-center justify-between", isMobile ? "py-3" : "px-6 py-4")}>
          <Link
            to={backLink}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isMobile ? 'Zurück' : 'Zurück zur InvestEngine'}
          </Link>
          <Badge variant="outline" className="text-xs">
            AfA: {(project as any).afa_model || 'linear'} · Gebäude: {Math.round((1 - (((project as any).land_share_percent ?? 20) / 100)) * 100)}%
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("relative", isMobile ? "p-3" : "p-6")}>
        <div className={cn(isMobile ? "space-y-6" : "grid lg:grid-cols-3 gap-8")}>
          {/* Left Column — Property Info & Calculations */}
          <div className={cn(!isMobile && "lg:col-span-2", "space-y-6")}>
            {/* Property Details */}
            <div>
              <div className={cn("mb-4", isMobile ? "space-y-2" : "flex items-start justify-between")}>
                <div>
                  <Badge className="mb-2">Eigentumswohnung</Badge>
                  <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>
                    {unit.unit_number} — {(project as any).name}
                  </h1>
                  {addressLine && (
                    <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {addressLine}
                    </p>
                  )}
                </div>
                <p className={cn("font-bold text-primary", isMobile ? "text-2xl" : "text-3xl")}>
                  {formatCurrency(listPrice)}
                </p>
              </div>

              {/* Key Facts */}
              <div className={cn("gap-4 p-4 rounded-xl bg-muted/50 grid", isMobile ? "grid-cols-3" : "grid-cols-2 md:grid-cols-6")}>
                <div>
                  <p className="text-sm text-muted-foreground">Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {unit.area_sqm ?? 0} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zimmer</p>
                  <p className="font-semibold">{unit.rooms_count ?? '–'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etage</p>
                  <p className="font-semibold">
                    {unit.floor === 0 ? 'EG' : (unit.floor ?? 0) < 0 ? `${Math.abs(unit.floor ?? 0)}. UG` : `${unit.floor}. OG`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Miete (kalt)</p>
                  <p className="font-semibold">{formatCurrency(rentMonthly)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hausgeld</p>
                  <p className="font-semibold">{formatCurrency(unit.hausgeld ?? 0)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rendite (brutto)</p>
                  <p className="font-semibold">{grossYield > 0 ? `${grossYield.toFixed(1)}%` : '–'}</p>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
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

            {/* MasterGraph */}
            {isCalculating ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : calcResult ? (
              <MasterGraph
                projection={calcResult.projection}
                title="Wertentwicklung (40 Jahre)"
                variant="full"
              />
            ) : null}

            {/* Haushaltsrechnung */}
            {calcResult && (
              <Haushaltsrechnung
                result={calcResult}
                variant="ledger"
                showMonthly={true}
              />
            )}

            {/* FinanzierungSummary */}
            {calcResult && (
              <FinanzierungSummary
                purchasePrice={listPrice}
                equity={params.equity}
                result={calcResult}
              />
            )}

            {/* DetailTable40Jahre */}
            {calcResult && (
              <DetailTable40Jahre
                projection={calcResult.projection}
                defaultOpen={false}
              />
            )}
          </div>

          {/* Right Column — Slider Panel */}
          {isMobile ? (
            <div className="space-y-6">
              <InvestmentSliderPanel
                value={params}
                onChange={setParams}
                layout="vertical"
                showAdvanced={false}
                purchasePrice={listPrice}
              />
            </div>
          ) : (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
                  <InvestmentSliderPanel
                    value={params}
                    onChange={setParams}
                    layout="vertical"
                    showAdvanced={true}
                    purchasePrice={listPrice}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
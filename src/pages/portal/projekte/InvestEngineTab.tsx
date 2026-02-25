/**
 * InvestEngine Tab — Investment-Perspektive auf die Projekt-Preisliste
 * MOD-13 PROJEKTE
 * 
 * Flow: Projekt-Auswahl → zVE/EK eingeben → Berechnen → Preisliste mit Monatsbelastung
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Loader2 } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvestmentEngine, defaultInput, type CalculationInput, type CalculationResult } from '@/hooks/useInvestmentEngine';
import { ProjectCard } from '@/components/projekte/ProjectCard';
import { InvestPreislisteTable } from '@/components/projekte/InvestPreislisteTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoId } from '@/engines/demoData/engine';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function InvestEngineTab() {
  const isMobile = useIsMobile();
  const { portfolioRows, projects } = useDevProjects();

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (portfolioRows.length > 0 && !selectedProjectId) {
      setSelectedProjectId(portfolioRows[0].id);
    }
  }, [portfolioRows, selectedProjectId]);

  // Search parameters (like SucheTab investment mode)
  const [zve, setZve] = useState(60000);
  const [equity, setEquity] = useState(50000);
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [hasChurchTax, setHasChurchTax] = useState(false);

  // Calculation state
  const [metricsCache, setMetricsCache] = useState<Record<string, CalculationResult['summary']>>({});
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);
  const { calculate } = useInvestmentEngine();

  const fullProject = projects.find(p => p.id === selectedProjectId);

  // Fetch units for selected project
  const { data: realUnits, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['dev_project_units_invest', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('unit_number');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedProjectId,
  });

  // Map units to table rows
  const unitRows = useMemo(() => {
    if (!realUnits) return [];
    return realUnits.map(u => ({
      id: u.id,
      public_id: u.public_id || u.id.substring(0, 8),
      unit_number: u.unit_number || '—',
      rooms: u.rooms_count ?? 0,
      floor: u.floor ?? 0,
      area_sqm: u.area_sqm ?? 0,
      list_price: u.list_price ?? 0,
      rent_monthly: u.rent_net ?? u.current_rent ?? 0,
      hausgeld: u.hausgeld ?? 0,
      status: u.status === 'verkauft' ? 'sold' : u.status === 'reserviert' ? 'reserved' : u.status || 'available',
    }));
  }, [realUnits]);

  // Reset calculation when project changes (including AfA parameter changes)
  useEffect(() => {
    setMetricsCache({});
    setHasCalculated(false);
  }, [selectedProjectId, fullProject?.afa_model, fullProject?.land_share_percent, fullProject?.afa_rate_percent]);

  // Calculate for all units in parallel
  const handleCalculate = useCallback(async () => {
    if (!realUnits || realUnits.length === 0 || !fullProject) return;

    setIsCalculatingAll(true);
    const newCache: Record<string, CalculationResult['summary']> = {};

    // Project-level defaults
    const afaModel = (fullProject.afa_model as CalculationInput['afaModel']) ?? 'linear';
    const buildingShare = 1 - ((fullProject.land_share_percent ?? 20) / 100);

    await Promise.all(realUnits.map(async (unit) => {
      const rentMonthly = unit.rent_net ?? unit.current_rent ?? 0;
      const listPrice = unit.list_price ?? 0;
      if (listPrice <= 0) return;

      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: listPrice,
        monthlyRent: rentMonthly,
        equity,
        taxableIncome: zve,
        maritalStatus,
        hasChurchTax,
        afaModel,
        buildingShare,
        managementCostMonthly: unit.hausgeld ?? 25,
        afaRateOverride: fullProject.afa_rate_percent ?? undefined,
      };

      const result = await calculate(input);
      if (result) {
        newCache[unit.id] = result.summary;
      }
    }));

    setMetricsCache(newCache);
    setHasCalculated(true);
    setIsCalculatingAll(false);

    // Mark invest_engine_analyzed flag in DB for Golden Path
    if (selectedProjectId) {
      supabase
        .from('dev_projects')
        .update({ invest_engine_analyzed: true })
        .eq('id', selectedProjectId)
        .then(() => {
          console.log('[InvestEngine] invest_engine_analyzed flag set for project', selectedProjectId);
        });
    }
  }, [realUnits, fullProject, equity, zve, maritalStatus, hasChurchTax, calculate, selectedProjectId]);

  // Build search params for pass-through to expose page
  const searchParamsString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('zve', String(zve));
    params.set('equity', String(equity));
    params.set('marital', maritalStatus);
    params.set('church', String(hasChurchTax));
    params.set('projectId', selectedProjectId);
    return params.toString();
  }, [zve, equity, maritalStatus, hasChurchTax, selectedProjectId]);

  return (
    <PageShell>
      <ModulePageHeader
        title="InvestEngine"
        description="Investorenperspektive auf Ihre Projekt-Einheiten — Monatsbelastung nach Steuer"
      />

      {/* Project Switcher */}
      <WidgetGrid>
        {portfolioRows.map((p) => (
          <WidgetCell key={p.id}>
            <ProjectCard
              project={p}
              isDemo={isDemoId(p.id)}
              isSelected={p.id === selectedProjectId}
              onClick={(id) => setSelectedProjectId(id)}
            />
          </WidgetCell>
        ))}
      </WidgetGrid>

      {/* Search Parameters Card — like SucheTab investment mode */}
      <Card>
        <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-3"}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-4 h-4" />
            Investment-Parameter
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? "space-y-3 px-3 pb-3" : "space-y-4"}>
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}>
            <div className="space-y-2">
              <Label>zu versteuerndes Einkommen (zVE)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={zve}
                  onChange={(e) => setZve(Number(e.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Eigenkapital</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={equity}
                  onChange={(e) => setEquity(Number(e.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              </div>
            </div>

            {isMobile ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Familienstand</Label>
                  <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Ledig</SelectItem>
                      <SelectItem value="married">Verheiratet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kirchensteuer</Label>
                  <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Nein</SelectItem>
                      <SelectItem value="yes">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Familienstand</Label>
                  <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Ledig</SelectItem>
                      <SelectItem value="married">Verheiratet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kirchensteuer</Label>
                  <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Nein</SelectItem>
                      <SelectItem value="yes">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={isCalculatingAll || !selectedProjectId || unitRows.length === 0}
            className={isMobile ? "w-full h-12 text-base" : ""}
            size={isMobile ? "lg" : "default"}
          >
            {isCalculatingAll && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {hasCalculated ? 'Neu berechnen' : 'Berechnen'}
          </Button>
        </CardContent>
      </Card>

      {/* Results: Investment Price List */}
      {selectedProjectId && (
        <>
          {isLoadingUnits ? (
            <LoadingState />
          ) : unitRows.length > 0 ? (
            <>
              <h3 className="text-sm font-medium text-muted-foreground">
                Investment-Preisliste — {unitRows.length} Einheiten
                {fullProject && (
                  <span className="ml-2 text-xs text-muted-foreground/70">
                    (AfA: {fullProject.afa_model || 'linear'}, Gebäudeanteil: {100 - (fullProject.land_share_percent ?? 20)}%)
                  </span>
                )}
              </h3>
              <InvestPreislisteTable
                units={unitRows}
                metricsCache={metricsCache}
                hasCalculated={hasCalculated}
                isCalculating={isCalculatingAll}
                searchParams={searchParamsString}
              />
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Keine Einheiten in diesem Projekt vorhanden.
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
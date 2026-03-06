/**
 * PropertyValuationTab — Bewertung tab extracted from PropertyDetailPage
 * R-15 sub-component
 * V7.0: Delete fix (tenant_id + error check), Open-Case handler, re-open completed valuations
 */
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, TrendingUp, Play, Database, Trash2, RotateCcw, AlertTriangle, Eye } from 'lucide-react';
import { useValuationCase } from '@/hooks/useValuationCase';
import { toast } from 'sonner';
import {
  ValuationPreflight,
  ValuationPipeline,
  ValuationReportReader,
  ValuationDiffReview,
  generateValuationPdf,
} from '@/components/shared/valuation';

interface Props {
  propertyId: string;
  tenantId: string;
}

export function PropertyValuationTab({ propertyId, tenantId }: Props) {
  const [showPipeline, setShowPipeline] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { state, isLoading, runPreflight, runValuation, fetchResult, reset } = useValuationCase();

  // Fetch existing valuations from valuation_cases (SSOT table)
  const { data: valuations, isLoading: loadingList } = useQuery({
    queryKey: ['valuation-cases', propertyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuation_cases')
        .select('id, status, source_mode, created_at, updated_at')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (data && data.length > 0) {
        const completedIds = data.filter(c => c.status === 'final').map(c => c.id);
        if (completedIds.length > 0) {
          const { data: results } = await supabase
            .from('valuation_results')
            .select('case_id, value_band')
            .in('case_id', completedIds);
          
          const resultMap = new Map(results?.map(r => [r.case_id, r.value_band]) || []);
          return data.map(c => ({
            ...c,
            market_value: (() => {
              const vb = resultMap.get(c.id) as any;
              return vb?.p50 ?? null;
            })(),
          }));
        }
      }
      return data?.map(c => ({ ...c, market_value: null as number | null })) || [];
    },
    enabled: !!propertyId && !!tenantId,
  });

  const fmt = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  const handleStartValuation = async () => {
    const preflight = await runPreflight({
      propertyId,
      sourceContext: 'MOD_04',
    });
    if (preflight) {
      setShowPipeline(true);
    }
  };

  const handleRunValuation = async () => {
    await runValuation({
      propertyId,
      sourceContext: 'MOD_04',
    });
  };

  const handleReset = () => {
    reset();
    setShowPipeline(false);
    queryClient.invalidateQueries({ queryKey: ['valuation-cases', propertyId, tenantId] });
  };

  /** Open an existing completed case to view its report */
  const handleOpenCase = async (caseId: string) => {
    setOpeningId(caseId);
    try {
      const result = await fetchResult(caseId);
      if (result) {
        setShowPipeline(true);
      }
    } catch (e: any) {
      console.error('Open case error:', e);
      toast.error('Gutachten konnte nicht geladen werden');
    } finally {
      setOpeningId(null);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    setDeletingId(caseId);
    try {
      // Child-first deletion order
      // valuation_reports, valuation_results, valuation_inputs only have case_id (no tenant_id)
      // valuation_cases has tenant_id
      const { error: e1 } = await (supabase.from('valuation_reports').delete() as any).eq('case_id', caseId);
      if (e1) throw new Error(`Reports: ${e1.message}`);

      const { error: e2 } = await (supabase.from('valuation_results').delete() as any).eq('case_id', caseId);
      if (e2) throw new Error(`Results: ${e2.message}`);

      const { error: e3 } = await (supabase.from('valuation_inputs').delete() as any).eq('case_id', caseId);
      if (e3) throw new Error(`Inputs: ${e3.message}`);

      const { error: e4 } = await (supabase.from('valuation_cases').delete() as any).eq('id', caseId).eq('tenant_id', tenantId);
      if (e4) throw new Error(`Case: ${e4.message}`);

      toast.success('Bewertung gelöscht');
      queryClient.invalidateQueries({ queryKey: ['valuation-cases', propertyId, tenantId] });
    } catch (e: any) {
      console.error('Delete error:', e);
      toast.error(`Löschen fehlgeschlagen: ${e.message || 'Unbekannter Fehler'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    const r = state.resultData;
    if (!r?.valueBand) return;
    try {
      await generateValuationPdf({
        snapshot: r.snapshot || { address: '', city: '', postalCode: '', objectType: null, livingAreaSqm: null, plotAreaSqm: null, usableAreaSqm: null, commercialAreaSqm: null, rooms: null, units: null, floors: null, parkingSpots: null, yearBuilt: null, condition: null, energyClass: null, modernizations: [], askingPrice: null, netColdRentMonthly: null, netColdRentPerSqm: null, hausgeldMonthly: null, vacancyRate: null, rentalStatus: null, purchasePrice: null, acquisitionCosts: null, notaryDate: null, legalTitle: null, existingLoanData: null, groundBookEntry: null, partitionDeclaration: null, providerName: null, providerContact: null },
        valueBand: r.valueBand,
        methods: r.methods || [],
        financing: r.financing || [],
        stressTests: r.stressTests || [],
        lienProxy: r.lienProxy || null,
        dataQuality: r.dataQuality || null,
        compStats: r.compStats || null,
        comps: r.comps || [],
        location: r.location || null,
        executiveSummary: r.executiveSummary || '',
        caseId: state.caseId || 'unknown',
        generatedAt: new Date().toISOString(),
        sourceMode: 'SSOT_FINAL',
        legalTitle: r.legalTitle || null,
      });
      toast.success('PDF erstellt');
    } catch (e) {
      console.error('PDF error:', e);
      toast.error('PDF-Erstellung fehlgeschlagen');
    }
  }, [state.resultData, state.caseId]);

  // Pipeline view
  if (showPipeline) {
    if (state.status === 'idle' && state.preflight) {
      return (
        <div className="space-y-4">
          <ValuationPreflight
            preflight={state.preflight}
            onCheckPreflight={handleStartValuation}
            onStartValuation={handleRunValuation}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (state.status === 'running') {
      return (
        <ValuationPipeline
          stages={state.stages}
          currentStage={state.currentStage}
          status={state.status}
          error={state.error}
        />
      );
    }

    if (state.resultData) {
      const r = state.resultData;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-[10px] bg-primary/90">
              <Database className="h-3 w-3 mr-1" />
              SSOT (Final)
            </Badge>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Zurück
            </Button>
          </div>

          {r.diffs && r.diffs.length > 0 && (
            <ValuationDiffReview diffs={r.diffs} />
          )}

          <ValuationReportReader
            valueBand={r.valueBand}
            methods={r.methods || []}
            financing={r.financing || []}
            stressTests={r.stressTests || []}
            lienProxy={r.lienProxy || null}
            debtService={r.debtService || null}
            dataQuality={r.dataQuality || null}
            compStats={r.compStats || null}
            executiveSummary={r.executiveSummary}
            sourceMode={r.sourceMode || 'SSOT_FINAL'}
            legalTitle={r.legalTitle || null}
            location={r.location || null}
            comps={r.comps || []}
            beleihungswert={r.beleihungswert || null}
            geminiResearch={r.geminiResearch || null}
            onDownloadPdf={handleDownloadPdf}
          />
        </div>
      );
    }

    // Fallback: pipeline finished but no resultData (e.g. DB insert failed)
    if (state.status !== 'idle') {
      return (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center py-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-destructive/60" />
            <p className="text-sm font-medium">Bewertung konnte nicht geladen werden</p>
            <p className="text-xs text-muted-foreground">
              {state.error || 'Das Ergebnis wurde möglicherweise nicht korrekt gespeichert.'}
            </p>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      );
    }
  }

  // Default: List view
  if (loadingList) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Neue SSOT-Bewertung starten</p>
            <p className="text-xs text-muted-foreground">
              Nutzt alle Daten aus der Immobilienakte (20 Credits)
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStartValuation}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Bewertung starten
          </Button>
        </CardContent>
      </Card>

      {(!valuations || valuations.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Noch keine Bewertungen vorhanden</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Starten Sie eine Bewertung, um hier Ihr Gutachten zu erhalten.
            </p>
          </CardContent>
        </Card>
      ) : (
        valuations.map((v) => (
          <Card
            key={v.id}
            className={v.status === 'final' ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}
            onClick={() => v.status === 'final' && handleOpenCase(v.id)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">
                  {v.source_mode === 'SSOT_FINAL' ? 'SSOT' : 'Draft'}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono">{v.id.slice(0, 8)}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {v.updated_at ? new Date(v.updated_at).toLocaleDateString('de-DE') : v.created_at ? new Date(v.created_at).toLocaleDateString('de-DE') : '–'}
                  </p>
                  <Badge variant={v.status === 'final' ? 'default' : 'outline'} className="text-[9px]">
                    {v.status === 'final' ? 'Abgeschlossen' : v.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm font-semibold shrink-0">{fmt(v.market_value)}</p>

              {/* Open button for completed cases */}
              {v.status === 'final' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleOpenCase(v.id); }}
                  disabled={openingId === v.id}
                >
                  {openingId === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={(e) => { e.stopPropagation(); handleDeleteCase(v.id); }}
                disabled={deletingId === v.id}
              >
                {deletingId === v.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

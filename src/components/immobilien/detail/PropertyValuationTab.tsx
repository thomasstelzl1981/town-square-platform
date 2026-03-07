/**
 * PropertyValuationTab — Bewertung tab extracted from PropertyDetailPage
 * R-15 sub-component
 * V9.2: Phase 1 — Photo/Document uploads + enhanced Maps
 */
import { useState, useCallback, useMemo } from 'react';
import type { DocumentSlot } from '@/components/shared/valuation/ValuationDocumentGrid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, TrendingUp, TrendingDown, Minus, Play, Database, Trash2, RotateCcw, AlertTriangle, Eye, GitCompareArrows } from 'lucide-react';
import { useValuationCase } from '@/hooks/useValuationCase';
import { toast } from 'sonner';
import {
  ValuationPreflight,
  ValuationPipeline,
  ValuationReportReader,
  ValuationDiffReview,
  ValuationPdfPipeline,
} from '@/components/shared/valuation';
import { ValuationCompare } from '@/components/shared/valuation/ValuationCompare';

interface Props {
  propertyId: string;
  tenantId: string;
}

interface EnrichedCase {
  id: string;
  status: string;
  source_mode: string | null;
  created_at: string;
  updated_at: string;
  market_value: number | null;
  p25: number | null;
  p75: number | null;
  data_quality: any | null;
  version: number;
  delta: number | null;
  deltaPercent: number | null;
}

export function PropertyValuationTab({ propertyId, tenantId }: Props) {
  const [showPipeline, setShowPipeline] = useState(false);
  const [showPdfPipeline, setShowPdfPipeline] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [valuationPhotos, setValuationPhotos] = useState<string[]>([]);
  const [valuationDocuments, setValuationDocuments] = useState<DocumentSlot[]>([]);
  const queryClient = useQueryClient();
  const { state, isLoading, runPreflight, runValuation, fetchResult, reset } = useValuationCase();

  // Fetch existing valuations from valuation_cases + results
  const { data: valuations, isLoading: loadingList } = useQuery({
    queryKey: ['valuation-cases', propertyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuation_cases')
        .select('id, status, source_mode, created_at, updated_at')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const completedIds = data.filter(c => c.status === 'final').map(c => c.id);
      let resultMap = new Map<string, any>();

      if (completedIds.length > 0) {
        const { data: results } = await supabase
          .from('valuation_results')
          .select('case_id, value_band')
          .in('case_id', completedIds);

        resultMap = new Map(results?.map(r => [r.case_id, r]) || []);
      }

      // Build enriched list: ascending order for version numbering
      const enriched: EnrichedCase[] = data.map((c, idx) => {
        const result = resultMap.get(c.id);
        const vb = result?.value_band as any;
        const marketValue = vb?.p50 ?? null;
        const p25 = vb?.p25 ?? null;
        const p75 = vb?.p75 ?? null;
        const dq = vb?.data_quality ?? null;

        // Delta vs previous completed case
        let delta: number | null = null;
        let deltaPercent: number | null = null;
        if (marketValue !== null && idx > 0) {
          for (let j = idx - 1; j >= 0; j--) {
            const prev = resultMap.get(data[j].id);
            const prevMv = (prev?.value_band as any)?.p50 ?? null;
            if (prevMv !== null) {
              delta = marketValue - prevMv;
              deltaPercent = prevMv > 0 ? (delta / prevMv) * 100 : null;
              break;
            }
          }
        }

        return {
          ...c,
          market_value: marketValue,
          p25,
          p75,
          data_quality: dq,
          version: idx + 1,
          delta,
          deltaPercent,
        };
      });

      // Return in descending order for display (newest first)
      return enriched.reverse();
    },
    enabled: !!propertyId && !!tenantId,
  });

  const fmt = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  const fmtCompact = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 0 }).format(v) + ' €' : '–';

  const completedCases = useMemo(() => valuations?.filter(v => v.status === 'final') || [], [valuations]);
  const canCompare = completedCases.length >= 2;

  const handleStartValuation = async () => {
    const preflight = await runPreflight({ propertyId, sourceContext: 'MOD_04' });
    if (preflight) setShowPipeline(true);
  };

  const handleRunValuation = async () => {
    await runValuation({ propertyId, sourceContext: 'MOD_04' });
  };

  const handleReset = () => {
    reset();
    setShowPipeline(false);
    queryClient.invalidateQueries({ queryKey: ['valuation-cases', propertyId, tenantId] });
  };

  const handleOpenCase = async (caseId: string) => {
    setOpeningId(caseId);
    try {
      const result = await fetchResult(caseId);
      if (result) setShowPipeline(true);
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

  const handleOpenPdfPipeline = useCallback(() => {
    setShowPdfPipeline(true);
  }, []);

  const handleCompare = () => {
    if (completedCases.length >= 2) {
      setCompareIds([completedCases[0].id, completedCases[1].id]);
    }
  };

  // Compare view
  if (compareIds) {
    return (
      <ValuationCompare
        caseIdA={compareIds[0]}
        caseIdB={compareIds[1]}
        allCases={completedCases.map(c => ({ id: c.id, version: c.version, date: c.created_at }))}
        onClose={() => setCompareIds(null)}
      />
    );
  }

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
            snapshot={r.snapshot || null}
            propertyId={propertyId}
            tenantId={tenantId}
            photos={valuationPhotos}
            onPhotosChange={setValuationPhotos}
            documents={valuationDocuments}
            onDocumentsChange={setValuationDocuments}
            onDownloadPdf={handleOpenPdfPipeline}
          />

          {showPdfPipeline && (
            <ValuationPdfPipeline
              snapshot={r.snapshot || null}
              valueBand={r.valueBand}
              methods={r.methods || []}
              financing={r.financing || []}
              stressTests={r.stressTests || []}
              lienProxy={r.lienProxy || null}
              dataQuality={r.dataQuality || null}
              compStats={r.compStats || null}
              comps={r.comps || []}
              location={r.location || null}
              executiveSummary={r.executiveSummary || ''}
              caseId={state.caseId || 'unknown'}
              sourceMode={r.sourceMode || 'SSOT_FINAL'}
              legalTitle={r.legalTitle || null}
              beleihungswert={r.beleihungswert || null}
              geminiResearch={r.geminiResearch || null}
              photos={valuationPhotos}
              documents={valuationDocuments}
              onClose={() => setShowPdfPipeline(false)}
            />
          )
          />
        </div>
      );
    }

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
          <div className="flex items-center gap-2">
            {canCompare && (
              <Button size="sm" variant="outline" onClick={handleCompare}>
                <GitCompareArrows className="h-3.5 w-3.5 mr-1.5" />
                Vergleichen
              </Button>
            )}
            <Button size="sm" onClick={handleStartValuation} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              Bewertung starten
            </Button>
          </div>
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
        valuations.map((v) => {
          const dqScore = v.data_quality?.score ?? null;
          const dqMax = v.data_quality?.max ?? 10;

          return (
            <Card
              key={v.id}
              className={v.status === 'final' ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}
              onClick={() => v.status === 'final' && handleOpenCase(v.id)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                {/* Version badge */}
                <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
                  <span className="text-xs font-bold text-foreground">V{v.version}</span>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">
                    {v.source_mode === 'SSOT_FINAL' ? 'SSOT' : 'Draft'}
                  </Badge>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      Gutachten V{v.version}
                    </p>
                    <Badge variant={v.status === 'final' ? 'default' : 'outline'} className="text-[9px]">
                      {v.status === 'final' ? 'Abgeschlossen' : v.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.created_at ? new Date(v.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'}
                    {v.p25 != null && v.p75 != null && (
                      <span className="ml-2 text-muted-foreground/70">
                        Band: {fmtCompact(v.p25)} – {fmtCompact(v.p75)}
                      </span>
                    )}
                  </p>
                  {/* Data quality bar */}
                  {dqScore != null && (
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <Progress value={(dqScore / dqMax) * 100} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{dqScore}/{dqMax}</span>
                    </div>
                  )}
                </div>

                {/* Market value + delta */}
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-sm font-semibold">{fmt(v.market_value)}</p>
                  {v.delta != null && v.deltaPercent != null && (
                    <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${v.delta > 0 ? 'text-emerald-600' : v.delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {v.delta > 0 ? <TrendingUp className="h-3 w-3" /> : v.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      <span>{v.delta > 0 ? '+' : ''}{v.deltaPercent.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {v.status === 'final' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleOpenCase(v.id); }}
                    disabled={openingId === v.id}
                  >
                    {openingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCase(v.id); }}
                  disabled={deletingId === v.id}
                >
                  {deletingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

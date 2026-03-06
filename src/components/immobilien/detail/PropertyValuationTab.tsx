/**
 * PropertyValuationTab — Bewertung tab extracted from PropertyDetailPage
 * R-15 sub-component
 * V6.0: SSOT-Final Mode — fetches full property context for valuation engine
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, TrendingUp, Play, Database } from 'lucide-react';
import { useValuationCase } from '@/hooks/useValuationCase';
import {
  ValuationPreflight,
  ValuationPipeline,
  ValuationReportReader,
  ValuationDiffReview,
} from '@/components/shared/valuation';

interface Props {
  propertyId: string;
  tenantId: string;
}

export function PropertyValuationTab({ propertyId, tenantId }: Props) {
  const [showPipeline, setShowPipeline] = useState(false);
  const { state, isLoading, runPreflight, runValuation, reset } = useValuationCase();

  // Fetch existing valuations
  const { data: valuations, isLoading: loadingList } = useQuery({
    queryKey: ['property-valuations', propertyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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
  };

  // Pipeline view
  if (showPipeline) {
    // Show preflight
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

    // Show running pipeline
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

    // Show results
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

          {/* Diff Review if diffs exist */}
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
            sourceMode="SSOT_FINAL"
            legalTitle={r.legalTitle || null}
          />
        </div>
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
      {/* Start new valuation button */}
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

      {/* Existing valuations list */}
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
          <Card key={v.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">PDF</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono">{v.public_id}</p>
                <p className="text-xs text-muted-foreground">
                  {v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}
                </p>
              </div>
              <p className="text-sm font-semibold shrink-0">{fmt(v.market_value)}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

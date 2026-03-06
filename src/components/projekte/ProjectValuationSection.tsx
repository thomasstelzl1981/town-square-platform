/**
 * ProjectValuationSection — MOD-13 Entry Point for ENG-VALUATION
 * Provides project-level valuation (Gesamtobjekt vor Aufteilung)
 * Uses shared ValuationReportReader + ValuationPipeline
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, Loader2, RotateCcw } from 'lucide-react';
import { useValuationCase } from '@/hooks/useValuationCase';
import { ValuationPreflight, ValuationPipeline, ValuationReportReader } from '@/components/shared/valuation';

interface ProjectValuationSectionProps {
  projectId: string;
  projectName: string;
  address?: string | null;
}

export function ProjectValuationSection({ projectId, projectName, address }: ProjectValuationSectionProps) {
  const valuation = useValuationCase();

  const runParams = {
    propertyId: projectId,
    sourceContext: 'MOD_13_INBOX' as const,
  };

  const statusLabel = valuation.state.status === 'idle' ? 'Keine Bewertung' : valuation.state.status;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Projektbewertung</CardTitle>
                <CardDescription>
                  Gesamtbewertung für {projectName || 'dieses Projekt'}
                  {address && ` — ${address}`}
                </CardDescription>
              </div>
            </div>
            <Badge variant={valuation.state.resultData ? 'default' : 'secondary'} className="text-xs">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {valuation.state.status === 'idle' && !valuation.state.preflight && (
            <ValuationPreflight
              preflight={null}
              isLoading={valuation.isLoading}
              onCheckPreflight={() => valuation.runPreflight(runParams)}
              onStartValuation={() => valuation.runValuation(runParams)}
            />
          )}

          {valuation.state.preflight && valuation.state.status !== 'running' && !valuation.state.resultData && (
            <ValuationPreflight
              preflight={valuation.state.preflight}
              isLoading={valuation.isLoading}
              onCheckPreflight={() => valuation.runPreflight(runParams)}
              onStartValuation={() => valuation.runValuation(runParams)}
            />
          )}

          {valuation.state.status === 'running' && (
            <ValuationPipeline
              stages={valuation.state.stages}
              currentStage={valuation.state.currentStage}
              status={valuation.state.status}
              error={valuation.state.error}
            />
          )}

          {valuation.state.status === 'failed' && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{valuation.state.error || 'Bewertung fehlgeschlagen'}</p>
              <Button variant="outline" size="sm" onClick={valuation.reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Erneut versuchen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {valuation.state.resultData && (
        <Card>
          <CardContent className="pt-6">
            <ValuationReportReader
              valueBand={valuation.state.resultData.valueBand}
              methods={valuation.state.resultData.methods || []}
              financing={valuation.state.resultData.financing || []}
              stressTests={valuation.state.resultData.stressTests || []}
              lienProxy={valuation.state.resultData.lienProxy || null}
              debtService={valuation.state.resultData.debtService || null}
              dataQuality={valuation.state.resultData.dataQuality || null}
              compStats={valuation.state.resultData.compStats || null}
              executiveSummary={valuation.state.resultData.executiveSummary}
              sourceMode={valuation.state.sourceMode}
              location={valuation.state.resultData.location || null}
              comps={valuation.state.resultData.comps || []}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={valuation.reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Neue Bewertung
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

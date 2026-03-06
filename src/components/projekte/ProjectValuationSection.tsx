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
  const {
    state,
    isLoading,
    runPreflight,
    runValuation,
    reset,
  } = useValuationCase();

  const handleStart = async () => {
    const preflight = await runPreflight({
      propertyId: projectId,
      sourceContext: 'MOD_13_INBOX',
    });
    if (preflight?.approved) {
      await runValuation();
    }
  };

  const statusLabel = state.status === 'idle' ? 'Keine Bewertung' : state.status;

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
            <Badge variant={state.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {state.status === 'idle' && (
            <Button onClick={handleStart} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Projekt bewerten
            </Button>
          )}

          {state.status === 'preflight' && state.preflight && (
            <ValuationPreflight
              data={state.preflight}
              onConfirm={() => runValuation()}
              onCancel={reset}
              isLoading={isLoading}
            />
          )}

          {(state.status === 'running' || state.status === 'pending') && (
            <ValuationPipeline stages={state.stages} currentStage={state.currentStage} />
          )}

          {state.status === 'failed' && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{state.error || 'Bewertung fehlgeschlagen'}</p>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Erneut versuchen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {state.status === 'completed' && state.resultData && (
        <Card>
          <CardContent className="pt-6">
            <ValuationReportReader
              data={state.resultData}
              sourceMode={state.sourceMode}
              legalTitle={projectName}
              location={address || undefined}
              comps={state.resultData?.comps}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Neue Bewertung
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * ValuationPipeline — 6-stage progress visualization for SoT Valuation Engine
 * Uses the SearchProgressIndicator open-ended pattern for long-running stages.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VALUATION_STAGES } from '@/engines/valuation/spec';
import type { StageProgress } from '@/hooks/useValuationCase';
import type { ValuationStageId, ValuationStageStatus } from '@/engines/valuation/spec';

interface Props {
  stages: StageProgress[];
  currentStage: ValuationStageId;
  status: string;
  error: string | null;
  className?: string;
}

export function ValuationPipeline({ stages, currentStage, status, error, className }: Props) {
  const isRunning = status === 'running';

  return (
    <Card className={className}>
      <CardContent className="py-5 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : status === 'final' ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : status === 'failed' ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">
            {isRunning ? 'Bewertung läuft…' : status === 'final' ? 'Bewertung abgeschlossen' : status === 'failed' ? 'Fehler' : 'Pipeline'}
          </span>
          {isRunning && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              Stage {currentStage + 1}/6
            </Badge>
          )}
        </div>

        {VALUATION_STAGES.map((stageDef) => {
          const stageData = stages.find(s => s.stageId === stageDef.id);
          const stageStatus = getStageDisplayStatus(stageDef.id, stageData, currentStage, isRunning);

          return (
            <div
              key={stageDef.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                stageStatus === 'running' && 'bg-primary/5',
                stageStatus === 'done' && 'opacity-80',
                stageStatus === 'queued' && 'opacity-40',
              )}
            >
              <StageIcon status={stageStatus} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium',
                  stageStatus === 'running' && 'text-primary',
                  stageStatus === 'done' && 'text-foreground',
                  stageStatus === 'queued' && 'text-muted-foreground',
                )}>
                  {stageDef.name}
                </p>
                {stageStatus === 'running' && (
                  <p className="text-[10px] text-muted-foreground">{stageDef.description}</p>
                )}
              </div>
              {stageData?.durationMs && stageStatus === 'done' && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {(stageData.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}

        {error && (
          <div className="flex items-start gap-2 mt-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStageDisplayStatus(
  stageId: ValuationStageId,
  stageData: StageProgress | undefined,
  currentStage: ValuationStageId,
  isRunning: boolean,
): ValuationStageStatus {
  if (stageData?.status === 'done' || stageData?.status === 'fail' || stageData?.status === 'warn') {
    return stageData.status;
  }
  if (isRunning && stageId === currentStage) return 'running';
  if (isRunning && stageId < currentStage) return 'done';
  return 'queued';
}

function StageIcon({ status }: { status: ValuationStageStatus }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />;
    case 'fail':
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
    case 'warn':
      return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
    default:
      return (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      );
  }
}

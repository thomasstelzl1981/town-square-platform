/**
 * ValuationPreflight — Credit gate + source summary + KI-Validierung before starting a valuation
 * V9.2: Shows warnings/blockers from KI-Preflight validation
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, Globe, CheckCircle2, AlertTriangle, Loader2, Database, ShieldAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PreflightOutput, PreflightWarning } from '@/engines/valuation/spec';
import { VALUATION_CREDITS_PER_CASE } from '@/engines/valuation/spec';

interface Props {
  preflight: PreflightOutput | null;
  isLoading: boolean;
  onCheckPreflight: () => void;
  onStartValuation: () => void;
  className?: string;
}

export function ValuationPreflight({
  preflight,
  isLoading,
  onCheckPreflight,
  onStartValuation,
  className,
}: Props) {
  if (!preflight) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Zap className="h-8 w-8 text-primary/60 mb-3" />
          <p className="text-sm font-medium">SoT Bewertung starten</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            KI-gestützte Wertermittlung mit deterministischem Rechenkern. Kosten: {VALUATION_CREDITS_PER_CASE} Credits.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={onCheckPreflight}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Zap className="h-4 w-4 mr-1.5" />}
            Preflight prüfen
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasBlockers = (preflight.blockers?.length ?? 0) > 0;
  const hasWarnings = (preflight.warnings?.length ?? 0) > 0;
  const canStart = preflight.limitsOk && !hasBlockers;

  return (
    <Card className={className}>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Bewertung — Preflight</span>
          {preflight.sourceMode && (
            <Badge 
              variant={preflight.sourceMode === 'SSOT_FINAL' ? 'default' : 'outline'} 
              className={cn('text-[10px]', preflight.sourceMode === 'SSOT_FINAL' && 'bg-primary/90')}
            >
              <Database className="h-3 w-3 mr-1" />
              {preflight.sourceModeLabel || preflight.sourceMode}
            </Badge>
          )}
          <Badge variant="secondary" className="ml-auto text-xs">
            {preflight.creditsCost} Credits
          </Badge>
        </div>

        {/* Sources */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quellen</p>
          {preflight.sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {s.type === 'url' ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="truncate flex-1">{s.name}</span>
              {s.pages && <span className="text-muted-foreground">{s.pages} S.</span>}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-1">
            Geschätzt: {preflight.totalEstimatedPages} Seiten
          </p>
        </div>

        {/* Service availability */}
        <div className="flex gap-3 text-xs">
          <ServiceCheck label="Google APIs" ok={preflight.googleApiAvailable} />
          <ServiceCheck label="Scraper" ok={preflight.scraperAvailable} />
        </div>

        {/* V9.2: Blockers */}
        {hasBlockers && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-destructive uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" /> Bewertung nicht möglich
            </p>
            {preflight.blockers!.map((b, i) => (
              <ValidationItem key={i} item={b} type="blocker" />
            ))}
          </div>
        )}

        {/* V9.2: Warnings */}
        {hasWarnings && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Hinweise zur Datenqualität
            </p>
            {preflight.warnings!.map((w, i) => (
              <ValidationItem key={i} item={w} type="warning" />
            ))}
          </div>
        )}

        {/* Limits */}
        {!preflight.limitsOk && !hasBlockers && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Quellen überschreiten das Limit. Bitte reduzieren.</span>
          </div>
        )}

        <Button
          className="w-full"
          onClick={onStartValuation}
          disabled={isLoading || !canStart}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Zap className="h-4 w-4 mr-1.5" />
          )}
          {hasBlockers
            ? 'Daten unvollständig — Bewertung nicht möglich'
            : `Bewertung starten (${preflight.creditsCost} Credits)`}
        </Button>

        {hasWarnings && !hasBlockers && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-700 text-[10px]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Bewertung trotz Hinweisen möglich, Ergebnisse können jedoch ungenau sein.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
      )}
      <span className={ok ? 'text-foreground' : 'text-destructive'}>{label}</span>
    </div>
  );
}

function ValidationItem({ item, type }: { item: PreflightWarning; type: 'warning' | 'blocker' }) {
  const isBlocker = type === 'blocker';
  return (
    <div className={cn(
      'flex items-start gap-2 p-2.5 rounded-lg text-xs',
      isBlocker ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-800'
    )}>
      {isBlocker ? (
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      )}
      <div className="space-y-0.5">
        <p>{item.message}</p>
        {item.suggestedAction && (
          <p className="text-[10px] opacity-80">→ {item.suggestedAction}</p>
        )}
      </div>
    </div>
  );
}

/**
 * ValuationPreflight — Credit gate + source summary before starting a valuation
 * V6.0: Shows source mode badge (SSOT vs Draft)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, Globe, CheckCircle2, AlertTriangle, Loader2, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PreflightOutput } from '@/engines/valuation/spec';
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

        {/* Limits */}
        {!preflight.limitsOk && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Quellen überschreiten das Limit. Bitte reduzieren.</span>
          </div>
        )}

        <Button
          className="w-full"
          onClick={onStartValuation}
          disabled={isLoading || !preflight.limitsOk}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Zap className="h-4 w-4 mr-1.5" />
          )}
          Bewertung starten ({preflight.creditsCost} Credits)
        </Button>
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

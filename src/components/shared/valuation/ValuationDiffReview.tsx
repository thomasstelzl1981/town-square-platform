/**
 * ValuationDiffReview — Shows SSOT vs Extracted field differences
 * Default: SSOT always wins. User can review but no auto-override.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { DiffEntry } from '@/engines/valuation/spec';

interface Props {
  diffs: DiffEntry[];
  className?: string;
}

const fmtVal = (v: string | number | boolean | null) => {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'number') return v.toLocaleString('de-DE');
  return String(v);
};

export function ValuationDiffReview({ diffs, className }: Props) {
  if (!diffs || diffs.length === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-semibold">SSOT ≠ Exposé — Abweichungen</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {diffs.length} Felder
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Diese Felder weichen zwischen SSOT-Daten und Exposé-Extraktion ab. SSOT-Werte werden immer beibehalten.
        </p>
        <div className="space-y-2">
          {diffs.map((d) => (
            <div key={d.field} className="flex items-center gap-3 text-xs p-2 rounded-md bg-muted/50 border">
              <span className="w-32 shrink-0 font-medium text-foreground">{d.fieldLabel}</span>
              <div className="flex-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  SSOT: {fmtVal(d.ssotValue)}
                </Badge>
                <span className="text-muted-foreground">≠</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Exposé: {fmtVal(d.extractedValue)}
                </Badge>
              </div>
              <Badge variant="secondary" className="text-[9px] shrink-0">
                {d.decision === 'ssot_kept' ? '✓ SSOT' : d.decision}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

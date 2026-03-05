/**
 * VerwaltungContextGrid — Shared VE selector cards for both Anlage V and BWA modes
 * Extracted from VerwaltungTab R-30
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, BarChart3, FileText } from 'lucide-react';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DESIGN } from '@/config/designManifest';

interface Props {
  contexts: any[];
  selectedContextId: string | null;
  mode: 'anlageV' | 'bwa';
  onSelect: (ctxId: string) => void;
}

export function VerwaltungContextGrid({ contexts, selectedContextId, mode, onSelect }: Props) {
  return (
    <WidgetGrid variant="widget">
      {contexts.map((ctx: any) => (
        <WidgetCell key={ctx.id}>
          <button
            onClick={() => onSelect(ctx.id)}
            className={cn(
              "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
              DESIGN.CARD.BASE,
              selectedContextId === ctx.id
                ? "ring-2 ring-primary border-primary shadow-sm"
                : "border-border/50 hover:border-primary/40"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-[10px]">{ctx.context_type}</Badge>
                {mode === 'bwa' ? (
                  <BarChart3 className="h-4 w-4 text-primary" />
                ) : ctx.allConfirmed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">{ctx.confirmedCount}/{ctx.propertyCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{ctx.name}</span>
              </div>
              {mode === 'anlageV' && ctx.tax_number && (
                <p className="text-xs text-muted-foreground mt-1">StNr: {ctx.tax_number}</p>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Objekte</span>
                <span className="font-semibold">{ctx.propertyCount}</span>
              </div>
              {mode === 'anlageV' && (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={cn(
                      "border-0 text-[10px]",
                      ctx.allConfirmed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {ctx.allConfirmed ? 'Alle bestätigt' : 'In Bearbeitung'}
                    </Badge>
                  </div>
                  {ctx.allConfirmed && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Erklärung</span>
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </>
              )}
            </div>
          </button>
        </WidgetCell>
      ))}
    </WidgetGrid>
  );
}

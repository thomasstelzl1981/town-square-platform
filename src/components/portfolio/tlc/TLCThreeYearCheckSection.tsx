/**
 * TLC 3-Jahres-Check Section — Kappungsgrenze §558 BGB
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { performThreeYearCheck, type ThreeYearCheck } from '@/engines/tenancyLifecycle/engine';
import type { LeaseAnalysisInput } from '@/engines/tenancyLifecycle/spec';

interface Props {
  leaseId: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  rentColdEur: number;
  startDate: string;
  endDate?: string | null;
  rentThreeYearsAgo?: number | null;
  isTightMarket?: boolean;
  vergleichsmiete?: number | null;
}

const STRATEGY_LABELS: Record<string, string> = {
  conservative: 'Vorsichtig',
  market: 'Marktorientiert',
  maximum: 'Maximum',
};

const STATUS_CONFIG: Record<ThreeYearCheck['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof ShieldCheck }> = {
  within_cap: { label: 'Im Rahmen', variant: 'default', icon: ShieldCheck },
  near_cap: { label: 'Nahe Grenze', variant: 'secondary', icon: TrendingUp },
  at_cap: { label: 'An der Grenze', variant: 'destructive', icon: AlertTriangle },
  over_cap: { label: 'Überschritten', variant: 'destructive', icon: AlertTriangle },
};

export function TLCThreeYearCheckSection({
  leaseId, unitId, propertyId, tenantId, rentColdEur, startDate, endDate,
  rentThreeYearsAgo = null, isTightMarket = false, vergleichsmiete = null,
}: Props) {
  const [open, setOpen] = useState(false);

  const check = useMemo(() => {
    if (!rentColdEur || rentColdEur <= 0) return null;
    const input: LeaseAnalysisInput = {
      leaseId, unitId, propertyId, tenantId, startDate,
      status: 'active',
      phase: 'active',
      endDate: endDate || null,
      noticeDate: null,
      rentColdEur,
      nkAdvanceEur: null,
      monthlyRent: rentColdEur,
      paymentDueDay: null,
      depositAmountEur: null,
      depositStatus: null,
      rentModel: null,
      lastRentIncreaseAt: null,
      nextRentAdjustmentDate: null,
      staffelSchedule: null,
      indexBaseMonth: null,
    };
    return performThreeYearCheck(input, rentThreeYearsAgo, isTightMarket, vergleichsmiete);
  }, [leaseId, unitId, propertyId, tenantId, rentColdEur, startDate, endDate, rentThreeYearsAgo, isTightMarket, vergleichsmiete]);

  if (!check) return null;

  const config = STATUS_CONFIG[check.status];
  const StatusIcon = config.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            3-Jahres-Kappungsgrenze
          </span>
          <span className="flex items-center gap-2">
            <Badge variant={config.variant} className="text-[10px] h-5 px-1.5">
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1">
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Kappungsgrenze ausgeschöpft</span>
              <span className="font-medium">{check.capUsedPercent}% von {check.capPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  check.status === 'within_cap' ? 'bg-primary' :
                  check.status === 'near_cap' ? 'bg-yellow-500' :
                  'bg-destructive'
                }`}
                style={{ width: `${Math.min(100, check.capUsedPercent)}%` }}
              />
            </div>
          </div>

          {/* Key figures */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="text-center p-1.5 rounded bg-background">
              <p className="text-muted-foreground">Aktuelle Miete</p>
              <p className="font-semibold">{check.currentRent.toFixed(0)} €</p>
            </div>
            <div className="text-center p-1.5 rounded bg-background">
              <p className="text-muted-foreground">Erhöhung 3J</p>
              <p className="font-semibold">{check.totalIncreasePercent}%</p>
            </div>
            <div className="text-center p-1.5 rounded bg-background">
              <p className="text-muted-foreground">Spielraum</p>
              <p className="font-semibold text-primary">{check.remainingCapEur.toFixed(0)} €</p>
            </div>
          </div>

          {/* Proposals */}
          {check.proposals.length > 0 && (
            <div className="pt-1 border-t">
              <p className="text-[11px] text-muted-foreground mb-1">Vorschläge:</p>
              {check.proposals.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5">
                  <span>{STRATEGY_LABELS[p.strategy] || p.strategy}</span>
                  <span className="font-medium">+{p.increaseEur.toFixed(0)} €/Monat</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

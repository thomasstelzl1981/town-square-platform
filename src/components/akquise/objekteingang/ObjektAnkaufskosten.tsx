/**
 * ObjektAnkaufskosten — Ancillary cost breakdown card for ObjekteingangDetail
 * Uses ENG-AKQUISE calcAncillaryCosts with PLZ-based GrESt resolution
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, MapPin } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { calcAncillaryCosts } from '@/engines/akquiseCalc/engine';

function CostRow({ label, rate, amount, highlight }: { label: string; rate: string; amount: string; highlight?: boolean }) {
  return (
    <div className={cn("grid grid-cols-[1fr_80px_120px] px-4 py-2.5 text-sm", highlight && "bg-primary/5 font-semibold")}>
      <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="text-right tabular-nums">{rate}</span>
      <span className="text-right tabular-nums font-medium">{amount}</span>
    </div>
  );
}

interface ObjektAnkaufskostenProps {
  purchasePrice: number;
  postalCode?: string | null;
}

export function ObjektAnkaufskosten({ purchasePrice, postalCode }: ObjektAnkaufskostenProps) {
  const breakdown = React.useMemo(
    () => calcAncillaryCosts(purchasePrice, postalCode),
    [purchasePrice, postalCode]
  );

  const fmtCur = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const fmtPct = (v: number) => `${v.toFixed(2)} %`;

  if (!purchasePrice) return null;

  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
        <CardTitle className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'flex items-center gap-2')}>
          <Receipt className="h-3 w-3" /> Ankaufsnebenkosten
          <Badge variant="outline" className="text-[10px] ml-2 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" />
            {breakdown.stateName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_120px] px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Position</span>
            <span className="text-right">Satz</span>
            <span className="text-right">Betrag</span>
          </div>
          <CostRow label="Grunderwerbsteuer (GrESt)" rate={fmtPct(breakdown.grestRate)} amount={fmtCur(breakdown.grestAmount)} />
          <CostRow label="Notar + Grundbuch" rate={fmtPct(breakdown.notaryRate)} amount={fmtCur(breakdown.notaryAmount)} />
          <CostRow label="Maklercourtage (Käufer)" rate={fmtPct(breakdown.brokerRate)} amount={fmtCur(breakdown.brokerAmount)} />
          <CostRow label="Gesamt Nebenkosten" rate={fmtPct(breakdown.totalRate)} amount={fmtCur(breakdown.totalAmount)} highlight />
          <CostRow label="Gesamtinvestment (KP + NK)" rate="" amount={fmtCur(breakdown.purchasePrice + breakdown.totalAmount)} highlight />
        </div>
      </CardContent>
    </Card>
  );
}

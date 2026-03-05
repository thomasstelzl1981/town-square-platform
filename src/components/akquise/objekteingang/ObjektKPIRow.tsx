/**
 * ObjektKPIRow — 4 compact KPI tiles for ObjekteingangDetail
 */
import { Card, CardContent } from '@/components/ui/card';
import { Euro, Home, Ruler, TrendingUp } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

interface ObjektKPIRowProps {
  effectivePrice: string;
  unitsCount: string;
  areaSqm: string;
  yieldFactor: string;
}

export function ObjektKPIRow({ effectivePrice, unitsCount, areaSqm, yieldFactor }: ObjektKPIRowProps) {
  const kpis = [
    { icon: <Euro className="h-4 w-4" />, label: 'Kaufpreis', value: effectivePrice },
    { icon: <Home className="h-4 w-4" />, label: 'Einheiten', value: unitsCount },
    { icon: <Ruler className="h-4 w-4" />, label: 'Fläche', value: areaSqm },
    { icon: <TrendingUp className="h-4 w-4" />, label: 'Rendite / Faktor', value: yieldFactor },
  ];

  return (
    <div className={DESIGN.KPI_GRID.FULL}>
      {kpis.map(kpi => (
        <Card key={kpi.label} className={DESIGN.CARD.BASE}>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">{kpi.icon}<span className={DESIGN.TYPOGRAPHY.LABEL}>{kpi.label}</span></div>
            <span className="text-lg font-bold tracking-tight">{kpi.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

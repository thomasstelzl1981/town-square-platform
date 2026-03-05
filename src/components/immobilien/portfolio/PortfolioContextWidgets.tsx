/**
 * R-8: Context widget grid for portfolio
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { Building2, Plus, Pencil } from 'lucide-react';
import { DEMO_PROPERTY_IDS } from '@/config/tenantConstants';
import { formatCurrency } from './portfolioHelpers';
import type { PortfolioLandlordContext, PortfolioTotals, UnitWithProperty } from './portfolioTypes';

interface PortfolioContextWidgetsProps {
  contexts: PortfolioLandlordContext[];
  contextAssignments: { context_id: string; property_id: string }[];
  unitsWithProperties: UnitWithProperty[] | undefined;
  totals: PortfolioTotals | null;
  totalPropertyCount: number;
  selectedContextId: string | null;
  demoEnabled: boolean;
  onContextSelect: (id: string | null) => void;
  onCreateContext: () => void;
  onEditContext: (ctx: PortfolioLandlordContext) => void;
  onAssignContext: (id: string, name: string) => void;
}

export function PortfolioContextWidgets({
  contexts, contextAssignments, unitsWithProperties, totals,
  totalPropertyCount, selectedContextId, demoEnabled,
  onContextSelect, onCreateContext, onEditContext, onAssignContext,
}: PortfolioContextWidgetsProps) {
  const navigate = useNavigate();

  const contextKpis = useMemo(() => {
    if (!unitsWithProperties) return new Map<string, { propertyCount: number; totalValue: number; avgYield: number }>();
    const kpis = new Map<string, { propertyCount: number; totalValue: number; avgYield: number }>();
    contexts.forEach(ctx => {
      const assignedPropertyIds = contextAssignments.filter(a => a.context_id === ctx.id).map(a => a.property_id);
      let ctxUnits: UnitWithProperty[];
      if (assignedPropertyIds.length === 0 && ctx.is_default) {
        const allAssignedIds = contextAssignments.map(a => a.property_id);
        ctxUnits = unitsWithProperties.filter(u => !allAssignedIds.includes(u.property_id));
      } else {
        ctxUnits = unitsWithProperties.filter(u => assignedPropertyIds.includes(u.property_id));
      }
      const uniqueProps = [...new Set(ctxUnits.map(u => u.property_id))];
      const propValues = new Map<string, number>();
      ctxUnits.forEach(u => { if (u.market_value && !propValues.has(u.property_id)) propValues.set(u.property_id, u.market_value); });
      const totalValue = Array.from(propValues.values()).reduce((a, b) => a + b, 0);
      const totalIncome = ctxUnits.reduce((sum, u) => sum + (u.annual_net_cold_rent || 0), 0);
      kpis.set(ctx.id, { propertyCount: uniqueProps.length, totalValue, avgYield: totalValue > 0 ? (totalIncome / totalValue) * 100 : 0 });
    });
    return kpis;
  }, [unitsWithProperties, contexts, contextAssignments]);

  const propertyCountByContext = useMemo(() => {
    const counts: Record<string, number> = {};
    contextAssignments.forEach(a => { counts[a.context_id] = (counts[a.context_id] || 0) + 1; });
    return counts;
  }, [contextAssignments]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Vermietereinheiten</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCreateContext}><Plus className="h-4 w-4" /></Button>
      </div>
      <WidgetGrid variant="widget">
        {/* Demo Widget */}
        {demoEnabled && (
          <WidgetCell>
            <button onClick={() => navigate(`/portal/immobilien/${DEMO_PROPERTY_IDS[0]}`)}
              className={cn("w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all", DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER, "ring-2 ring-emerald-400 border-emerald-400 shadow-sm")}>
              <div>
                <div className="flex items-center justify-between mb-2"><Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge></div>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /><span className="font-semibold text-sm">Familie Mustermann</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">Berlin, München, Hamburg</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Einheiten</span><span className="text-sm font-semibold">{totalPropertyCount}</span></div>
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span><span className="text-sm font-semibold">{totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}</span></div>
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Restschuld</span><span className="text-sm font-semibold">{totals?.totalDebt != null ? formatCurrency(totals.totalDebt) : '–'}</span></div>
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Nettovermögen</span><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{totals?.totalValue && totals?.totalDebt != null ? formatCurrency(totals.totalValue - totals.totalDebt) : '–'}</span></div>
              </div>
            </button>
          </WidgetCell>
        )}

        {/* All properties widget */}
        <WidgetCell>
          <button onClick={() => onContextSelect(null)}
            className={cn("w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all", DESIGN.CARD.BASE, !selectedContextId ? "ring-2 ring-primary border-primary shadow-sm" : "hover:border-primary/50 hover:shadow-md")}>
            <div>
              <WidgetHeader icon={Building2} title="Alle Immobilien" />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Objekte</span><span className="text-sm font-semibold">{totalPropertyCount}</span></div>
                <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span><span className="text-sm font-semibold">{totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}</span></div>
              </div>
            </div>
          </button>
        </WidgetCell>

        {/* Per-context widgets */}
        {contexts.map(ctx => {
          const kpi = contextKpis.get(ctx.id);
          return (
            <WidgetCell key={ctx.id}>
              <button onClick={() => onContextSelect(ctx.id)}
                className={cn("w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all", DESIGN.CARD.BASE, selectedContextId === ctx.id ? "ring-2 ring-primary border-primary shadow-sm" : "hover:border-primary/50 hover:shadow-md")}>
                <div>
                  <WidgetHeader icon={Building2} title={ctx.name} badge={ctx.context_type === 'BUSINESS' ? 'GEW' : 'PRIV'} />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Objekte</span><span className="text-sm font-semibold">{kpi?.propertyCount || propertyCountByContext[ctx.id] || 0}</span></div>
                    <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span><span className="text-sm font-semibold">{kpi?.totalValue ? formatCurrency(kpi.totalValue) : '–'}</span></div>
                    <div className="flex justify-between items-center"><span className={DESIGN.TYPOGRAPHY.LABEL}>Rendite</span><span className="text-sm font-semibold">{kpi?.avgYield ? `${kpi.avgYield.toFixed(1)}%` : '–'}</span></div>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={(e) => { e.stopPropagation(); onEditContext(ctx); }}><Pencil className="h-3 w-3" />Bearbeiten</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={(e) => { e.stopPropagation(); onAssignContext(ctx.id, ctx.name); }}><Building2 className="h-3 w-3" />Zuordnen</Button>
                </div>
              </button>
            </WidgetCell>
          );
        })}
      </WidgetGrid>
    </div>
  );
}

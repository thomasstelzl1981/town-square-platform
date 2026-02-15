/**
 * ResearchTab — Zone 2 Golden Path Standard
 * DEMO_WIDGET CI + useDemoToggles + ResearchDemoSimulation + Billing-Slot
 * MOD-14 Communication Pro > Recherche
 */
import { useState, useCallback } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useResearchOrders, useCreateResearchOrder, useDeleteResearchOrder, type ResearchOrder } from '@/hooks/useResearchOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ResearchOrderWidget, ResearchOrderCreateWidget } from './ResearchOrderWidget';
import { ResearchOrderInlineFlow } from './ResearchOrderInlineFlow';
import { ResearchDemoSimulation } from './ResearchDemoSimulation';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function ResearchTab() {
  const { data: orders = [], isLoading } = useResearchOrders();
  const createOrder = useCreateResearchOrder();
  const deleteOrder = useDeleteResearchOrder();
  const { user, activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const demoEnabled = isEnabled('GP-RECHERCHE');
  const isDemo = activeOrderId === '__demo__';
  const activeOrder = !isDemo ? orders.find(o => o.id === activeOrderId) || null : null;

  const handleCreate = useCallback(async () => {
    if (!user?.id || !activeTenantId) {
      toast.error('Profil nicht geladen');
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        tenant_id: activeTenantId,
        created_by: user.id,
      });
      setActiveOrderId(order.id);
    } catch (e: any) {
      toast.error(`Fehler beim Erstellen: ${e.message}`);
    }
  }, [user, activeTenantId, createOrder]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteOrder.mutateAsync(id);
      if (activeOrderId === id) setActiveOrderId(null);
      toast.success('Auftrag gelöscht');
    } catch (e: any) {
      toast.error(`Löschen fehlgeschlagen: ${e.message}`);
    }
  }, [deleteOrder, activeOrderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-40">
      <ModulePageHeader
        title="Recherche"
        description="Asynchrone Lead-Engine — Rechercheaufträge anlegen, durchführen und Kontakte übernehmen."
      />

      {/* Widget Grid: Demo (Pos 0) + CTA (Pos 1) + Real Orders */}
      <WidgetGrid>
        {/* Demo Widget — Position 0 */}
        {demoEnabled && (
          <WidgetCell>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all',
                DESIGN.DEMO_WIDGET.CARD,
                DESIGN.DEMO_WIDGET.HOVER,
                isDemo && 'ring-2 ring-emerald-500 shadow-glow'
              )}
              onClick={() => setActiveOrderId(isDemo ? null : '__demo__')}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, 'text-[10px]')}>Demo</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fertig
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Hausverwaltungen NRW</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    25 qualifizierte Kontakte gefunden
                  </p>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Intent:</span>
                    <span className="text-foreground truncate ml-2">GF HV &gt; 500 WE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Region:</span>
                    <span className="text-foreground">NRW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treffer:</span>
                    <span className="text-foreground font-medium">25 / 25</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* CTA: New Order — Position 1 */}
        <WidgetCell>
          <ResearchOrderCreateWidget onClick={handleCreate} />
        </WidgetCell>

        {/* Real Orders — Position 2+ */}
        {orders.map(order => (
          <WidgetCell key={order.id}>
            <ResearchOrderWidget
              order={order}
              isActive={order.id === activeOrderId}
              onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)}
              onDelete={handleDelete}
            />
          </WidgetCell>
        ))}
      </WidgetGrid>

      {/* Demo Simulation Flow */}
      {isDemo && <ResearchDemoSimulation />}

      {/* Inline Case Flow for real orders */}
      {activeOrder && <ResearchOrderInlineFlow order={activeOrder} />}
    </div>
  );
}

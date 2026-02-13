/**
 * ResearchTab — Golden Path Standard v1.0
 * ModulePageHeader + WidgetGrid (Demo + Orders + CTA) + Inline-Flow
 * MOD-14 Communication Pro > Recherche
 */
import { useState, useCallback } from 'react';
import { Loader2, Plus, Eye, Search, Globe, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useResearchOrders, useCreateResearchOrder, type ResearchOrder } from '@/hooks/useResearchOrders';
import { useAuth } from '@/contexts/AuthContext';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ResearchOrderWidget, ResearchOrderCreateWidget } from './ResearchOrderWidget';
import { ResearchOrderInlineFlow } from './ResearchOrderInlineFlow';
import { CARD, TYPOGRAPHY } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ─── Demo Data ───────────────────────────────────────────
const DEMO_ORDER: ResearchOrder = {
  id: '__demo__',
  tenant_id: '',
  created_by: '',
  status: 'done',
  title: 'Demo: Hausverwaltungen NRW',
  intent_text: 'Geschäftsführer von Hausverwaltungen in Nordrhein-Westfalen mit mehr als 500 Einheiten',
  icp_json: { branche: 'Immobilien / Hausverwaltung', region: 'NRW', role: 'Geschäftsführer', keywords: ['WEG', 'Mietverwaltung'] },
  max_results: 50,
  cost_cap: 10,
  cost_spent: 4.20,
  results_count: 37,
  consent_confirmed: true,
  provider_plan_json: { firecrawl: true, epify: false, apollo: false },
  ai_summary_md: 'Recherche abgeschlossen: 37 qualifizierte Kontakte gefunden, davon 12 mit Confidence >80%.',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T12:30:00Z',
} as any;

export function ResearchTab() {
  const { data: orders = [], isLoading } = useResearchOrders();
  const createOrder = useCreateResearchOrder();
  const { user, activeTenantId } = useAuth();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const isDemo = activeOrderId === '__demo__';
  const activeOrder = isDemo ? DEMO_ORDER : orders.find(o => o.id === activeOrderId) || null;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ModulePageHeader
        title="Recherche"
        description="Asynchrone Lead-Engine — Rechercheaufträge anlegen, durchführen und Kontakte übernehmen."
      />

      {/* Widget Grid */}
      <WidgetGrid>
        {/* Demo Widget */}
        <WidgetCell>
          <Card
            className={cn(
              'glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 h-full flex flex-col justify-between',
              activeOrderId === '__demo__' && 'ring-2 ring-primary shadow-lg'
            )}
            onClick={() => setActiveOrderId(activeOrderId === '__demo__' ? null : '__demo__')}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
                  Demo: Hausverwaltungen NRW
                </h4>
                <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/10 text-primary border-primary/20">
                  Demo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                So sieht ein abgeschlossener Rechercheauftrag aus
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground">37 Treffer</span>
              </div>
            </div>
          </Card>
        </WidgetCell>

        {/* Real Orders */}
        {orders.map(order => (
          <WidgetCell key={order.id}>
            <ResearchOrderWidget
              order={order}
              isActive={order.id === activeOrderId}
              onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)}
            />
          </WidgetCell>
        ))}

        {/* CTA: New Order */}
        <WidgetCell>
          <ResearchOrderCreateWidget onClick={handleCreate} />
        </WidgetCell>
      </WidgetGrid>

      {/* Inline Case Flow */}
      {activeOrder && !isDemo && (
        <ResearchOrderInlineFlow order={activeOrder} />
      )}

      {/* Demo Inline Flow (read-only summary) */}
      {isDemo && (
        <div className="space-y-4">
          <div className={cn(CARD.CONTENT, 'space-y-3')}>
            <h3 className={TYPOGRAPHY.CARD_TITLE}>Demo-Auftrag: Hausverwaltungen NRW</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className={TYPOGRAPHY.LABEL}>Suchintent:</span> <span>Geschäftsführer von Hausverwaltungen in NRW mit &gt;500 Einheiten</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Branche:</span> <span>Immobilien / Hausverwaltung</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Region:</span> <span>NRW</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Rolle:</span> <span>Geschäftsführer</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Max. Treffer:</span> <span>50</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Kosten:</span> <span>€4,20 / €10,00</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Ergebnis:</span> <span className="font-medium">37 qualifizierte Kontakte</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Provider:</span> <span>Firecrawl</span></div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium mb-1">KI-Zusammenfassung:</p>
              <p>Recherche abgeschlossen: 37 qualifizierte Kontakte gefunden, davon 12 mit Confidence &gt;80%.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

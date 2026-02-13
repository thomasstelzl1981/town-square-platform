/**
 * ResearchTab — Redesign v1.0
 * Widget-Grid oben + Inline-Case-Flow darunter
 * MOD-14 Communication Pro > Recherche
 */
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResearchOrders, useCreateResearchOrder, type ResearchOrder } from '@/hooks/useResearchOrders';
import { useAuth } from '@/contexts/AuthContext';
import { ResearchOrderWidget, ResearchOrderCreateWidget } from './ResearchOrderWidget';
import { ResearchOrderInlineFlow } from './ResearchOrderInlineFlow';

export function ResearchTab() {
  const { data: orders = [], isLoading } = useResearchOrders();
  const createOrder = useCreateResearchOrder();
  const { user, activeTenantId } = useAuth();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const activeOrder = orders.find(o => o.id === activeOrderId) || null;

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
      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResearchOrderCreateWidget onClick={handleCreate} />
        {orders.map(order => (
          <ResearchOrderWidget
            key={order.id}
            order={order}
            isActive={order.id === activeOrderId}
            onClick={() => setActiveOrderId(order.id)}
          />
        ))}
      </div>

      {/* Inline Case Flow */}
      {activeOrder && (
        <ResearchOrderInlineFlow order={activeOrder} />
      )}
    </div>
  );
}

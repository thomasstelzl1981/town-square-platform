/**
 * MOD-07: Finance Request Widget-Leiste
 * Shows all finance requests as horizontal widget tiles + CTA for new request.
 * Follows Manager-Module pattern (persistent widget bar at top).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';

interface FinanceRequestWidgetsProps {
  activeRequestId?: string;
}

export function FinanceRequestWidgets({ activeRequestId }: FinanceRequestWidgetsProps) {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['finance-requests-list', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('finance_requests')
        .select('id, public_id, status, object_address, purchase_price, created_at')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { data, error } = await supabase
        .from('finance_requests')
        .insert({
          tenant_id: activeTenantId,
          status: 'draft',
          source: 'portal',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests-list'] });
      navigate(`/portal/finanzierung/anfrage/${data.id}`);
      toast.success('Neue Anfrage erstellt');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Anfrage');
    },
  });

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : null;

  return (
    <WidgetGrid variant="widget">
      {/* Existing requests */}
      {requests.map((req) => {
        const isActive = req.id === activeRequestId;
        return (
          <WidgetCell key={req.id}>
            <Card
              className={`h-full cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => navigate(`/portal/finanzierung/anfrage/${req.id}`)}
            >
              <div className="flex flex-col h-full p-4 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Badge variant={getStatusBadgeVariant(req.status)}>
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm truncate">
                    {req.public_id || `#${req.id.slice(0, 8)}`}
                  </h3>
                  {req.object_address && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {req.object_address}
                    </p>
                  )}
                  {req.purchase_price && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(req.purchase_price))}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(req.created_at), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            </Card>
          </WidgetCell>
        );
      })}

      {/* CTA: New Request */}
      <WidgetCell>
        <Card
          className="h-full cursor-pointer transition-all hover:shadow-md border-dashed border-2 border-muted-foreground/20 hover:border-primary/40"
          onClick={() => createMutation.mutate()}
        >
          <div className="flex flex-col items-center justify-center h-full p-4 gap-3">
            {createMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Neue Anfrage
                </span>
              </>
            )}
          </div>
        </Card>
      </WidgetCell>

      {/* Loading state */}
      {isLoading && requests.length === 0 && (
        <WidgetCell>
          <Card className="h-full">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </WidgetCell>
      )}
    </WidgetGrid>
  );
}

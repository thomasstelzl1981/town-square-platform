/**
 * MOD-07: Finance Request Widget-Leiste
 * Shows all finance requests as horizontal widget tiles + CTA for new request.
 * Follows Manager-Module pattern (persistent widget bar at top).
 * 
 * GOLDEN PATH KONFORM: Demo-Widget an Position 0, useDemoToggles
 */
 
import { cn } from '@/lib/utils';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, FileText, Loader2, Home, Trash2, Archive } from 'lucide-react';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { toast } from 'sonner';

const DELETABLE_STATUSES = ['draft', 'collecting'];
const ARCHIVABLE_STATUSES = ['submitted', 'rejected', 'cancelled', 'completed'];
const REMOVABLE_STATUSES = [...DELETABLE_STATUSES, ...ARCHIVABLE_STATUSES];
import { format } from 'date-fns';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { isDemoId } from '@/engines/demoData/engine';

const GP_FINANZIERUNG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-FINANZIERUNG')!;
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
        .is('archived_at', null)
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

  const removeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (DELETABLE_STATUSES.includes(status)) {
        const { error } = await supabase.from('finance_requests').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('finance_requests').update({ archived_at: new Date().toISOString() } as any).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-requests-with-mandates'] });
      toast.success(DELETABLE_STATUSES.includes(variables.status) ? 'Entwurf gelöscht' : 'Anfrage archiviert');
    },
    onError: () => toast.error('Fehler beim Entfernen'),
  });

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : null;

  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled('GP-FINANZIERUNG');

  return (
    <WidgetGrid variant="widget">
      {/* Demo-Widget an Position 0 */}
      <WidgetCell>
        <Card
          className={cn(
            'h-full transition-all',
            showDemo
              ? [DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER, 'cursor-pointer']
              : 'opacity-50 grayscale cursor-default',
            activeRequestId === '__demo__' && showDemo ? 'ring-2 ring-emerald-400' : ''
          )}
          onClick={() => showDemo && navigate('/portal/finanzierung/anfrage/__demo__')}
        >
          <div className="flex flex-col h-full p-4 justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Home className="h-5 w-5 text-primary" />
                <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>
                  {GP_FINANZIERUNG.demoWidget.badgeLabel}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm">{GP_FINANZIERUNG.demoWidget.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">Schadowstr. 42, Düsseldorf</p>
              <p className="text-xs text-muted-foreground">320.000 €</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{GP_FINANZIERUNG.demoWidget.subtitle}</p>
          </div>
        </Card>
      </WidgetCell>

      {/* Existing requests */}
      {requests.filter((req) => showDemo || !isDemoId(req.id)).map((req) => {
        const isActive = req.id === activeRequestId;
        const canRemove = REMOVABLE_STATUSES.includes(req.status);
        const isDraft = DELETABLE_STATUSES.includes(req.status);
        return (
          <WidgetCell key={req.id}>
            <Card
              className={cn(
                `h-full cursor-pointer transition-all hover:shadow-md`,
                getActiveWidgetGlow('primary'),
                isActive ? 'ring-2 ring-primary' : ''
              )}
              onClick={() => navigate(`/portal/finanzierung/anfrage/${req.id}`)}
            >
              <div className="flex flex-col h-full p-4 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex items-center gap-1">
                      {canRemove && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-1 rounded hover:bg-destructive/10 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title={isDraft ? 'Entwurf löschen' : 'Archivieren'}
                            >
                              {isDraft ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isDraft ? 'Entwurf löschen?' : 'Anfrage archivieren?'}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {isDraft
                                  ? 'Dieser Entwurf wird unwiderruflich gelöscht.'
                                  : 'Die Anfrage wird aus der Übersicht entfernt.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                className={isDraft ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                                onClick={() => removeMutation.mutate({ id: req.id, status: req.status })}
                              >
                                {isDraft ? 'Löschen' : 'Archivieren'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Badge variant={getStatusBadgeVariant(req.status)}>
                        {getStatusLabel(req.status)}
                      </Badge>
                    </div>
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

      {/* CTA: New Request — Desktop only */}
      <DesktopOnly>
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
      </DesktopOnly>

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

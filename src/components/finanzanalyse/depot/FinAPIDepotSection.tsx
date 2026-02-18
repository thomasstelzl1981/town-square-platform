/**
 * FinAPIDepotSection — Read-only securities depot connection via FinAPI
 * Same Web Form 2.0 flow as bank account connection (KontenTab)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { CARD, TYPOGRAPHY, TABLE } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, RefreshCw, Landmark, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export function FinAPIDepotSection({ tenantId }: { tenantId: string | null }) {
  const [isPolling, setIsPolling] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((webFormId: string) => {
    setIsPolling(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('sot-finapi-sync', {
          body: { action: 'poll_depot', webFormId },
        });
        if (data?.status === 'connected') {
          stopPolling();
          toast.success(`Depot verbunden! ${data.depots_imported || 0} Depots importiert.`);
          queryClient.invalidateQueries({ queryKey: ['finapi_depot_accounts'] });
        } else if (data?.status === 'failed') {
          stopPolling();
          toast.error(`Depot-Verbindung fehlgeschlagen: ${data.reason || 'Unbekannt'}`);
        }
      } catch (err) {
        console.error('[poll_depot] Exception:', err);
      }
    }, POLL_INTERVAL_MS);

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      toast.error('Zeitüberschreitung: Depot-Verbindung nicht abgeschlossen.');
    }, POLL_TIMEOUT_MS);
  }, [stopPolling, queryClient]);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-finapi-sync', {
        body: { action: 'connect_depot' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.webFormUrl && data.webFormId) {
        window.open(data.webFormUrl, '_blank', 'width=500,height=700,scrollbars=yes');
        toast.info('FinAPI-Formular geöffnet. Bitte melden Sie sich bei Ihrer Bank an.');
        startPolling(data.webFormId);
      } else {
        toast.error('Keine Web Form URL erhalten.');
      }
    },
    onError: (err: any) => toast.error(`Fehler: ${err.message}`),
  });

  // Fetch depot accounts
  const { data: depotAccounts = [], isLoading } = useQuery({
    queryKey: ['finapi_depot_accounts', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from('finapi_depot_accounts' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!tenantId,
  });

  // Fetch positions for selected depot
  const { data: depotPositions = [], isLoading: posLoading } = useQuery({
    queryKey: ['finapi_depot_positions', selectedDepotId],
    queryFn: async () => {
      if (!selectedDepotId) return [];
      const { data } = await supabase
        .from('finapi_depot_positions' as any)
        .select('*')
        .eq('depot_account_id', selectedDepotId)
        .order('name');
      return (data || []) as any[];
    },
    enabled: !!selectedDepotId,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (depotAccountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-finapi-sync', {
        body: { action: 'sync_depot', depotAccountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Depot synchronisiert: ${data.positions_count || 0} Positionen`);
      queryClient.invalidateQueries({ queryKey: ['finapi_depot_positions'] });
      queryClient.invalidateQueries({ queryKey: ['finapi_depot_accounts'] });
    },
    onError: (err: any) => toast.error(`Sync fehlgeschlagen: ${err.message}`),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finapi_depot_accounts' as any)
        .update({ status: 'deleted' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finapi_depot_accounts'] });
      toast.success('Depot entfernt');
      setSelectedDepotId(null);
    },
  });

  const selectedDepot = depotAccounts.find((d: any) => d.id === selectedDepotId);
  const totalPositionsValue = depotPositions.reduce((sum: number, p: any) => sum + (p.current_value || 0), 0);

  return (
    <div className="mt-8">
      <ModulePageHeader
        title="Wertpapier-Depots (Read-Only)"
        description="Bestehendes Depot via FinAPI anbinden — Positionen werden read-only angezeigt"
        actions={
          <Button
            variant="glass"
            size="sm"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending || isPolling}
          >
            {isPolling ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Warte auf Bank…</>
            ) : (
              <><Building2 className="h-4 w-4 mr-2" /> Depot anbinden (FinAPI)</>
            )}
          </Button>
        }
      />

      {/* Polling indicator */}
      {isPolling && (
        <Card className="glass-card mb-4 border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold">Warte auf Bank-Anmeldung…</p>
                <p className="text-xs text-muted-foreground">
                  Bitte schließen Sie die Anmeldung im FinAPI-Fenster ab.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={stopPolling} className="ml-auto">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : depotAccounts.length === 0 && !isPolling ? (
        <Card className="glass-card p-6 text-center text-muted-foreground">
          <Landmark className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Noch kein Depot verbunden.</p>
          <p className="text-xs mt-1">Klicken Sie auf "Depot anbinden", um Ihr Wertpapier-Depot zu importieren.</p>
        </Card>
      ) : (
        <WidgetGrid>
          {depotAccounts.map((depot: any) => {
            const isSelected = selectedDepotId === depot.id;
            return (
              <WidgetCell key={depot.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE, 'group relative',
                    'h-full flex flex-col justify-between p-5',
                    getActiveWidgetGlow('primary'),
                    isSelected && getSelectionRing('primary'),
                  )}
                  onClick={(e) => { e.stopPropagation(); setSelectedDepotId(isSelected ? null : depot.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDepotId(isSelected ? null : depot.id); }}}
                  role="button"
                  tabIndex={0}
                >
                  <WidgetDeleteOverlay
                    title={depot.account_name || depot.bank_name || 'Depot'}
                    onConfirmDelete={() => deleteMutation.mutate(depot.id)}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">Read-Only</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-primary" />
                      <h4 className={TYPOGRAPHY.CARD_TITLE}>{depot.account_name || 'Depot'}</h4>
                    </div>
                    {depot.bank_name && <p className="text-xs text-muted-foreground">{depot.bank_name}</p>}
                    {depot.depot_number && <p className="text-[10px] text-muted-foreground/70">Nr. {depot.depot_number}</p>}
                  </div>
                  <div className="mt-auto pt-3 border-t border-border/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Aktualisiert: {new Date(depot.updated_at).toLocaleDateString('de-DE')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); syncMutation.mutate(depot.id); }}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* Positions table for selected depot */}
      {selectedDepotId && (
        <Card className="glass-card overflow-hidden mt-4">
          <div className="px-4 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between">
            <p className="text-base font-semibold">
              Positionen — {selectedDepot?.account_name || 'Depot'}
              {totalPositionsValue > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Gesamt: {fmt(totalPositionsValue)})
                </span>
              )}
            </p>
          </div>
          {posLoading ? (
            <div className="p-6"><Skeleton className="h-32" /></div>
          ) : depotPositions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Keine Positionen vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={TABLE.HEADER_BG}>
                    <th className={TABLE.HEADER_CELL + ' text-left'}>Wertpapier</th>
                    <th className={TABLE.HEADER_CELL + ' text-left hidden md:table-cell'}>ISIN</th>
                    <th className={TABLE.HEADER_CELL + ' text-right hidden md:table-cell'}>Stück</th>
                    <th className={TABLE.HEADER_CELL + ' text-right hidden md:table-cell'}>Kaufwert</th>
                    <th className={TABLE.HEADER_CELL + ' text-right'}>Aktuell</th>
                    <th className={TABLE.HEADER_CELL + ' text-right'}>+/−</th>
                  </tr>
                </thead>
                <tbody>
                  {depotPositions.map((p: any) => {
                    const pl = p.profit_or_loss ?? (p.current_value && p.purchase_value ? p.current_value - p.purchase_value : null);
                    return (
                      <tr key={p.id} className={`${TABLE.ROW_BORDER} ${TABLE.ROW_HOVER}`}>
                        <td className={TABLE.BODY_CELL + ' font-medium'}>{p.name || '—'}</td>
                        <td className={TABLE.BODY_CELL + ' text-muted-foreground hidden md:table-cell font-mono text-xs'}>{p.isin || p.wkn || '—'}</td>
                        <td className={TABLE.BODY_CELL + ' text-right hidden md:table-cell'}>{p.quantity?.toFixed(2) ?? p.quantity_nominal?.toFixed(2) ?? '—'}</td>
                        <td className={TABLE.BODY_CELL + ' text-right hidden md:table-cell'}>{p.purchase_value != null ? fmt(p.purchase_value) : '—'}</td>
                        <td className={TABLE.BODY_CELL + ' text-right font-medium'}>{p.current_value != null ? fmt(p.current_value) : '—'}</td>
                        <td className={TABLE.BODY_CELL + ' text-right'}>
                          {pl != null ? (
                            <Badge variant="outline" className={pl >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}>
                              {pl >= 0 ? '+' : ''}{fmt(pl)}
                            </Badge>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

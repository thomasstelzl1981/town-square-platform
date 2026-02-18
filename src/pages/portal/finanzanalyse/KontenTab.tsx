/**
 * MOD-18 Finanzen — Tab: KONTEN
 * Bankkonten mit polymorphischer Zuordnung + FinAPI Bank-Connect
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DEMO_WIDGET } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KontoAkteInline } from '@/components/finanzanalyse/KontoAkteInline';
import { AddBankAccountDialog } from '@/components/shared/AddBankAccountDialog';
import { DEMO_KONTO, DEMO_KONTO_IBAN_MASKED } from '@/constants/demoKontoData';
import { Landmark, ScanSearch, Plus, CreditCard, RefreshCw, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const OWNER_TYPE_LABELS: Record<string, string> = {
  person: 'Person',
  property: 'Immobilie',
  pv_plant: 'PV-Anlage',
};

export default function KontenTab() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const [openKontoId, setOpenKontoId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ['msv_bank_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('msv_bank_accounts')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // FinAPI connections
  const { data: finapiConnections = [] } = useQuery({
    queryKey: ['finapi_connections', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('finapi_connections')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // FinAPI transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['finapi_transactions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('finapi_transactions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('booking_date', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Bank Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-finapi-sync', {
        body: { action: 'connect', bankId: 280001 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Bank verbunden! ${data.accounts_imported} Konten importiert.`);
      queryClient.invalidateQueries({ queryKey: ['msv_bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finapi_connections'] });
    },
    onError: (err: Error) => {
      toast.error(`Bank-Verbindung fehlgeschlagen: ${err.message}`);
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-finapi-sync', {
        body: { action: 'sync', connectionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.transactions_synced} Transaktionen synchronisiert.`);
      queryClient.invalidateQueries({ queryKey: ['finapi_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finapi_connections'] });
    },
    onError: (err: Error) => {
      toast.error(`Sync fehlgeschlagen: ${err.message}`);
    },
  });

  // Load owner names for display
  const { data: ownerNames = {} } = useQuery({
    queryKey: ['konten-owner-names', activeTenantId, bankAccounts],
    queryFn: async () => {
      if (!activeTenantId) return {};
      const names: Record<string, string> = {};
      const personIds = bankAccounts.filter((a: any) => a.owner_type === 'person' && a.owner_id).map((a: any) => a.owner_id);
      const propIds = bankAccounts.filter((a: any) => a.owner_type === 'property' && a.owner_id).map((a: any) => a.owner_id);
      const pvIds = bankAccounts.filter((a: any) => a.owner_type === 'pv_plant' && a.owner_id).map((a: any) => a.owner_id);

      if (personIds.length) {
        const { data } = await supabase.from('household_persons').select('id, first_name, last_name').in('id', personIds);
        data?.forEach(p => { names[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim(); });
      }
      if (propIds.length) {
        const { data } = await supabase.from('properties').select('id, name').in('id', propIds);
        data?.forEach((p: any) => { names[p.id] = p.name || 'Immobilie'; });
      }
      if (pvIds.length) {
        const { data } = await supabase.from('pv_plants').select('id, name').in('id', pvIds);
        data?.forEach(p => { names[p.id] = p.name || 'PV-Anlage'; });
      }
      return names;
    },
    enabled: !!activeTenantId && bankAccounts.length > 0,
  });

  const showDemo = isEnabled('GP-KONTEN');
  const maskIban = (iban: string) => iban ? `${iban.slice(0, 9)} ••••` : '—';

  return (
    <PageShell>
      <ModulePageHeader
        title="Konten"
        description="Bankkonten verwalten und zuordnen — Personen, Vermietung oder Photovoltaik"
        actions={
          <Button variant="glass" size="icon-round" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* FinAPI Connections */}
      {finapiConnections.length > 0 && (
        <Card className="glass-card mb-4">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Bankverbindungen (FinAPI)
            </h3>
            <div className="space-y-2">
              {finapiConnections.map((conn: any) => (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{conn.bank_name || 'Bank'}</p>
                    <p className="text-xs text-muted-foreground">
                      {conn.iban_masked || '—'} · Status: {conn.status}
                      {conn.last_sync_at && ` · Letzter Sync: ${new Date(conn.last_sync_at).toLocaleString('de-DE')}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncMutation.mutate(conn.id)}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Sync
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <WidgetGrid>
        {showDemo && (
          <WidgetCell>
            <div
              className={cn(
                'h-full w-full rounded-xl cursor-pointer transition-all',
                DEMO_WIDGET.CARD, DEMO_WIDGET.HOVER,
                openKontoId === DEMO_KONTO.id && 'ring-2 ring-primary/50',
              )}
              onClick={(e) => { e.stopPropagation(); setOpenKontoId(openKontoId === DEMO_KONTO.id ? null : DEMO_KONTO.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenKontoId(openKontoId === DEMO_KONTO.id ? null : DEMO_KONTO.id); }}}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <Badge className={DEMO_WIDGET.BADGE + ' mb-2'}>Demo</Badge>
                  <h4 className="font-semibold text-sm">Demo: Girokonto Sparkasse</h4>
                  <p className="text-xs text-muted-foreground mt-1">{DEMO_KONTO_IBAN_MASKED}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {OWNER_TYPE_LABELS[DEMO_KONTO.owner_type] || 'Vermietereinheit'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(DEMO_KONTO.balance)}</p>
                </div>
              </div>
            </div>
          </WidgetCell>
        )}

        {bankAccounts.map((acc: any) => (
          <WidgetCell key={acc.id}>
            <div
              className={cn(
                'h-full w-full rounded-xl cursor-pointer transition-all hover:shadow-lg',
                getActiveWidgetGlow('rose'),
                openKontoId === acc.id && getSelectionRing('rose'),
              )}
              onClick={(e) => { e.stopPropagation(); setOpenKontoId(openKontoId === acc.id ? null : acc.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenKontoId(openKontoId === acc.id ? null : acc.id); }}}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <h4 className="font-semibold text-sm">{acc.account_name || acc.bank_name || 'Konto'}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{maskIban(acc.iban || '')}</p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{acc.account_type || 'Giro'}</Badge>
                    {acc.owner_type && (
                      <Badge variant="secondary" className="text-[10px]">
                        {OWNER_TYPE_LABELS[acc.owner_type] || acc.owner_type}
                        {acc.owner_id && ownerNames[acc.owner_id] ? `: ${ownerNames[acc.owner_id]}` : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={acc.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {acc.status === 'active' ? 'Verbunden' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </div>
          </WidgetCell>
        ))}

        <WidgetCell>
          <div
            className="h-full w-full rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => setShowAddDialog(true)}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Konto hinzufügen</p>
            </div>
          </div>
        </WidgetCell>
      </WidgetGrid>

      {openKontoId === DEMO_KONTO.id && (
        <KontoAkteInline isDemo onClose={() => setOpenKontoId(null)} />
      )}
      {openKontoId && openKontoId !== DEMO_KONTO.id && (
        <KontoAkteInline
          isDemo={false}
          account={bankAccounts.find((a: any) => a.id === openKontoId)}
          onClose={() => setOpenKontoId(null)}
        />
      )}

      {/* Transactions from FinAPI */}
      {transactions.length > 0 && (
        <Card className="glass-card mt-4">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3">Transaktionen ({transactions.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2 pr-4">Gegenpartei</th>
                    <th className="py-2 pr-4">Verwendungszweck</th>
                    <th className="py-2 text-right">Betrag</th>
                    <th className="py-2 text-center">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-muted/20 hover:bg-muted/10">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(tx.booking_date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-2 pr-4">{tx.counterpart_name || '—'}</td>
                      <td className="py-2 pr-4 max-w-[200px] truncate text-muted-foreground">
                        {tx.purpose || '—'}
                      </td>
                      <td className={cn(
                        'py-2 text-right font-medium whitespace-nowrap',
                        tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500',
                      )}>
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: tx.currency || 'EUR' }).format(tx.amount)}
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={tx.match_status === 'matched' ? 'default' : 'secondary'} className="text-[10px]">
                          {tx.match_status || 'unmatched'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card mt-4">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ScanSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Umsätze auslesen & Verträge erkennen</p>
              <p className="text-sm text-muted-foreground">
                Scannt die letzten 12 Monate Ihrer Kontoumsätze und identifiziert wiederkehrende Zahlungen als potenzielle Abonnements, Versicherungen oder Vorsorgeverträge.
              </p>
            </div>
            <Button variant="outline" disabled>
              <ScanSearch className="h-4 w-4 mr-2" />
              Scan starten
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddBankAccountDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </PageShell>
  );
}

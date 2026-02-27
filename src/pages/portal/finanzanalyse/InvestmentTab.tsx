/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Redesigned: Single [+] button with AlertDialog for FinAPI depot connection
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDataReadiness } from '@/hooks/useDataReadiness';
import { DataReadinessModal } from '@/components/portal/DataReadinessModal';
import { ConsentRequiredModal } from '@/components/portal/ConsentRequiredModal';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { CARD, TYPOGRAPHY, DEMO_WIDGET, HEADER, RECORD_CARD, TABLE } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { FormInput } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { User, Plus, TrendingUp, X, Building2, Loader2, RefreshCw, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;


const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson',
  partner: 'Partner/in',
  kind: 'Kind',
  weitere: 'Weitere',
};

const ROLE_GRADIENTS: Record<string, string> = {
  hauptperson: 'from-primary to-primary/60',
  partner: 'from-rose-400 to-rose-500/60',
  kind: 'from-amber-400 to-amber-500/60',
  weitere: 'from-muted-foreground to-muted-foreground/60',
};

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
] as const;

const INVESTMENT_TYPES = ['ETF-Sparplan', 'Fonds-Sparplan', 'Aktien-Sparplan', 'Crypto-Sparplan', 'Sonstige'] as const;

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export default function InvestmentTab() {
  const { activeTenantId, user } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const readiness = useDataReadiness();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { persons } = useFinanzanalyseData();
  const queryClient = useQueryClient();

  // --- Action Dialog ---
  const [showDepotDialog, setShowDepotDialog] = useState(false);

  // --- Depot persons ---
  const { data: rawPersons } = useQuery({
    queryKey: ['household_persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('household_persons')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order');
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const depotPersons = useMemo(
    () => demoEnabled ? rawPersons : rawPersons?.filter((p: any) => !isDemoId(p.id)),
    [rawPersons, demoEnabled]
  );

  const effectivePersonId = selectedPersonId || depotPersons?.find(p => p.is_primary)?.id || depotPersons?.[0]?.id || null;
  const selectedPerson = useMemo(
    () => depotPersons?.find(p => p.id === effectivePersonId),
    [depotPersons, effectivePersonId]
  );


  // --- Investment-Sparpläne ---
  const [selectedSparId, setSelectedSparId] = useState<string | null>(null);
  const [sparForms, setSparForms] = useState<Record<string, Record<string, any>>>({});

  const { data: rawInvestmentContracts = [], isLoading: sparLoading } = useQuery({
    queryKey: ['fin-investment-spar', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('vorsorge_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('category', 'investment')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const investmentContracts = demoEnabled
    ? rawInvestmentContracts
    : rawInvestmentContracts.filter((c: any) => !isDemoId(c.id));

  const createSparMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!readiness.requireReadiness()) throw new Error('Readiness required');
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await supabase.from('vorsorge_contracts').insert({
        tenant_id: activeTenantId, user_id: user.id,
        provider: form.provider || null, contract_no: form.contract_no || null,
        contract_type: form.contract_type || null, person_id: form.person_id || null,
        start_date: form.start_date || null, premium: Number(form.premium) || null,
        payment_interval: (form.payment_interval as any) || null,
        status: form.status || null, notes: form.notes || null,
        category: 'investment',
        current_balance: form.current_balance ? Number(form.current_balance) : null,
        balance_date: form.balance_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-investment-spar'] });
      toast.success('Investment-Sparplan angelegt');
    },
  });

  const updateSparMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!readiness.requireReadiness()) throw new Error('Readiness required');
      const { id, created_at, updated_at, tenant_id, user_id, ...rest } = form;
      const { error } = await supabase.from('vorsorge_contracts').update({
        provider: rest.provider || null, contract_no: rest.contract_no || null,
        contract_type: rest.contract_type || null, person_id: rest.person_id || null,
        start_date: rest.start_date || null, premium: Number(rest.premium) || null,
        payment_interval: (rest.payment_interval as any) || null,
        status: rest.status || null, notes: rest.notes || null,
        current_balance: rest.current_balance ? Number(rest.current_balance) : null,
        balance_date: rest.balance_date || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-investment-spar'] });
      toast.success('Investment-Sparplan aktualisiert');
    },
  });

  const deleteSparMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!readiness.requireReadiness()) throw new Error('Readiness required');
      const { error } = await supabase.from('vorsorge_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-investment-spar'] });
      toast.success('Investment-Sparplan gelöscht');
      setSelectedSparId(null);
    },
  });

  const selectSparCard = (id: string) => {
    if (selectedSparId === id) { setSelectedSparId(null); return; }
    const c = investmentContracts.find((x: any) => x.id === id);
    if (c) setSparForms(prev => ({ ...prev, [id]: { ...c } }));
    setSelectedSparId(id);
    setSelectedDepotId(null);
  };

  const updateSparField = (id: string, field: string, value: any) => {
    setSparForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const intervalLabel = (v: string) => INTERVALS.find(i => i.value === v)?.label || v;
  const selectedSparContract = investmentContracts.find((c: any) => c.id === selectedSparId);
  const sparForm = selectedSparId ? (sparForms[selectedSparId] || selectedSparContract) : null;

  // --- FinAPI Depot Logic (moved from FinAPIDepotSection) ---
  const [isPolling, setIsPolling] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { data: depotAccounts = [], isLoading: depotLoading } = useQuery({
    queryKey: ['finapi_depot_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('finapi_depot_accounts' as any)
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

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

  const deleteDepotMutation = useMutation({
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

  const handleConnectDepot = () => {
    setShowDepotDialog(false);
    connectMutation.mutate();
  };

  // --- SparFields component ---
  const SparFields = ({ form: f, onUpdate }: { form: Record<string, any>; onUpdate: (field: string, v: any) => void }) => (
    <div>
      <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <FormInput label="Anbieter" name="provider" value={f.provider || ''} onChange={e => onUpdate('provider', e.target.value)} />
        <FormInput label="Vertragsnummer" name="contract_no" value={f.contract_no || ''} onChange={e => onUpdate('contract_no', e.target.value)} />
        <div>
          <Label className="text-xs">Sparplan-Typ</Label>
          <Select value={f.contract_type || ''} onValueChange={v => onUpdate('contract_type', v)}>
            <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
            <SelectContent>
              {INVESTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Person zuordnen</Label>
          <Select value={f.person_id || ''} onValueChange={v => onUpdate('person_id', v)}>
            <SelectTrigger><SelectValue placeholder="Person wählen" /></SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Beginn" name="start_date" type="date" value={f.start_date || ''} onChange={e => onUpdate('start_date', e.target.value)} />
        <FormInput label="Sparrate (€)" name="premium" type="number" value={f.premium || ''} onChange={e => onUpdate('premium', e.target.value)} />
        <div>
          <Label className="text-xs">Intervall</Label>
          <Select value={f.payment_interval || 'monatlich'} onValueChange={v => onUpdate('payment_interval', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTERVALS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Status" name="status" value={f.status || ''} onChange={e => onUpdate('status', e.target.value)} />
      </div>
      <p className={cn(RECORD_CARD.SECTION_TITLE, 'mt-4')}>Guthaben</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <FormInput label="Aktuelles Guthaben (€)" name="current_balance" type="number" value={f.current_balance || ''} onChange={e => onUpdate('current_balance', e.target.value)} />
        <FormInput label="Stand per" name="balance_date" type="date" value={f.balance_date || ''} onChange={e => onUpdate('balance_date', e.target.value)} />
      </div>
      <div className="mt-3">
        <Label className="text-xs">Notizen</Label>
        <Textarea value={f.notes || ''} onChange={e => onUpdate('notes', e.target.value)} rows={2} className="mt-1" />
      </div>
    </div>
  );

  return (
    <PageShell>
      {/* ─── Single Header with [+] Button ─────────────────────────── */}
      <ModulePageHeader
        title="Investment"
        description="Wertpapiere, ETFs und Depot-Verwaltung"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="icon-round"
              onClick={() => setShowDepotDialog(true)}
              disabled={connectMutation.isPending || isPolling}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      {/* ─── AlertDialog: Info-Text + FinAPI Connect ─────────────── */}
      <AlertDialog open={showDepotDialog} onOpenChange={setShowDepotDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Depot anbinden</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Wenn Sie hier ein eigenes Depot anbinden, können Sie darüber nicht traden. 
              Es dient nur der Überwachung. Wenn Sie direkt aus Ihrem Portal heraus mit 
              Wertpapieren handeln möchten, können Sie unten über unseren Partner Upvest 
              direkt im Portal ein eigenes Depot anlegen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConnectDepot}>
              <Building2 className="h-4 w-4 mr-2" />
              Depot anbinden (FinAPI)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Person selection as compact CI-Kacheln ─────────────── */}
      {depotPersons && depotPersons.length > 0 && (
        <WidgetGrid>
          {depotPersons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            const isDemo = isDemoId(person.id);
            const hasDepot = false; // Real depot status will come from FinAPI integration
            const gradient = ROLE_GRADIENTS[person.role] || ROLE_GRADIENTS.weitere;
            const glowVariant = isDemo ? 'emerald' : 'primary';

            return (
              <WidgetCell key={person.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col items-center justify-center p-5 text-center',
                    hasDepot ? getActiveWidgetGlow(glowVariant) : '',
                    isSelected && getSelectionRing(glowVariant),
                  )}
                  onClick={(e) => { e.stopPropagation(); setSelectedPersonId(person.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedPersonId(person.id); }}}
                  role="button"
                  tabIndex={0}
                >
                  {isDemo && (
                    <Badge className={DEMO_WIDGET.BADGE + ' absolute top-3 right-3 text-[10px]'}>DEMO</Badge>
                  )}
                  <div className={cn('h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center mb-3', gradient)}>
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>
                    {person.first_name} {person.last_name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ROLE_LABELS[person.role] || person.role}
                  </p>
                  <Badge
                    variant={hasDepot ? 'default' : 'outline'}
                    className="mt-2 text-[10px]"
                  >
                    {hasDepot ? 'Depot aktiv' : 'Kein Depot'}
                  </Badge>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* ─── Polling indicator ─────────────────────────── */}
      {isPolling && (
        <Card className="glass-card mb-4 mt-4 border-primary/30">
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

      {/* ─── Combined WidgetGrid: Sparpläne + FinAPI-Depots ─────── */}
      <div className="mt-8">
        {sparLoading || depotLoading ? (
          <Skeleton className="h-40" />
        ) : (investmentContracts.length > 0 || depotAccounts.length > 0) ? (
          <WidgetGrid>
            {/* Sparplan-Kacheln */}
            {investmentContracts.map((c: any) => {
              const personName = persons.find(p => p.id === c.person_id);
              const isSelected = selectedSparId === c.id;
              const isDemo = isDemoId(c.id);
              const glowVariant = isDemo ? 'emerald' : 'primary';
              return (
                <WidgetCell key={c.id}>
                  <div
                    className={cn(
                      CARD.BASE, CARD.INTERACTIVE,
                      'h-full flex flex-col justify-between p-5',
                      getActiveWidgetGlow(glowVariant),
                      isSelected && getSelectionRing(glowVariant),
                    )}
                    onClick={(e) => { e.stopPropagation(); selectSparCard(c.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectSparCard(c.id); }}}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
                        {c.contract_type && <Badge variant="secondary" className="text-[10px]">{c.contract_type}</Badge>}
                        <Badge variant="default" className="text-[10px]">{c.status || 'Aktiv'}</Badge>
                      </div>
                      <div className={HEADER.WIDGET_ICON_BOX}>
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className={TYPOGRAPHY.CARD_TITLE}>{c.provider || 'Anbieter'}</h4>
                      {c.contract_no && <p className="text-[10px] text-muted-foreground/70">{c.contract_no}</p>}
                    </div>
                    <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Sparrate</span>
                        <span className="font-semibold">{fmt(c.premium || 0)} / {intervalLabel(c.payment_interval || '')}</span>
                      </div>
                      {c.current_balance != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Guthaben</span>
                          <span className="font-semibold">{fmt(c.current_balance)}</span>
                        </div>
                      )}
                      {c.balance_date && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Stand</span>
                          <span>{new Date(c.balance_date).toLocaleDateString('de-DE')}</span>
                        </div>
                      )}
                      {personName && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Person</span>
                          <span>{personName.first_name} {personName.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </WidgetCell>
              );
            })}

            {/* FinAPI-Depot-Kacheln */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDepotId(isSelected ? null : depot.id);
                      setSelectedSparId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDepotId(isSelected ? null : depot.id);
                        setSelectedSparId(null);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <WidgetDeleteOverlay
                      title={depot.account_name || depot.bank_name || 'Depot'}
                      onConfirmDelete={() => deleteDepotMutation.mutate(depot.id)}
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
        ) : null}

        {/* Sparplan Detail below grid */}
        {selectedSparId && sparForm && (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{sparForm.provider || 'Anbieter'}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedSparId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-6">
              <SparFields form={sparForm} onUpdate={(f, v) => updateSparField(selectedSparId, f, v)} />
            </div>
            <div className={RECORD_CARD.ACTIONS}>
              <Button variant="destructive" size="sm" onClick={() => deleteSparMutation.mutate(selectedSparId)}>Löschen</Button>
              <Button size="sm" onClick={() => updateSparMutation.mutate(sparForm)} disabled={updateSparMutation.isPending}>Speichern</Button>
            </div>
          </Card>
        )}

        {/* FinAPI Depot Positions table below grid */}
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

      <DataReadinessModal
        open={readiness.showReadinessModal}
        onOpenChange={readiness.setShowReadinessModal}
        isDemoActive={readiness.isDemoActive}
        isConsentGiven={readiness.isConsentGiven}
      />
      <ConsentRequiredModal
        open={readiness.showConsentModal}
        onOpenChange={readiness.setShowConsentModal}
      />
    </PageShell>
  );
}

/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Person selection via WidgetGrid CI-Kacheln + Investment-Sparpläne section
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, DEMO_WIDGET, HEADER, RECORD_CARD } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { useDemoDepot } from '@/hooks/useDemoDepot';
import { DepotOnboardingWizard } from '@/components/finanzanalyse/depot/DepotOnboardingWizard';
import { DepotPortfolio } from '@/components/finanzanalyse/depot/DepotPortfolio';
import { DepotPositionen } from '@/components/finanzanalyse/depot/DepotPositionen';
import { DepotPerformanceChart } from '@/components/finanzanalyse/depot/DepotPerformanceChart';
import { DepotTransaktionen } from '@/components/finanzanalyse/depot/DepotTransaktionen';
import { DepotSteuerReport } from '@/components/finanzanalyse/depot/DepotSteuerReport';
import { FormInput } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { User, Plus, TrendingUp, X, Shield, Zap, BarChart3, PiggyBank, Puzzle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const UPVEST_FEATURES = [
  { icon: Shield, title: 'BaFin-reguliert', desc: 'WpIG-lizenzierte Infrastruktur' },
  { icon: Zap, title: 'Sofort startklar', desc: 'Depot in Sekunden eröffnen' },
  { icon: BarChart3, title: 'Volle Auswahl', desc: 'Aktien, ETFs, Fonds & Crypto' },
  { icon: PiggyBank, title: 'Automatisch sparen', desc: 'Sparpläne ab 1 €' },
  { icon: Puzzle, title: 'Fractional Trading', desc: 'Bruchstücke handeln' },
  { icon: FileText, title: 'Steuer digital', desc: 'Automatische Steuerreports' },
] as const;

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
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { persons } = useFinanzanalyseData();
  const queryClient = useQueryClient();

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

  const { status, setStatus, resetDepot, totalValue, dailyChange } = useDemoDepot(
    effectivePersonId ?? undefined,
    selectedPerson?.is_primary
  );

  // --- Investment-Sparpläne ---
  const [selectedSparId, setSelectedSparId] = useState<string | null>(null);
  const [sparForms, setSparForms] = useState<Record<string, Record<string, any>>>({});
  const [showNewSpar, setShowNewSpar] = useState(false);
  const [newSparForm, setNewSparForm] = useState<Record<string, any>>({
    provider: '', contract_no: '', contract_type: '', person_id: '',
    start_date: '', premium: 0, payment_interval: 'monatlich', status: 'Aktiv', notes: '',
    current_balance: '', balance_date: '',
  });

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
      setShowNewSpar(false);
      setNewSparForm({ provider: '', contract_no: '', contract_type: '', person_id: '', start_date: '', premium: 0, payment_interval: 'monatlich', status: 'Aktiv', notes: '', current_balance: '', balance_date: '' });
    },
  });

  const updateSparMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
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
    setShowNewSpar(false);
  };

  const updateSparField = (id: string, field: string, value: any) => {
    setSparForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const intervalLabel = (v: string) => INTERVALS.find(i => i.value === v)?.label || v;
  const selectedSparContract = investmentContracts.find((c: any) => c.id === selectedSparId);
  const sparForm = selectedSparId ? (sparForms[selectedSparId] || selectedSparContract) : null;

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
      <ModulePageHeader
        title="Investment"
        description="Depot-Verwaltung über Upvest — Wertpapiere, ETFs und mehr"
        actions={
          status === 'active' ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Depot aktiv</Badge>
          ) : undefined
        }
      />

      {/* Person selection as compact CI-Kacheln */}
      {depotPersons && depotPersons.length > 0 && (
        <WidgetGrid>
          {depotPersons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            const isDemo = isDemoId(person.id);
            const personDepotKey = `depot_status_${person.id}`;
            const storedStatus = localStorage.getItem(personDepotKey);
            const hasDepot = storedStatus === 'active' || (storedStatus === null && isPrimary);
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
                  {hasDepot && isSelected && (
                    <p className="text-xs font-semibold mt-1">
                      {totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </p>
                  )}
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* ─── Investment-Sparpläne ─────────────────────────── */}
      <div className="mt-8">
        <ModulePageHeader
          title="Investment-Sparpläne"
          description="ETF-, Fonds- und Aktien-Sparpläne verwalten"
          actions={
            <Button
              variant="glass"
              size="icon-round"
              onClick={() => { setShowNewSpar(true); setSelectedSparId(null); }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          }
        />

        {sparLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <WidgetGrid>
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
          </WidgetGrid>
        )}

        {/* Detail below grid */}
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

        {showNewSpar && (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Neuer Investment-Sparplan</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNewSpar(false)}>Abbrechen</Button>
            </div>
            <div className="space-y-6">
              <SparFields form={newSparForm} onUpdate={(f, v) => setNewSparForm(prev => ({ ...prev, [f]: v }))} />
            </div>
            <div className={RECORD_CARD.ACTIONS}>
              <Button size="sm" onClick={() => createSparMutation.mutate(newSparForm)}>Speichern</Button>
            </div>
          </Card>
        )}
      </div>

      {/* ─── Armstrong Depot ─────────────────────────── */}
      <div className="mt-8">
        <ModulePageHeader
          title="Armstrong Depot"
          description="Investiere mit unserem Partner Upvest direkt aus deinem Portal"
        />

        <Card className="glass-card p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Mit dem Armstrong Depot investieren Sie direkt aus Ihrem Portal — powered by Upvest. 
            Die BaFin-regulierte Infrastruktur ermöglicht sekundenschnelle Depoteröffnung, 
            Zugang zu Tausenden von Aktien, ETFs und Fonds, automatische Sparpläne und 
            Fractional Trading. Ihre Wertpapiere werden sicher verwahrt, Steuerreports 
            digital erstellt. Kein separates Bankkonto, kein Papierkram.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {UPVEST_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Depot content based on selected person's status */}
        {status === 'none' && (
          <DepotOnboardingWizard onComplete={() => setStatus('active')} />
        )}

        {status === 'active' && (
          <div className="space-y-4 md:space-y-6">
            <DepotPortfolio totalValue={totalValue} dailyChange={dailyChange} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <DepotPerformanceChart />
              <DepotSteuerReport />
            </div>
            <DepotPositionen />
            <DepotTransaktionen />
            <div className="text-center pt-4">
              <button onClick={resetDepot} className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors underline">
                Depot zurücksetzen (Demo)
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

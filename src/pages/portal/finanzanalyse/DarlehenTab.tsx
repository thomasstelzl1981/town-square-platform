/**
 * MOD-18 Finanzen — Tab: DARLEHEN
 * Sektion 1: Hausdarlehen (gespiegelt aus miety_loans, read-only)
 * Sektion 2: PV-Darlehen (gespiegelt aus pv_plants, read-only)
 * Sektion 3: Privatkredite (CRUD aus private_loans)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { CARD, TYPOGRAPHY, HEADER, RECORD_CARD, DEMO_WIDGET, getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Landmark, Home, Sun, CreditCard, X, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function fmtRate(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

function fmtPercent(v: number) {
  return `${v.toFixed(2)} %`;
}

const PURPOSE_OPTIONS = [
  { value: 'autokredit', label: 'Autokredit' },
  { value: 'konsumkredit', label: 'Konsumkredit' },
  { value: 'moebel', label: 'Möbelfinanzierung' },
  { value: 'bildung', label: 'Bildungskredit' },
  { value: 'umschuldung', label: 'Umschuldung' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const STATUS_OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
];

export default function DarlehenTab() {
  const { activeTenantId, user } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<'haus' | 'pv' | 'privat' | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({
    loan_purpose: 'konsumkredit', bank_name: '', loan_amount: 0, remaining_balance: 0,
    interest_rate: 0, monthly_rate: 0, start_date: '', end_date: '', status: 'aktiv', notes: '',
  });

  // ─── Hausdarlehen (miety_loans) ─────────────────────────
  const { data: mietyLoans = [], isLoading: loadingHaus } = useQuery({
    queryKey: ['darlehen-miety-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('miety_loans')
        .select('id, bank_name, loan_amount, remaining_balance, monthly_rate, interest_rate, loan_type')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ─── PV-Darlehen (pv_plants) ───────────────────────────
  const { data: pvPlants = [], isLoading: loadingPV } = useQuery({
    queryKey: ['darlehen-pv-plants', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('pv_plants' as any)
        .select('id, name, loan_bank, loan_amount, loan_remaining_balance, loan_monthly_rate, loan_interest_rate')
        .eq('tenant_id', activeTenantId);
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  // ─── Privatkredite (private_loans) ─────────────────────
  const { data: privateLoans = [], isLoading: loadingPrivat } = useQuery({
    queryKey: ['darlehen-private-loans', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('private_loans' as any)
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await supabase.from('private_loans' as any).insert({
        tenant_id: activeTenantId, user_id: user.id,
        loan_purpose: form.loan_purpose, bank_name: form.bank_name || null,
        loan_amount: Number(form.loan_amount) || 0, remaining_balance: Number(form.remaining_balance) || 0,
        interest_rate: Number(form.interest_rate) || 0, monthly_rate: Number(form.monthly_rate) || 0,
        start_date: form.start_date || null, end_date: form.end_date || null,
        status: form.status || 'aktiv', notes: form.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['darlehen-private-loans'] });
      queryClient.invalidateQueries({ queryKey: ['fb-private-loans'] });
      toast.success('Privatkredit angelegt');
      setShowNew(false);
      setNewForm({ loan_purpose: 'konsumkredit', bank_name: '', loan_amount: 0, remaining_balance: 0, interest_rate: 0, monthly_rate: 0, start_date: '', end_date: '', status: 'aktiv', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const { id, created_at, updated_at, tenant_id, user_id, ...rest } = form;
      const { error } = await supabase.from('private_loans' as any).update({
        loan_purpose: rest.loan_purpose, bank_name: rest.bank_name || null,
        loan_amount: Number(rest.loan_amount) || 0, remaining_balance: Number(rest.remaining_balance) || 0,
        interest_rate: Number(rest.interest_rate) || 0, monthly_rate: Number(rest.monthly_rate) || 0,
        start_date: rest.start_date || null, end_date: rest.end_date || null,
        status: rest.status || 'aktiv', notes: rest.notes || null,
      } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['darlehen-private-loans'] });
      queryClient.invalidateQueries({ queryKey: ['fb-private-loans'] });
      toast.success('Privatkredit aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('private_loans' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['darlehen-private-loans'] });
      queryClient.invalidateQueries({ queryKey: ['fb-private-loans'] });
      toast.success('Privatkredit gelöscht');
      setSelectedId(null);
      setSelectedSection(null);
    },
  });

  // ─── KPI Aggregation ───────────────────────────────────
  const kpis = useMemo(() => {
    const hausTotal = mietyLoans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
    const hausRate = mietyLoans.reduce((s, l) => s + (l.monthly_rate || 0), 0);
    const pvTotal = pvPlants.reduce((s: number, p: any) => s + (p.loan_remaining_balance || 0), 0);
    const pvRate = pvPlants.reduce((s: number, p: any) => s + (p.loan_monthly_rate || 0), 0);
    const privatTotal = (privateLoans as any[]).filter((l: any) => l.status === 'aktiv').reduce((s: number, l: any) => s + (l.remaining_balance || 0), 0);
    const privatRate = (privateLoans as any[]).filter((l: any) => l.status === 'aktiv').reduce((s: number, l: any) => s + (l.monthly_rate || 0), 0);
    return {
      totalDebt: hausTotal + pvTotal + privatTotal,
      totalRate: hausRate + pvRate + privatRate,
      count: mietyLoans.length + pvPlants.filter((p: any) => p.loan_bank).length + (privateLoans as any[]).filter((l: any) => l.status === 'aktiv').length,
    };
  }, [mietyLoans, pvPlants, privateLoans]);

  const isLoading = loadingHaus || loadingPV || loadingPrivat;
  if (isLoading) return <PageShell><Skeleton className="h-64" /></PageShell>;

  const selectCard = (id: string, section: 'haus' | 'pv' | 'privat') => {
    if (selectedId === id) { setSelectedId(null); setSelectedSection(null); return; }
    if (section === 'privat') {
      const loan = (privateLoans as any[]).find((l: any) => l.id === id);
      if (loan) setForms(prev => ({ ...prev, [id]: { ...loan } }));
    }
    setSelectedId(id);
    setSelectedSection(section);
    setShowNew(false);
  };

  const updateField = (id: string, field: string, value: any) => {
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const pvWithLoans = pvPlants.filter((p: any) => p.loan_bank);

  return (
    <PageShell>
      <ModulePageHeader
        title="Darlehen"
        description="Konsolidierte Übersicht aller privaten Verbindlichkeiten"
        actions={
          <Button size="icon-round" onClick={() => { setShowNew(true); setSelectedId(null); setSelectedSection(null); }} className="h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* KPI Bar */}
      <Card className="glass-card">
        <CardContent className="py-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamtschulden (privat)</p>
              <p className="text-2xl font-bold">{fmt(kpis.totalDebt)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monatliche Belastung</p>
            <p className="text-lg font-semibold">{fmtRate(kpis.totalRate)}</p>
          </div>
          <Badge variant="secondary">{kpis.count} aktive Darlehen</Badge>
        </CardContent>
      </Card>

      {/* ═══ Sektion 1: Hausdarlehen ═══ */}
      <div className="flex items-center gap-2 mt-6">
        <Home className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hausdarlehen</h3>
        <Badge variant="outline" className="text-[10px]">Zu Hause</Badge>
      </div>

      {mietyLoans.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Keine Hausdarlehen vorhanden</p>
      ) : (
        <WidgetGrid>
          {mietyLoans.map((loan) => {
            const isDemo = isDemoId(loan.id);
            const isSelected = selectedId === loan.id;
            return (
              <WidgetCell key={loan.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5',
                    getActiveWidgetGlow(isDemo ? 'emerald' : 'rose'),
                    isSelected && getSelectionRing(isDemo ? 'emerald' : 'rose'),
                  )}
                  onClick={(e) => { e.stopPropagation(); selectCard(loan.id, 'haus'); }}
                  role="button" tabIndex={0}
                >
                  <div className="space-y-2">
                    {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
                    <div className={HEADER.WIDGET_ICON_BOX}>
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className={TYPOGRAPHY.CARD_TITLE}>{loan.bank_name || 'Hausdarlehen'}</h4>
                    <p className="text-xs text-muted-foreground">{loan.loan_type || 'Annuitätendarlehen'}</p>
                  </div>
                  <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Restschuld</span>
                      <span className="font-semibold">{fmt(loan.remaining_balance || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate/Monat</span>
                      <span>{fmtRate(loan.monthly_rate || 0)}</span>
                    </div>
                  </div>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* Detail Hausdarlehen (read-only) */}
      {selectedId && selectedSection === 'haus' && (() => {
        const loan = mietyLoans.find(l => l.id === selectedId);
        if (!loan) return null;
        return (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{loan.bank_name || 'Hausdarlehen'}</h2>
                <Badge variant="outline" className="text-[10px]">Gespiegelt aus Zu Hause</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(null); setSelectedSection(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className={RECORD_CARD.FIELD_GRID}>
              <div><Label className="text-xs">Bank</Label><p className="text-sm font-medium">{loan.bank_name || '—'}</p></div>
              <div><Label className="text-xs">Darlehenstyp</Label><p className="text-sm font-medium">{loan.loan_type || '—'}</p></div>
              <div><Label className="text-xs">Darlehenssumme</Label><p className="text-sm font-medium">{fmt(loan.loan_amount || 0)}</p></div>
              <div><Label className="text-xs">Restschuld</Label><p className="text-sm font-medium">{fmt(loan.remaining_balance || 0)}</p></div>
              <div><Label className="text-xs">Zinssatz</Label><p className="text-sm font-medium">{fmtPercent(loan.interest_rate || 0)}</p></div>
              <div><Label className="text-xs">Monatsrate</Label><p className="text-sm font-medium">{fmtRate(loan.monthly_rate || 0)}</p></div>
            </div>
          </Card>
        );
      })()}

      {/* ═══ Sektion 2: PV-Darlehen ═══ */}
      <div className="flex items-center gap-2 mt-6">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">PV-Darlehen</h3>
        <Badge variant="outline" className="text-[10px]">Photovoltaik</Badge>
      </div>

      {pvWithLoans.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Keine PV-Darlehen vorhanden</p>
      ) : (
        <WidgetGrid>
          {pvWithLoans.map((pv: any) => {
            const isSelected = selectedId === pv.id;
            return (
              <WidgetCell key={pv.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5',
                    getActiveWidgetGlow('rose'),
                    isSelected && getSelectionRing('rose'),
                  )}
                  onClick={(e) => { e.stopPropagation(); selectCard(pv.id, 'pv'); }}
                  role="button" tabIndex={0}
                >
                  <div className="space-y-2">
                    <div className={HEADER.WIDGET_ICON_BOX}>
                      <Sun className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className={TYPOGRAPHY.CARD_TITLE}>{pv.loan_bank || 'PV-Darlehen'}</h4>
                    <p className="text-xs text-muted-foreground">{pv.name || 'PV-Anlage'}</p>
                  </div>
                  <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Restschuld</span>
                      <span className="font-semibold">{fmt(pv.loan_remaining_balance || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate/Monat</span>
                      <span>{fmtRate(pv.loan_monthly_rate || 0)}</span>
                    </div>
                  </div>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* Detail PV (read-only) */}
      {selectedId && selectedSection === 'pv' && (() => {
        const pv = pvWithLoans.find((p: any) => p.id === selectedId);
        if (!pv) return null;
        return (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{pv.loan_bank || 'PV-Darlehen'}</h2>
                <Badge variant="outline" className="text-[10px]">Gespiegelt aus Photovoltaik</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(null); setSelectedSection(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className={RECORD_CARD.FIELD_GRID}>
              <div><Label className="text-xs">Bank</Label><p className="text-sm font-medium">{pv.loan_bank || '—'}</p></div>
              <div><Label className="text-xs">Anlage</Label><p className="text-sm font-medium">{pv.name || '—'}</p></div>
              <div><Label className="text-xs">Darlehenssumme</Label><p className="text-sm font-medium">{fmt(pv.loan_amount || 0)}</p></div>
              <div><Label className="text-xs">Restschuld</Label><p className="text-sm font-medium">{fmt(pv.loan_remaining_balance || 0)}</p></div>
              <div><Label className="text-xs">Zinssatz</Label><p className="text-sm font-medium">{fmtPercent(pv.loan_interest_rate || 0)}</p></div>
              <div><Label className="text-xs">Monatsrate</Label><p className="text-sm font-medium">{fmtRate(pv.loan_monthly_rate || 0)}</p></div>
            </div>
          </Card>
        );
      })()}

      {/* ═══ Sektion 3: Privatkredite ═══ */}
      <div className="flex items-center gap-2 mt-6">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Privatkredite</h3>
      </div>

      {(privateLoans as any[]).length === 0 && !showNew ? (
        <p className="text-sm text-muted-foreground py-4">Keine Privatkredite vorhanden — nutzen Sie den Plus-Button um einen anzulegen</p>
      ) : (
        <WidgetGrid>
          {(privateLoans as any[]).map((loan: any) => {
            const isSelected = selectedId === loan.id;
            return (
              <WidgetCell key={loan.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5',
                    getActiveWidgetGlow('rose'),
                    isSelected && getSelectionRing('rose'),
                  )}
                  onClick={(e) => { e.stopPropagation(); selectCard(loan.id, 'privat'); }}
                  role="button" tabIndex={0}
                >
                  <div className="space-y-2">
                    <Badge variant={loan.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">
                      {loan.status || 'aktiv'}
                    </Badge>
                    <div className={HEADER.WIDGET_ICON_BOX}>
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className={TYPOGRAPHY.CARD_TITLE}>{loan.bank_name || PURPOSE_OPTIONS.find(p => p.value === loan.loan_purpose)?.label || 'Privatkredit'}</h4>
                    <p className="text-xs text-muted-foreground">{PURPOSE_OPTIONS.find(p => p.value === loan.loan_purpose)?.label || loan.loan_purpose}</p>
                  </div>
                  <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Restschuld</span>
                      <span className="font-semibold">{fmt(loan.remaining_balance || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate/Monat</span>
                      <span>{fmtRate(loan.monthly_rate || 0)}</span>
                    </div>
                  </div>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* Detail Privatkredit (editable) */}
      {selectedId && selectedSection === 'privat' && (() => {
        const form = forms[selectedId];
        if (!form) return null;
        return (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{form.bank_name || 'Privatkredit'}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(null); setSelectedSection(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PrivatLoanFields form={form} onUpdate={(f, v) => updateField(selectedId, f, v)} />
            <div className={RECORD_CARD.ACTIONS}>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedId)}>Löschen</Button>
              <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>Speichern</Button>
            </div>
          </Card>
        );
      })()}

      {/* New Privatkredit */}
      {showNew && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Neuer Privatkredit</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Abbrechen</Button>
          </div>
          <PrivatLoanFields form={newForm} onUpdate={(f, v) => setNewForm(prev => ({ ...prev, [f]: v }))} />
          <div className={RECORD_CARD.ACTIONS}>
            <Button size="sm" onClick={() => createMutation.mutate(newForm)} disabled={createMutation.isPending}>Speichern</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}

function PrivatLoanFields({ form, onUpdate }: { form: Record<string, any>; onUpdate: (field: string, v: any) => void }) {
  return (
    <div>
      <p className={RECORD_CARD.SECTION_TITLE}>Kreditdetails</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <div>
          <Label className="text-xs">Verwendungszweck</Label>
          <Select value={form.loan_purpose || 'sonstiges'} onValueChange={v => onUpdate('loan_purpose', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PURPOSE_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Bank / Kreditgeber" name="bank_name" value={form.bank_name || ''} onChange={e => onUpdate('bank_name', e.target.value)} />
        <FormInput label="Darlehenssumme (€)" name="loan_amount" type="number" value={form.loan_amount || ''} onChange={e => onUpdate('loan_amount', e.target.value)} />
        <FormInput label="Restschuld (€)" name="remaining_balance" type="number" value={form.remaining_balance || ''} onChange={e => onUpdate('remaining_balance', e.target.value)} />
        <FormInput label="Zinssatz (%)" name="interest_rate" type="number" value={form.interest_rate || ''} onChange={e => onUpdate('interest_rate', e.target.value)} />
        <FormInput label="Monatsrate (€)" name="monthly_rate" type="number" value={form.monthly_rate || ''} onChange={e => onUpdate('monthly_rate', e.target.value)} />
        <FormInput label="Vertragsbeginn" name="start_date" type="date" value={form.start_date || ''} onChange={e => onUpdate('start_date', e.target.value)} />
        <FormInput label="Vertragsende" name="end_date" type="date" value={form.end_date || ''} onChange={e => onUpdate('end_date', e.target.value)} />
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={form.status || 'aktiv'} onValueChange={v => onUpdate('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Notizen" name="notes" value={form.notes || ''} onChange={e => onUpdate('notes', e.target.value)} />
      </div>
    </div>
  );
}

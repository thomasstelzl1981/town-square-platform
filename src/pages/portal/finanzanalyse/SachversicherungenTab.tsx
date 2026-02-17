/**
 * MOD-18 Finanzen — Tab 3: SACHVERSICHERUNGEN
 * Widget CE Layout: WidgetGrid + WidgetCell (4-col, square)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, HEADER, RECORD_CARD, DEMO_WIDGET, getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';

import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Shield, X } from 'lucide-react';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { cn } from '@/lib/utils';

// DB enums
const CATEGORIES = [
  { value: 'haftpflicht', label: 'Haftpflicht' },
  { value: 'hausrat', label: 'Hausrat' },
  { value: 'wohngebaeude', label: 'Wohngebäude' },
  { value: 'rechtsschutz', label: 'Rechtsschutz' },
  { value: 'kfz', label: 'KFZ' },
  { value: 'unfall', label: 'Unfall' },
  { value: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit' },
  { value: 'sonstige', label: 'Sonstige' },
] as const;

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
] as const;

const STATUSES = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'gekuendigt', label: 'Gekündigt' },
  { value: 'ruhend', label: 'Ruhend' },
  { value: 'auslaufend', label: 'Auslaufend' },
] as const;

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v;

export default function SachversicherungenTab() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({
    category: 'haftpflicht', insurer: '', policy_no: '', policyholder: '',
    start_date: '', end_date: '', premium: 0, payment_interval: 'monatlich',
    status: 'aktiv', details: {},
  });

  const { data: rawContracts = [], isLoading } = useQuery({
    queryKey: ['fin-insurance', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('insurance_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const contracts = demoEnabled ? rawContracts : rawContracts.filter((c: any) => !isDemoId(c.id));

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { details, ...rest } = form;
      const { error } = await supabase.from('insurance_contracts').insert({
        tenant_id: activeTenantId, user_id: user.id,
        category: rest.category as any, insurer: rest.insurer || null,
        policy_no: rest.policy_no || null, policyholder: rest.policyholder || null,
        start_date: rest.start_date || null, end_date: rest.end_date || null,
        premium: Number(rest.premium) || null, payment_interval: (rest.payment_interval as any) || null,
        status: (rest.status as any) || null, details: details || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-insurance'] });
      toast.success('Versicherung angelegt');
      setShowNew(false);
      setNewForm({ category: 'haftpflicht', insurer: '', policy_no: '', policyholder: '', start_date: '', end_date: '', premium: 0, payment_interval: 'monatlich', status: 'aktiv', details: {} });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const { id, created_at, updated_at, tenant_id, user_id, details, ...rest } = form;
      const { error } = await supabase.from('insurance_contracts').update({
        category: rest.category as any, insurer: rest.insurer || null,
        policy_no: rest.policy_no || null, policyholder: rest.policyholder || null,
        start_date: rest.start_date || null, end_date: rest.end_date || null,
        premium: Number(rest.premium) || null, payment_interval: (rest.payment_interval as any) || null,
        status: (rest.status as any) || null, details: details || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-insurance'] });
      toast.success('Versicherung aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insurance_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-insurance'] });
      toast.success('Versicherung gelöscht');
      setSelectedId(null);
    },
  });

  if (isLoading) return <PageShell><Skeleton className="h-64" /></PageShell>;

  const selectCard = (id: string) => {
    if (selectedId === id) { setSelectedId(null); return; }
    const c = contracts.find((x: any) => x.id === id);
    if (c) setForms(prev => ({ ...prev, [id]: { ...c } }));
    setSelectedId(id);
    setShowNew(false);
  };

  const updateField = (id: string, field: string, value: any) => {
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const updateDetail = (id: string, field: string, value: any) => {
    setForms(prev => ({
      ...prev,
      [id]: { ...prev[id], details: { ...(prev[id]?.details || {}), [field]: value } },
    }));
  };

  const updateNewDetail = (field: string, value: any) => {
    setNewForm(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
  };

  const renderCategoryFields = (category: string, details: Record<string, any>, onUpdate: (f: string, v: any) => void) => {
    switch (category) {
      case 'haftpflicht':
        return (
          <>
            <FormInput label="Deckungssumme (€)" name="coverage" type="number" value={details.coverage || ''} onChange={e => onUpdate('coverage', e.target.value)} />
            <FormInput label="Selbstbeteiligung (€)" name="deductible" type="number" value={details.deductible || ''} onChange={e => onUpdate('deductible', e.target.value)} />
            <FormInput label="Mitversicherte Personen" name="insured_persons" type="number" value={details.insured_persons || ''} onChange={e => onUpdate('insured_persons', e.target.value)} />
          </>
        );
      case 'hausrat':
        return (
          <>
            <FormInput label="Versicherungssumme (€)" name="sum_insured" type="number" value={details.sum_insured || ''} onChange={e => onUpdate('sum_insured', e.target.value)} />
            <FormInput label="Wohnfläche (m²)" name="living_area" type="number" value={details.living_area || ''} onChange={e => onUpdate('living_area', e.target.value)} />
            <div className="flex items-center gap-2">
              <Switch checked={!!details.elemental} onCheckedChange={v => onUpdate('elemental', v)} />
              <Label className="text-xs">Elementarschutz</Label>
            </div>
          </>
        );
      case 'wohngebaeude':
        return (
          <>
            <FormInput label="Wohnfläche (m²)" name="living_area" type="number" value={details.living_area || ''} onChange={e => onUpdate('living_area', e.target.value)} />
            <div className="flex items-center gap-2">
              <Switch checked={!!details.elemental} onCheckedChange={v => onUpdate('elemental', v)} />
              <Label className="text-xs">Elementarschutz</Label>
            </div>
          </>
        );
      case 'rechtsschutz':
        return (
          <>
            <FormInput label="Selbstbeteiligung (€)" name="deductible" type="number" value={details.deductible || ''} onChange={e => onUpdate('deductible', e.target.value)} />
            <div className="space-y-1">
              <Label className="text-xs">Bereiche</Label>
              {['Privat', 'Beruf', 'Verkehr', 'Miete'].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <Switch checked={!!details[`area_${b.toLowerCase()}`]} onCheckedChange={v => onUpdate(`area_${b.toLowerCase()}`, v)} />
                  <span className="text-xs">{b}</span>
                </div>
              ))}
            </div>
          </>
        );
      case 'kfz':
        return (
          <>
            <div>
              <Label className="text-xs">Deckung</Label>
              <Select value={details.coverage_type || ''} onValueChange={v => onUpdate('coverage_type', v)}>
                <SelectTrigger><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="haftpflicht">Haftpflicht</SelectItem>
                  <SelectItem value="teilkasko">Teilkasko</SelectItem>
                  <SelectItem value="vollkasko">Vollkasko</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormInput label="Selbstbeteiligung (€)" name="deductible" type="number" value={details.deductible || ''} onChange={e => onUpdate('deductible', e.target.value)} />
          </>
        );
      default:
        return null;
    }
  };

  const selectedContract = contracts.find((c: any) => c.id === selectedId);
  const form = selectedId ? (forms[selectedId] || selectedContract) : null;

  const InsuranceFields = ({ form: f, onUpdate, onDetailUpdate }: { form: Record<string, any>; onUpdate: (field: string, v: any) => void; onDetailUpdate: (field: string, v: any) => void }) => (
    <>
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <div>
            <Label className="text-xs">Kategorie</Label>
            <Select value={f.category || ''} onValueChange={v => onUpdate('category', v)}>
              <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FormInput label="Versicherer" name="insurer" value={f.insurer || ''} onChange={e => onUpdate('insurer', e.target.value)} />
          <FormInput label="Policen-Nr." name="policy_no" value={f.policy_no || ''} onChange={e => onUpdate('policy_no', e.target.value)} />
          <FormInput label="Versicherungsnehmer" name="policyholder" value={f.policyholder || ''} onChange={e => onUpdate('policyholder', e.target.value)} />
          <FormInput label="Beginn" name="start_date" type="date" value={f.start_date || ''} onChange={e => onUpdate('start_date', e.target.value)} />
          <FormInput label="Ablauf / Kündigungsfrist" name="end_date" type="date" value={f.end_date || ''} onChange={e => onUpdate('end_date', e.target.value)} />
          <FormInput label="Beitrag (€)" name="premium" type="number" value={f.premium || ''} onChange={e => onUpdate('premium', e.target.value)} />
          <div>
            <Label className="text-xs">Intervall</Label>
            <Select value={f.payment_interval || 'monatlich'} onValueChange={v => onUpdate('payment_interval', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVALS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={f.status || 'aktiv'} onValueChange={v => onUpdate('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {f.category && (
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>{catLabel(f.category)} — Spezifisch</p>
          <div className={RECORD_CARD.FIELD_GRID}>
            {renderCategoryFields(f.category, f.details || {}, onDetailUpdate)}
          </div>
        </div>
      )}
    </>
  );

  return (
    <PageShell>
      <ModulePageHeader
        title="Sachversicherungen"
        description="Zentrale Verwaltung aller Versicherungsverträge (SSOT)"
        actions={
          <Button
            variant="glass"
            size="icon-round"
            onClick={() => { setShowNew(true); setSelectedId(null); }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <WidgetGrid>
        {contracts.map((c: any) => {
          const intervalLabel = INTERVALS.find(i => i.value === c.payment_interval)?.label || c.payment_interval || '';
          const isSelected = selectedId === c.id;
          const isDemo = isDemoId(c.id);
          const glowVariant = isDemo ? 'emerald' : 'rose';
          return (
            <WidgetCell key={c.id}>
              <div
                className={cn(
                  CARD.BASE, CARD.INTERACTIVE,
                  'h-full flex flex-col justify-between p-5',
                  getActiveWidgetGlow(glowVariant),
                  isSelected && getSelectionRing(glowVariant),
                )}
                onClick={(e) => { e.stopPropagation(); selectCard(c.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectCard(c.id); }}}
                role="button"
                tabIndex={0}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
                    <Badge variant={c.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">
                      {STATUSES.find(s => s.value === c.status)?.label || 'Aktiv'}
                    </Badge>
                  </div>
                  <div className={HEADER.WIDGET_ICON_BOX}>
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>{c.insurer || 'Versicherer'}</h4>
                  <p className="text-xs text-muted-foreground">{catLabel(c.category)}</p>
                  {c.policy_no && <p className="text-[10px] text-muted-foreground/70">{c.policy_no}</p>}
                </div>
                <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beitrag</span>
                    <span className="font-semibold">{fmt(c.premium || 0)} / {intervalLabel}</span>
                  </div>
                  {c.start_date && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Beginn</span>
                      <span>{new Date(c.start_date).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>
            </WidgetCell>
          );
        })}

      </WidgetGrid>

      {/* Detail / Edit below grid */}
      {selectedId && form && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{form.insurer || 'Versicherer'} — {catLabel(form.category)}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-6">
            <InsuranceFields
              form={form}
              onUpdate={(f, v) => updateField(selectedId, f, v)}
              onDetailUpdate={(f, v) => updateDetail(selectedId, f, v)}
            />
          </div>
          <div className={RECORD_CARD.ACTIONS}>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedId)}>Löschen</Button>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>Speichern</Button>
          </div>
        </Card>
      )}

      {/* New form below grid */}
      {showNew && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Neue Versicherung</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Abbrechen</Button>
          </div>
          <div className="space-y-6">
            <InsuranceFields
              form={newForm}
              onUpdate={(f, v) => setNewForm(prev => ({ ...prev, [f]: v }))}
              onDetailUpdate={updateNewDetail}
            />
          </div>
          <div className={RECORD_CARD.ACTIONS}>
            <Button size="sm" onClick={() => createMutation.mutate(newForm)}>Speichern</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}

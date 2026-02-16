/**
 * MOD-18 Finanzen — Tab 3: SACHVERSICHERUNGEN
 * SSOT für alle Versicherungen. RecordCard-Pattern.
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD } from '@/config/designManifest';
import { getContractWidgetGlow } from '@/config/widgetCategorySpec';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

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
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({
    category: 'haftpflicht', insurer: '', policy_no: '', policyholder: '',
    start_date: '', end_date: '', premium: 0, payment_interval: 'monatlich',
    status: 'aktiv', details: {},
  });

  const { data: contracts = [], isLoading } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { details, ...rest } = form;
      const { error } = await supabase.from('insurance_contracts').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        category: rest.category as any,
        insurer: rest.insurer || null,
        policy_no: rest.policy_no || null,
        policyholder: rest.policyholder || null,
        start_date: rest.start_date || null,
        end_date: rest.end_date || null,
        premium: Number(rest.premium) || null,
        payment_interval: (rest.payment_interval as any) || null,
        status: (rest.status as any) || null,
        details: details || null,
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
        category: rest.category as any,
        insurer: rest.insurer || null,
        policy_no: rest.policy_no || null,
        policyholder: rest.policyholder || null,
        start_date: rest.start_date || null,
        end_date: rest.end_date || null,
        premium: Number(rest.premium) || null,
        payment_interval: (rest.payment_interval as any) || null,
        status: (rest.status as any) || null,
        details: details || null,
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
      setOpenCardId(null);
    },
  });

  if (isLoading) return <PageShell><Skeleton className="h-64" /></PageShell>;

  const toggleCard = (id: string) => {
    if (openCardId === id) { setOpenCardId(null); return; }
    const c = contracts.find((x: any) => x.id === id);
    if (c) setForms(prev => ({ ...prev, [id]: { ...c } }));
    setOpenCardId(id);
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

  const InsuranceFields = ({ form, onUpdate, onDetailUpdate }: { form: Record<string, any>; onUpdate: (f: string, v: any) => void; onDetailUpdate: (f: string, v: any) => void }) => (
    <>
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <div>
            <Label className="text-xs">Kategorie</Label>
            <Select value={form.category || ''} onValueChange={v => onUpdate('category', v)}>
              <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FormInput label="Versicherer" name="insurer" value={form.insurer || ''} onChange={e => onUpdate('insurer', e.target.value)} />
          <FormInput label="Policen-Nr." name="policy_no" value={form.policy_no || ''} onChange={e => onUpdate('policy_no', e.target.value)} />
          <FormInput label="Versicherungsnehmer" name="policyholder" value={form.policyholder || ''} onChange={e => onUpdate('policyholder', e.target.value)} />
          <FormInput label="Beginn" name="start_date" type="date" value={form.start_date || ''} onChange={e => onUpdate('start_date', e.target.value)} />
          <FormInput label="Ablauf / Kündigungsfrist" name="end_date" type="date" value={form.end_date || ''} onChange={e => onUpdate('end_date', e.target.value)} />
          <FormInput label="Beitrag (€)" name="premium" type="number" value={form.premium || ''} onChange={e => onUpdate('premium', e.target.value)} />
          <div>
            <Label className="text-xs">Intervall</Label>
            <Select value={form.payment_interval || 'monatlich'} onValueChange={v => onUpdate('payment_interval', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVALS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status || 'aktiv'} onValueChange={v => onUpdate('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {form.category && (
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>{catLabel(form.category)} — Spezifisch</p>
          <div className={RECORD_CARD.FIELD_GRID}>
            {renderCategoryFields(form.category, form.details || {}, onDetailUpdate)}
          </div>
        </div>
      )}
    </>
  );

  return (
    <PageShell>
      <ModulePageHeader title="Sachversicherungen" description="Zentrale Verwaltung aller Versicherungsverträge (SSOT)" />

      <div className={RECORD_CARD.GRID}>
        {contracts.map((c: any) => {
          const form = forms[c.id] || c;
          const intervalLabel = INTERVALS.find(i => i.value === c.payment_interval)?.label || c.payment_interval || '';
          return (
            <RecordCard
              key={c.id}
              id={c.id}
              entityType="insurance"
              isOpen={openCardId === c.id}
              onToggle={() => toggleCard(c.id)}
              glowVariant={getContractWidgetGlow(c.id) ?? undefined}
              title={`${c.insurer || 'Versicherer'} — ${catLabel(c.category)}`}
              subtitle={c.policy_no || undefined}
              badges={[
                { label: STATUSES.find(s => s.value === c.status)?.label || 'Aktiv', variant: c.status === 'aktiv' ? 'default' : 'secondary' },
              ]}
              summary={[
                { label: 'Beitrag', value: `${fmt(c.premium || 0)} / ${intervalLabel}` },
                ...(c.start_date ? [{ label: 'Beginn', value: new Date(c.start_date).toLocaleDateString('de-DE') }] : []),
              ]}
              tenantId={activeTenantId || undefined}
              onSave={() => updateMutation.mutate(form)}
              onDelete={() => deleteMutation.mutate(c.id)}
              saving={updateMutation.isPending}
            >
              <InsuranceFields
                form={form}
                onUpdate={(f, v) => updateField(c.id, f, v)}
                onDetailUpdate={(f, v) => updateDetail(c.id, f, v)}
              />
            </RecordCard>
          );
        })}

        {!showNew && (
          <div
            className={RECORD_CARD.CLOSED + ' border-dashed border-primary/30 flex items-center justify-center'}
            onClick={() => { setShowNew(true); setOpenCardId(null); }}
            role="button"
            tabIndex={0}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Versicherung hinzufügen</p>
            </div>
          </div>
        )}

        {showNew && (
          <div className={RECORD_CARD.OPEN}>
            <div className="flex items-center justify-between mb-6">
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
          </div>
        )}
      </div>
    </PageShell>
  );
}

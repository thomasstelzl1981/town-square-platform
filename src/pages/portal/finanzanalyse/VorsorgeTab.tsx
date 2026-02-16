/**
 * MOD-18 Finanzen — Tab 4: VORSORGEVERTRÄGE
 * CRUD für Vorsorge / Rente. RecordCard-Pattern.
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD, INFO_BANNER } from '@/config/designManifest';
import { getContractWidgetGlow } from '@/config/widgetCategorySpec';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Info } from 'lucide-react';

const CONTRACT_TYPES = ['bAV', 'Riester', 'Rürup', 'Versorgungswerk', 'Privat', 'Sonstige'] as const;

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
] as const;

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export default function VorsorgeTab() {
  const { activeTenantId, user } = useAuth();
  const { persons } = useFinanzanalyseData();
  const queryClient = useQueryClient();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({
    provider: '', contract_no: '', contract_type: '', person_id: '',
    start_date: '', premium: 0, payment_interval: 'monatlich', status: 'Aktiv', notes: '',
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['fin-vorsorge', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('vorsorge_contracts')
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
      const { error } = await supabase.from('vorsorge_contracts').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        provider: form.provider || null,
        contract_no: form.contract_no || null,
        contract_type: form.contract_type || null,
        person_id: form.person_id || null,
        start_date: form.start_date || null,
        premium: Number(form.premium) || null,
        payment_interval: (form.payment_interval as any) || null,
        status: form.status || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-vorsorge'] });
      toast.success('Vorsorgevertrag angelegt');
      setShowNew(false);
      setNewForm({ provider: '', contract_no: '', contract_type: '', person_id: '', start_date: '', premium: 0, payment_interval: 'monatlich', status: 'Aktiv', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const { id, created_at, updated_at, tenant_id, user_id, ...rest } = form;
      const { error } = await supabase.from('vorsorge_contracts').update({
        provider: rest.provider || null,
        contract_no: rest.contract_no || null,
        contract_type: rest.contract_type || null,
        person_id: rest.person_id || null,
        start_date: rest.start_date || null,
        premium: Number(rest.premium) || null,
        payment_interval: (rest.payment_interval as any) || null,
        status: rest.status || null,
        notes: rest.notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-vorsorge'] });
      toast.success('Vorsorgevertrag aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vorsorge_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-vorsorge'] });
      toast.success('Vorsorgevertrag gelöscht');
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

  const intervalLabel = (v: string) => INTERVALS.find(i => i.value === v)?.label || v;

  const VorsorgeFields = ({ form, onUpdate }: { form: Record<string, any>; onUpdate: (f: string, v: any) => void }) => (
    <div>
      <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <FormInput label="Anbieter" name="provider" value={form.provider || ''} onChange={e => onUpdate('provider', e.target.value)} />
        <FormInput label="Vertragsnummer" name="contract_no" value={form.contract_no || ''} onChange={e => onUpdate('contract_no', e.target.value)} />
        <div>
          <Label className="text-xs">Vertragsart</Label>
          <Select value={form.contract_type || ''} onValueChange={v => onUpdate('contract_type', v)}>
            <SelectTrigger><SelectValue placeholder="Art wählen" /></SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Person zuordnen</Label>
          <Select value={form.person_id || ''} onValueChange={v => onUpdate('person_id', v)}>
            <SelectTrigger><SelectValue placeholder="Person wählen" /></SelectTrigger>
            <SelectContent>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Beginn" name="start_date" type="date" value={form.start_date || ''} onChange={e => onUpdate('start_date', e.target.value)} />
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
        <FormInput label="Status" name="status" value={form.status || ''} onChange={e => onUpdate('status', e.target.value)} />
      </div>
      <div className="mt-3">
        <Label className="text-xs">Notizen</Label>
        <Textarea value={form.notes || ''} onChange={e => onUpdate('notes', e.target.value)} rows={2} className="mt-1" />
      </div>
    </div>
  );

  return (
    <PageShell>
      <ModulePageHeader title="Vorsorgeverträge" description="Renten- und Vorsorgeverträge zentral verwalten" />

      <div className={`${INFO_BANNER.BASE} ${INFO_BANNER.HINT} flex items-center gap-3`}>
        <Info className="h-5 w-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          DRV-Renteninformationen werden unter <strong>Übersicht → Personen</strong> gepflegt und hier referenziert.
        </p>
      </div>

      <div className={RECORD_CARD.GRID}>
        {contracts.map((c: any) => {
          const form = forms[c.id] || c;
          const personName = persons.find(p => p.id === c.person_id);
          return (
            <RecordCard
              key={c.id}
              id={c.id}
              entityType="vorsorge"
              isOpen={openCardId === c.id}
              onToggle={() => toggleCard(c.id)}
              glowVariant={getContractWidgetGlow(c.id) ?? undefined}
              title={c.provider || 'Anbieter'}
              subtitle={c.contract_no || undefined}
              badges={[
                ...(c.contract_type ? [{ label: c.contract_type, variant: 'secondary' as const }] : []),
                { label: c.status || 'Aktiv', variant: 'default' as const },
              ]}
              summary={[
                { label: 'Beitrag', value: `${fmt(c.premium || 0)} / ${intervalLabel(c.payment_interval || '')}` },
                ...(personName ? [{ label: 'Person', value: `${personName.first_name} ${personName.last_name}` }] : []),
              ]}
              tenantId={activeTenantId || undefined}
              onSave={() => updateMutation.mutate(form)}
              onDelete={() => deleteMutation.mutate(c.id)}
              saving={updateMutation.isPending}
            >
              <VorsorgeFields form={form} onUpdate={(f, v) => updateField(c.id, f, v)} />
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
              <p className="text-sm font-medium">Vorsorgevertrag hinzufügen</p>
            </div>
          </div>
        )}

        {showNew && (
          <div className={RECORD_CARD.OPEN}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Neuer Vorsorgevertrag</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Abbrechen</Button>
            </div>
            <div className="space-y-6">
              <VorsorgeFields form={newForm} onUpdate={(f, v) => setNewForm(prev => ({ ...prev, [f]: v }))} />
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

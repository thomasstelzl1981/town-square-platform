/**
 * MOD-18 Finanzen — Tab: Krankenversicherung (KV)
 * DB-backed CRUD — Pattern: SachversicherungenTab
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
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { cn } from '@/lib/utils';

const KV_TYPES = [
  { value: 'PKV', label: 'Privat (PKV)' },
  { value: 'GKV', label: 'Gesetzlich (GKV)' },
  { value: 'familienversichert', label: 'Familienversichert' },
] as const;

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

const kvLabel = (v: string) => KV_TYPES.find(t => t.value === v)?.label || v;

const EMPTY_FORM: Record<string, any> = {
  kv_type: 'PKV', person_name: '', provider: '', person_id: crypto.randomUUID(),
  monthly_premium: 0, employer_contribution: null, tariff_name: '', deductible: null,
  contract_start: '', insurance_number: '', notes: '',
  // PKV
  deductible_reduction_from_67: false, daily_sickness_benefit: null,
  dental_prosthetics_percent: null, single_room: false, chief_physician: false,
  ihl_outpatient_percent: null, ihl_inpatient_percent: null, ihl_vision_aid_budget: null,
  ihl_hearing_aid_budget: null, ihl_psychotherapy_sessions: null, ihl_rehabilitation: '',
  ihl_alternative_medicine: false,
  // GKV
  contribution_rate: '', income_threshold: null, gross_income: null,
  family_insured_children: null, sick_pay_from_day: null,
  // familienversichert
  insured_via_person_name: '', insured_until_age: null,
};

export default function KrankenversicherungTab() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const consentGuard = useLegalConsent();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({ ...EMPTY_FORM });

  const { data: rawContracts = [], isLoading } = useQuery({
    queryKey: ['fin-kv', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('kv_contracts')
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
      if (!consentGuard.requireConsent()) throw new Error('Consent required');
      if (!activeTenantId) throw new Error('No tenant');
      const { created_at, updated_at, id, ...rest } = form;
      const payload = {
        tenant_id: activeTenantId,
        person_id: rest.person_id || crypto.randomUUID(),
        person_name: rest.person_name || '',
        provider: rest.provider || '',
        kv_type: rest.kv_type || 'PKV',
        monthly_premium: Number(rest.monthly_premium) || null,
        employer_contribution: Number(rest.employer_contribution) || null,
        tariff_name: rest.tariff_name || null,
        deductible: Number(rest.deductible) || null,
        contract_start: rest.contract_start || null,
        insurance_number: rest.insurance_number || null,
        notes: rest.notes || null,
        daily_sickness_benefit: Number(rest.daily_sickness_benefit) || null,
        dental_prosthetics_percent: Number(rest.dental_prosthetics_percent) || null,
        single_room: !!rest.single_room,
        chief_physician: !!rest.chief_physician,
        deductible_reduction_from_67: !!rest.deductible_reduction_from_67,
        ihl_alternative_medicine: !!rest.ihl_alternative_medicine,
        ihl_outpatient_percent: Number(rest.ihl_outpatient_percent) || null,
        ihl_inpatient_percent: Number(rest.ihl_inpatient_percent) || null,
        ihl_vision_aid_budget: Number(rest.ihl_vision_aid_budget) || null,
        ihl_hearing_aid_budget: Number(rest.ihl_hearing_aid_budget) || null,
        ihl_psychotherapy_sessions: Number(rest.ihl_psychotherapy_sessions) || null,
        ihl_rehabilitation: rest.ihl_rehabilitation || null,
        contribution_rate: rest.contribution_rate || null,
        income_threshold: Number(rest.income_threshold) || null,
        gross_income: Number(rest.gross_income) || null,
        family_insured_children: Number(rest.family_insured_children) || null,
        sick_pay_from_day: Number(rest.sick_pay_from_day) || null,
        insured_via_person_name: rest.insured_via_person_name || null,
        insured_until_age: Number(rest.insured_until_age) || null,
      };
      const { error } = await supabase.from('kv_contracts').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-kv'] });
      toast.success('Krankenversicherung angelegt');
      setShowNew(false);
      setNewForm({ ...EMPTY_FORM, person_id: crypto.randomUUID() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!consentGuard.requireConsent()) throw new Error('Consent required');
      const { id, created_at, updated_at, tenant_id, premium_adjustments, ...rest } = form;
      const payload = {
        person_name: rest.person_name || '',
        provider: rest.provider || '',
        kv_type: rest.kv_type || 'PKV',
        monthly_premium: Number(rest.monthly_premium) || null,
        employer_contribution: Number(rest.employer_contribution) || null,
        tariff_name: rest.tariff_name || null,
        deductible: Number(rest.deductible) || null,
        contract_start: rest.contract_start || null,
        insurance_number: rest.insurance_number || null,
        notes: rest.notes || null,
        daily_sickness_benefit: Number(rest.daily_sickness_benefit) || null,
        dental_prosthetics_percent: Number(rest.dental_prosthetics_percent) || null,
        single_room: !!rest.single_room,
        chief_physician: !!rest.chief_physician,
        deductible_reduction_from_67: !!rest.deductible_reduction_from_67,
        ihl_alternative_medicine: !!rest.ihl_alternative_medicine,
        ihl_outpatient_percent: Number(rest.ihl_outpatient_percent) || null,
        ihl_inpatient_percent: Number(rest.ihl_inpatient_percent) || null,
        ihl_vision_aid_budget: Number(rest.ihl_vision_aid_budget) || null,
        ihl_hearing_aid_budget: Number(rest.ihl_hearing_aid_budget) || null,
        ihl_psychotherapy_sessions: Number(rest.ihl_psychotherapy_sessions) || null,
        ihl_rehabilitation: rest.ihl_rehabilitation || null,
        contribution_rate: rest.contribution_rate || null,
        income_threshold: Number(rest.income_threshold) || null,
        gross_income: Number(rest.gross_income) || null,
        family_insured_children: Number(rest.family_insured_children) || null,
        sick_pay_from_day: Number(rest.sick_pay_from_day) || null,
        insured_via_person_name: rest.insured_via_person_name || null,
        insured_until_age: Number(rest.insured_until_age) || null,
      };
      const { error } = await supabase.from('kv_contracts').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-kv'] });
      toast.success('Krankenversicherung aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!consentGuard.requireConsent()) throw new Error('Consent required');
      const { error } = await supabase.from('kv_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-kv'] });
      toast.success('Krankenversicherung gelöscht');
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

  // Type-specific fields renderer
  const renderTypeFields = (kvType: string, form: Record<string, any>, onUpdate: (f: string, v: any) => void) => {
    switch (kvType) {
      case 'PKV':
        return (
          <>
            <FormInput label="Tarif" name="tariff_name" value={form.tariff_name || ''} onChange={e => onUpdate('tariff_name', e.target.value)} />
            <FormInput label="Selbstbeteiligung (€)" name="deductible" type="number" value={form.deductible || ''} onChange={e => onUpdate('deductible', e.target.value)} />
            <FormInput label="AG-Anteil (€/mtl.)" name="employer_contribution" type="number" value={form.employer_contribution || ''} onChange={e => onUpdate('employer_contribution', e.target.value)} />
            <FormInput label="Krankentagegeld (€/Tag)" name="daily_sickness_benefit" type="number" value={form.daily_sickness_benefit || ''} onChange={e => onUpdate('daily_sickness_benefit', e.target.value)} />
            <FormInput label="Zahnersatz (%)" name="dental_prosthetics_percent" type="number" value={form.dental_prosthetics_percent || ''} onChange={e => onUpdate('dental_prosthetics_percent', e.target.value)} />
            <div className="flex items-center gap-2">
              <Switch checked={!!form.single_room} onCheckedChange={v => onUpdate('single_room', v)} />
              <Label className="text-xs">Einbettzimmer</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.chief_physician} onCheckedChange={v => onUpdate('chief_physician', v)} />
              <Label className="text-xs">Chefarztbehandlung</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.deductible_reduction_from_67} onCheckedChange={v => onUpdate('deductible_reduction_from_67', v)} />
              <Label className="text-xs">Beitragsentlastung ab 67</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.ihl_alternative_medicine} onCheckedChange={v => onUpdate('ihl_alternative_medicine', v)} />
              <Label className="text-xs">Alternativmedizin</Label>
            </div>
            <FormInput label="IHL ambulant (%)" name="ihl_outpatient_percent" type="number" value={form.ihl_outpatient_percent || ''} onChange={e => onUpdate('ihl_outpatient_percent', e.target.value)} />
            <FormInput label="IHL stationär (%)" name="ihl_inpatient_percent" type="number" value={form.ihl_inpatient_percent || ''} onChange={e => onUpdate('ihl_inpatient_percent', e.target.value)} />
            <FormInput label="Sehhilfen-Budget (€)" name="ihl_vision_aid_budget" type="number" value={form.ihl_vision_aid_budget || ''} onChange={e => onUpdate('ihl_vision_aid_budget', e.target.value)} />
            <FormInput label="Hörhilfen-Budget (€)" name="ihl_hearing_aid_budget" type="number" value={form.ihl_hearing_aid_budget || ''} onChange={e => onUpdate('ihl_hearing_aid_budget', e.target.value)} />
            <FormInput label="Psychotherapie (Sitzungen)" name="ihl_psychotherapy_sessions" type="number" value={form.ihl_psychotherapy_sessions || ''} onChange={e => onUpdate('ihl_psychotherapy_sessions', e.target.value)} />
            <FormInput label="Rehabilitation" name="ihl_rehabilitation" value={form.ihl_rehabilitation || ''} onChange={e => onUpdate('ihl_rehabilitation', e.target.value)} />
          </>
        );
      case 'GKV':
        return (
          <>
            <FormInput label="Beitragssatz" name="contribution_rate" value={form.contribution_rate || ''} onChange={e => onUpdate('contribution_rate', e.target.value)} />
            <FormInput label="AG-Anteil (€/mtl.)" name="employer_contribution" type="number" value={form.employer_contribution || ''} onChange={e => onUpdate('employer_contribution', e.target.value)} />
            <FormInput label="Bemessungsgrenze (€)" name="income_threshold" type="number" value={form.income_threshold || ''} onChange={e => onUpdate('income_threshold', e.target.value)} />
            <FormInput label="Bruttoeinkommen (€/mtl.)" name="gross_income" type="number" value={form.gross_income || ''} onChange={e => onUpdate('gross_income', e.target.value)} />
            <FormInput label="Familienversicherte Kinder" name="family_insured_children" type="number" value={form.family_insured_children || ''} onChange={e => onUpdate('family_insured_children', e.target.value)} />
            <FormInput label="Krankengeld ab Tag" name="sick_pay_from_day" type="number" value={form.sick_pay_from_day || ''} onChange={e => onUpdate('sick_pay_from_day', e.target.value)} />
          </>
        );
      case 'familienversichert':
        return (
          <>
            <FormInput label="Versichert über (Person)" name="insured_via_person_name" value={form.insured_via_person_name || ''} onChange={e => onUpdate('insured_via_person_name', e.target.value)} />
            <FormInput label="Versichert bis Alter" name="insured_until_age" type="number" value={form.insured_until_age || ''} onChange={e => onUpdate('insured_until_age', e.target.value)} />
          </>
        );
      default:
        return null;
    }
  };

  const KVFields = ({ form: f, onUpdate }: { form: Record<string, any>; onUpdate: (field: string, v: any) => void }) => (
    <>
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Stammdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <div>
            <Label className="text-xs">KV-Typ</Label>
            <Select value={f.kv_type || 'PKV'} onValueChange={v => onUpdate('kv_type', v)}>
              <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
              <SelectContent>
                {KV_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FormInput label="Person" name="person_name" value={f.person_name || ''} onChange={e => onUpdate('person_name', e.target.value)} />
          <FormInput label="Versicherer / Kasse" name="provider" value={f.provider || ''} onChange={e => onUpdate('provider', e.target.value)} />
          <FormInput label="Versicherungsnr." name="insurance_number" value={f.insurance_number || ''} onChange={e => onUpdate('insurance_number', e.target.value)} />
          <FormInput label="Monatsbeitrag (€)" name="monthly_premium" type="number" value={f.monthly_premium || ''} onChange={e => onUpdate('monthly_premium', e.target.value)} />
          <FormInput label="Vertragsbeginn" name="contract_start" type="date" value={f.contract_start || ''} onChange={e => onUpdate('contract_start', e.target.value)} />
        </div>
      </div>
      {f.kv_type && (
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>{kvLabel(f.kv_type)} — Details</p>
          <div className={RECORD_CARD.FIELD_GRID}>
            {renderTypeFields(f.kv_type, f, onUpdate)}
          </div>
        </div>
      )}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Notizen</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Notizen" name="notes" value={f.notes || ''} onChange={e => onUpdate('notes', e.target.value)} />
        </div>
      </div>
    </>
  );

  const selectedContract = contracts.find((c: any) => c.id === selectedId);
  const form = selectedId ? (forms[selectedId] || selectedContract) : null;

  return (
    <PageShell>
      <ModulePageHeader
        title="Krankenversicherung"
        description="PKV & GKV Übersicht für alle Haushaltsmitglieder"
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
                    <Badge variant="secondary" className="text-[10px]">{kvLabel(c.kv_type)}</Badge>
                  </div>
                  <div className={HEADER.WIDGET_ICON_BOX}>
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>{c.person_name}</h4>
                  <p className="text-xs text-muted-foreground">{c.provider}</p>
                  {c.insurance_number && <p className="text-[10px] text-muted-foreground/70">{c.insurance_number}</p>}
                </div>
                <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beitrag</span>
                    <span className="font-semibold">{fmt(c.monthly_premium || 0)}</span>
                  </div>
                  {c.employer_contribution && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">AG-Anteil</span>
                      <span>{fmt(c.employer_contribution)}</span>
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
            <h2 className="text-lg font-semibold">{form.person_name} — {kvLabel(form.kv_type)}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-6">
            <KVFields
              form={form}
              onUpdate={(f, v) => updateField(selectedId, f, v)}
            />
          </div>
          <div className={RECORD_CARD.ACTIONS}>
            {!isDemoId(selectedId) && (
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedId)}>Löschen</Button>
            )}
            <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>Speichern</Button>
          </div>
        </Card>
      )}

      {/* New form below grid */}
      {showNew && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Neue Krankenversicherung</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Abbrechen</Button>
          </div>
          <div className="space-y-6">
            <KVFields
              form={newForm}
              onUpdate={(f, v) => setNewForm(prev => ({ ...prev, [f]: v }))}
            />
          </div>
          <div className={RECORD_CARD.ACTIONS}>
            <Button size="sm" onClick={() => createMutation.mutate(newForm)} disabled={createMutation.isPending}>Speichern</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}

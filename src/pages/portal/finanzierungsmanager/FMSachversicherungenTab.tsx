/**
 * FMSachversicherungenTab — MOD-11 Menu (3) SACHVERSICHERUNGEN
 * SSOT für alle Versicherungen. RecordCard-Pattern mit kategoriespezifischen Feldern.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { FormInput } from '@/components/shared';
import { useInsuranceContracts, useInsuranceContractMutations } from '@/hooks/useFinanzmanagerData';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Shield } from 'lucide-react';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'haftpflicht', label: 'Haftpflicht' },
  { value: 'hausrat', label: 'Hausrat' },
  { value: 'wohngebaeude', label: 'Wohngebäude' },
  { value: 'rechtsschutz', label: 'Rechtsschutz' },
  { value: 'kfz', label: 'KFZ' },
  { value: 'unfall', label: 'Unfall' },
  { value: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit' },
  { value: 'sonstige', label: 'Sonstige' },
];

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
];

const STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv', gekuendigt: 'Gekündigt', ruhend: 'Ruhend', auslaufend: 'Auslaufend',
};

/** Category-specific fields config */
const CATEGORY_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  haftpflicht: [
    { key: 'coverage_amount', label: 'Deckungssumme (€)', type: 'number' },
    { key: 'deductible', label: 'Selbstbeteiligung (€)', type: 'number' },
    { key: 'insured_persons', label: 'Mitversicherte Personen', type: 'number' },
  ],
  hausrat: [
    { key: 'sum_insured', label: 'Versicherungssumme (€)', type: 'number' },
    { key: 'living_area', label: 'Wohnfläche (qm)', type: 'number' },
    { key: 'elemental', label: 'Elementar' },
  ],
  wohngebaeude: [
    { key: 'object_ref', label: 'Objekt-Referenz' },
    { key: 'living_area', label: 'Wohnfläche (qm)', type: 'number' },
    { key: 'elemental', label: 'Elementar' },
  ],
  rechtsschutz: [
    { key: 'scope_privat', label: 'Privat' },
    { key: 'scope_beruf', label: 'Beruf' },
    { key: 'scope_verkehr', label: 'Verkehr' },
    { key: 'scope_miete', label: 'Miete' },
    { key: 'deductible', label: 'Selbstbeteiligung (€)', type: 'number' },
  ],
  kfz: [
    { key: 'vehicle_ref', label: 'Fahrzeug-Referenz' },
    { key: 'kasko_type', label: 'Kasko-Typ' },
    { key: 'deductible', label: 'Selbstbeteiligung (€)', type: 'number' },
  ],
  unfall: [],
  berufsunfaehigkeit: [],
  sonstige: [],
};

function InsuranceRecordCard({ contract, onUpdate, onDelete }: {
  contract: any;
  onUpdate: (values: any) => void;
  onDelete: (id: string) => void;
}) {
  const { activeTenantId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    ...contract,
    details: contract.details || {},
  }));

  const set = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));
  const setDetail = (k: string, v: any) => setForm((prev: any) => ({
    ...prev,
    details: { ...prev.details, [k]: v },
  }));

  const catLabel = CATEGORIES.find(c => c.value === contract.category)?.label || contract.category || '';
  const intervalLabel = INTERVALS.find(i => i.value === contract.payment_interval)?.label || '';

  const categoryFields = CATEGORY_FIELDS[form.category] || [];

  return (
    <RecordCard
      id={contract.id}
      entityType="insurance"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={`${contract.insurer || 'Unbekannt'} — ${catLabel}`}
      subtitle={catLabel}
      summary={[
        ...(contract.premium ? [{ label: 'Beitrag', value: `${contract.premium} € / ${intervalLabel}` }] : []),
        ...(contract.policy_no ? [{ label: 'Police', value: contract.policy_no }] : []),
        ...(contract.policyholder ? [{ label: 'VN', value: contract.policyholder }] : []),
      ]}
      badges={[
        { label: catLabel, variant: 'outline' as const },
        { label: STATUS_LABELS[contract.status] || contract.status || 'Aktiv', variant: contract.status === 'aktiv' ? 'default' as const : 'secondary' as const },
      ]}
      tenantId={activeTenantId || undefined}
      onSave={() => onUpdate(form)}
      onDelete={() => onDelete(contract.id)}
      saving={false}
    >
      {/* Universal Fields */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.category || ''} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <FormInput label="Versicherer" name="insurer" value={form.insurer || ''} onChange={e => set('insurer', e.target.value)} />
          <FormInput label="Policen-Nr." name="policy_no" value={form.policy_no || ''} onChange={e => set('policy_no', e.target.value)} />
          <FormInput label="Versicherungsnehmer" name="policyholder" value={form.policyholder || ''} onChange={e => set('policyholder', e.target.value)} />
          <FormInput label="Beginn" name="start_date" type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
          <FormInput label="Ablauf" name="end_date" type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} />
          <FormInput label="Kündigungsfrist" name="cancellation_deadline" value={form.cancellation_deadline || ''} onChange={e => set('cancellation_deadline', e.target.value)} placeholder="z.B. 3 Monate" />
          <FormInput label="Beitrag (€)" name="premium" type="number" value={form.premium || ''} onChange={e => set('premium', e.target.value)} />
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Intervall</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.payment_interval || 'monatlich'} onChange={e => set('payment_interval', e.target.value)}>
              {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Status</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.status || 'aktiv'} onChange={e => set('status', e.target.value)}>
              <option value="aktiv">Aktiv</option>
              <option value="gekuendigt">Gekündigt</option>
              <option value="ruhend">Ruhend</option>
              <option value="auslaufend">Auslaufend</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category-specific fields */}
      {categoryFields.length > 0 && (
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>Kategorie-spezifisch ({catLabel})</p>
          <div className={RECORD_CARD.FIELD_GRID}>
            {categoryFields.map(field => {
              // Toggle fields for boolean
              if (field.key === 'elemental' || field.key.startsWith('scope_')) {
                return (
                  <div key={field.key} className="flex items-center gap-3 pt-5">
                    <Switch
                      checked={!!form.details?.[field.key]}
                      onCheckedChange={v => setDetail(field.key, v)}
                    />
                    <label className="text-sm">{field.label}</label>
                  </div>
                );
              }
              // Kasko type dropdown
              if (field.key === 'kasko_type') {
                return (
                  <div key={field.key}>
                    <label className={DESIGN.TYPOGRAPHY.LABEL}>{field.label}</label>
                    <select className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                      value={form.details?.kasko_type || ''}
                      onChange={e => setDetail('kasko_type', e.target.value)}>
                      <option value="">— wählen —</option>
                      <option value="teilkasko">Teilkasko</option>
                      <option value="vollkasko">Vollkasko</option>
                    </select>
                  </div>
                );
              }
              return (
                <FormInput
                  key={field.key}
                  label={field.label}
                  name={field.key}
                  type={field.type || 'text'}
                  value={form.details?.[field.key] || ''}
                  onChange={e => setDetail(field.key, e.target.value)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Notizen</p>
        <textarea
          className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm bg-background resize-y"
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Interne Notizen..."
        />
      </div>
    </RecordCard>
  );
}

export default function FMSachversicherungenTab() {
  const { data: contracts = [], isLoading } = useInsuranceContracts();
  const { create, update, remove } = useInsuranceContractMutations();
  const [showNew, setShowNew] = useState(false);
  const [newCategory, setNewCategory] = useState('haftpflicht');
  const [newForm, setNewForm] = useState<Record<string, any>>({ category: 'haftpflicht', payment_interval: 'monatlich', status: 'aktiv', details: {} });

  const handleCreate = () => {
    create.mutate(newForm);
    setShowNew(false);
    setNewForm({ category: 'haftpflicht', payment_interval: 'monatlich', status: 'aktiv', details: {} });
  };

  return (
    <PageShell>
      <ModulePageHeader title="SACHVERSICHERUNGEN" />

      {isLoading ? (
        <div className={RECORD_CARD.GRID}>
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      ) : (
        <div className={RECORD_CARD.GRID}>
          {contracts.map((c: any) => (
            <InsuranceRecordCard
              key={c.id}
              contract={c}
              onUpdate={(values) => update.mutate(values)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}

          {/* New Insurance Form */}
          {showNew ? (
            <div className={cn(RECORD_CARD.OPEN)}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Neue Versicherung</h2>
                </div>
              </div>

              <div className={RECORD_CARD.FIELD_GRID}>
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie *</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.category} onChange={e => {
                    setNewCategory(e.target.value);
                    setNewForm(prev => ({ ...prev, category: e.target.value }));
                  }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <FormInput label="Versicherer" name="insurer" value={newForm.insurer || ''} onChange={e => setNewForm(prev => ({ ...prev, insurer: e.target.value }))} />
                <FormInput label="Policen-Nr." name="policy_no" value={newForm.policy_no || ''} onChange={e => setNewForm(prev => ({ ...prev, policy_no: e.target.value }))} />
                <FormInput label="Versicherungsnehmer" name="policyholder" value={newForm.policyholder || ''} onChange={e => setNewForm(prev => ({ ...prev, policyholder: e.target.value }))} />
                <FormInput label="Beginn" name="start_date" type="date" value={newForm.start_date || ''} onChange={e => setNewForm(prev => ({ ...prev, start_date: e.target.value }))} />
                <FormInput label="Beitrag (€)" name="premium" type="number" value={newForm.premium || ''} onChange={e => setNewForm(prev => ({ ...prev, premium: e.target.value }))} />
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Intervall</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.payment_interval || 'monatlich'} onChange={e => setNewForm(prev => ({ ...prev, payment_interval: e.target.value }))}>
                    {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={RECORD_CARD.ACTIONS}>
                <Button size="sm" variant="outline" onClick={() => { setShowNew(false); setNewForm({ category: 'haftpflicht', payment_interval: 'monatlich', status: 'aktiv', details: {} }); }}>Abbrechen</Button>
                <Button size="sm" onClick={handleCreate}>Anlegen</Button>
              </div>
            </div>
          ) : (
            /* CTA Widget */
            <div
              className={cn(RECORD_CARD.CLOSED, 'border-dashed border-2 border-primary/20')}
              onClick={() => setShowNew(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setShowNew(true)}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Versicherung hinzufügen</span>
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

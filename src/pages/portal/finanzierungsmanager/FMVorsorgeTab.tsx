/**
 * FMVorsorgeTab — MOD-11 Menu (4) VORSORGEVERTRÄGE
 * RecordCard-Pattern: Geschlossen = quadratisches Widget, Offen = volle Breite
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { FormInput } from '@/components/shared';
import { useVorsorgeContracts, useVorsorgeContractMutations } from '@/hooks/useFinanzmanagerData';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, HeartPulse, Info } from 'lucide-react';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
];

const CONTRACT_TYPES = [
  { value: 'bav', label: 'bAV' },
  { value: 'riester', label: 'Riester' },
  { value: 'ruerup', label: 'Rürup' },
  { value: 'versorgungswerk', label: 'Versorgungswerk' },
  { value: 'privat', label: 'Privat' },
  { value: 'sonstige', label: 'Sonstige' },
];

function useHouseholdPersons() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['household_persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('household_persons').select('id, first_name, last_name, role').eq('tenant_id', activeTenantId).order('role');
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

function VorsorgeRecordCard({ contract, persons, onUpdate, onDelete }: {
  contract: any;
  persons: any[];
  onUpdate: (values: any) => void;
  onDelete: (id: string) => void;
}) {
  const { activeTenantId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(contract);
  const [hasChanges, setHasChanges] = useState(false);

  const set = (k: string, v: any) => {
    setForm((prev: any) => ({ ...prev, [k]: v }));
    setHasChanges(true);
  };

  const typeLabel = CONTRACT_TYPES.find(t => t.value === contract.contract_type)?.label || contract.contract_type || '';
  const intervalLabel = INTERVALS.find(i => i.value === contract.payment_interval)?.label || contract.payment_interval || '';
  const personName = persons.find(p => p.id === contract.person_id);
  const personLabel = personName ? `${personName.first_name} ${personName.last_name}` : '';

  return (
    <RecordCard
      id={contract.id}
      entityType="vorsorge"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={contract.provider || 'Unbekannt'}
      subtitle={typeLabel}
      summary={[
        ...(contract.premium ? [{ label: 'Beitrag', value: `${contract.premium} € / ${intervalLabel}` }] : []),
        ...(personLabel ? [{ label: 'Person', value: personLabel }] : []),
        ...(contract.contract_no ? [{ label: 'Vertragsnr.', value: contract.contract_no }] : []),
      ]}
      badges={[
        ...(typeLabel ? [{ label: typeLabel, variant: 'outline' as const }] : []),
        { label: contract.status || 'aktiv', variant: contract.status === 'aktiv' ? 'default' as const : 'secondary' as const },
      ]}
      tenantId={activeTenantId || undefined}
      onSave={() => { onUpdate(form); setHasChanges(false); }}
      onDelete={() => onDelete(contract.id)}
      saving={false}
    >
      {/* Vertragsdaten */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Anbieter" name="provider" value={form.provider || ''} onChange={e => set('provider', e.target.value)} />
          <FormInput label="Vertragsnummer" name="contract_no" value={form.contract_no || ''} onChange={e => set('contract_no', e.target.value)} />
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Vertragsart</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.contract_type || ''} onChange={e => set('contract_type', e.target.value)}>
              <option value="">— wählen —</option>
              {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Person</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.person_id || ''} onChange={e => set('person_id', e.target.value)}>
              <option value="">— keine Zuordnung —</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <FormInput label="Beginn" name="start_date" type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
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

      {/* DRV Referenz Banner */}
      <div className={cn(DESIGN.INFO_BANNER.BASE, DESIGN.INFO_BANNER.HINT, 'flex items-start gap-3')}>
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          DRV-Renteninformationen werden unter <strong>Übersicht → Personen</strong> gepflegt und dort zentral verwaltet.
        </p>
      </div>

      {/* Notizen */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Notizen</p>
        <textarea
          className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm bg-background resize-y"
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Interne Notizen zum Vertrag..."
        />
      </div>
    </RecordCard>
  );
}

export default function FMVorsorgeTab() {
  const { data: contracts = [], isLoading } = useVorsorgeContracts();
  const { create, update, remove } = useVorsorgeContractMutations();
  const { data: persons = [] } = useHouseholdPersons();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({ payment_interval: 'monatlich', status: 'aktiv' });

  const handleCreate = () => {
    create.mutate(newForm);
    setShowNew(false);
    setNewForm({ payment_interval: 'monatlich', status: 'aktiv' });
  };

  return (
    <PageShell>
      <ModulePageHeader title="VORSORGEVERTRÄGE" />

      {isLoading ? (
        <div className={RECORD_CARD.GRID}>
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      ) : (
        <div className={RECORD_CARD.GRID}>
          {contracts.map((c: any) => (
            <VorsorgeRecordCard
              key={c.id}
              contract={c}
              persons={persons}
              onUpdate={(values) => update.mutate(values)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}

          {/* New Contract Form as open RecordCard */}
          {showNew ? (
            <div className={cn(RECORD_CARD.OPEN)}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <HeartPulse className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Neuer Vorsorgevertrag</h2>
                </div>
              </div>
              <div className={RECORD_CARD.FIELD_GRID}>
                <FormInput label="Anbieter" name="provider" value={newForm.provider || ''} onChange={e => setNewForm(prev => ({ ...prev, provider: e.target.value }))} />
                <FormInput label="Vertragsnummer" name="contract_no" value={newForm.contract_no || ''} onChange={e => setNewForm(prev => ({ ...prev, contract_no: e.target.value }))} />
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Vertragsart</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.contract_type || ''} onChange={e => setNewForm(prev => ({ ...prev, contract_type: e.target.value }))}>
                    <option value="">— wählen —</option>
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Person</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.person_id || ''} onChange={e => setNewForm(prev => ({ ...prev, person_id: e.target.value }))}>
                    <option value="">— keine Zuordnung —</option>
                    {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                </div>
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
                <Button size="sm" variant="outline" onClick={() => { setShowNew(false); setNewForm({ payment_interval: 'monatlich', status: 'aktiv' }); }}>Abbrechen</Button>
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
                <span className="text-sm font-medium">Vorsorgevertrag hinzufügen</span>
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

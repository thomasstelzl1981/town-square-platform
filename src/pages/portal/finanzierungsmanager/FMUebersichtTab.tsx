/**
 * FMUebersichtTab — MOD-11 Menu (1) ÜBERSICHT
 * Block A: Personen im Haushalt (RecordCard)
 * Block B: Konten (RecordCard)
 * Block C: 12M Scan Button
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { FormInput } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, User, CreditCard, ScanSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';

// ─── Hooks ────────────────────────────────────────────────
function useHouseholdPersons() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['household_persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('household_persons').select('*').eq('tenant_id', activeTenantId).order('role');
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

function usePensionRecords() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pension_records', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('pension_records').select('*').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

const ROLES = [
  { value: 'hauptperson', label: 'Hauptperson' },
  { value: 'partner', label: 'Partner' },
  { value: 'kind', label: 'Kind' },
  { value: 'weitere', label: 'Weitere' },
];

// ─── Person RecordCard ────────────────────────────────────
function PersonRecordCard({ person, pensionRecords, onUpdate, onDelete }: {
  person: any;
  pensionRecords: any[];
  onUpdate: (p: any) => void;
  onDelete: (id: string) => void;
}) {
  const { activeTenantId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(person);
  const set = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  const personPensions = pensionRecords.filter(p => p.person_id === person.id);
  const roleLabel = ROLES.find(r => r.value === person.role)?.label || person.role || '';
  const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Neue Person';

  return (
    <RecordCard
      id={person.id}
      entityType="person"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={fullName}
      subtitle={roleLabel}
      summary={[
        ...(person.birth_date ? [{ label: 'Geb.', value: person.birth_date }] : []),
        ...(person.email ? [{ label: 'E-Mail', value: person.email }] : []),
        ...(person.phone ? [{ label: 'Mobil', value: person.phone }] : []),
      ]}
      badges={[
        { label: roleLabel, variant: 'outline' as const },
      ]}
      tenantId={activeTenantId || undefined}
      onSave={() => onUpdate(form)}
      onDelete={() => onDelete(person.id)}
      saving={false}
    >
      {/* Persönliche Daten */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Persönliche Daten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Rolle</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.role || ''} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <FormInput label="Anrede" name="salutation" value={form.salutation || ''} onChange={e => set('salutation', e.target.value)} />
          <FormInput label="Vorname" name="first_name" value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} />
          <FormInput label="Nachname" name="last_name" value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} />
          <FormInput label="Geburtsdatum" name="birth_date" type="date" value={form.birth_date || ''} onChange={e => set('birth_date', e.target.value)} />
          <FormInput label="E-Mail" name="email" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          <FormInput label="Mobil" name="phone" type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>

      {/* Adresse */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Adresse</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Straße" name="street" value={form.street || ''} onChange={e => set('street', e.target.value)} />
          <FormInput label="PLZ" name="postal_code" value={form.postal_code || ''} onChange={e => set('postal_code', e.target.value)} />
          <FormInput label="Ort" name="city" value={form.city || ''} onChange={e => set('city', e.target.value)} />
        </div>
      </div>

      {/* DRV Renteninformation */}
      {personPensions.length > 0 && (
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>DRV Renteninformation</p>
          {personPensions.map((pr: any) => (
            <div key={pr.id} className={cn(RECORD_CARD.FIELD_GRID, 'bg-muted/20 rounded-lg p-4')}>
              <FormInput label="Datum der Info" name="info_date" type="date" value={pr.info_date || ''} disabled />
              <FormInput label="Regelaltersrente (€)" name="regular_pension" type="number" value={pr.regular_pension || ''} disabled />
              <FormInput label="Künftige Rente (€)" name="future_pension_no_adj" type="number" value={pr.future_pension_no_adj || ''} disabled />
              <FormInput label="Erwerbsminderung (€)" name="disability_pension" type="number" value={pr.disability_pension || ''} disabled />
            </div>
          ))}
        </div>
      )}
    </RecordCard>
  );
}

// ─── Bank Account RecordCard ──────────────────────────────
function BankAccountRecordCard({ account }: { account: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const maskedIban = account.iban ? `****${account.iban.slice(-4)}` : '—';
  const displayName = account.custom_name || `${account.bank_name || 'Konto'} • ${maskedIban}`;

  return (
    <RecordCard
      id={account.id}
      entityType="bank_account"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={displayName}
      subtitle={account.account_type || 'Giro'}
      summary={[
        { label: 'Bank', value: account.bank_name || '—' },
        { label: 'IBAN', value: maskedIban },
        ...(account.balance != null ? [{ label: 'Saldo', value: `${account.balance} €` }] : []),
      ]}
      badges={[
        { label: account.account_type || 'Giro', variant: 'outline' as const },
        { label: account.status === 'active' ? 'OK' : account.status || 'Unbekannt', variant: account.status === 'active' ? 'default' as const : 'secondary' as const },
      ]}
    >
      {/* Kontodaten (READ-ONLY) */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Kontodaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Bankname" name="bank_name" value={account.bank_name || ''} disabled />
          <FormInput label="IBAN" name="iban" value={maskedIban} disabled />
          <FormInput label="BIC" name="bic" value={account.bic || ''} disabled />
          <FormInput label="Inhaber" name="account_holder" value={account.account_holder || ''} disabled />
          <FormInput label="Provider" name="provider" value="FinAPI" disabled />
        </div>
      </div>

      {/* Umsätze Placeholder */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Umsätze (12 Monate)</p>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Umsatzdaten werden über FinAPI geladen.</p>
      </div>
    </RecordCard>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function FMUebersichtTab() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();
  const { data: persons = [], isLoading: loadingPersons } = useHouseholdPersons();
  const { data: pensionRecords = [] } = usePensionRecords();
  const [showNewPerson, setShowNewPerson] = useState(false);

  const { data: bankAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['msv_bank_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('msv_bank_accounts').select('*').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const addPerson = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await supabase.from('household_persons').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        role: 'weitere',
        first_name: '',
        last_name: '',
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['household_persons'] }); toast.success('Person hinzugefügt'); },
  });

  const updatePerson = useMutation({
    mutationFn: async (person: any) => {
      const { id, created_at, updated_at, ...rest } = person;
      const { error } = await supabase.from('household_persons').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['household_persons'] }); toast.success('Gespeichert'); },
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('household_persons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['household_persons'] }); toast.success('Person entfernt'); },
  });

  return (
    <PageShell>
      <ModulePageHeader title="ÜBERSICHT" />

      {/* ═══ BLOCK A — Personen im Haushalt ═══ */}
      <div className="space-y-3">
        <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Personen im Haushalt</h2>

        {loadingPersons ? (
          <div className={RECORD_CARD.GRID}>
            <Skeleton className="h-[260px] rounded-xl" />
            <Skeleton className="h-[260px] rounded-xl" />
          </div>
        ) : (
          <div className={RECORD_CARD.GRID}>
            {persons.map((p: any) => (
              <PersonRecordCard
                key={p.id}
                person={p}
                pensionRecords={pensionRecords}
                onUpdate={(updated) => updatePerson.mutate(updated)}
                onDelete={(id) => deletePerson.mutate(id)}
              />
            ))}

            {/* CTA Widget: + Person */}
            <div
              className={cn(RECORD_CARD.CLOSED, 'border-dashed border-2 border-primary/20')}
              onClick={() => addPerson.mutate()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && addPerson.mutate()}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Person hinzufügen</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ BLOCK B — Konten ═══ */}
      <div className="space-y-3">
        <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Konten</h2>

        {loadingAccounts ? (
          <div className={RECORD_CARD.GRID}>
            <Skeleton className="h-[260px] rounded-xl" />
          </div>
        ) : bankAccounts.length === 0 ? (
          <Card className="glass-card border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-40" />
              Keine Bankkonten verbunden. Verbinde deine Konten über FinAPI.
            </CardContent>
          </Card>
        ) : (
          <div className={RECORD_CARD.GRID}>
            {bankAccounts.map((acc: any) => (
              <BankAccountRecordCard key={acc.id} account={acc} />
            ))}
          </div>
        )}
      </div>

      {/* ═══ BLOCK C — 12M Scan ═══ */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
            <ScanSearch className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Umsätze (12 Monate) auslesen & Verträge erkennen</h3>
            <p className={DESIGN.TYPOGRAPHY.MUTED}>
              Analysiert Ihre Kontoumsätze und erkennt automatisch Abonnements, Versicherungen und Vorsorgeverträge.
            </p>
          </div>
          <Button disabled={bankAccounts.length === 0} className="gap-2">
            <ScanSearch className="h-4 w-4" />
            Scan starten
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

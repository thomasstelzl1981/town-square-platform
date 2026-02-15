/**
 * FMUebersichtTab — MOD-11 Menu (1) ÜBERSICHT
 * Block A: Personen im Haushalt (Accordion, editierbar, DRV)
 * Block B: Konten (FinAPI read-only + editierbare Meta)
 * Block C: 12M Scan Button
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, User, CreditCard, ScanSearch, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';

// ─── Personen Hook (shared with MOD-18) ───────────────────
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

// ─── Person Card ──────────────────────────────────────────
function PersonCard({ person, pensionRecords, onUpdate, onDelete }: {
  person: any;
  pensionRecords: any[];
  onUpdate: (p: any) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(person);
  const personPensions = pensionRecords.filter(p => p.person_id === person.id);

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  const roleLabel = { hauptperson: 'Hauptperson', partner: 'Partner', kind: 'Kind', weitere: 'Weitere' }[person.role as string] || person.role;

  return (
    <AccordionItem value={person.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">
              {person.first_name} {person.last_name}
            </span>
            <Badge variant="outline" className="ml-2 text-[10px]">{roleLabel}</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Rolle</Label>
                <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="hauptperson">Hauptperson</option>
                  <option value="partner">Partner</option>
                  <option value="kind">Kind</option>
                  <option value="weitere">Weitere</option>
                </select>
              </div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Anrede</Label><Input value={form.salutation || ''} onChange={e => setForm({ ...form, salutation: e.target.value })} /></div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Vorname</Label><Input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Nachname</Label><Input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Geburtsdatum</Label><Input type="date" value={form.birth_date || ''} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>E-Mail</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Mobil</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {person.birth_date && <div><span className="text-muted-foreground">Geb.:</span> {person.birth_date}</div>}
              {person.email && <div><span className="text-muted-foreground">E-Mail:</span> {person.email}</div>}
              {person.phone && <div><span className="text-muted-foreground">Mobil:</span> {person.phone}</div>}
            </div>
          )}

          {/* DRV Renteninformation */}
          {personPensions.length > 0 && (
            <>
              <Separator />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DRV Renteninformation</h4>
              {personPensions.map((pr: any) => (
                <div key={pr.id} className="grid grid-cols-2 gap-2 text-sm bg-muted/20 rounded-lg p-3">
                  <div><span className="text-muted-foreground">Datum:</span> {pr.info_date || '—'}</div>
                  <div><span className="text-muted-foreground">Regelaltersrente:</span> {pr.regular_pension ? `${pr.regular_pension} €` : '—'}</div>
                  <div><span className="text-muted-foreground">Künftige Rente:</span> {pr.future_pension_no_adj ? `${pr.future_pension_no_adj} €` : '—'}</div>
                  <div><span className="text-muted-foreground">Erwerbsminderung:</span> {pr.disability_pension ? `${pr.disability_pension} €` : '—'}</div>
                </div>
              ))}
            </>
          )}

          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}>Speichern</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm(person); }}>Abbrechen</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Bearbeiten</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(person.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Bank Account Widget ──────────────────────────────────
function BankAccountWidget({ account }: { account: any }) {
  const maskedIban = account.iban ? `****${account.iban.slice(-4)}` : '—';

  return (
    <AccordionItem value={account.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-sm">{account.bank_name || 'Konto'} • {maskedIban}</span>
            <div className="flex gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px]">{account.account_type || 'Giro'}</Badge>
              <Badge variant={account.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {account.status === 'active' ? 'OK' : account.status || 'Unbekannt'}
              </Badge>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Bank:</span> {account.bank_name || '—'}</div>
            <div><span className="text-muted-foreground">IBAN:</span> {maskedIban}</div>
            <div><span className="text-muted-foreground">BIC:</span> {account.bic || '—'}</div>
            <div><span className="text-muted-foreground">Inhaber:</span> {account.account_holder || '—'}</div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">Umsätze (12 Monate) — Daten werden über FinAPI geladen.</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function FMUebersichtTab() {
  const { activeTenantId, user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: persons = [], isLoading: loadingPersons } = useHouseholdPersons();
  const { data: pensionRecords = [] } = usePensionRecords();

  // Bank accounts
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

      {/* BLOCK A — Personen im Haushalt */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Personen im Haushalt</h2>
          <Button size="sm" variant="outline" onClick={() => addPerson.mutate()} disabled={addPerson.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Person hinzufügen
          </Button>
        </div>

        {loadingPersons ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : persons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              Noch keine Personen im Haushalt. Füge die erste Person hinzu.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {persons.map((p: any) => (
              <PersonCard
                key={p.id}
                person={p}
                pensionRecords={pensionRecords}
                onUpdate={(updated) => updatePerson.mutate(updated)}
                onDelete={(id) => deletePerson.mutate(id)}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* BLOCK B — Konten (verwaltet in Finanzanalyse) */}
      <div className="space-y-3">
        <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Konten</h2>
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm font-medium">Konten werden in der Finanzanalyse verwaltet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.href = '/portal/finanzanalyse/dashboard'}>
              Zur Finanzanalyse →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* BLOCK C — 12M Scan */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ScanSearch className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-semibold">Umsätze (12 Monate) auslesen & Verträge erkennen</h3>
            <p className="text-sm text-muted-foreground">Analysiert Ihre Kontoumsätze und erkennt automatisch Abonnements, Versicherungen und Vorsorgeverträge.</p>
          </div>
          <Button disabled={bankAccounts.length === 0}>
            <ScanSearch className="h-4 w-4 mr-2" />
            Scan starten
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

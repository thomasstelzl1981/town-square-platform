/**
 * MOD-18 Finanzen — Tab 1: ÜBERSICHT
 * Block A: Personen im Haushalt (RecordCard)
 * Block B: Konten (RecordCard) 
 * Block C: 12M Scan Button
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { RECORD_CARD, DEMO_WIDGET } from '@/config/designManifest';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { usePersonDMS } from '@/hooks/usePersonDMS';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KontoAkteInline } from '@/components/finanzanalyse/KontoAkteInline';
import { DEMO_KONTO, DEMO_KONTO_IBAN_MASKED } from '@/constants/demoKontoData';
import {
  Users, UserPlus, Landmark, ScanSearch, Plus,
  Calendar, Mail, Phone, MapPin, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MARITAL_OPTIONS = [
  { value: 'ledig', label: 'Ledig' },
  { value: 'verheiratet', label: 'Verheiratet' },
  { value: 'geschieden', label: 'Geschieden' },
  { value: 'verwitwet', label: 'Verwitwet' },
  { value: 'eingetragene_lebenspartnerschaft', label: 'Eingetr. Lebenspartnerschaft' },
];

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

const ROLE_OPTIONS = [
  { value: 'hauptperson', label: 'Hauptperson' },
  { value: 'partner', label: 'Partner/in' },
  { value: 'kind', label: 'Kind' },
  { value: 'weitere', label: 'Weitere' },
];

const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson',
  partner: 'Partner/in',
  kind: 'Kind',
  weitere: 'Weitere',
};

// ─── Konten Block (Widget-Grid mit Demo + echte Konten) ───
function KontenBlock() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const [openKontoId, setOpenKontoId] = useState<string | null>(null);

  const { data: bankAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['msv_bank_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('msv_bank_accounts').select('*').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const showDemo = isEnabled('GP-KONTEN');

  const maskIban = (iban: string) => iban ? `${iban.slice(0, 9)} ••••` : '—';

  return (
    <>
      {/* ═══ BLOCK B: Konten ═══ */}
      <div className="flex items-center justify-between mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Konten
        </h3>
      </div>

      <WidgetGrid>
        {/* Demo Widget Position 0 */}
        {showDemo && (
          <WidgetCell>
            <div
              className={cn(
                'h-full w-full rounded-xl cursor-pointer transition-all',
                DEMO_WIDGET.CARD,
                DEMO_WIDGET.HOVER,
                openKontoId === DEMO_KONTO.id && 'ring-2 ring-primary/50',
              )}
              onClick={() => setOpenKontoId(openKontoId === DEMO_KONTO.id ? null : DEMO_KONTO.id)}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <Badge className={DEMO_WIDGET.BADGE + ' mb-2'}>Demo</Badge>
                  <h4 className="font-semibold text-sm">Demo: Girokonto Sparkasse</h4>
                  <p className="text-xs text-muted-foreground mt-1">{DEMO_KONTO_IBAN_MASKED}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">Vermietung</Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(DEMO_KONTO.balance)}</p>
                </div>
              </div>
            </div>
          </WidgetCell>
        )}

        {/* Echte Konten */}
        {bankAccounts.map((acc: any) => (
          <WidgetCell key={acc.id}>
            <div
              className={cn(
                'h-full w-full glass-card rounded-xl cursor-pointer transition-all hover:shadow-lg',
                openKontoId === acc.id && 'ring-2 ring-primary/50',
              )}
              onClick={() => setOpenKontoId(openKontoId === acc.id ? null : acc.id)}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <h4 className="font-semibold text-sm">{acc.account_name || acc.bank_name || 'Konto'}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{maskIban(acc.iban || '')}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">{acc.account_type || 'Giro'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={acc.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {acc.status === 'active' ? 'Verbunden' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </div>
          </WidgetCell>
        ))}

        {/* CTA Widget */}
        <WidgetCell>
          <div
            className="h-full w-full rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            role="button"
            tabIndex={0}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Konto hinzufügen</p>
            </div>
          </div>
        </WidgetCell>
      </WidgetGrid>

      {/* Inline Kontoakte — outside grid, full width */}
      {openKontoId === DEMO_KONTO.id && (
        <KontoAkteInline isDemo onClose={() => setOpenKontoId(null)} />
      )}
      {openKontoId && openKontoId !== DEMO_KONTO.id && (
        <KontoAkteInline
          isDemo={false}
          account={bankAccounts.find((a: any) => a.id === openKontoId)}
          onClose={() => setOpenKontoId(null)}
        />
      )}

      {/* ═══ BLOCK C: 12M Scan ═══ */}
      <Card className="glass-card mt-4">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ScanSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Umsätze auslesen & Verträge erkennen</p>
              <p className="text-sm text-muted-foreground">
                Scannt die letzten 12 Monate Ihrer Kontoumsätze und identifiziert wiederkehrende Zahlungen als potenzielle Abonnements, Versicherungen oder Vorsorgeverträge.
              </p>
            </div>
            <Button variant="outline" disabled>
              <ScanSearch className="h-4 w-4 mr-2" />
              Scan starten
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function UebersichtTab() {
  const { activeTenantId } = useAuth();
  const {
    isLoading, persons, pensionRecords,
    createPerson, updatePerson, deletePerson, upsertPension,
  } = useFinanzanalyseData();

  const { createPersonDMSTree } = usePersonDMS();

  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, Record<string, any>>>({});
  const [pensionForms, setPensionForms] = useState<Record<string, Record<string, any>>>({});
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newForm, setNewForm] = useState({
    role: 'partner', salutation: '', first_name: '', last_name: '',
    birth_date: '', email: '', phone: '', street: '', house_number: '', zip: '', city: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  if (isLoading) {
    return <PageShell><Skeleton className="h-64" /></PageShell>;
  }

  const toggleCard = (id: string) => {
    if (openCardId === id) {
      setOpenCardId(null);
    } else {
      const person = persons.find(p => p.id === id);
      if (person) {
        setEditForms(prev => ({ ...prev, [id]: { ...person } }));
        const pension = pensionRecords.find(p => p.person_id === id);
        setPensionForms(prev => ({
          ...prev,
          [id]: pension ? {
            info_date: pension.info_date || '',
            current_pension: pension.current_pension || '',
            projected_pension: pension.projected_pension || '',
            disability_pension: pension.disability_pension || '',
          } : { info_date: '', current_pension: '', projected_pension: '', disability_pension: '' },
        }));
        // Lazy-create DMS tree for existing persons
        if (activeTenantId) {
          createPersonDMSTree.mutate({
            personId: person.id,
            personName: `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Person',
            tenantId: activeTenantId,
          });
        }
      }
      setOpenCardId(id);
      setShowNewPerson(false);
    }
  };

  const updateField = (personId: string, field: string, value: any) => {
    setEditForms(prev => ({ ...prev, [personId]: { ...prev[personId], [field]: value } }));
  };

  const updatePensionField = (personId: string, field: string, value: any) => {
    setPensionForms(prev => ({ ...prev, [personId]: { ...prev[personId], [field]: value } }));
  };

  const handleSave = (personId: string) => {
    setSavingId(personId);
    const form = editForms[personId];
    updatePerson.mutate(form, {
      onSuccess: () => {
        const pForm = pensionForms[personId];
        if (pForm && (pForm.info_date || pForm.current_pension || pForm.projected_pension || pForm.disability_pension)) {
          upsertPension.mutate({
            personId,
            info_date: pForm.info_date || null,
            current_pension: pForm.current_pension ? Number(pForm.current_pension) : null,
            projected_pension: pForm.projected_pension ? Number(pForm.projected_pension) : null,
            disability_pension: pForm.disability_pension ? Number(pForm.disability_pension) : null,
          });
        }
        toast.success('Person gespeichert');
        setSavingId(null);
      },
      onError: () => setSavingId(null),
    });
  };

  const handleDelete = (personId: string) => {
    deletePerson.mutate(personId, {
      onSuccess: () => {
        toast.success('Person entfernt');
        setOpenCardId(null);
      },
    });
  };

  const handleAddPerson = () => {
    createPerson.mutate(newForm, {
      onSuccess: (newPerson) => {
        toast.success('Person hinzugefügt');
        // Auto-create DMS tree for the new person
        if (activeTenantId && newPerson?.id) {
          createPersonDMSTree.mutate({
            personId: newPerson.id,
            personName: `${newForm.first_name} ${newForm.last_name}`.trim(),
            tenantId: activeTenantId,
          });
        }
        setShowNewPerson(false);
        setNewForm({ role: 'partner', salutation: '', first_name: '', last_name: '', birth_date: '', email: '', phone: '', street: '', house_number: '', zip: '', city: '' });
      },
    });
  };

  return (
    <PageShell>
      <ModulePageHeader title="Finanzen" description="Ihre finanzielle Gesamtübersicht — Personen, Konten und Vertragsanalyse" />

      {/* ═══ BLOCK A: Personen im Haushalt ═══ */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Personen im Haushalt
        </h3>
      </div>

      <div className={RECORD_CARD.GRID}>
        {persons.map((person) => {
          const pension = pensionRecords.find(p => p.person_id === person.id);
          const form = editForms[person.id] || person;
          const pForm = pensionForms[person.id] || {};

          return (
            <RecordCard
              key={person.id}
              id={person.id}
              entityType="person"
              isOpen={openCardId === person.id}
              onToggle={() => toggleCard(person.id)}
              title={`${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Neue Person'}
              subtitle={person.email || undefined}
              badges={[
                { label: ROLE_LABELS[person.role] || person.role, variant: person.is_primary ? 'default' : 'secondary' },
              ]}
              thumbnailUrl={(person as any).avatar_url || undefined}
              summary={[
                ...(person.birth_date ? [{ label: '', value: new Date(person.birth_date).toLocaleDateString('de-DE') }] : []),
                ...(person.street ? [{ label: '', value: `${person.street} ${person.house_number || ''}`.trim() }] : []),
                ...(person.zip ? [{ label: '', value: `${person.zip} ${person.city || ''}`.trim() }] : []),
                ...((person as any).phone_landline ? [{ label: '', value: (person as any).phone_landline }] : []),
                ...(person.phone ? [{ label: '', value: person.phone }] : []),
                ...(person.email ? [{ label: '', value: person.email }] : []),
              ]}
              tenantId={activeTenantId || undefined}
              onSave={() => handleSave(person.id)}
              onDelete={!person.is_primary ? () => handleDelete(person.id) : undefined}
              saving={savingId === person.id}
            >
              {/* Persönliche Daten */}
              <div>
                <p className={RECORD_CARD.SECTION_TITLE}>Persönliche Daten</p>
                <div className={RECORD_CARD.FIELD_GRID}>
                  <div>
                    <Label className="text-xs">Rolle</Label>
                    <Select value={form.role || 'weitere'} onValueChange={v => updateField(person.id, 'role', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Anrede</Label>
                    <Select value={form.salutation || ''} onValueChange={v => updateField(person.id, 'salutation', v)}>
                      <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                        <SelectItem value="Divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormInput label="Vorname" name="first_name" value={form.first_name || ''}
                    onChange={e => updateField(person.id, 'first_name', e.target.value)} />
                  <FormInput label="Nachname" name="last_name" value={form.last_name || ''}
                    onChange={e => updateField(person.id, 'last_name', e.target.value)} />
                  <FormInput label="Geburtsdatum" name="birth_date" type="date" value={form.birth_date || ''}
                    onChange={e => updateField(person.id, 'birth_date', e.target.value)} />
                  <div>
                    <Label className="text-xs">Familienstand</Label>
                    <Select value={form.marital_status || ''} onValueChange={v => updateField(person.id, 'marital_status', v)}>
                      <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        {MARITAL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormInput label="E-Mail" name="email" type="email" value={form.email || ''}
                    onChange={e => updateField(person.id, 'email', e.target.value)} />
                  <FormInput label="Festnetz" name="phone_landline" type="tel" value={form.phone_landline || ''}
                    onChange={e => updateField(person.id, 'phone_landline', e.target.value)} />
                  <FormInput label="Mobil" name="phone" type="tel" value={form.phone || ''}
                    onChange={e => updateField(person.id, 'phone', e.target.value)} />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <p className={RECORD_CARD.SECTION_TITLE}>Adresse</p>
                <div className={RECORD_CARD.FIELD_GRID}>
                  <FormInput label="Straße" name="street" value={form.street || ''}
                    onChange={e => updateField(person.id, 'street', e.target.value)} />
                  <FormInput label="Hausnummer" name="house_number" value={form.house_number || ''}
                    onChange={e => updateField(person.id, 'house_number', e.target.value)} />
                  <FormInput label="PLZ" name="zip" value={form.zip || ''}
                    onChange={e => updateField(person.id, 'zip', e.target.value)} />
                  <FormInput label="Ort" name="city" value={form.city || ''}
                    onChange={e => updateField(person.id, 'city', e.target.value)} />
                </div>
              </div>

              {/* DRV Renteninformation */}
              <div>
                <p className={RECORD_CARD.SECTION_TITLE}>DRV Renteninformation</p>
                <div className={RECORD_CARD.FIELD_GRID}>
                  <FormInput label="Datum der Renteninformation" name="info_date" type="date"
                    value={pForm.info_date || ''}
                    onChange={e => updatePensionField(person.id, 'info_date', e.target.value)} />
                  <FormInput label="Bisher erreichte Regelaltersrente (€)" name="current_pension" type="number"
                    value={pForm.current_pension || ''}
                    onChange={e => updatePensionField(person.id, 'current_pension', e.target.value)} />
                  <FormInput label="Künftige Rente ohne Anpassung (€)" name="projected_pension" type="number"
                    value={pForm.projected_pension || ''}
                    onChange={e => updatePensionField(person.id, 'projected_pension', e.target.value)} />
                  <FormInput label="Volle Erwerbsminderungsrente (€)" name="disability_pension" type="number"
                    value={pForm.disability_pension || ''}
                    onChange={e => updatePensionField(person.id, 'disability_pension', e.target.value)} />
                </div>
              </div>
            </RecordCard>
          );
        })}

        {/* CTA Widget: + Person hinzufügen */}
        {!showNewPerson && (
          <div
            className={RECORD_CARD.CLOSED + ' border-dashed border-primary/30 flex items-center justify-center'}
            onClick={() => { setShowNewPerson(true); setOpenCardId(null); }}
            role="button"
            tabIndex={0}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Person hinzufügen</p>
            </div>
          </div>
        )}

        {/* New Person Form (open state) */}
        {showNewPerson && (
          <div className={RECORD_CARD.OPEN}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Neue Person</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNewPerson(false)}>Abbrechen</Button>
            </div>
            <div>
              <p className={RECORD_CARD.SECTION_TITLE}>Persönliche Daten</p>
              <div className={RECORD_CARD.FIELD_GRID}>
                <div>
                  <Label className="text-xs">Rolle</Label>
                  <Select value={newForm.role} onValueChange={v => setNewForm(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.filter(r => r.value !== 'hauptperson').map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Anrede</Label>
                  <Select value={newForm.salutation} onValueChange={v => setNewForm(p => ({ ...p, salutation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                      <SelectItem value="Divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormInput label="Vorname" name="new_first" value={newForm.first_name}
                  onChange={e => setNewForm(p => ({ ...p, first_name: e.target.value }))} />
                <FormInput label="Nachname" name="new_last" value={newForm.last_name}
                  onChange={e => setNewForm(p => ({ ...p, last_name: e.target.value }))} />
                <FormInput label="Geburtsdatum" name="new_birth" type="date" value={newForm.birth_date}
                  onChange={e => setNewForm(p => ({ ...p, birth_date: e.target.value }))} />
                <FormInput label="E-Mail" name="new_email" type="email" value={newForm.email}
                  onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} />
                <FormInput label="Mobil" name="new_phone" type="tel" value={newForm.phone}
                  onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className={RECORD_CARD.ACTIONS}>
              <Button size="sm" onClick={handleAddPerson}>Speichern</Button>
            </div>
          </div>
        )}
      </div>

      <KontenBlock />
    </PageShell>
  );
}

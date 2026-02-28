/**
 * MOD-18 Finanzen — Tab 1: ÜBERSICHT
 * Block A: Personen im Haushalt (WidgetGrid CI-Kacheln)
 * Block B: Finanzbericht
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { RECORD_CARD, DEMO_WIDGET, CARD, TYPOGRAPHY } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { usePersonDMS } from '@/hooks/usePersonDMS';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FinanzberichtSection } from '@/components/finanzanalyse/FinanzberichtSection';
import { ManualExpensesSection } from '@/components/finanzanalyse/ManualExpensesSection';
import {
  Users, Plus, User, X, Euro
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

const DIENSTHERR_OPTIONS = [
  { value: 'bund', label: 'Bund' },
  { value: 'baden-wuerttemberg', label: 'Baden-Württemberg' },
  { value: 'bayern', label: 'Bayern' },
  { value: 'berlin', label: 'Berlin' },
  { value: 'brandenburg', label: 'Brandenburg' },
  { value: 'bremen', label: 'Bremen' },
  { value: 'hamburg', label: 'Hamburg' },
  { value: 'hessen', label: 'Hessen' },
  { value: 'mecklenburg-vorpommern', label: 'Mecklenburg-Vorpommern' },
  { value: 'niedersachsen', label: 'Niedersachsen' },
  { value: 'nordrhein-westfalen', label: 'Nordrhein-Westfalen' },
  { value: 'rheinland-pfalz', label: 'Rheinland-Pfalz' },
  { value: 'saarland', label: 'Saarland' },
  { value: 'sachsen', label: 'Sachsen' },
  { value: 'sachsen-anhalt', label: 'Sachsen-Anhalt' },
  { value: 'schleswig-holstein', label: 'Schleswig-Holstein' },
  { value: 'thueringen', label: 'Thüringen' },
];

const BESOLDUNGSGRUPPEN = [
  ...Array.from({ length: 15 }, (_, i) => `A${i + 2}`),
  ...Array.from({ length: 11 }, (_, i) => `B${i + 1}`),
  'W1', 'W2', 'W3',
  ...Array.from({ length: 10 }, (_, i) => `R${i + 1}`),
];

function calcPension(grundgehalt: number, dienstjahre: number) {
  const versorgungssatz = Math.min(dienstjahre * 1.79375, 71.75);
  const bruttoPension = grundgehalt * (versorgungssatz / 100);
  const mindestversorgung = grundgehalt * 0.35;
  return {
    versorgungssatz,
    bruttoPension: Math.max(bruttoPension, mindestversorgung),
    istMindestversorgung: bruttoPension < mindestversorgung,
  };
}

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

const ROLE_GRADIENTS: Record<string, string> = {
  hauptperson: 'from-primary to-primary/60',
  partner: 'from-rose-400 to-rose-500/60',
  kind: 'from-amber-400 to-amber-500/60',
  weitere: 'from-muted-foreground to-muted-foreground/60',
};

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
    const isBeamter = form.employment_status === 'beamter';
    updatePerson.mutate(form, {
      onSuccess: () => {
        const pForm = pensionForms[personId];
        // Only save DRV pension data for non-Beamte
        if (!isBeamter && pForm && (pForm.info_date || pForm.current_pension || pForm.projected_pension || pForm.disability_pension)) {
          upsertPension.mutate({
            personId,
            pension_type: 'drv',
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
      <ModulePageHeader
        title="Finanzen"
        description="Deine finanzielle Gesamtübersicht — Personen, Konten und Vertragsanalyse"
        actions={
          <Button
            variant="glass"
            size="icon-round"
            onClick={() => { setShowNewPerson(true); setOpenCardId(null); }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* ═══ BLOCK A: Personen im Haushalt ═══ */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Personen im Haushalt
        </h3>
      </div>

      <WidgetGrid>
        {persons.map((person) => {
          const isDemo = isDemoId(person.id);
          const glowVariant = isDemo ? 'emerald' : 'rose';
          const isSelected = openCardId === person.id;
          const gradient = ROLE_GRADIENTS[person.role] || ROLE_GRADIENTS.weitere;

          return (
            <WidgetCell key={person.id}>
              <div
                className={cn(
                  CARD.BASE, CARD.INTERACTIVE,
                  'h-full flex flex-col items-center justify-center p-5 text-center',
                  getActiveWidgetGlow(glowVariant),
                  isSelected && getSelectionRing(glowVariant),
                )}
                onClick={(e) => { e.stopPropagation(); toggleCard(person.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleCard(person.id); }}}
                role="button"
                tabIndex={0}
              >
                {isDemo && (
                  <Badge className={DEMO_WIDGET.BADGE + ' absolute top-3 right-3 text-[10px]'}>DEMO</Badge>
                )}
                <div className={cn('h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center mb-3', gradient)}>
                  <User className="h-7 w-7 text-white" />
                </div>
                <h4 className={TYPOGRAPHY.CARD_TITLE}>
                  {person.first_name} {person.last_name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_LABELS[person.role] || person.role}
                </p>
                {person.birth_date && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {new Date(person.birth_date).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            </WidgetCell>
          );
        })}

      </WidgetGrid>

      {/* Person detail/edit below grid */}
      {openCardId && (() => {
        const person = persons.find(p => p.id === openCardId);
        if (!person) return null;
        const form = editForms[openCardId] || person;
        const pForm = pensionForms[openCardId] || {};
        return (
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{person.first_name} {person.last_name}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpenCardId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Persönliche Daten */}
            <div className="space-y-6">
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

              {/* Beschäftigung und Einkommen */}
              <div>
                <p className={RECORD_CARD.SECTION_TITLE}>Beschäftigung und Einkommen</p>
                <div className={RECORD_CARD.FIELD_GRID}>
                  <div>
                    <Label className="text-xs">Beschäftigungsstatus</Label>
                    <Select value={form.employment_status || ''} onValueChange={v => updateField(person.id, 'employment_status', v)}>
                      <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="angestellt">Angestellt</SelectItem>
                        <SelectItem value="selbstaendig">Selbstständig</SelectItem>
                        <SelectItem value="beamter">Beamter</SelectItem>
                        <SelectItem value="rentner">Rentner</SelectItem>
                        <SelectItem value="nicht_erwerbstaetig">Nicht erwerbstätig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Angestellten-Felder: immer sichtbar außer bei beamter/rentner/nicht_erwerbstaetig */}
                  {form.employment_status !== 'beamter' && form.employment_status !== 'rentner' && form.employment_status !== 'nicht_erwerbstaetig' && (
                    <>
                      <FormInput label="Arbeitgeber" name="employer_name" value={form.employer_name || ''}
                        onChange={e => updateField(person.id, 'employer_name', e.target.value)} />
                      <FormInput label="Bruttoeinkommen (€/mtl.)" name="gross_income_monthly" type="number"
                        value={form.gross_income_monthly || ''}
                        onChange={e => updateField(person.id, 'gross_income_monthly', e.target.value)} />
                      <FormInput label="Nettoeinkommen (€/mtl.)" name="net_income_monthly" type="number"
                        value={form.net_income_monthly || ''}
                        onChange={e => updateField(person.id, 'net_income_monthly', e.target.value)} />
                      <div>
                        <Label className="text-xs">Steuerklasse</Label>
                        <Select value={form.tax_class || ''} onValueChange={v => updateField(person.id, 'tax_class', v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {['I', 'II', 'III', 'IV', 'V', 'VI'].map(tc => (
                              <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormInput label="Kinderfreibeträge" name="child_allowances" type="number"
                        value={form.child_allowances || ''}
                        onChange={e => updateField(person.id, 'child_allowances', e.target.value)} />
                    </>
                  )}

                  {form.employment_status === 'beamter' && (
                    <>
                      <div>
                        <Label className="text-xs">Dienstherr</Label>
                        <Select value={form.dienstherr || ''} onValueChange={v => updateField(person.id, 'dienstherr', v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {DIENSTHERR_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Besoldungsgruppe</Label>
                        <Select value={form.besoldungsgruppe || ''} onValueChange={v => updateField(person.id, 'besoldungsgruppe', v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {BESOLDUNGSGRUPPEN.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Erfahrungsstufe</Label>
                        <Select value={String(form.erfahrungsstufe || '')} onValueChange={v => updateField(person.id, 'erfahrungsstufe', Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Stufe {s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormInput label="Bruttoeinkommen (€/mtl.)" name="gross_income_monthly" type="number"
                        value={form.gross_income_monthly || ''}
                        onChange={e => updateField(person.id, 'gross_income_monthly', e.target.value)} />
                      <FormInput label="Nettoeinkommen (€/mtl.)" name="net_income_monthly" type="number"
                        value={form.net_income_monthly || ''}
                        onChange={e => updateField(person.id, 'net_income_monthly', e.target.value)} />
                      <div>
                        <Label className="text-xs">Steuerklasse</Label>
                        <Select value={form.tax_class || ''} onValueChange={v => updateField(person.id, 'tax_class', v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {['I', 'II', 'III', 'IV', 'V', 'VI'].map(tc => (
                              <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormInput label="Kinderfreibeträge" name="child_allowances" type="number"
                        value={form.child_allowances || ''}
                        onChange={e => updateField(person.id, 'child_allowances', e.target.value)} />
                      <FormInput label="Datum der Verbeamtung" name="verbeamtung_date" type="date"
                        value={form.verbeamtung_date || ''}
                        onChange={e => updateField(person.id, 'verbeamtung_date', e.target.value)} />
                      <FormInput label="Ruhegehaltfähiges Grundgehalt (€/mtl.)" name="ruhegehaltfaehiges_grundgehalt" type="number"
                        value={form.ruhegehaltfaehiges_grundgehalt || ''}
                        onChange={e => updateField(person.id, 'ruhegehaltfaehiges_grundgehalt', e.target.value)} />
                      <FormInput label="Ruhegehaltfähige Dienstjahre" name="ruhegehaltfaehige_dienstjahre" type="number"
                        value={form.ruhegehaltfaehige_dienstjahre || ''}
                        onChange={e => updateField(person.id, 'ruhegehaltfaehige_dienstjahre', e.target.value)} />
                      <FormInput label="Geplantes Ruhestandsdatum" name="planned_retirement_date" type="date"
                        value={form.planned_retirement_date || ''}
                        onChange={e => updateField(person.id, 'planned_retirement_date', e.target.value)} />
                    </>
                  )}

                  {/* Selbstständig-Felder: immer sichtbar außer bei beamter/rentner/nicht_erwerbstaetig */}
                  {form.employment_status !== 'beamter' && form.employment_status !== 'rentner' && form.employment_status !== 'nicht_erwerbstaetig' && (
                    <FormInput label="Einkünfte aus Gewerbebetrieb (€/mtl.)" name="business_income_monthly" type="number"
                      value={form.business_income_monthly || ''}
                      onChange={e => updateField(person.id, 'business_income_monthly', e.target.value)} />
                  )}

                  <FormInput label="Einkünfte aus Photovoltaik (€/mtl.)" name="pv_income_monthly" type="number"
                    value={form.pv_income_monthly || ''}
                    onChange={e => updateField(person.id, 'pv_income_monthly', e.target.value)} />
                  <FormInput label="Sonstige Einnahmen (€/mtl.)" name="other_income_monthly" type="number"
                    value={form.other_income_monthly || ''}
                    onChange={e => updateField(person.id, 'other_income_monthly', e.target.value)} />
                </div>
              </div>

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

              {form.employment_status === 'beamter' ? (
                <div>
                  <p className={RECORD_CARD.SECTION_TITLE}>
                    <Shield className="h-4 w-4 inline mr-1" />
                    Pensionsanspruch (Beamtenversorgung)
                  </p>
                  {(() => {
                    const grundgehalt = Number(form.ruhegehaltfaehiges_grundgehalt) || 0;
                    const dienstjahre = Number(form.ruhegehaltfaehige_dienstjahre) || 0;
                    if (!grundgehalt || !dienstjahre) {
                      return (
                        <p className="text-sm text-muted-foreground italic">
                          Bitte ruhegehaltfähiges Grundgehalt und Dienstjahre eintragen, um den Pensionsanspruch zu berechnen.
                        </p>
                      );
                    }
                    const { versorgungssatz, bruttoPension, istMindestversorgung } = calcPension(grundgehalt, dienstjahre);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Versorgungssatz</p>
                          <p className="text-xl font-bold">{versorgungssatz.toFixed(2)} %</p>
                          {versorgungssatz >= 71.75 && <Badge variant="secondary" className="mt-1 text-[10px]">Maximum</Badge>}
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Brutto-Pension (mtl.)</p>
                          <p className="text-xl font-bold">{fmt(bruttoPension)}</p>
                          {istMindestversorgung && <Badge variant="secondary" className="mt-1 text-[10px]">Mindestversorgung</Badge>}
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Grundgehalt (ruhegehaltf.)</p>
                          <p className="text-xl font-bold">{fmt(grundgehalt)}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Berechnung nach BeamtVG: Versorgungssatz = min(Dienstjahre × 1,79375 %, 71,75 %). Mindestversorgung: 35 % des ruhegehaltfähigen Grundgehalts.
                  </p>
                </div>
              ) : (
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
              )}
            </div>

            <div className={RECORD_CARD.ACTIONS}>
              {!person.is_primary && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(person.id)}>Löschen</Button>
              )}
              <Button size="sm" onClick={() => handleSave(person.id)} disabled={savingId === person.id}>Speichern</Button>
            </div>
          </Card>
        );
      })()}

      {/* New Person Form */}
      {showNewPerson && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
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
        </Card>
      )}

      <ManualExpensesSection />
      <FinanzberichtSection />
    </PageShell>
  );
}

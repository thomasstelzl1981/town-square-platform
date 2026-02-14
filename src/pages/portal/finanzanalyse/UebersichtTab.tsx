/**
 * MOD-18 Finanzanalyse — Tab 1: Übersicht
 * Block A: Personen im Haushalt (OBEN)
 * Block B: KPI Row
 * Block C: Top Treiber
 * Block D: Setup / Konten (UNTEN)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users, UserPlus, TrendingUp, TrendingDown, Wallet, Receipt,
  CheckCircle2, Circle, BarChart3, ShoppingBag, PieChart, ArrowUpRight,
  Pencil, Trash2, Save, X
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson',
  partner: 'Partner/in',
  kind: 'Kind',
  weitere: 'Weitere',
};

export default function UebersichtTab() {
  const {
    kpis, setupStatus, isLoading,
    persons, pensionRecords,
    createPerson, updatePerson, deletePerson, upsertPension,
  } = useFinanzanalyseData();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    role: 'partner' as string,
    salutation: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    email: '',
    phone: '',
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </PageShell>
    );
  }

  const handleStartEdit = (person: any) => {
    setEditingId(person.id);
    setEditForm({ ...person });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updatePerson.mutate(editForm, {
      onSuccess: () => {
        toast.success('Person aktualisiert');
        setEditingId(null);
        setEditForm({});
      },
    });
  };

  const handleAddPerson = () => {
    createPerson.mutate(newPerson, {
      onSuccess: () => {
        toast.success('Person hinzugefügt');
        setShowAddForm(false);
        setNewPerson({ role: 'partner', salutation: '', first_name: '', last_name: '', birth_date: '', email: '', phone: '' });
      },
    });
  };

  const handleDeletePerson = (id: string) => {
    deletePerson.mutate(id, {
      onSuccess: () => toast.success('Person entfernt'),
    });
  };

  const handleSavePension = (personId: string, data: any) => {
    upsertPension.mutate({ personId, ...data }, {
      onSuccess: () => toast.success('Renteninformation gespeichert'),
    });
  };

  // ─── KPI Cards ─────────────────────────────────────
  const kpiCards = [
    { label: 'Einnahmen (12M)', value: kpis.totalIncome > 0 ? fmt(kpis.totalIncome) : '—', icon: TrendingUp, color: 'text-primary' },
    { label: 'Ausgaben (12M)', value: kpis.totalExpenses > 0 ? fmt(kpis.totalExpenses) : '—', icon: TrendingDown, color: 'text-destructive' },
    { label: 'Netto-Cashflow', value: kpis.totalIncome > 0 || kpis.totalExpenses > 0 ? fmt(kpis.netCashflow) : '—', icon: Wallet, color: kpis.netCashflow >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'Fixkosten/Monat', value: kpis.fixedCosts > 0 ? fmt(kpis.fixedCosts) : '—', icon: Receipt, color: 'text-muted-foreground' },
  ];

  return (
    <PageShell>
      {/* ═══ BLOCK A: Personen im Haushalt (GANZ OBEN) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personen im Haushalt
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Person hinzufügen
            </Button>
          </div>
          <CardDescription>Ihre Haushaltsstruktur als Grundlage für die Finanzanalyse</CardDescription>
        </CardHeader>
        <CardContent>
          {persons.length === 0 && !showAddForm ? (
            <div className="py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Noch keine Personen hinterlegt.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
                Stammdaten prüfen
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {persons.map((person) => {
                const pension = pensionRecords.find(p => p.person_id === person.id);
                const isEditing = editingId === person.id;

                return (
                  <AccordionItem key={person.id} value={person.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full mr-4">
                        <Badge variant="outline">{ROLE_LABELS[person.role] || person.role}</Badge>
                        <span className="font-medium text-sm">
                          {person.first_name} {person.last_name}
                        </span>
                        {person.birth_date && (
                          <span className="text-xs text-muted-foreground">
                            * {new Date(person.birth_date).toLocaleDateString('de-DE')}
                          </span>
                        )}
                        {person.is_primary && <Badge variant="secondary" className="text-xs">Hauptperson</Badge>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {isEditing ? (
                        <PersonEditForm
                          data={editForm}
                          onChange={setEditForm}
                          onSave={handleSaveEdit}
                          onCancel={() => { setEditingId(null); setEditForm({}); }}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <FieldDisplay label="Anrede" value={person.salutation} />
                            <FieldDisplay label="Vorname" value={person.first_name} />
                            <FieldDisplay label="Nachname" value={person.last_name} />
                            <FieldDisplay label="Geburtsdatum" value={person.birth_date ? new Date(person.birth_date).toLocaleDateString('de-DE') : '–'} />
                            <FieldDisplay label="E-Mail" value={person.email} />
                            <FieldDisplay label="Mobil" value={person.phone} />
                            {person.street && <FieldDisplay label="Adresse" value={`${person.street} ${person.house_number || ''}, ${person.zip || ''} ${person.city || ''}`} />}
                            {person.marital_status && <FieldDisplay label="Familienstand" value={person.marital_status} />}
                            {person.employment_status && <FieldDisplay label="Beschäftigung" value={person.employment_status} />}
                            {person.employer_name && <FieldDisplay label="Arbeitgeber" value={person.employer_name} />}
                            {person.net_income_range && <FieldDisplay label="Netto (Bandbreite)" value={person.net_income_range} />}
                          </div>

                          {/* DRV / Renteninformation */}
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3">DRV / Renteninformation</p>
                            <PensionSection
                              pension={pension}
                              personId={person.id}
                              onSave={handleSavePension}
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => handleStartEdit(person)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </Button>
                            {!person.is_primary && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeletePerson(person.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Entfernen
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Add Person Form */}
          {showAddForm && (
            <Card className="mt-4 border-dashed border-primary/30">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-4">Neue Person hinzufügen</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Rolle</Label>
                    <Select value={newPerson.role} onValueChange={v => setNewPerson(p => ({ ...p, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner">Partner/in</SelectItem>
                        <SelectItem value="kind">Kind</SelectItem>
                        <SelectItem value="weitere">Weitere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Anrede</Label>
                    <Select value={newPerson.salutation} onValueChange={v => setNewPerson(p => ({ ...p, salutation: v }))}>
                      <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                        <SelectItem value="Divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Vorname</Label>
                    <Input value={newPerson.first_name} onChange={e => setNewPerson(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Nachname</Label>
                    <Input value={newPerson.last_name} onChange={e => setNewPerson(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Geburtsdatum</Label>
                    <Input type="date" value={newPerson.birth_date} onChange={e => setNewPerson(p => ({ ...p, birth_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">E-Mail</Label>
                    <Input type="email" value={newPerson.email} onChange={e => setNewPerson(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Mobil</Label>
                    <Input value={newPerson.phone} onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={handleAddPerson}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* ═══ BLOCK B: Kurz-Überblick (KPI Row) ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                {kpi.color === 'text-primary' && kpi.value !== '—' && <ArrowUpRight className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!setupStatus.hasTransactions && (
        <p className="text-xs text-muted-foreground text-center mt-2">Noch keine Kontodaten verbunden</p>
      )}

      {/* ═══ BLOCK C: Top Treiber (nur bei Daten) ═══ */}
      {kpis.topCategories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Ausgaben nach Kategorie
            </CardTitle>
            <CardDescription>Top 5 Kategorien der letzten 12 Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple">
              {kpis.topCategories.map((cat) => (
                <AccordionItem key={cat.category} value={cat.category}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-3 w-full mr-4">
                      <Badge variant="outline" className="min-w-[80px] justify-center">{cat.category}</Badge>
                      <div className="flex-1">
                        <Progress value={kpis.topCategories[0] ? (cat.total / kpis.topCategories[0].total) * 100 : 0} className="h-2" />
                      </div>
                      <span className="font-mono text-sm font-medium">{fmt(cat.total)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Durchschnittlich {fmt(cat.total / 12)} pro Monat in dieser Kategorie.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {kpis.topMerchants.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Top Empfänger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.topMerchants.slice(0, 5).map((m) => (
                <div key={m.merchant} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.merchant}</p>
                    <p className="text-xs text-muted-foreground">{m.count} Transaktionen</p>
                  </div>
                  <span className="font-mono text-sm">{fmt(m.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ BLOCK D: Setup / Konten (GANZ UNTEN) ═══ */}
      <Card className="mt-6 border-dashed border-muted-foreground/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Setup-Status</p>
              <p className="text-sm text-muted-foreground">Verbinden Sie Datenquellen für vollständige Analysen</p>
            </div>
          </div>
          <Progress value={setupStatus.completionPercent} className="h-2 mb-4" />
          <div className="space-y-2">
            <CheckItem done={setupStatus.hasTransactions} label="Kontoumsätze vorhanden" />
            <CheckItem done={setupStatus.hasBudgets} label="Budget-Ziele definiert" />
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/portal/finanzierungsmanager')}>
            Konten im Finanzmanager verbinden →
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function FieldDisplay({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '–'}</p>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

function PersonEditForm({ data, onChange, onSave, onCancel }: {
  data: Record<string, any>;
  onChange: (d: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (key: string, val: string) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Rolle</Label>
          <Select value={data.role} onValueChange={v => set('role', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hauptperson">Hauptperson</SelectItem>
              <SelectItem value="partner">Partner/in</SelectItem>
              <SelectItem value="kind">Kind</SelectItem>
              <SelectItem value="weitere">Weitere</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Anrede</Label>
          <Select value={data.salutation || ''} onValueChange={v => set('salutation', v)}>
            <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Herr">Herr</SelectItem>
              <SelectItem value="Frau">Frau</SelectItem>
              <SelectItem value="Divers">Divers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Vorname</Label>
          <Input value={data.first_name || ''} onChange={e => set('first_name', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Nachname</Label>
          <Input value={data.last_name || ''} onChange={e => set('last_name', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Geburtsdatum</Label>
          <Input type="date" value={data.birth_date || ''} onChange={e => set('birth_date', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">E-Mail</Label>
          <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Mobil</Label>
          <Input value={data.phone || ''} onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Familienstand</Label>
          <Input value={data.marital_status || ''} onChange={e => set('marital_status', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Beschäftigungsstatus</Label>
          <Input value={data.employment_status || ''} onChange={e => set('employment_status', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Arbeitgeber</Label>
          <Input value={data.employer_name || ''} onChange={e => set('employer_name', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Netto (Bandbreite)</Label>
          <Input value={data.net_income_range || ''} onChange={e => set('net_income_range', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

function PensionSection({ pension, personId, onSave }: {
  pension?: any;
  personId: string;
  onSave: (personId: string, data: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    info_date: pension?.info_date || '',
    current_pension: pension?.current_pension?.toString() || '',
    projected_pension: pension?.projected_pension?.toString() || '',
    disability_pension: pension?.disability_pension?.toString() || '',
  });

  if (!editing && !pension) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">Keine Renteninformation hinterlegt</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing(true)}>
          Renteninformation erfassen
        </Button>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <FieldDisplay label="Datum der Info" value={pension?.info_date ? new Date(pension.info_date).toLocaleDateString('de-DE') : '–'} />
        <FieldDisplay label="Erreichte Regelaltersrente" value={pension?.current_pension ? fmt(Number(pension.current_pension)) : '–'} />
        <FieldDisplay label="Künftige Rente (ohne Anpassung)" value={pension?.projected_pension ? fmt(Number(pension.projected_pension)) : '–'} />
        <FieldDisplay label="Volle Erwerbsminderungsrente" value={pension?.disability_pension ? fmt(Number(pension.disability_pension)) : '–'} />
        <div className="col-span-full">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-xs">Datum der Renteninformation</Label>
        <Input type="date" value={form.info_date} onChange={e => setForm(f => ({ ...f, info_date: e.target.value }))} />
      </div>
      <div>
        <Label className="text-xs">Bisher erreichte Regelaltersrente (€)</Label>
        <Input type="number" value={form.current_pension} onChange={e => setForm(f => ({ ...f, current_pension: e.target.value }))} />
      </div>
      <div>
        <Label className="text-xs">Künftige Rente ohne Anpassung (€)</Label>
        <Input type="number" value={form.projected_pension} onChange={e => setForm(f => ({ ...f, projected_pension: e.target.value }))} />
      </div>
      <div>
        <Label className="text-xs">Volle Erwerbsminderungsrente (€)</Label>
        <Input type="number" value={form.disability_pension} onChange={e => setForm(f => ({ ...f, disability_pension: e.target.value }))} />
      </div>
      <div className="col-span-full flex gap-2">
        <Button size="sm" onClick={() => {
          onSave(personId, {
            info_date: form.info_date || null,
            current_pension: form.current_pension ? parseFloat(form.current_pension) : null,
            projected_pension: form.projected_pension ? parseFloat(form.projected_pension) : null,
            disability_pension: form.disability_pension ? parseFloat(form.disability_pension) : null,
          });
          setEditing(false);
        }}>
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          <X className="h-4 w-4 mr-2" />
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

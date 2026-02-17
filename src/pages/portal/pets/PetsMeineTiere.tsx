/**
 * Pets — Meine Tiere Tab
 * RecordCard-Grid mit Inline-Akte (kein Seitenwechsel)
 */
import { useState } from 'react';
import { PawPrint, Plus, Dog, Cat, Bird, Rabbit, Radar, FolderOpen, Stethoscope } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD, DEMO_WIDGET } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { FormInput } from '@/components/shared';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { usePets, usePet, usePetVaccinations, useCreatePet, useUpdatePet, useDeletePet } from '@/hooks/usePets';
import { usePetMedicalRecords, useCreateVaccination, useDeleteVaccination, useCreateMedicalRecord, useDeleteMedicalRecord } from '@/hooks/usePetHealth';
import { useCaringEvents, useCompleteCaringEvent, useDeleteCaringEvent, CARING_EVENT_TYPES } from '@/hooks/usePetCaring';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInYears, differenceInMonths, parseISO, format, isPast, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Syringe, Calendar, Heart, Check, Trash2 } from 'lucide-react';

const SPECIES_ICONS: Record<string, typeof PawPrint> = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit };

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

const GENDER_LABELS: Record<string, string> = { male: 'Männlich', female: 'Weiblich', unknown: 'Unbekannt' };

function getAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const bd = parseISO(birthDate);
  const years = differenceInYears(new Date(), bd);
  if (years >= 1) return `${years} ${years === 1 ? 'Jahr' : 'Jahre'}`;
  const months = differenceInMonths(new Date(), bd);
  return `${months} ${months === 1 ? 'Monat' : 'Monate'}`;
}

/** Inline pet dossier rendered below the grid */
function PetInlineDossier({ petId, tenantId }: { petId: string; tenantId?: string }) {
  const { data: pet } = usePet(petId);
  const { data: vaccinations = [] } = usePetVaccinations(petId);
  const { data: medicalRecords = [] } = usePetMedicalRecords(petId);
  const { data: caringEvents = [] } = useCaringEvents({ petId });
  const completeCaring = useCompleteCaringEvent();
  const deleteCaring = useDeleteCaringEvent();
  const createVaccination = useCreateVaccination();
  const deleteVaccination = useDeleteVaccination();
  const createMedicalRecord = useCreateMedicalRecord();
  const deleteMedicalRecord = useDeleteMedicalRecord();
  const updatePet = useUpdatePet();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [vaccDialogOpen, setVaccDialogOpen] = useState(false);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [vaccForm, setVaccForm] = useState({ vaccination_type: '', vaccine_name: '', administered_at: '', next_due_at: '', vet_name: '', batch_number: '', notes: '' });
  const [medForm, setMedForm] = useState({ record_type: 'vet_visit', title: '', record_date: '', vet_name: '', diagnosis: '', treatment: '', medication: '', cost_amount: '', follow_up_date: '', notes: '' });
  if (!pet) return <p className="text-sm text-muted-foreground py-4">Laden…</p>;

  const currentData = { ...pet, ...formData };
  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { updatePet.mutate({ id: petId, ...formData }); setFormData({}); };

  return (
    <div className="col-span-full space-y-6 p-4 rounded-xl border border-teal-500/20 bg-card">
      {/* Stammdaten */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Stammdaten</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Name" name="name" value={currentData.name || ''} onChange={e => updateField('name', e.target.value)} />
          <div>
            <Label className="text-sm">Tierart</Label>
            <Select value={currentData.species || 'dog'} onValueChange={v => updateField('species', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <FormInput label="Rasse" name="breed" value={currentData.breed || ''} onChange={e => updateField('breed', e.target.value)} />
          <div>
            <Label className="text-sm">Geschlecht</Label>
            <Select value={currentData.gender || 'unknown'} onValueChange={v => updateField('gender', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(GENDER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <FormInput label="Geburtsdatum" name="birth_date" type="date" value={currentData.birth_date || ''} onChange={e => updateField('birth_date', e.target.value)} />
          <FormInput label="Gewicht (kg)" name="weight_kg" type="number" value={currentData.weight_kg?.toString() || ''} onChange={e => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : null)} />
        </div>
      </div>

      {/* Identifikation */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Identifikation</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Chip-Nr." name="chip_number" value={currentData.chip_number || ''} onChange={e => updateField('chip_number', e.target.value)} />
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={currentData.neutered || false} onCheckedChange={v => updateField('neutered', v)} />
            <Label>Kastriert / Sterilisiert</Label>
          </div>
        </div>
      </div>

      {/* Gesundheit */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Gesundheit</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Tierarzt" name="vet_name" value={currentData.vet_name || ''} onChange={e => updateField('vet_name', e.target.value)} />
          <div className="md:col-span-2">
            <Label className="text-sm">Allergien</Label>
            <Textarea value={(currentData.allergies || []).join(', ')} onChange={e => updateField('allergies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Kommagetrennt" rows={2} />
          </div>
        </div>
      </div>

      {/* Versicherung — nur Toggle, Details in MOD-18 */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Versicherung</p>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-3">
            <Switch
              checked={!!(currentData.insurance_provider)}
              onCheckedChange={v => {
                if (!v) {
                  updateField('insurance_provider', null);
                  updateField('insurance_policy_no', null);
                }
              }}
              disabled
            />
            <div>
              <p className="text-sm font-medium">{currentData.insurance_provider ? 'Versicherung vorhanden' : 'Keine Versicherung hinterlegt'}</p>
              <p className="text-xs text-muted-foreground">Versicherungsdetails werden im Modul <span className="font-medium text-primary">Finanzanalyse</span> verwaltet.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/portal/finanzanalyse'}>
            Zur Finanzanalyse
          </Button>
        </div>
      </div>

      {/* Lennox Tracker Placeholder */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>
          <span className="flex items-center gap-2"><Radar className="h-3.5 w-3.5" />Lennox Tracker</span>
        </p>
        <Card className="border-teal-500/10 bg-teal-500/5">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-teal-500/10">
              <Radar className="h-8 w-8 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Kein Tracker zugeordnet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bestellen Sie einen Lennox GPS-Tracker im Shop, um den Live-Standort Ihres Tieres hier zu sehen.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/portal/pets/shop'}>
              Zum Shop
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Impfhistorie */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={RECORD_CARD.SECTION_TITLE}>
            <span className="flex items-center gap-2"><Syringe className="h-3.5 w-3.5" />Impfhistorie ({vaccinations.length})</span>
          </p>
          <Dialog open={vaccDialogOpen} onOpenChange={setVaccDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" />Impfung</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Impfung erfassen</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Impftyp *</Label><Input value={vaccForm.vaccination_type} onChange={e => setVaccForm(p => ({ ...p, vaccination_type: e.target.value }))} placeholder="z.B. Tollwut" /></div>
                <div><Label>Impfstoff</Label><Input value={vaccForm.vaccine_name} onChange={e => setVaccForm(p => ({ ...p, vaccine_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Verabreicht am *</Label><Input type="date" value={vaccForm.administered_at} onChange={e => setVaccForm(p => ({ ...p, administered_at: e.target.value }))} /></div>
                  <div><Label>Nächste Fälligkeit</Label><Input type="date" value={vaccForm.next_due_at} onChange={e => setVaccForm(p => ({ ...p, next_due_at: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tierarzt</Label><Input value={vaccForm.vet_name} onChange={e => setVaccForm(p => ({ ...p, vet_name: e.target.value }))} /></div>
                  <div><Label>Chargen-Nr.</Label><Input value={vaccForm.batch_number} onChange={e => setVaccForm(p => ({ ...p, batch_number: e.target.value }))} /></div>
                </div>
                <div><Label>Notizen</Label><Textarea value={vaccForm.notes} onChange={e => setVaccForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                <Button className="w-full" disabled={!vaccForm.vaccination_type || !vaccForm.administered_at || createVaccination.isPending} onClick={() => {
                  createVaccination.mutate({
                    pet_id: petId,
                    vaccination_type: vaccForm.vaccination_type,
                    administered_at: vaccForm.administered_at,
                    ...(vaccForm.vaccine_name && { vaccine_name: vaccForm.vaccine_name }),
                    ...(vaccForm.next_due_at && { next_due_at: vaccForm.next_due_at }),
                    ...(vaccForm.vet_name && { vet_name: vaccForm.vet_name }),
                    ...(vaccForm.batch_number && { batch_number: vaccForm.batch_number }),
                    ...(vaccForm.notes && { notes: vaccForm.notes }),
                  }, { onSuccess: () => { setVaccDialogOpen(false); setVaccForm({ vaccination_type: '', vaccine_name: '', administered_at: '', next_due_at: '', vet_name: '', batch_number: '', notes: '' }); } });
                }}>Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {vaccinations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Noch keine Impfungen erfasst.</p>
        ) : (
          <div className="space-y-2">
            {vaccinations.map(v => {
              const overdue = v.next_due_at && isPast(parseISO(v.next_due_at));
              return (
                <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.vaccination_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(v.administered_at), 'dd.MM.yyyy', { locale: de })}
                      {v.vaccine_name && ` · ${v.vaccine_name}`}
                    </p>
                  </div>
                  {v.next_due_at && (
                    <Badge variant={overdue ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                      {overdue ? 'Überfällig' : `Fällig ${format(parseISO(v.next_due_at), 'dd.MM.yyyy', { locale: de })}`}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteVaccination.mutate({ id: v.id, petId })}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Krankengeschichte */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={RECORD_CARD.SECTION_TITLE}>
            <span className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" />Krankengeschichte ({medicalRecords.length})</span>
          </p>
          <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" />Eintrag</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Krankengeschichte erfassen</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Art</Label>
                  <Select value={medForm.record_type} onValueChange={v => setMedForm(p => ({ ...p, record_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vet_visit">Tierarztbesuch</SelectItem>
                      <SelectItem value="diagnosis">Diagnose</SelectItem>
                      <SelectItem value="treatment">Behandlung</SelectItem>
                      <SelectItem value="surgery">OP</SelectItem>
                      <SelectItem value="medication">Medikation</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Titel *</Label><Input value={medForm.title} onChange={e => setMedForm(p => ({ ...p, title: e.target.value }))} placeholder="z.B. Jahresuntersuchung" /></div>
                <div><Label>Datum *</Label><Input type="date" value={medForm.record_date} onChange={e => setMedForm(p => ({ ...p, record_date: e.target.value }))} /></div>
                <div><Label>Tierarzt</Label><Input value={medForm.vet_name} onChange={e => setMedForm(p => ({ ...p, vet_name: e.target.value }))} /></div>
                <div><Label>Diagnose</Label><Input value={medForm.diagnosis} onChange={e => setMedForm(p => ({ ...p, diagnosis: e.target.value }))} /></div>
                <div><Label>Behandlung</Label><Input value={medForm.treatment} onChange={e => setMedForm(p => ({ ...p, treatment: e.target.value }))} /></div>
                <div><Label>Medikation</Label><Input value={medForm.medication} onChange={e => setMedForm(p => ({ ...p, medication: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Kosten (€)</Label><Input type="number" value={medForm.cost_amount} onChange={e => setMedForm(p => ({ ...p, cost_amount: e.target.value }))} /></div>
                  <div><Label>Nachkontrolle</Label><Input type="date" value={medForm.follow_up_date} onChange={e => setMedForm(p => ({ ...p, follow_up_date: e.target.value }))} /></div>
                </div>
                <div><Label>Notizen</Label><Textarea value={medForm.notes} onChange={e => setMedForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                <Button className="w-full" disabled={!medForm.title || !medForm.record_date || createMedicalRecord.isPending} onClick={() => {
                  createMedicalRecord.mutate({
                    pet_id: petId,
                    record_type: medForm.record_type,
                    title: medForm.title,
                    record_date: medForm.record_date,
                    ...(medForm.vet_name && { vet_name: medForm.vet_name }),
                    ...(medForm.diagnosis && { diagnosis: medForm.diagnosis }),
                    ...(medForm.treatment && { treatment: medForm.treatment }),
                    ...(medForm.medication && { medication: medForm.medication }),
                    ...(medForm.cost_amount && { cost_amount: parseFloat(medForm.cost_amount) }),
                    ...(medForm.follow_up_date && { follow_up_date: medForm.follow_up_date }),
                    ...(medForm.notes && { notes: medForm.notes }),
                  }, { onSuccess: () => { setMedDialogOpen(false); setMedForm({ record_type: 'vet_visit', title: '', record_date: '', vet_name: '', diagnosis: '', treatment: '', medication: '', cost_amount: '', follow_up_date: '', notes: '' }); } });
                }}>Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {medicalRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Noch keine Einträge erfasst.</p>
        ) : (
          <div className="space-y-2">
            {medicalRecords.map(r => {
              const typeLabels: Record<string, string> = { vet_visit: 'Tierarztbesuch', diagnosis: 'Diagnose', treatment: 'Behandlung', surgery: 'OP', medication: 'Medikation', other: 'Sonstiges' };
              return (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(r.record_date), 'dd.MM.yyyy', { locale: de })} · {typeLabels[r.record_type] || r.record_type}
                      {r.vet_name && ` · ${r.vet_name}`}
                      {r.cost_amount && ` · ${r.cost_amount} €`}
                    </p>
                  </div>
                  {r.follow_up_date && (
                    <Badge variant={isPast(parseISO(r.follow_up_date)) ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                      Nachkontrolle {format(parseISO(r.follow_up_date), 'dd.MM.yyyy', { locale: de })}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteMedicalRecord.mutate({ id: r.id, petId })}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>
          <span className="flex items-center gap-2"><Heart className="h-3.5 w-3.5" />Pflege-Timeline ({caringEvents.filter(e => !e.is_completed).length} offen)</span>
        </p>
        {caringEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Noch keine Pflege-Events erfasst.</p>
        ) : (
          <div className="space-y-2">
            {caringEvents.filter(e => !e.is_completed).slice(0, 10).map(event => {
              const cfg = CARING_EVENT_TYPES[event.event_type] || CARING_EVENT_TYPES.other;
              const isOverdue = isPast(parseISO(event.scheduled_at));
              return (
                <div key={event.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border/30 bg-muted/30'}`}>
                  <span className="text-base">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(event.scheduled_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </div>
                  {isOverdue && <Badge variant="destructive" className="text-[10px]">Überfällig</Badge>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => completeCaring.mutate(event.id)}>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Datenraum — ganz unten */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>
          <span className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" /> Datenraum
          </span>
        </p>
        {tenantId ? (
          <EntityStorageTree
            key={petId}
            tenantId={tenantId}
            entityType="pet"
            entityId={petId}
            moduleCode="MOD_05"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Kein Mandant zugeordnet.</p>
        )}
      </div>

      {/* Save */}
      {Object.keys(formData).length > 0 && (
        <div className="flex justify-end pt-2 border-t border-border/30">
          <Button onClick={handleSave} disabled={updatePet.isPending}>
            {updatePet.isPending ? 'Speichern…' : 'Änderungen speichern'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PetsMeineTiere() {
  const { activeTenantId } = useAuth();
  const { data: allPets = [], isLoading } = usePets();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PETS');
  const pets = demoEnabled ? allPets : allPets.filter(p => !isDemoId(p.id));
  const createPet = useCreatePet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openPetId, setOpenPetId] = useState<string | null>(null);
  const [newPet, setNewPet] = useState({ name: '', species: 'dog' as string, breed: '' });

  const handleCreate = async () => {
    if (!newPet.name.trim()) return;
    await createPet.mutateAsync({ name: newPet.name, species: newPet.species as any, breed: newPet.breed || null });
    setNewPet({ name: '', species: 'dog', breed: '' });
    setDialogOpen(false);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="MEINE TIERE"
        description="Verwalten Sie Ihre Haustiere"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="glass" size="icon-round"><Plus className="h-5 w-5" /></Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neues Tier anlegen</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name *</Label>
                <Input value={newPet.name} onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Luna" />
              </div>
              <div>
                <Label>Tierart</Label>
                <Select value={newPet.species} onValueChange={v => setNewPet(p => ({ ...p, species: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rasse</Label>
                <Input value={newPet.breed} onChange={e => setNewPet(p => ({ ...p, breed: e.target.value }))} placeholder="z.B. Golden Retriever" />
              </div>
              <Button onClick={handleCreate} disabled={createPet.isPending || !newPet.name.trim()} className="w-full">Anlegen</Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden…</div>
      ) : pets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">Noch keine Tiere angelegt</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">Klicken Sie auf „Tier anlegen" um Ihr erstes Haustier zu registrieren.</p>
        </div>
      ) : (
        <>
          {/* Block 1: Alle Karten — IMMER geschlossen */}
          <div className={RECORD_CARD.GRID}>
            {pets.map((pet) => {
              const age = getAge(pet.birth_date);
              const summaryItems = [
                ...(pet.breed ? [{ label: '', value: `${SPECIES_LABELS[pet.species] || pet.species} · ${pet.breed}` }] : [{ label: '', value: SPECIES_LABELS[pet.species] || pet.species }]),
                ...(age ? [{ label: '', value: age }] : []),
                ...(pet.weight_kg ? [{ label: '', value: `${pet.weight_kg} kg` }] : []),
                ...(pet.chip_number ? [{ label: '', value: `Chip: ${pet.chip_number}` }] : []),
              ];
              const isDemo = isDemoId(pet.id);
              return (
                <RecordCard
                  key={pet.id}
                  id={pet.id}
                  entityType="pet"
                  isOpen={false}
                  onToggle={() => setOpenPetId(prev => prev === pet.id ? null : pet.id)}
                  thumbnailUrl={pet.photo_url || undefined}
                  title={pet.name}
                  subtitle={SPECIES_LABELS[pet.species] || pet.species}
                  summary={summaryItems}
                  glowVariant={isDemo ? 'emerald' : (openPetId === pet.id ? 'teal' : undefined)}
                  badges={isDemo ? [{ label: 'DEMO', variant: 'outline' as const }] : undefined}
                >
                  {null}
                </RecordCard>
              );
            })}
          </div>

          {/* Block 2: Inline-Dossier — NUR wenn ein Tier ausgewählt */}
          {openPetId && (
            <PetInlineDossier
              key={openPetId}
              petId={openPetId}
              tenantId={activeTenantId || undefined}
            />
          )}
        </>
      )}
    </PageShell>
  );
}

/**
 * Pets — Tierakte Detail Page
 * Full RecordCard open-state with vaccination history
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PawPrint, ArrowLeft, Syringe, Calendar } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD } from '@/config/designManifest';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePet, usePetVaccinations, useUpdatePet, useDeletePet } from '@/hooks/usePets';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isPast, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Männlich', female: 'Weiblich', unknown: 'Unbekannt',
};

export default function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: pet, isLoading } = usePet(petId);
  const { data: vaccinations = [] } = usePetVaccinations(petId);
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();
  const [isOpen, setIsOpen] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Sync pet data to form
  const currentData = { ...pet, ...formData };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!petId) return;
    updatePet.mutate({ id: petId, ...formData });
    setFormData({});
  };

  const handleDelete = async () => {
    if (!petId) return;
    await deletePet.mutateAsync(petId);
    navigate('/portal/pets/meine-tiere');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="text-center py-12 text-muted-foreground">Laden…</div>
      </PageShell>
    );
  }

  if (!pet) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">Tier nicht gefunden</h3>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/pets/meine-tiere')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate('/portal/pets/meine-tiere')}>
        <ArrowLeft className="h-4 w-4" /> Zurück zu Meine Tiere
      </Button>

      <div className={RECORD_CARD.GRID}>
        <RecordCard
          id={pet.id}
          entityType="pet"
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          thumbnailUrl={pet.photo_url || undefined}
          title={pet.name}
          subtitle={`${SPECIES_LABELS[pet.species] || pet.species}${pet.breed ? ` · ${pet.breed}` : ''}`}
          summary={[
            { label: '', value: SPECIES_LABELS[pet.species] || pet.species },
            ...(pet.breed ? [{ label: '', value: pet.breed }] : []),
            ...(pet.weight_kg ? [{ label: '', value: `${pet.weight_kg} kg` }] : []),
          ]}
          tenantId={activeTenantId || undefined}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={updatePet.isPending}
        >
          {/* ── STAMMDATEN ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Stammdaten</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Name" name="name" value={currentData.name || ''}
                onChange={e => updateField('name', e.target.value)} />
              <div>
                <Label className="text-sm">Tierart</Label>
                <Select value={currentData.species || 'dog'} onValueChange={v => updateField('species', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIES_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormInput label="Rasse" name="breed" value={currentData.breed || ''}
                onChange={e => updateField('breed', e.target.value)} />
              <div>
                <Label className="text-sm">Geschlecht</Label>
                <Select value={currentData.gender || 'unknown'} onValueChange={v => updateField('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormInput label="Geburtsdatum" name="birth_date" type="date" value={currentData.birth_date || ''}
                onChange={e => updateField('birth_date', e.target.value)} />
              <FormInput label="Gewicht (kg)" name="weight_kg" type="number" value={currentData.weight_kg?.toString() || ''}
                onChange={e => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          </div>

          {/* ── IDENTIFIKATION ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Identifikation</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Chip-Nr." name="chip_number" value={currentData.chip_number || ''}
                onChange={e => updateField('chip_number', e.target.value)} />
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={currentData.neutered || false} onCheckedChange={v => updateField('neutered', v)} />
                <Label>Kastriert / Sterilisiert</Label>
              </div>
            </div>
          </div>

          {/* ── GESUNDHEIT ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Gesundheit</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Tierarzt" name="vet_name" value={currentData.vet_name || ''}
                onChange={e => updateField('vet_name', e.target.value)} />
              <div className="md:col-span-2">
                <Label className="text-sm">Allergien</Label>
                <Textarea
                  value={(currentData.allergies || []).join(', ')}
                  onChange={e => updateField('allergies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Kommagetrennt, z.B. Getreide, Huhn"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* ── VERSICHERUNG ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Versicherung</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <FormInput label="Versicherer" name="insurance_provider" value={currentData.insurance_provider || ''}
                onChange={e => updateField('insurance_provider', e.target.value)} />
              <FormInput label="Policen-Nr." name="insurance_policy_no" value={currentData.insurance_policy_no || ''}
                onChange={e => updateField('insurance_policy_no', e.target.value)} />
            </div>
          </div>

          {/* ── NOTIZEN ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Notizen</p>
            <Textarea
              value={currentData.notes || ''}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Freitext-Notizen…"
              rows={3}
            />
          </div>

          {/* ── IMPFHISTORIE ── */}
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>
              <span className="flex items-center gap-2">
                <Syringe className="h-3.5 w-3.5" />
                Impfhistorie ({vaccinations.length})
              </span>
            </p>
            {vaccinations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Noch keine Impfungen erfasst.</p>
            ) : (
              <div className="space-y-2">
                {vaccinations.map(v => {
                  const overdue = v.next_due_at && isPast(parseISO(v.next_due_at));
                  const soonDue = v.next_due_at && !overdue && isPast(addDays(new Date(), -30));
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.vaccination_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(v.administered_at), 'dd.MM.yyyy', { locale: de })}
                          {v.vaccine_name && ` · ${v.vaccine_name}`}
                          {v.vet_name && ` · ${v.vet_name}`}
                        </p>
                      </div>
                      {v.next_due_at && (
                        <Badge variant={overdue ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                          {overdue ? 'Überfällig' : `Fällig ${format(parseISO(v.next_due_at), 'dd.MM.yyyy', { locale: de })}`}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </RecordCard>
      </div>
    </PageShell>
  );
}

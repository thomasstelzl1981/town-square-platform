/**
 * PetProfileSection — Steckbrief with large profile photo
 */
import { memo, useState, useRef } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PawPrint, Pencil, Save, X, Camera } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import type { PetSectionProps } from './types';

interface Props extends PetSectionProps {
  onPhotoUpload: (file: File) => void;
}

export const PetProfileSection = memo(function PetProfileSection({ pet, readOnly, onUpdate, onPhotoUpload }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet);
  const fileRef = useRef<HTMLInputElement>(null);

  const age = pet.birth_date ? differenceInYears(new Date(), new Date(pet.birth_date)) : null;

  const speciesEmoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : pet.species === 'bird' ? '🐦' : '🐾';

  const handleSave = () => {
    const { id, tenant_id, photo_url, ...updates } = draft;
    onUpdate(updates);
    setEditing(false);
  };

  const handlePhotoClick = () => {
    if (!readOnly) fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPhotoUpload(file);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Steckbrief"
        icon={PawPrint}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(pet); setEditing(false); }}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.FORM_GRID.FULL}>
          <FormInput label="Name" value={draft.name} required onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
          <div className="space-y-2">
            <Label>Tierart</Label>
            <Select value={draft.species} onValueChange={v => setDraft(p => ({ ...p, species: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Hund</SelectItem>
                <SelectItem value="cat">Katze</SelectItem>
                <SelectItem value="bird">Vogel</SelectItem>
                <SelectItem value="rabbit">Kaninchen</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormInput label="Rasse" value={draft.breed || ''} onChange={e => setDraft(p => ({ ...p, breed: e.target.value }))} />
          <div className="space-y-2">
            <Label>Geschlecht</Label>
            <Select value={draft.gender || 'unknown'} onValueChange={v => setDraft(p => ({ ...p, gender: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Rüde / Kater</SelectItem>
                <SelectItem value="female">Hündin / Kätzin</SelectItem>
                <SelectItem value="unknown">Unbekannt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormInput label="Geburtsdatum" type="date" value={draft.birth_date || ''} onChange={e => setDraft(p => ({ ...p, birth_date: e.target.value }))} />
          <FormInput label="Gewicht (kg)" type="number" value={draft.weight_kg?.toString() || ''} onChange={e => setDraft(p => ({ ...p, weight_kg: e.target.value ? Number(e.target.value) : null }))} />
          <FormInput label="Größe (cm)" type="number" value={draft.height_cm?.toString() || ''} onChange={e => setDraft(p => ({ ...p, height_cm: e.target.value ? Number(e.target.value) : null }))} />
          <FormInput label="Farbe" value={draft.color || ''} onChange={e => setDraft(p => ({ ...p, color: e.target.value }))} />
          <FormInput label="Chip-Nr." value={draft.chip_number || ''} onChange={e => setDraft(p => ({ ...p, chip_number: e.target.value }))} />
          <div className="flex items-center gap-3">
            <Switch checked={draft.neutered || false} onCheckedChange={v => setDraft(p => ({ ...p, neutered: v }))} />
            <Label>Kastriert / Sterilisiert</Label>
          </div>
        </div>
      </SectionCard>
    );
  }

  const genderLabel = pet.gender === 'male' ? 'Rüde' : pet.gender === 'female' ? 'Hündin' : null;

  return (
    <SectionCard
      title="Steckbrief"
      icon={PawPrint}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => { setDraft(pet); setEditing(true); }}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Profile Photo */}
        <div
          className="relative shrink-0 w-40 h-40 rounded-2xl bg-muted/30 border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden cursor-pointer group"
          onClick={handlePhotoClick}
        >
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-6xl">{speciesEmoji}</span>
          )}
          {!readOnly && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Camera className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 flex-1">
          <DataRow label="Name" value={pet.name} />
          <DataRow label="Rasse" value={pet.breed} />
          <DataRow label="Geschlecht" value={genderLabel} />
          <DataRow label="Geb." value={pet.birth_date ? `${new Date(pet.birth_date).toLocaleDateString('de-DE')}${age !== null ? ` (${age} J.)` : ''}` : null} />
          <DataRow label="Gewicht" value={pet.weight_kg ? `${pet.weight_kg} kg` : null} />
          <DataRow label="Größe" value={pet.height_cm ? `${pet.height_cm} cm` : null} />
          <DataRow label="Farbe" value={pet.color} />
          <DataRow label="Chip-Nr." value={pet.chip_number} />
          <DataRow label="Kastriert" value={pet.neutered === true ? 'Ja' : pet.neutered === false ? 'Nein' : null} />
        </div>
      </div>
    </SectionCard>
  );
});

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

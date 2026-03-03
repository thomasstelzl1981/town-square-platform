/**
 * PetHealthSection — Vet, allergies, vaccinations, treatments
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Heart, Pencil, Save, X } from 'lucide-react';
import type { PetSectionProps } from './types';

export const PetHealthSection = memo(function PetHealthSection({ pet, readOnly, onUpdate }: PetSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    vet_name: pet.vet_name || '',
    vet_practice: pet.vet_practice || '',
    vet_phone: pet.vet_phone || '',
    allergies: pet.allergies?.join(', ') || '',
    intolerances: pet.intolerances?.join(', ') || '',
  });

  const handleSave = () => {
    onUpdate({
      vet_name: draft.vet_name || null,
      vet_practice: draft.vet_practice || null,
      vet_phone: draft.vet_phone || null,
      allergies: draft.allergies ? draft.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
      intolerances: draft.intolerances ? draft.intolerances.split(',').map(s => s.trim()).filter(Boolean) : null,
    });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Gesundheit"
        icon={Heart}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft({ vet_name: pet.vet_name || '', vet_practice: pet.vet_practice || '', vet_phone: pet.vet_phone || '', allergies: pet.allergies?.join(', ') || '', intolerances: pet.intolerances?.join(', ') || '' }); setEditing(false); }}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.FORM_GRID.FULL}>
          <FormInput label="Tierarzt" value={draft.vet_name} onChange={e => setDraft(p => ({ ...p, vet_name: e.target.value }))} />
          <FormInput label="Praxis" value={draft.vet_practice} onChange={e => setDraft(p => ({ ...p, vet_practice: e.target.value }))} />
          <FormInput label="Telefon Tierarzt" value={draft.vet_phone} onChange={e => setDraft(p => ({ ...p, vet_phone: e.target.value }))} />
          <FormInput label="Allergien (kommagetrennt)" value={draft.allergies} onChange={e => setDraft(p => ({ ...p, allergies: e.target.value }))} />
          <FormInput label="Unverträglichkeiten (kommagetrennt)" value={draft.intolerances} onChange={e => setDraft(p => ({ ...p, intolerances: e.target.value }))} />
        </div>
      </SectionCard>
    );
  }

  const hasData = pet.vet_name || pet.allergies?.length || pet.intolerances?.length;

  return (
    <SectionCard
      title="Gesundheit"
      icon={Heart}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      {!hasData ? (
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Noch keine Gesundheitsdaten hinterlegt</p>
      ) : (
        <div className={DESIGN.SPACING.COMPACT}>
          {pet.vet_name && (
            <div>
              <p className="text-sm font-medium">Tierarzt: {pet.vet_name}</p>
              {pet.vet_practice && <p className={DESIGN.TYPOGRAPHY.MUTED}>Praxis: {pet.vet_practice}</p>}
              {pet.vet_phone && <p className={DESIGN.TYPOGRAPHY.MUTED}>Tel: {pet.vet_phone}</p>}
            </div>
          )}
          {pet.allergies?.length ? (
            <div>
              <p className="text-sm font-medium">Allergien</p>
              <p className={DESIGN.TYPOGRAPHY.MUTED}>{pet.allergies.join(', ')}</p>
            </div>
          ) : null}
          {pet.intolerances?.length ? (
            <div>
              <p className="text-sm font-medium">Unverträglichkeiten</p>
              <p className={DESIGN.TYPOGRAPHY.MUTED}>{pet.intolerances.join(', ')}</p>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
});

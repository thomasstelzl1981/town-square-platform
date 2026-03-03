/**
 * PetNutritionSection — Food, grooming, care details
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput, FormTextarea } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Utensils, Pencil, Save, X } from 'lucide-react';
import type { PetSectionProps } from './types';

export const PetNutritionSection = memo(function PetNutritionSection({ pet, readOnly, onUpdate }: PetSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    food_brand: pet.food_brand || '',
    food_amount: pet.food_amount || '',
    food_frequency: pet.food_frequency || '',
    food_notes: pet.food_notes || '',
    grooming_notes: pet.grooming_notes || '',
  });

  const handleSave = () => {
    onUpdate({
      food_brand: draft.food_brand || null,
      food_amount: draft.food_amount || null,
      food_frequency: draft.food_frequency || null,
      food_notes: draft.food_notes || null,
      grooming_notes: draft.grooming_notes || null,
    });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Ernährung & Pflege"
        icon={Utensils}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.FORM_GRID.FULL}>
          <FormInput label="Futter / Marke" value={draft.food_brand} onChange={e => setDraft(p => ({ ...p, food_brand: e.target.value }))} />
          <FormInput label="Menge" value={draft.food_amount} onChange={e => setDraft(p => ({ ...p, food_amount: e.target.value }))} />
          <FormInput label="Häufigkeit" value={draft.food_frequency} onChange={e => setDraft(p => ({ ...p, food_frequency: e.target.value }))} placeholder="z.B. 2x täglich" />
          <div className="md:col-span-2">
            <FormTextarea label="Besonderheiten Futter" value={draft.food_notes} onChange={e => setDraft(p => ({ ...p, food_notes: e.target.value }))} rows={2} />
          </div>
          <div className="md:col-span-2">
            <FormTextarea label="Fellpflege & Hygiene" value={draft.grooming_notes} onChange={e => setDraft(p => ({ ...p, grooming_notes: e.target.value }))} rows={2} />
          </div>
        </div>
      </SectionCard>
    );
  }

  const hasData = pet.food_brand || pet.grooming_notes;

  return (
    <SectionCard
      title="Ernährung & Pflege"
      icon={Utensils}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      {!hasData ? (
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Noch keine Angaben zur Ernährung</p>
      ) : (
        <div className={DESIGN.SPACING.COMPACT}>
          {pet.food_brand && <p className="text-sm"><span className="text-muted-foreground">Futter:</span> {pet.food_brand}</p>}
          {pet.food_amount && <p className="text-sm"><span className="text-muted-foreground">Menge:</span> {pet.food_amount} {pet.food_frequency ? `(${pet.food_frequency})` : ''}</p>}
          {pet.food_notes && <p className="text-sm"><span className="text-muted-foreground">Besonderheiten:</span> {pet.food_notes}</p>}
          {pet.grooming_notes && <p className="text-sm"><span className="text-muted-foreground">Pflege:</span> {pet.grooming_notes}</p>}
        </div>
      )}
    </SectionCard>
  );
});

/**
 * PetNotesSection — Free-text notes
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Pencil, Save, X } from 'lucide-react';
import type { PetSectionProps } from './types';

export const PetNotesSection = memo(function PetNotesSection({ pet, readOnly, onUpdate }: PetSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet.notes || '');

  const handleSave = () => {
    onUpdate({ notes: draft || null });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Notizen"
        icon={StickyNote}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(pet.notes || ''); setEditing(false); }}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4} placeholder="Freitext-Notizen zum Tier..." />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Notizen"
      icon={StickyNote}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      {pet.notes ? (
        <p className="text-sm whitespace-pre-wrap">{pet.notes}</p>
      ) : (
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Notizen</p>
      )}
    </SectionCard>
  );
});

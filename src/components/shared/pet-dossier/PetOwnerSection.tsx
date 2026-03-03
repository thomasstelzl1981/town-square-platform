/**
 * PetOwnerSection — Besitzer/Kunde inline section
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { User, Pencil, Save, X } from 'lucide-react';
import type { PetOwnerData } from './types';

interface Props {
  owner: PetOwnerData;
  readOnly: boolean;
  onUpdate: (data: Partial<PetOwnerData>) => void;
}

export const PetOwnerSection = memo(function PetOwnerSection({ owner, readOnly, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(owner);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(owner);
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Besitzer"
        icon={User}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.FORM_GRID.FULL}>
          <FormInput label="Vorname" value={draft.first_name || ''} onChange={e => setDraft(p => ({ ...p, first_name: e.target.value }))} />
          <FormInput label="Nachname" value={draft.last_name || ''} onChange={e => setDraft(p => ({ ...p, last_name: e.target.value }))} />
          <FormInput label="E-Mail" type="email" value={draft.email || ''} onChange={e => setDraft(p => ({ ...p, email: e.target.value }))} />
          <FormInput label="Telefon" value={draft.phone || ''} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))} />
          {draft.address !== undefined && (
            <>
              <FormInput label="Adresse" value={draft.address || ''} onChange={e => setDraft(p => ({ ...p, address: e.target.value }))} />
              <FormInput label="Stadt" value={draft.city || ''} onChange={e => setDraft(p => ({ ...p, city: e.target.value }))} />
              <FormInput label="PLZ" value={draft.postal_code || ''} onChange={e => setDraft(p => ({ ...p, postal_code: e.target.value }))} />
            </>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Besitzer"
      icon={User}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className={DESIGN.SPACING.COMPACT}>
          <p className="font-semibold text-base">{owner.first_name} {owner.last_name}</p>
          {owner.email && <p className={DESIGN.TYPOGRAPHY.MUTED}>📧 {owner.email}</p>}
          {owner.phone && <p className={DESIGN.TYPOGRAPHY.MUTED}>📱 {owner.phone}</p>}
          {owner.address && (
            <p className={DESIGN.TYPOGRAPHY.MUTED}>📍 {owner.address}{owner.postal_code ? `, ${owner.postal_code}` : ''} {owner.city || ''}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
});

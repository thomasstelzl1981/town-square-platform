/**
 * PetBehaviorSection — Compatibility, training, fears
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput, FormTextarea } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dog, Pencil, Save, X } from 'lucide-react';
import type { PetSectionProps } from './types';

export const PetBehaviorSection = memo(function PetBehaviorSection({ pet, readOnly, onUpdate }: PetSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    compatible_dogs: pet.compatible_dogs ?? true,
    compatible_cats: pet.compatible_cats ?? true,
    compatible_children: pet.compatible_children ?? true,
    leash_required: pet.leash_required ?? false,
    muzzle_required: pet.muzzle_required ?? false,
    training_level: pet.training_level || '',
    fears: pet.fears?.join(', ') || '',
    behavior_notes: pet.behavior_notes || '',
  });

  const handleSave = () => {
    onUpdate({
      compatible_dogs: draft.compatible_dogs,
      compatible_cats: draft.compatible_cats,
      compatible_children: draft.compatible_children,
      leash_required: draft.leash_required,
      muzzle_required: draft.muzzle_required,
      training_level: draft.training_level || null,
      fears: draft.fears ? draft.fears.split(',').map(s => s.trim()).filter(Boolean) : null,
      behavior_notes: draft.behavior_notes || null,
    });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Verhalten & Training"
        icon={Dog}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.SPACING.COMPACT}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SwitchRow label="Verträglich mit Hunden" checked={draft.compatible_dogs} onChange={v => setDraft(p => ({ ...p, compatible_dogs: v }))} />
            <SwitchRow label="Verträglich mit Katzen" checked={draft.compatible_cats} onChange={v => setDraft(p => ({ ...p, compatible_cats: v }))} />
            <SwitchRow label="Verträglich mit Kindern" checked={draft.compatible_children} onChange={v => setDraft(p => ({ ...p, compatible_children: v }))} />
            <SwitchRow label="Leinenpflicht" checked={draft.leash_required} onChange={v => setDraft(p => ({ ...p, leash_required: v }))} />
            <SwitchRow label="Maulkorb erforderlich" checked={draft.muzzle_required} onChange={v => setDraft(p => ({ ...p, muzzle_required: v }))} />
          </div>
          <div className={DESIGN.FORM_GRID.FULL}>
            <FormInput label="Training-Level" value={draft.training_level} onChange={e => setDraft(p => ({ ...p, training_level: e.target.value }))} placeholder="z.B. Grundgehorsam" />
            <FormInput label="Ängste (kommagetrennt)" value={draft.fears} onChange={e => setDraft(p => ({ ...p, fears: e.target.value }))} placeholder="z.B. Gewitter, Feuerwerk" />
            <div className="md:col-span-2">
              <FormTextarea label="Besonderheiten" value={draft.behavior_notes} onChange={e => setDraft(p => ({ ...p, behavior_notes: e.target.value }))} rows={2} />
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Verhalten & Training"
      icon={Dog}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      <div className={DESIGN.SPACING.COMPACT}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <CompatBadge label="Hunde" ok={pet.compatible_dogs ?? true} />
          <CompatBadge label="Katzen" ok={pet.compatible_cats ?? true} />
          <CompatBadge label="Kinder" ok={pet.compatible_children ?? true} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {pet.leash_required && <span className="text-sm bg-destructive/10 text-destructive rounded-lg px-3 py-1.5 text-center">Leinenpflicht</span>}
          {pet.muzzle_required && <span className="text-sm bg-destructive/10 text-destructive rounded-lg px-3 py-1.5 text-center">Maulkorb</span>}
        </div>
        {pet.training_level && <p className="text-sm"><span className="text-muted-foreground">Training:</span> {pet.training_level}</p>}
        {pet.fears?.length ? <p className="text-sm"><span className="text-muted-foreground">Ängste:</span> {pet.fears.join(', ')}</p> : null}
        {pet.behavior_notes && <p className="text-sm"><span className="text-muted-foreground">Besonderheiten:</span> {pet.behavior_notes}</p>}
      </div>
    </SectionCard>
  );
});

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label className="text-sm">{label}</Label>
    </div>
  );
}

function CompatBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`text-sm rounded-lg px-3 py-1.5 text-center ${ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

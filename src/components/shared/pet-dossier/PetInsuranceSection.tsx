/**
 * PetInsuranceSection — Insurance details
 */
import { memo, useState } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { FormInput } from '@/components/shared/FormSection';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Shield, Pencil, Save, X } from 'lucide-react';
import type { PetSectionProps } from './types';

export const PetInsuranceSection = memo(function PetInsuranceSection({ pet, readOnly, onUpdate }: PetSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    insurance_provider: pet.insurance_provider || '',
    insurance_policy_no: pet.insurance_policy_no || '',
    insurance_type: pet.insurance_type || '',
    insurance_premium_monthly: pet.insurance_premium_monthly?.toString() || '',
    insurance_deductible: pet.insurance_deductible?.toString() || '',
    insurance_valid_until: pet.insurance_valid_until || '',
  });

  const handleSave = () => {
    onUpdate({
      insurance_provider: draft.insurance_provider || null,
      insurance_policy_no: draft.insurance_policy_no || null,
      insurance_type: draft.insurance_type || null,
      insurance_premium_monthly: draft.insurance_premium_monthly ? Number(draft.insurance_premium_monthly) : null,
      insurance_deductible: draft.insurance_deductible ? Number(draft.insurance_deductible) : null,
      insurance_valid_until: draft.insurance_valid_until || null,
    });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <SectionCard
        title="Versicherung"
        icon={Shield}
        headerAction={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Speichern</Button>
          </div>
        }
      >
        <div className={DESIGN.FORM_GRID.FULL}>
          <FormInput label="Anbieter" value={draft.insurance_provider} onChange={e => setDraft(p => ({ ...p, insurance_provider: e.target.value }))} />
          <FormInput label="Policen-Nr." value={draft.insurance_policy_no} onChange={e => setDraft(p => ({ ...p, insurance_policy_no: e.target.value }))} />
          <FormInput label="Typ (OP, Kranken, etc.)" value={draft.insurance_type} onChange={e => setDraft(p => ({ ...p, insurance_type: e.target.value }))} />
          <FormInput label="Beitrag (€/Monat)" type="number" value={draft.insurance_premium_monthly} onChange={e => setDraft(p => ({ ...p, insurance_premium_monthly: e.target.value }))} />
          <FormInput label="Selbstbeteiligung (€/Jahr)" type="number" value={draft.insurance_deductible} onChange={e => setDraft(p => ({ ...p, insurance_deductible: e.target.value }))} />
          <FormInput label="Gültig bis" type="date" value={draft.insurance_valid_until} onChange={e => setDraft(p => ({ ...p, insurance_valid_until: e.target.value }))} />
        </div>
      </SectionCard>
    );
  }

  const hasData = pet.insurance_provider;

  return (
    <SectionCard
      title="Versicherung"
      icon={Shield}
      headerAction={!readOnly ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button> : undefined}
    >
      {!hasData ? (
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Versicherung hinterlegt</p>
      ) : (
        <div className={DESIGN.SPACING.COMPACT}>
          <p className="text-sm"><span className="text-muted-foreground">Anbieter:</span> {pet.insurance_provider}</p>
          {pet.insurance_policy_no && <p className="text-sm"><span className="text-muted-foreground">Policen-Nr.:</span> {pet.insurance_policy_no}</p>}
          {pet.insurance_type && <p className="text-sm"><span className="text-muted-foreground">Typ:</span> {pet.insurance_type}</p>}
          {pet.insurance_premium_monthly && <p className="text-sm"><span className="text-muted-foreground">Beitrag:</span> {pet.insurance_premium_monthly.toFixed(2)} € / Monat</p>}
          {pet.insurance_deductible && <p className="text-sm"><span className="text-muted-foreground">SB:</span> {pet.insurance_deductible.toFixed(2)} € / Jahr</p>}
          {pet.insurance_valid_until && <p className="text-sm"><span className="text-muted-foreground">Gültig bis:</span> {new Date(pet.insurance_valid_until).toLocaleDateString('de-DE')}</p>}
        </div>
      )}
    </SectionCard>
  );
});

/**
 * PetDossier — Universal pet dossier component
 * 1 component, 8 sections, 3 zones, 0 collapsibles
 */
import { memo } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Loader2 } from 'lucide-react';
import { usePetDossier } from './usePetDossier';
import { PetOwnerSection } from './PetOwnerSection';
import { PetProfileSection } from './PetProfileSection';
// PetGallerySection removed — profile photo in Steckbrief is sufficient (CI: like Fahrzeuge)
import { PetHealthSection } from './PetHealthSection';
import { PetNutritionSection } from './PetNutritionSection';
import { PetInsuranceSection } from './PetInsuranceSection';
import { PetBehaviorSection } from './PetBehaviorSection';
import { PetDocumentsSection } from './PetDocumentsSection';
import { PetNotesSection } from './PetNotesSection';
import type { PetDossierContext, PetOwnerData } from './types';

interface PetDossierProps {
  petId: string;
  context: PetDossierContext;
  readOnly?: boolean;
  showOwner?: boolean;
  /** External owner override (for Z3 where owner comes from session) */
  externalOwner?: PetOwnerData | null;
  onOwnerUpdate?: (data: Partial<PetOwnerData>) => void;
  /** Z3 session token — required when context is 'z3' */
  z3SessionToken?: string | null;
}

export const PetDossier = memo(function PetDossier({
  petId,
  context,
  readOnly = false,
  showOwner = true,
  externalOwner,
  onOwnerUpdate,
  z3SessionToken,
}: PetDossierProps) {
  const {
    pet,
    owner: hookOwner,
    loading,
    updatePet,
    updateOwner,
    uploadProfilePhoto,
  } = usePetDossier(petId, context, { z3SessionToken });

  const owner = externalOwner ?? hookOwner;
  const handleOwnerUpdate = onOwnerUpdate ?? updateOwner;

  const showInsurance = context === 'z2-client';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Tierakte nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className={DESIGN.SPACING.SECTION}>
      {/* 1. Besitzer */}
      {showOwner && owner && (
        <PetOwnerSection owner={owner} readOnly={readOnly} onUpdate={handleOwnerUpdate} />
      )}

      {/* 2. Steckbrief */}
      <PetProfileSection pet={pet} readOnly={readOnly} onUpdate={updatePet} onPhotoUpload={uploadProfilePhoto} />

      {/* 3. Gesundheit */}
      <PetHealthSection pet={pet} readOnly={readOnly} onUpdate={updatePet} />

      {/* 4. Ernährung & Pflege */}
      <PetNutritionSection pet={pet} readOnly={readOnly} onUpdate={updatePet} />

      {/* 5. Versicherung (nur MOD-05 Client) */}
      {showInsurance && (
        <PetInsuranceSection pet={pet} readOnly={readOnly} onUpdate={updatePet} />
      )}

      {/* 6. Verhalten & Training */}
      <PetBehaviorSection pet={pet} readOnly={readOnly} onUpdate={updatePet} />

      {/* 7. Dokumente */}
      <PetDocumentsSection petId={pet.id} readOnly={readOnly} />

      {/* 8. Notizen */}
      <PetNotesSection pet={pet} readOnly={readOnly} onUpdate={updatePet} />
    </div>
  );
});

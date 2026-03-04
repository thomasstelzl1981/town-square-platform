/**
 * PetDocumentsSection — DMS integration via EntityStorageTree
 */
import { memo } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { FileText } from 'lucide-react';

interface Props {
  petId: string;
  tenantId: string;
  readOnly: boolean;
}

export const PetDocumentsSection = memo(function PetDocumentsSection({ petId, tenantId, readOnly }: Props) {
  return (
    <SectionCard title="Dokumente" icon={FileText}>
      <EntityStorageTree
        tenantId={tenantId}
        entityType="pet"
        entityId={petId}
        moduleCode="MOD_05"
      />
    </SectionCard>
  );
});

/**
 * PetDocumentsSection — Placeholder for DMS integration
 */
import { memo } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { DESIGN } from '@/config/designManifest';
import { FileText } from 'lucide-react';

interface Props {
  petId: string;
  readOnly: boolean;
}

export const PetDocumentsSection = memo(function PetDocumentsSection({ petId, readOnly }: Props) {
  return (
    <SectionCard title="Dokumente" icon={FileText}>
      <p className={DESIGN.TYPOGRAPHY.MUTED}>
        Dokumente werden über das DMS verwaltet. Impfpässe, EU-Heimtierausweise und Versicherungspolicen können hier verknüpft werden.
      </p>
    </SectionCard>
  );
});

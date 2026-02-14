/**
 * Pets — Fotoalbum Tab (Platzhalter)
 * Foto-Galerie pro Tier
 */
import { Camera } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function PetsFotoalbum() {
  return (
    <PageShell>
      <ModulePageHeader title="FOTOALBUM" description="Sammeln Sie hier die schönsten Momente Ihrer Tiere" />
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Fotoalbum</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Sammeln Sie hier die schönsten Momente Ihrer Tiere.
        </p>
      </div>
    </PageShell>
  );
}

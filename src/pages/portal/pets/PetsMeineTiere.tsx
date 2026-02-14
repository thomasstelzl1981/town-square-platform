/**
 * Pets — Meine Tiere Tab (Platzhalter)
 * RecordCard-Pattern wie bei Stammdaten/Personen
 */
import { PawPrint } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function PetsMeineTiere() {
  return (
    <PageShell>
      <ModulePageHeader title="MEINE TIERE" description="Verwalten Sie Ihre Haustiere mit dem RecordCard-System" />
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Noch keine Tiere angelegt</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Hier verwalten Sie Ihre Haustiere mit dem RecordCard-System.
        </p>
      </div>
    </PageShell>
  );
}

/**
 * Pets — Caring Tab (Platzhalter)
 * Pflege-Kalender, Tierarzt-Termine, Medikamente
 */
import { Heart } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function PetsCaring() {
  return (
    <PageShell>
      <ModulePageHeader title="CARING" description="Pflege-Kalender, Tierarzt-Termine und Medikamenten-Tracking" />
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Pflege & Termine</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Pflege-Kalender, Tierarzt-Termine und Medikamenten-Tracking.
        </p>
      </div>
    </PageShell>
  );
}

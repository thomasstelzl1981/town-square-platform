/**
 * Pets — Caring Tab (Platzhalter)
 * Pflege-Kalender, Tierarzt-Termine, Medikamente
 */
import { Heart } from 'lucide-react';

export default function PetsCaring() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Caring</h2>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Pflege & Termine</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Pflege-Kalender, Tierarzt-Termine und Medikamenten-Tracking.
        </p>
      </div>
    </div>
  );
}

/**
 * Pets — Meine Tiere Tab (Platzhalter)
 * RecordCard-Pattern wie bei Stammdaten/Personen
 */
import { PawPrint } from 'lucide-react';

export default function PetsMeineTiere() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PawPrint className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Meine Tiere</h2>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Noch keine Tiere angelegt</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Hier verwalten Sie Ihre Haustiere mit dem RecordCard-System.
        </p>
      </div>
    </div>
  );
}

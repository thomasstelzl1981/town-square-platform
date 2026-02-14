/**
 * Zone 1 — Petmanager Desk (Platzhalter)
 * Governance-Dashboard für das Pets-Modul (MOD-05)
 */
import { PawPrint } from 'lucide-react';

export default function PetmanagerDesk() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PawPrint className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Petmanager</h1>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Petmanager — Platzhalter</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Governance-Dashboard für das Haustier-Modul.
        </p>
      </div>
    </div>
  );
}

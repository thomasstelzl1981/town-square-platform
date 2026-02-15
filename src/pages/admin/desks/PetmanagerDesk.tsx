/**
 * Zone 1 — Petmanager Desk (Platzhalter)
 * Governance-Dashboard für das Pets-Modul (MOD-05)
 * Uses OperativeDeskShell for consistent design.
 */
import { PawPrint } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerDesk() {
  return (
    <OperativeDeskShell
      title="Petmanager"
      subtitle="Tier-Registrierung · Service-Governance · Shop-Management · Content-Moderation"
      moduleCode="MOD-05"
    >
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Petmanager — Platzhalter</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Governance-Dashboard für das Haustier-Modul wird hier implementiert.
        </p>
      </div>
    </OperativeDeskShell>
  );
}

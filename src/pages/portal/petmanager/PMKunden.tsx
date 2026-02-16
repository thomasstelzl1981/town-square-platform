/**
 * PMKunden — Kunden & Tiere (Pet Manager, read-only)
 * Placeholder until full implementation in Phase 6
 */
import { Users } from 'lucide-react';

export default function PMKunden() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Kunden & Tiere</h1>
      </div>
      <p className="text-muted-foreground">
        Übersicht Ihrer zugewiesenen Kunden und deren Tiere. Dieses Modul wird in Phase 6 vollständig implementiert.
      </p>
    </div>
  );
}

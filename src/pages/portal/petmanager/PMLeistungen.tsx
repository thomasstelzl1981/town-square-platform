/**
 * PMLeistungen — Leistungen & Verfügbarkeit (Pet Manager)
 * Placeholder until full implementation in Phase 6
 */
import { Settings } from 'lucide-react';

export default function PMLeistungen() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Leistungen & Verfügbarkeit</h1>
      </div>
      <p className="text-muted-foreground">
        Verwalten Sie Ihre Services und Kapazitäten. Dieses Modul wird in Phase 6 vollständig implementiert.
      </p>
    </div>
  );
}

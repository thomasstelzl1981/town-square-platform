/**
 * PMBuchungen — Kalender & Buchungen (Pet Manager)
 * Placeholder until full implementation in Phase 6
 */
import { Calendar } from 'lucide-react';

export default function PMBuchungen() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Kalender & Buchungen</h1>
      </div>
      <p className="text-muted-foreground">
        Hier sehen Sie Ihre zugewiesenen Buchungen. Dieses Modul wird in Phase 6 vollständig implementiert.
      </p>
    </div>
  );
}

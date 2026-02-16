/**
 * PMUebersicht — Dashboard KPIs (Pet Manager)
 * Placeholder until full implementation in Phase 6
 */
import { BarChart3 } from 'lucide-react';

export default function PMUebersicht() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Übersicht</h1>
      </div>
      <p className="text-muted-foreground">
        Dashboard mit KPIs, Umsatz und Auslastung. Dieses Modul wird in Phase 6 vollständig implementiert.
      </p>
    </div>
  );
}

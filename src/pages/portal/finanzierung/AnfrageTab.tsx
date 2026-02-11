/**
 * MOD-07: Anfrage Tab
 * Two-card layout: FinanceObjectCard + FinanceRequestCard
 * No draft creation, no DB writes — localStorage only.
 */
import FinanceObjectCard from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard from '@/components/finanzierung/FinanceRequestCard';

export default function AnfrageTab() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsanfrage</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie die Objektdaten und Ihren Finanzierungswunsch
        </p>
      </div>

      {/* Section heading: Finanzierungsobjekt */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsobjekt</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hier erfassen Sie Ihr Finanzierungsobjekt.
        </p>
      </div>

      <FinanceObjectCard storageKey="mod07-anfrage" />
      <FinanceRequestCard storageKey="mod07-anfrage" />
    </div>
  );
}

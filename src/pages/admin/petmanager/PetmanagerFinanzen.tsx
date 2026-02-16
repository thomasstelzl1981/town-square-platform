/**
 * Zone 1 — Pet Governance: Finanzen
 * Umsatz-Governance, offene Forderungen, Abrechnungen
 */
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerFinanzen() {
  return (
    <OperativeDeskShell
      title="Finanz-Governance"
      subtitle="Umsatz · Forderungen · Abrechnungen"
      moduleCode="MOD-05"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: TrendingUp, label: 'Umsatz-Übersicht', desc: 'Monatliche und jährliche Umsatzentwicklung' },
          { icon: AlertTriangle, label: 'Offene Forderungen', desc: 'Ausstehende Zahlungen und Mahnungen' },
          { icon: CreditCard, label: 'Abrechnungen', desc: 'Provider-Abrechnungen und Provisionen' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
            <Icon className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-medium text-muted-foreground">{label}</h3>
            <p className="mt-1 text-sm text-muted-foreground/70">{desc}</p>
          </div>
        ))}
      </div>
    </OperativeDeskShell>
  );
}

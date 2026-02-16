/**
 * Zone 1 — Petmanager Desk (Platzhalter)
 * Governance-Dashboard für das Pets-Modul (MOD-05)
 * Uses OperativeDeskShell for consistent design.
 */
import { PawPrint, Users, CreditCard, ShieldCheck, BarChart3 } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerDesk() {
  return (
    <OperativeDeskShell
      title="Pet Governance"
      subtitle="Provider-Übersicht · Umsatz-Governance · Service-Moderation · Franchise-Monitoring"
      moduleCode="MOD-05"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Aktive Provider', value: '—', sub: 'Verifiziert & Live' },
          { icon: CreditCard, label: 'Offene Forderungen', value: '—', sub: 'Ausstehend' },
          { icon: BarChart3, label: 'Monatsumsatz', value: '—', sub: 'Aktueller Monat' },
          { icon: ShieldCheck, label: 'Verifizierungen', value: '—', sub: 'Offen' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <PawPrint className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-base font-medium text-muted-foreground">Pet Governance Desk</h3>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Zentrale Steuerung für MOD-05 (Pets) und MOD-22 (Pet Manager). Provider-, Umsatz- und Service-Übersicht werden hier ausgebaut.
        </p>
      </div>
    </OperativeDeskShell>
  );
}

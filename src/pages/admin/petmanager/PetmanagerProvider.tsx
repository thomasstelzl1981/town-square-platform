/**
 * Zone 1 — Pet Governance: Provider
 * Provider-Verzeichnis, Verifizierungsstatus, Onboarding
 */
import { Users2, ShieldCheck, UserPlus } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerProvider() {
  return (
    <OperativeDeskShell
      title="Provider-Verwaltung"
      subtitle="Verzeichnis · Verifizierung · Onboarding"
      moduleCode="MOD-05"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Users2, label: 'Provider-Verzeichnis', desc: 'Alle registrierten Pet-Service-Provider' },
          { icon: ShieldCheck, label: 'Verifizierung', desc: 'Offene und abgeschlossene Prüfungen' },
          { icon: UserPlus, label: 'Onboarding', desc: 'Neue Provider einladen und freischalten' },
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

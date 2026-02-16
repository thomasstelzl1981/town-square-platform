/**
 * Pets — Mein Bereich Tab
 * Kundendaten, Bestellhistorie, Service-Übersicht
 */
import { User, ShoppingBag, ClipboardList } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function PetsMeinBereich() {
  return (
    <PageShell>
      <ModulePageHeader title="MEIN BEREICH" description="Kundendaten, Bestellungen und Service-Übersicht" />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: User, label: 'Kundendaten', desc: 'Ihre persönlichen Daten und Einstellungen' },
          { icon: ShoppingBag, label: 'Bestellungen', desc: 'Bestellhistorie und offene Aufträge' },
          { icon: ClipboardList, label: 'Services', desc: 'Gebuchte Services und Abonnements' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
            <Icon className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-medium text-muted-foreground">{label}</h3>
            <p className="mt-1 text-sm text-muted-foreground/70">{desc}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

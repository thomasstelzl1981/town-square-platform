/**
 * Zone 1 — Pet Governance: Services
 * Service-Katalog-Moderation, Qualitätskontrolle
 */
import { ClipboardList, Star, ShieldCheck } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerServices() {
  return (
    <OperativeDeskShell
      title="Service-Moderation"
      subtitle="Katalog · Qualitätskontrolle · Freigaben"
      moduleCode="MOD-05"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ClipboardList, label: 'Service-Katalog', desc: 'Alle angebotenen Pet-Services moderieren' },
          { icon: Star, label: 'Qualitätskontrolle', desc: 'Bewertungen und Service-Standards' },
          { icon: ShieldCheck, label: 'Freigaben', desc: 'Neue Services prüfen und freigeben' },
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

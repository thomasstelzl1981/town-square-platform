/**
 * Zone 1 — Pet Governance: Monitor
 * Franchise-Monitoring, Alerts, Audit-Trail
 */
import { Eye, Bell, FileText } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

export default function PetmanagerMonitor() {
  return (
    <OperativeDeskShell
      title="Monitoring"
      subtitle="Franchise-KPIs · Alerts · Audit-Trail"
      moduleCode="MOD-05"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Eye, label: 'Franchise-KPIs', desc: 'Performance-Metriken aller Standorte' },
          { icon: Bell, label: 'Alerts', desc: 'Warnungen und kritische Benachrichtigungen' },
          { icon: FileText, label: 'Audit-Trail', desc: 'Lückenlose Protokollierung aller Aktionen' },
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

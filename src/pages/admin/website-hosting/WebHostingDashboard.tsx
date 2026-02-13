/**
 * Zone 1 — Website Hosting Dashboard (Admin)
 */
import { PageShell } from '@/components/shared/PageShell';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WebHostingDashboard() {
  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Website Hosting</h2>
      <div className={SPACING.SECTION}>
        <div className={cn(CARD.CONTENT, 'text-center py-12')}>
          <p className={TYPOGRAPHY.MUTED}>Hosting-Verwaltung — Verträge, Domains und Monitoring</p>
          <p className={TYPOGRAPHY.HINT}>Vollständige Admin-Oberfläche wird in Phase 2 ausgebaut.</p>
        </div>
      </div>
    </PageShell>
  );
}

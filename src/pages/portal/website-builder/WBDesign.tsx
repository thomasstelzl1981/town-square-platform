/**
 * MOD-21 Website Builder — Tile 2: Design (Branding)
 */
import { PageShell } from '@/components/shared/PageShell';
import { TYPOGRAPHY, CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WBDesign() {
  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Design</h2>
      <div className={cn(CARD.CONTENT, 'text-center py-12')}>
        <p className={TYPOGRAPHY.MUTED}>Globale Branding-Einstellungen werden in Phase 2 verfügbar.</p>
        <p className={TYPOGRAPHY.HINT}>Farbschema, Schriftart, Logo — alles an einem Ort.</p>
      </div>
    </PageShell>
  );
}

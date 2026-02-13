/**
 * MOD-21 Website Builder — Tile 3: SEO
 */
import { PageShell } from '@/components/shared/PageShell';
import { TYPOGRAPHY, CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WBSeo() {
  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>SEO</h2>
      <div className={cn(CARD.CONTENT, 'text-center py-12')}>
        <p className={TYPOGRAPHY.MUTED}>SEO-Einstellungen werden in Phase 2 verfügbar.</p>
        <p className={TYPOGRAPHY.HINT}>Meta-Tags, OG-Images, robots.txt</p>
      </div>
    </PageShell>
  );
}

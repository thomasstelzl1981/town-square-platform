/**
 * MOD-21 Website Builder — Tile 4: Vertrag
 * Credits-based contract management (no Stripe)
 */
import { PageShell } from '@/components/shared/PageShell';
import { useWebsites } from '@/hooks/useWebsites';
import { useHostingContract } from '@/hooks/useHostingContract';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WBVertrag() {
  const { data: websites } = useWebsites();
  const firstWebsite = websites?.[0];

  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Hosting-Vertrag</h2>
      <div className={SPACING.SECTION}>
        {firstWebsite ? (
          <ContractCard websiteId={firstWebsite.id} websiteName={firstWebsite.name} />
        ) : (
          <div className={cn(CARD.CONTENT, 'text-center py-12')}>
            <p className={TYPOGRAPHY.MUTED}>Erstellen Sie zuerst eine Website, um einen Hosting-Vertrag abzuschließen.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ContractCard({ websiteId, websiteName }: { websiteId: string; websiteName: string }) {
  const { data: contract, isLoading } = useHostingContract(websiteId);

  if (isLoading) return <p className={TYPOGRAPHY.MUTED}>Laden...</p>;

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: 'Aktiv (Credits-basiert)', color: 'text-emerald-600' },
    pending: { label: 'Ausstehend', color: 'text-amber-600' },
    suspended: { label: 'Gesperrt', color: 'text-destructive' },
    cancelled: { label: 'Gekündigt', color: 'text-muted-foreground' },
  };

  return (
    <div className={cn(CARD.CONTENT, 'space-y-3')}>
      <h3 className={TYPOGRAPHY.CARD_TITLE}>{websiteName}</h3>
      {contract ? (
        <>
          <div className="flex items-center gap-2">
            <span className={TYPOGRAPHY.LABEL}>Status:</span>
            <span className={cn('text-sm font-medium', statusMap[contract.status]?.color)}>
              {statusMap[contract.status]?.label || contract.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={TYPOGRAPHY.LABEL}>Abrechnung:</span>
            <span className="text-sm">Credits-basiert (Pay-Per-Use)</span>
          </div>
          {contract.credits_charged > 0 && (
            <div className="flex items-center gap-2">
              <span className={TYPOGRAPHY.LABEL}>Verbrauchte Credits:</span>
              <span className="text-sm">{contract.credits_charged}</span>
            </div>
          )}
          {contract.accepted_terms_at && (
            <p className={TYPOGRAPHY.HINT}>
              Vertrag abgeschlossen am {new Date(contract.accepted_terms_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </>
      ) : (
        <p className={TYPOGRAPHY.MUTED}>Kein Hosting-Vertrag vorhanden. Veröffentlichen Sie Ihre Website, um das Hosting zu aktivieren.</p>
      )}
    </div>
  );
}

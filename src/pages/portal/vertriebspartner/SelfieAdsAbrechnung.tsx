/**
 * Selfie Ads Abrechnung — Zahlungen & Rechnungen (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function SelfieAdsAbrechnung() {
  return (
    <PageShell>
      <ModulePageHeader title="Abrechnung" description="Zahlungen und Rechnungen für Selfie Ads Mandate" />

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={CreditCard}
            title="Noch keine Abrechnungen"
            description="Nach Ihrer ersten Kampagnen-Beauftragung erscheinen hier Zahlungsübersicht und Rechnungen."
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}

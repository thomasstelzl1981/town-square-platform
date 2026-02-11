/**
 * Selfie Ads Abrechnung — Zahlungen & Rechnungen (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SelfieAdsAbrechnung() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Abrechnung</h1>
        <p className="text-muted-foreground mt-1">Zahlungen und Rechnungen für Selfie Ads Mandate</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={CreditCard}
            title="Noch keine Abrechnungen"
            description="Nach Ihrer ersten Kampagnen-Beauftragung erscheinen hier Zahlungsübersicht und Rechnungen."
          />
        </CardContent>
      </Card>
    </div>
  );
}

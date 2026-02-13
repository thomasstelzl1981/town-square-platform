/**
 * Selfie Ads Performance — Performance Dashboard (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function SelfieAdsPerformance() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <ModulePageHeader title="Performance" description="Kampagnen-Performance & Lead-Auswertung" />

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={BarChart3}
            title="Noch keine Performance-Daten"
            description="Sobald Ihre erste Kampagne live ist, erscheinen hier Leads, CPL und Conversion-Daten in Echtzeit."
            action={{
              label: 'Kampagne planen',
              onClick: () => navigate('/portal/vertriebspartner/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}

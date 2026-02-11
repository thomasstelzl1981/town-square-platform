/**
 * Selfie Ads Performance — Performance Dashboard (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SelfieAdsPerformance() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Performance</h1>
        <p className="text-muted-foreground mt-1">Kampagnen-Performance & Lead-Auswertung</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={BarChart3}
            title="Noch keine Performance-Daten"
            description="Sobald Ihre erste Kampagne live ist, erscheinen hier Leads, CPL und Conversion-Daten in Echtzeit."
            action={{
              label: 'Kampagne planen',
              onClick: () => navigate('/portal/leads/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

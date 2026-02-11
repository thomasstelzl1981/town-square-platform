/**
 * Selfie Ads Kampagnen — Meine Kampagnen (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SelfieAdsKampagnen() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Meine Kampagnen</h1>
          <p className="text-muted-foreground mt-1">Beauftragte Kaufy Selfie Ads Mandate</p>
        </div>
        <Button onClick={() => navigate('/portal/leads/selfie-ads-planen')} className="gap-2">
          <Plus className="h-4 w-4" /> Neue Kampagne
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={Megaphone}
            title="Noch keine Kampagnen beauftragt"
            description="Planen und beauftragen Sie Ihre erste Selfie Ads Kampagne, um hier den Status und die Ergebnisse zu verfolgen."
            action={{
              label: 'Erste Kampagne planen',
              onClick: () => navigate('/portal/leads/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

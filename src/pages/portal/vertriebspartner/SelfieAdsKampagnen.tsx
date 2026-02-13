/**
 * Selfie Ads Kampagnen — Meine Kampagnen (Zone 2)
 * Clean empty-state, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function SelfieAdsKampagnen() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <ModulePageHeader
        title="Meine Kampagnen"
        description="Beauftragte Kaufy Selfie Ads Mandate"
        actions={
          <Button onClick={() => navigate('/portal/vertriebspartner/selfie-ads-planen')} className="gap-2">
            <Plus className="h-4 w-4" /> Neue Kampagne
          </Button>
        }
      />

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={Megaphone}
            title="Noch keine Kampagnen beauftragt"
            description="Planen und beauftragen Sie Ihre erste Selfie Ads Kampagne, um hier den Status und die Ergebnisse zu verfolgen."
            action={{
              label: 'Erste Kampagne planen',
              onClick: () => navigate('/portal/vertriebspartner/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}

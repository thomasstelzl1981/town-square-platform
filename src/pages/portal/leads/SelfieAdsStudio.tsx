/**
 * Selfie Ads Studio — Überblick (Zone 2, unter /portal/leads/selfie-ads)
 * Clean empty-state when no campaigns exist, showcase-ready
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, ArrowRight, BarChart3, FileText, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell, WidgetHeader } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SelfieAdsStudio() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center justify-between">
        <WidgetHeader
          icon={Megaphone}
          title="Selfie Ads Studio"
          description="Kaufy Social-Media-Kampagnen beauftragen"
        />
        <Button onClick={() => navigate('/portal/leads/selfie-ads-planen')} className="gap-2">
          <Plus className="h-4 w-4" />
          Kampagne planen
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={Megaphone}
            title="Noch keine Kampagnen beauftragt"
            description="Planen Sie Ihre erste Selfie Ads Kampagne — Kaufy veröffentlicht sie auf Social Media und liefert Leads direkt in Ihre Inbox."
            action={{
              label: 'Erste Kampagne planen',
              onClick: () => navigate('/portal/leads/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/portal/leads/selfie-ads-kampagnen')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Meine Kampagnen</p>
              <p className="text-xs text-muted-foreground">Beauftragungen einsehen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/portal/leads/selfie-ads-performance')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Performance</p>
              <p className="text-xs text-muted-foreground">Leads & Kennzahlen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/portal/leads/selfie-ads-abrechnung')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Abrechnung</p>
              <p className="text-xs text-muted-foreground">Zahlungen & Rechnungen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-muted/50">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-medium">So funktioniert Selfie Ads</p>
          <div className="space-y-2">
            {[
              'Wählen Sie Zielgruppe, Region und Budget für Ihre Kampagne.',
              'Kaufy erstellt und veröffentlicht die Anzeigen auf Meta & Social Media.',
              'Generierte Leads erscheinen automatisch in Ihrer Inbox.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">{i + 1}</div>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

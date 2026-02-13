/**
 * LeadsTab — MOD-09 Vertriebspartner Lead-Management
 * One-Pager Flow nach dem Manager-Modul-Muster (wie MOD-11/12)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, Users, TrendingUp, Inbox, ArrowRight, 
  BarChart3, Target, Plus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DESIGN } from '@/config/designManifest';

export default function LeadsTab() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <ModulePageHeader 
        title="Leads" 
        description="Lead-Generierung und -Verwaltung für Ihren Vertrieb"
        actions={
          <Button onClick={() => navigate('/portal/vertriebspartner/selfie-ads')} className="gap-2">
            <Megaphone className="h-4 w-4" />
            Selfie Ads Studio
          </Button>
        }
      />

      {/* Widget Grid */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Inbox className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Neue Leads</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">In Bearbeitung</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Konvertiert</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="glass-card hover:border-primary/30 transition-colors cursor-pointer border-primary/20"
          onClick={() => navigate('/portal/vertriebspartner/selfie-ads')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Selfie Ads Studio</p>
              <p className="text-xs text-muted-foreground">Kampagnen beauftragen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Lead-Generierungs-Flow */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={Target}
            title="Noch keine Leads vorhanden"
            description="Starten Sie eine Selfie Ads Kampagne, um automatisch Leads zu generieren, oder erhalten Sie Leads über Partner-Zuweisungen."
            action={{
              label: 'Erste Kampagne planen',
              onClick: () => navigate('/portal/vertriebspartner/selfie-ads-planen'),
            }}
          />
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-muted/50">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-medium">So funktioniert Lead-Generierung</p>
          <div className="space-y-2">
            {[
              'Beauftragen Sie eine Selfie Ads Kampagne über das Studio.',
              'Kaufy veröffentlicht Anzeigen auf Social Media mit Ihrem Profil.',
              'Generierte Leads erscheinen automatisch hier zur Bearbeitung.',
              'Konvertieren Sie qualifizierte Leads zu Kunden und Deals.',
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

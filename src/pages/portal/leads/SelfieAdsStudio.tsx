/**
 * Selfie Ads Studio — Überblick (Zone 2, unter /portal/leads/selfie-ads)
 * Widget-Karten: Aktive Kampagnen, Neue Leads, Performance, Letzte Beauftragungen
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, TrendingUp, Users, FileText, Plus, ArrowRight, Eye, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell, KPICard, WidgetHeader, ListRow } from '@/components/shared';

const demoKampagnen = [
  { id: 1, name: 'Kapitalanleger München Q1', status: 'live', leads: 12, budget: '2.500 €' },
  { id: 2, name: 'Vermögensaufbau Berlin', status: 'ended', leads: 34, budget: '4.000 €' },
  { id: 3, name: 'Rendite-Immobilien Hamburg', status: 'scheduled', leads: 0, budget: '3.000 €' },
];

const demoLeads = [
  { id: 1, name: 'Max Müller', region: 'München', zeit: 'vor 2h', template: 'T1' },
  { id: 2, name: 'Anna Schmidt', region: 'Berlin', zeit: 'vor 5h', template: 'T3' },
  { id: 3, name: 'Peter Weber', region: 'Hamburg', zeit: 'gestern', template: 'T2' },
];

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Aktive Kampagnen" value="2" icon={Megaphone} />
        <KPICard label="Neue Leads" value="5" icon={Target} />
        <KPICard label="Ø CPL" value="18,50 €" icon={TrendingUp} />
        <KPICard label="Beauftragungen" value="3" icon={FileText} />
      </div>

      {/* Demo Kampagnen */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <WidgetHeader
              icon={Megaphone}
              title="Letzte Beauftragungen"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/portal/leads/selfie-ads-kampagnen')} className="gap-1 text-xs">
                  Alle anzeigen <ArrowRight className="h-3 w-3" />
                </Button>
              }
            />
          </div>
          <div className="space-y-3">
            {demoKampagnen.map((k) => (
              <ListRow key={k.id}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground">{k.budget} · {k.leads} Leads</p>
                  </div>
                </div>
                <Badge variant={k.status === 'live' ? 'default' : k.status === 'scheduled' ? 'secondary' : 'outline'}>
                  {k.status === 'live' ? 'Live' : k.status === 'scheduled' ? 'Geplant' : 'Beendet'}
                </Badge>
              </ListRow>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Leads */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <WidgetHeader
              icon={Users}
              title="Neue Leads"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/portal/leads/selfie-ads-performance')} className="gap-1 text-xs">
                  Performance <ArrowRight className="h-3 w-3" />
                </Button>
              }
            />
          </div>
          <div className="space-y-2">
            {demoLeads.map((l) => (
              <ListRow key={l.id}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.region} · Slot {l.template} · {l.zeit}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
              </ListRow>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

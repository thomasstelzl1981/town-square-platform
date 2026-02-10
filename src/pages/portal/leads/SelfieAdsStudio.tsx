/**
 * Selfie Ads Studio — Überblick (Zone 2, unter /portal/leads/selfie-ads)
 * Widget-Karten: Aktive Kampagnen, Neue Leads, Performance, Letzte Beauftragungen
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, TrendingUp, Users, FileText, Plus, ArrowRight, Eye, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Selfie Ads Studio</h1>
            <p className="text-sm text-muted-foreground">Kaufy Social-Media-Kampagnen beauftragen</p>
          </div>
        </div>
        <Button onClick={() => navigate('/portal/leads/selfie-ads-planen')} className="gap-2">
          <Plus className="h-4 w-4" />
          Kampagne planen
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Aktive Kampagnen', value: '2', icon: Megaphone, color: 'text-blue-600' },
          { label: 'Neue Leads', value: '5', icon: Target, color: 'text-green-600' },
          { label: 'Ø CPL', value: '18,50 €', icon: TrendingUp, color: 'text-amber-600' },
          { label: 'Beauftragungen', value: '3', icon: FileText, color: 'text-purple-600' },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Kampagnen */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Letzte Beauftragungen</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/leads/selfie-ads-kampagnen')} className="gap-1 text-xs">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {demoKampagnen.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Leads */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Neue Leads</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/leads/selfie-ads-performance')} className="gap-1 text-xs">
              Performance <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {demoLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.region} · Slot {l.template} · {l.zeit}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Selfie Ads Performance — Performance Dashboard (Zone 2)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, CreditCard, BarChart3, MapPin } from 'lucide-react';

export default function SelfieAdsPerformance() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Performance</h1>
          <p className="text-sm text-muted-foreground">Kampagnen-Performance & Lead-Auswertung</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt Leads', value: '46', icon: Target },
          { label: 'Ø CPL', value: '18,50 €', icon: CreditCard },
          { label: 'Aktive Kampagnen', value: '2', icon: BarChart3 },
          { label: 'Top Region', value: 'München', icon: MapPin },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Placeholder */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Leads über Zeit</h3>
          <div className="h-48 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Recharts-Diagramm (wird mit Live-Daten gefüllt)</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Templates */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4">Top Templates</h3>
          <div className="space-y-2">
            {[
              { name: 'T1: Rendite-Highlight', leads: 18, cpl: '16,20 €' },
              { name: 'T3: Objekt-Showcase', leads: 15, cpl: '19,00 €' },
              { name: 'T5: Region-Focus', leads: 13, cpl: '21,30 €' },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm font-medium">{t.name}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{t.leads} Leads</Badge>
                  <span className="text-xs text-muted-foreground">CPL {t.cpl}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Selfie Ads Performance — Performance Dashboard (Zone 2)
 * Mit Recharts-Diagramm, Top Templates, Region
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, CreditCard, BarChart3, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const leadsOverTime = [
  { week: 'KW 1', leads: 3, spend: 180 },
  { week: 'KW 2', leads: 7, spend: 320 },
  { week: 'KW 3', leads: 12, spend: 290 },
  { week: 'KW 4', leads: 9, spend: 250 },
  { week: 'KW 5', leads: 15, spend: 200 },
];

const regionData = [
  { region: 'München', leads: 22, cpl: 16.5 },
  { region: 'Berlin', leads: 14, cpl: 21.0 },
  { region: 'Hamburg', leads: 10, cpl: 19.8 },
];

export default function SelfieAdsPerformance() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Performance</h1>
        <p className="text-muted-foreground mt-1">Kampagnen-Performance & Lead-Auswertung</p>
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

      {/* Leads über Zeit */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Leads über Zeit</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* CPL Trend */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Spend pro Woche (EUR)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Spend €" />
              </LineChart>
            </ResponsiveContainer>
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

      {/* Region Performance */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Region Performance</h3>
          <div className="space-y-2">
            {regionData.map((r) => (
              <div key={r.region} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm font-medium">{r.region}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{r.leads} Leads</Badge>
                  <span className="text-xs text-muted-foreground">CPL {r.cpl.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

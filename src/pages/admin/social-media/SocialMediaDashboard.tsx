/**
 * Social Media Dashboard — Zone 1 Admin
 * KPIs: Aktive Kampagnen, Neue Mandate, Neue Leads, Spend
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, FileText, Target, CreditCard, TrendingUp, Users } from 'lucide-react';

const demoStats = [
  { label: 'Aktive Kampagnen', value: '5', icon: Megaphone, trend: '+2' },
  { label: 'Neue Mandate', value: '3', icon: FileText, trend: '+1' },
  { label: 'Neue Leads (7d)', value: '28', icon: Target, trend: '+12' },
  { label: 'Spend diese Woche', value: '1.240 €', icon: CreditCard, trend: '' },
];

const demoMandates = [
  { partner: 'Max Berater GmbH', status: 'live', budget: '2.500 €' },
  { partner: 'Immofin Partner AG', status: 'review', budget: '4.000 €' },
  { partner: 'Schmidt Vertrieb', status: 'submitted', budget: '1.500 €' },
];

export default function SocialMediaDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Social Media</h1>
          <p className="text-sm text-muted-foreground">Kaufy Publishing + Partner-Mandatsverwaltung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {demoStats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                  {s.trend && <span className="text-xs text-green-600">{s.trend}</span>}
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent mandates */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Neue Mandate</h3>
          <div className="space-y-2">
            {demoMandates.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{m.partner}</p>
                    <p className="text-xs text-muted-foreground">{m.budget}</p>
                  </div>
                </div>
                <Badge variant={m.status === 'live' ? 'default' : m.status === 'review' ? 'secondary' : 'outline'}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Templates */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4">Top Templates</h3>
          <div className="grid grid-cols-5 gap-3">
            {['T1: Rendite', 'T2: Portrait', 'T3: Showcase', 'T4: Testimonial', 'T5: Region'].map((t) => (
              <div key={t} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                <div className="h-12 w-full rounded bg-muted/50 mb-2" />
                <p className="text-xs">{t}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

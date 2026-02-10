/**
 * Social Media Dashboard — Zone 1 Admin
 * KPIs + Neue Mandate + Top Templates + Spend Chart
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, FileText, Target, CreditCard, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const demoStats = [
  { label: 'Aktive Kampagnen', value: '5', icon: Megaphone, trend: '+2' },
  { label: 'Aktive Mandate', value: '3', icon: FileText, trend: '+1' },
  { label: 'Neue Leads (7d)', value: '28', icon: Target, trend: '+12' },
  { label: 'Spend diese Woche', value: '1.240 €', icon: CreditCard, trend: '' },
];

const demoMandates = [
  { partner: 'Max Berater GmbH', status: 'live', budget: '2.500 €', leads: 12 },
  { partner: 'Immofin Partner AG', status: 'review', budget: '4.000 €', leads: 0 },
  { partner: 'Richter Consulting', status: 'scheduled', budget: '5.000 €', leads: 0 },
];

const spendData = [
  { day: 'Mo', spend: 180 },
  { day: 'Di', spend: 220 },
  { day: 'Mi', spend: 160 },
  { day: 'Do', spend: 290 },
  { day: 'Fr', spend: 240 },
  { day: 'Sa', spend: 80 },
  { day: 'So', spend: 70 },
];

export default function SocialMediaDashboard() {
  const navigate = useNavigate();

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

      {/* Spend Chart */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Spend diese Woche (EUR)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Spend €" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent mandates */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Aktive Mandate</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/social-media/vertrieb')} className="gap-1 text-xs">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {demoMandates.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/social-media/vertrieb')}>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{m.partner}</p>
                    <p className="text-xs text-muted-foreground">{m.budget} · {m.leads} Leads</p>
                  </div>
                </div>
                <Badge variant={m.status === 'live' ? 'default' : m.status === 'review' ? 'secondary' : 'outline'}>
                  {m.status === 'live' ? 'Live' : m.status === 'review' ? 'In Prüfung' : 'Geplant'}
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
              <div key={t} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/social-media/templates')}>
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

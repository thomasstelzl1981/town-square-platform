/**
 * Social Media Abrechnung — Gesamt-Spend & Partner-Abrechnung (Zone 1)
 * Erweitert mit Spend-Tracking und Export
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const demoEntries = [
  { partner: 'Max Berater GmbH', mandat: 'München Q1', prepaid: 2500, spend: 1240, status: 'active', leads: 12 },
  { partner: 'Immofin Partner AG', mandat: 'Berlin', prepaid: 4000, spend: 0, status: 'pending', leads: 0 },
  { partner: 'Weber Finanzen', mandat: 'Hamburg', prepaid: 3000, spend: 3000, status: 'completed', leads: 34 },
  { partner: 'Richter Consulting', mandat: 'Frankfurt + Stuttgart', prepaid: 5000, spend: 800, status: 'active', leads: 4 },
];

const spendByWeek = [
  { week: 'KW 5', spend: 420 },
  { week: 'KW 6', spend: 580 },
  { week: 'KW 7', spend: 380 },
  { week: 'KW 8', spend: 640 },
  { week: 'KW 9', spend: 520 },
];

const totalPrepaid = demoEntries.reduce((s, e) => s + e.prepaid, 0);
const totalSpend = demoEntries.reduce((s, e) => s + e.spend, 0);
const totalLeads = demoEntries.reduce((s, e) => s + e.leads, 0);

const formatBudget = (amount: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

export default function SocialMediaAbrechnung() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Abrechnung</h1>
            <p className="text-sm text-muted-foreground">Gesamt-Spend, Partner-Abrechnung & Exports</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Export wird vorbereitet...')}><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Prepaid</p><p className="text-2xl font-bold mt-1">{formatBudget(totalPrepaid)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Spend</p><p className="text-2xl font-bold mt-1">{formatBudget(totalSpend)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Verbleibend</p><p className="text-2xl font-bold mt-1">{formatBudget(totalPrepaid - totalSpend)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Leads</p><p className="text-2xl font-bold mt-1">{totalLeads}</p><p className="text-xs text-muted-foreground">Ø CPL {totalLeads > 0 ? formatBudget(totalSpend / totalLeads) : '—'}</p></CardContent></Card>
      </div>

      {/* Spend chart */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Spend pro Woche</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByWeek}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Spend €" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Partner-Abrechnung */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Partner-Abrechnung</h3>
          <div className="space-y-2">
            {demoEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{e.partner}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.mandat} · Prepaid: {formatBudget(e.prepaid)} · Spend: {formatBudget(e.spend)} · {e.leads} Leads
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {e.spend > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Rest: {formatBudget(e.prepaid - e.spend)}
                    </span>
                  )}
                  <Badge variant={e.status === 'active' ? 'default' : e.status === 'pending' ? 'secondary' : 'outline'}>
                    {e.status === 'active' ? 'Aktiv' : e.status === 'pending' ? 'Ausstehend' : 'Abgeschlossen'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

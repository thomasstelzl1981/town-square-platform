/**
 * Social Media Abrechnung — Gesamt-Spend & Partner-Abrechnung (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, FileText } from 'lucide-react';

const demoEntries = [
  { partner: 'Max Berater GmbH', mandat: 'München Q1', prepaid: '2.500 €', spend: '1.240 €', status: 'active' },
  { partner: 'Immofin Partner AG', mandat: 'Berlin', prepaid: '4.000 €', spend: '0 €', status: 'pending' },
  { partner: 'Weber Finanzen', mandat: 'Hamburg', prepaid: '3.000 €', spend: '3.000 €', status: 'completed' },
];

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
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Prepaid</p><p className="text-2xl font-bold mt-1">9.500 €</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Spend</p><p className="text-2xl font-bold mt-1">4.240 €</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Verbleibend</p><p className="text-2xl font-bold mt-1">5.260 €</p></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Partner-Abrechnung</h3>
          <div className="space-y-2">
            {demoEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <p className="text-sm font-medium">{e.partner}</p>
                  <p className="text-xs text-muted-foreground">{e.mandat} · Prepaid: {e.prepaid} · Spend: {e.spend}</p>
                </div>
                <Badge variant={e.status === 'active' ? 'default' : e.status === 'pending' ? 'secondary' : 'outline'}>
                  {e.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

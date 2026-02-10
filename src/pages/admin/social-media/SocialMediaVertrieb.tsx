/**
 * Social Media Vertrieb — Mandate-Liste (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Filter, Eye, Users, CreditCard, Calendar } from 'lucide-react';

const demoMandates = [
  { id: '1', partner: 'Max Berater GmbH', budget: '2.500 €', status: 'live', laufzeit: '01.03.–31.03.2026', leads: 12, payment: 'paid' },
  { id: '2', partner: 'Immofin Partner AG', budget: '4.000 €', status: 'review', laufzeit: '01.04.–30.04.2026', leads: 0, payment: 'paid' },
  { id: '3', partner: 'Schmidt Vertrieb', budget: '1.500 €', status: 'submitted', laufzeit: '15.04.–15.05.2026', leads: 0, payment: 'unpaid' },
  { id: '4', partner: 'Weber Finanzen', budget: '3.000 €', status: 'ended', laufzeit: '01.01.–31.01.2026', leads: 34, payment: 'paid' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  submitted: { label: 'Eingereicht', variant: 'outline' },
  review: { label: 'In Prüfung', variant: 'secondary' },
  approved: { label: 'Genehmigt', variant: 'secondary' },
  scheduled: { label: 'Geplant', variant: 'secondary' },
  live: { label: 'Live', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'outline' },
  ended: { label: 'Beendet', variant: 'outline' },
  failed: { label: 'Fehler', variant: 'destructive' },
};

export default function SocialMediaVertrieb() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Social Vertrieb</h1>
            <p className="text-sm text-muted-foreground">Partner-Mandate aus Selfie Ads Studio</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filter</Button>
      </div>

      <div className="space-y-3">
        {demoMandates.map((m) => {
          const s = statusMap[m.status] || statusMap.submitted;
          return (
            <Card key={m.id} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{m.partner}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{m.budget}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.laufzeit}</span>
                      <span>{m.leads} Leads</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

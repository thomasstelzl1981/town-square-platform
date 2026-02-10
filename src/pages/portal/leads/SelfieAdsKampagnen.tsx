/**
 * Selfie Ads Kampagnen — Meine Kampagnen (Zone 2)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, Eye, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const demoMandates = [
  { id: 1, name: 'Kapitalanleger München Q1', status: 'live', budget: '2.500 €', laufzeit: '01.03. – 31.03.2026', leads: 12, payment: 'paid' },
  { id: 2, name: 'Vermögensaufbau Berlin', status: 'ended', budget: '4.000 €', laufzeit: '01.01. – 31.01.2026', leads: 34, payment: 'paid' },
  { id: 3, name: 'Rendite-Immobilien Hamburg', status: 'review', budget: '3.000 €', laufzeit: '01.04. – 30.04.2026', leads: 0, payment: 'paid' },
  { id: 4, name: 'Neubau-Kapitalanlage Köln', status: 'submitted', budget: '1.500 €', laufzeit: '15.04. – 15.05.2026', leads: 0, payment: 'unpaid' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  submitted: { label: 'Eingereicht', variant: 'outline' },
  review: { label: 'In Prüfung', variant: 'secondary' },
  live: { label: 'Live', variant: 'default' },
  ended: { label: 'Beendet', variant: 'outline' },
};

export default function SelfieAdsKampagnen() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Meine Kampagnen</h1>
          <p className="text-muted-foreground mt-1">Beauftragte Kaufy Selfie Ads Mandate</p>
        </div>
        <Button onClick={() => navigate('/portal/leads/selfie-ads-planen')} className="gap-2">
          <Plus className="h-4 w-4" /> Neue Kampagne
        </Button>
      </div>

      <div className="space-y-3">
        {demoMandates.map((m) => {
          const s = statusMap[m.status] || statusMap.submitted;
          return (
            <Card key={m.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {m.budget}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {m.laufzeit}</span>
                        <span>{m.leads} Leads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

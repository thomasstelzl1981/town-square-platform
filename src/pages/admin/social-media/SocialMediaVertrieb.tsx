/**
 * Social Media Vertrieb — Mandate-Liste (Zone 1)
 * Vollständige Liste mit Navigation zu Detail-Akte
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Filter, Eye, Users, CreditCard, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const demoMandates = [
  { id: 'a1b2c3', partner: 'Max Berater GmbH', budget: 2500, status: 'live', startDate: '2026-03-01', endDate: '2026-03-31', leads: 12, payment: 'paid', regions: 'München', slots: ['T1', 'T3', 'T5'] },
  { id: 'd4e5f6', partner: 'Immofin Partner AG', budget: 4000, status: 'review', startDate: '2026-04-01', endDate: '2026-04-30', leads: 0, payment: 'paid', regions: 'Berlin', slots: ['T1', 'T2', 'T3', 'T4', 'T5'] },
  { id: 'g7h8i9', partner: 'Schmidt Vertrieb', budget: 1500, status: 'submitted', startDate: '2026-04-15', endDate: '2026-05-15', leads: 0, payment: 'unpaid', regions: 'Köln', slots: ['T1', 'T4'] },
  { id: 'j1k2l3', partner: 'Weber Finanzen', budget: 3000, status: 'ended', startDate: '2026-01-01', endDate: '2026-01-31', leads: 34, payment: 'paid', regions: 'Hamburg', slots: ['T1', 'T2', 'T3'] },
  { id: 'm4n5o6', partner: 'Richter Consulting', budget: 5000, status: 'scheduled', startDate: '2026-05-01', endDate: '2026-06-30', leads: 0, payment: 'paid', regions: 'Frankfurt, Stuttgart', slots: ['T1', 'T2', 'T3', 'T4', 'T5'] },
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

const formatBudget = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents);

export default function SocialMediaVertrieb() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const filtered = demoMandates.filter(m =>
    m.partner.toLowerCase().includes(filter.toLowerCase()) ||
    m.status.includes(filter.toLowerCase()) ||
    m.regions.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Social Vertrieb</h1>
            <p className="text-sm text-muted-foreground">Partner-Mandate aus Selfie Ads Studio · {filtered.length} Mandate</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusMap).map(([key, { label, variant }]) => {
          const count = demoMandates.filter(m => m.status === key).length;
          if (count === 0) return null;
          return (
            <Badge key={key} variant={variant} className="cursor-pointer" onClick={() => setFilter(key)}>
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const s = statusMap[m.status] || statusMap.submitted;
          return (
            <Card key={m.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/social-media/vertrieb/${m.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{m.partner}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatBudget(m.budget)}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.startDate} – {m.endDate}</span>
                      <span>{m.regions}</span>
                      <span>{m.leads} Leads</span>
                      <span>{m.slots.length} Slots</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.payment === 'paid' ? 'secondary' : 'destructive'} className="text-[10px]">
                    {m.payment === 'paid' ? 'Bezahlt' : 'Offen'}
                  </Badge>
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/admin/social-media/vertrieb/${m.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

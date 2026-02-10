/**
 * Social Media Kampagnen — Kaufy-eigene Kampagnen (Zone 1)
 * Mit Statusfilter und Detail-Ansicht
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Search, Eye, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const demoCampaigns = [
  { id: '1', name: 'Kaufy Brand Awareness Q1', platform: 'LinkedIn', type: 'organisch', status: 'live', startDate: '2026-01-15', leads: 45, spend: 0 },
  { id: '2', name: 'Kapitalanlage Leads FB', platform: 'Facebook', type: 'paid', status: 'live', startDate: '2026-02-01', leads: 128, spend: 3200 },
  { id: '3', name: 'Instagram Story Serie', platform: 'Instagram', type: 'organisch', status: 'scheduled', startDate: '2026-03-15', leads: 0, spend: 0 },
  { id: '4', name: 'Vermögensaufbau Kampagne', platform: 'Facebook', type: 'paid', status: 'ended', startDate: '2025-11-01', leads: 89, spend: 4500 },
  { id: '5', name: 'Partner-Recruitment LinkedIn', platform: 'LinkedIn', type: 'organisch', status: 'draft', startDate: '', leads: 0, spend: 0 },
  { id: '6', name: 'Kaufy Immobilien-Podcast Promo', platform: 'Instagram', type: 'paid', status: 'live', startDate: '2026-02-15', leads: 22, spend: 800 },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  scheduled: { label: 'Geplant', variant: 'secondary' },
  live: { label: 'Live', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'outline' },
  ended: { label: 'Beendet', variant: 'outline' },
};

const formatBudget = (amount: number) =>
  amount > 0 ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount) : '—';

export default function SocialMediaKampagnen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  const filtered = demoCampaigns.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = !platformFilter || c.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Kaufy Kampagnen</h1>
            <p className="text-sm text-muted-foreground">Organische & bezahlte Kampagnen · {filtered.length} Kampagnen</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button size="sm" onClick={() => navigate('/admin/social-media/creator')}><Plus className="h-4 w-4 mr-1" /> Kampagne erstellen</Button>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 flex-wrap">
        {[null, 'LinkedIn', 'Facebook', 'Instagram'].map(p => (
          <Badge
            key={String(p)}
            variant={platformFilter === p ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setPlatformFilter(p)}
          >
            {p || 'Alle'} ({p ? demoCampaigns.filter(c => c.platform === p).length : demoCampaigns.length})
          </Badge>
        ))}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Live</p><p className="text-2xl font-bold">{demoCampaigns.filter(c => c.status === 'live').length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Leads</p><p className="text-2xl font-bold">{demoCampaigns.reduce((s, c) => s + c.leads, 0)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gesamt Spend</p><p className="text-2xl font-bold">{formatBudget(demoCampaigns.reduce((s, c) => s + c.spend, 0))}</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const s = statusMap[c.status] || statusMap.draft;
          return (
            <Card key={c.id} className="glass-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{c.platform}</span>
                      <span>{c.type}</span>
                      {c.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.startDate}</span>}
                      {c.leads > 0 && <span>{c.leads} Leads</span>}
                      {c.spend > 0 && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatBudget(c.spend)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

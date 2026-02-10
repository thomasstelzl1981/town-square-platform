/**
 * Social Media Leads — Zentrale Lead-Inbox (Zone 1)
 * Mit Routing-Aktionen, Filter und Autoresponder-Status
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Users, Filter, ArrowRight, Mail, Search, AlertTriangle, CheckCircle2, MailX } from 'lucide-react';
import { toast } from 'sonner';

const demoLeads = [
  { id: '1', name: 'Max Müller', email: 'max@example.com', phone: '+49 171 1234567', source: 'meta_leadgen', mandat: 'München Q1', partner: 'Berater GmbH', template: 'T1', status: 'routed', autoresponder: 'sent', region: 'München', created: 'vor 2h' },
  { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', phone: '+49 172 9876543', source: 'meta_leadgen', mandat: 'München Q1', partner: 'Berater GmbH', template: 'T3', status: 'routed', autoresponder: 'sent', region: 'München', created: 'vor 5h' },
  { id: '3', name: 'Peter Weber', email: 'peter@example.com', phone: '+49 173 5555555', source: 'meta_leadgen', mandat: 'Berlin', partner: 'Immofin AG', template: 'T2', status: 'new', autoresponder: 'not_sent', region: 'Berlin', created: 'vor 1d' },
  { id: '4', name: 'Lisa Braun', email: 'lisa@example.com', phone: '', source: 'manual', mandat: '—', partner: '—', template: '—', status: 'unassigned', autoresponder: 'not_sent', region: '—', created: 'vor 2d' },
  { id: '5', name: 'Tom Fischer', email: 'tom@example.com', phone: '+49 174 7777777', source: 'meta_leadgen', mandat: 'Hamburg', partner: 'Schmidt Vertrieb', template: 'T5', status: 'routed', autoresponder: 'failed', region: 'Hamburg', created: 'vor 3d' },
  { id: '6', name: 'Sarah König', email: 'sarah@example.com', phone: '+49 175 3333333', source: 'meta_leadgen', mandat: 'München Q1', partner: 'Berater GmbH', template: 'T1', status: 'routed', autoresponder: 'sent', region: 'München', created: 'vor 3d' },
  { id: '7', name: 'Klaus Becker', email: 'klaus@example.com', phone: '+49 176 8888888', source: 'landing', mandat: '—', partner: '—', template: '—', status: 'new', autoresponder: 'not_sent', region: 'Frankfurt', created: 'vor 4d' },
];

const autoresponderIcon = {
  sent: { icon: CheckCircle2, className: 'text-green-600', label: 'Gesendet' },
  not_sent: { icon: Mail, className: 'text-muted-foreground', label: 'Nicht gesendet' },
  failed: { icon: MailX, className: 'text-destructive', label: 'Fehlgeschlagen' },
};

export default function SocialMediaLeads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = demoLeads.filter(l => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.includes(search) || l.partner.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRoute = (leadId: string) => {
    toast.success('Lead wurde dem Partner zugeordnet');
  };

  const handleResendAutoresponder = (leadId: string) => {
    toast.success('Auto-Responder wird erneut gesendet');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Leads & Routing</h1>
            <p className="text-sm text-muted-foreground">Zentrale Lead-Inbox — {filtered.length} Leads</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: null, label: 'Alle', count: demoLeads.length },
          { key: 'new', label: 'Neu', count: demoLeads.filter(l => l.status === 'new').length },
          { key: 'routed', label: 'Zugeordnet', count: demoLeads.filter(l => l.status === 'routed').length },
          { key: 'unassigned', label: 'Ohne Zuordnung', count: demoLeads.filter(l => l.status === 'unassigned').length },
        ].map(f => (
          <Badge
            key={String(f.key)}
            variant={statusFilter === f.key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label} ({f.count})
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((l) => {
          const ar = autoresponderIcon[l.autoresponder as keyof typeof autoresponderIcon] || autoresponderIcon.not_sent;
          const ArIcon = ar.icon;
          return (
            <Card key={l.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.email} {l.phone && `· ${l.phone}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.source} · Slot {l.template} · Mandat: {l.mandat} · Partner: {l.partner} · {l.created}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${ar.className}`}>
                      <ArIcon className="h-3 w-3" /> {ar.label}
                    </Badge>
                    <Badge variant={l.status === 'routed' ? 'default' : l.status === 'new' ? 'secondary' : 'outline'}>
                      {l.status === 'routed' ? 'Zugeordnet' : l.status === 'new' ? 'Neu' : 'Ohne Zuordnung'}
                    </Badge>
                    {l.status === 'unassigned' && (
                      <Button variant="outline" size="sm" onClick={() => handleRoute(l.id)} className="text-xs gap-1">
                        <ArrowRight className="h-3 w-3" /> Zuordnen
                      </Button>
                    )}
                    {l.autoresponder === 'failed' && (
                      <Button variant="outline" size="sm" onClick={() => handleResendAutoresponder(l.id)} className="text-xs gap-1">
                        <Mail className="h-3 w-3" /> Erneut senden
                      </Button>
                    )}
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

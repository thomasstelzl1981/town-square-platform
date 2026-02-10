/**
 * Social Media Leads — Zentrale Lead-Inbox (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Users, Filter, ArrowRight, Mail } from 'lucide-react';

const demoLeads = [
  { name: 'Max Müller', email: 'max@example.com', source: 'meta_leadgen', mandat: 'München Q1', partner: 'Berater GmbH', template: 'T1', status: 'routed', autoresponder: 'sent' },
  { name: 'Anna Schmidt', email: 'anna@example.com', source: 'meta_leadgen', mandat: 'München Q1', partner: 'Berater GmbH', template: 'T3', status: 'routed', autoresponder: 'sent' },
  { name: 'Peter Weber', email: 'peter@example.com', source: 'meta_leadgen', mandat: 'Berlin', partner: 'Immofin AG', template: 'T2', status: 'new', autoresponder: 'not_sent' },
  { name: 'Lisa Braun', email: 'lisa@example.com', source: 'manual', mandat: '—', partner: '—', template: '—', status: 'unassigned', autoresponder: 'not_sent' },
  { name: 'Tom Fischer', email: 'tom@example.com', source: 'meta_leadgen', mandat: 'Hamburg', partner: 'Schmidt Vertrieb', template: 'T5', status: 'routed', autoresponder: 'failed' },
];

export default function SocialMediaLeads() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Leads & Routing</h1>
            <p className="text-sm text-muted-foreground">Zentrale Lead-Inbox — alle Kanäle</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filter</Button>
      </div>

      <div className="space-y-2">
        {demoLeads.map((l, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.email} · {l.source} · Slot {l.template}</p>
                  <p className="text-xs text-muted-foreground">Mandat: {l.mandat} · Partner: {l.partner}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={l.autoresponder === 'sent' ? 'secondary' : l.autoresponder === 'failed' ? 'destructive' : 'outline'}>
                  <Mail className="h-3 w-3 mr-1" />{l.autoresponder}
                </Badge>
                <Badge variant={l.status === 'routed' ? 'default' : l.status === 'new' ? 'secondary' : 'outline'}>
                  {l.status}
                </Badge>
                <Button variant="ghost" size="sm"><ArrowRight className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

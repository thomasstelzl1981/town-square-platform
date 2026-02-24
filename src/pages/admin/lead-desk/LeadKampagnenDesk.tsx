/**
 * LeadKampagnenDesk — Tab 2: Kampagnen Leads (Zone 2)
 * Admin-Sicht auf Ad Campaigns + Social Mandates
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Megaphone, Users, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function LeadKampagnenDesk() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignLeadCounts, setCampaignLeadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      try {
        const [campaignsRes, campaignLeadsRes] = await Promise.all([
          supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }),
          supabase.from('ad_campaign_leads').select('campaign_id'),
        ]);
        setCampaigns(campaignsRes.data || []);

        const counts: Record<string, number> = {};
        (campaignLeadsRes.data || []).forEach(cl => {
          counts[cl.campaign_id] = (counts[cl.campaign_id] || 0) + 1;
        });
        setCampaignLeadCounts(counts);
      } catch (err) {
        console.error('LeadKampagnenDesk fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLeads = Object.values(campaignLeadCounts).reduce((a, b) => a + b, 0);

  const kpis = [
    { label: 'Kampagnen gesamt', value: campaigns.length, icon: Megaphone, color: 'text-primary' },
    { label: 'Aktiv', value: activeCampaigns, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Generierte Leads', value: totalLeads, icon: Users, color: 'text-blue-500' },
  ];

  function getStatusBadge(status: string | null) {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Aktiv', variant: 'default' },
      draft: { label: 'Entwurf', variant: 'outline' },
      paused: { label: 'Pausiert', variant: 'secondary' },
      completed: { label: 'Abgeschlossen', variant: 'secondary' },
      cancelled: { label: 'Abgebrochen', variant: 'destructive' },
    };
    const m = map[status || ''];
    return m ? <Badge variant={m.variant}>{m.label}</Badge> : <Badge variant="outline">{status || '—'}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Meta API Hint */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>Meta API Anbindung in Vorbereitung — Kampagnen werden derzeit manuell über den Leadmanager (Zone 2) erstellt.</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kampagnen-Übersicht</CardTitle>
          <CardDescription>{campaigns.length} Kampagnen aus Zone 2 Leadmanager</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Kampagnen vorhanden</p>
              <p className="text-xs text-muted-foreground mt-1">Kampagnen werden im Leadmanager (Zone 2) erstellt.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampagne</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Plattform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.campaign_type || '—'}</Badge></TableCell>
                    <TableCell>{c.platform || '—'}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="font-mono">{campaignLeadCounts[c.id] || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.created_at ? format(new Date(c.created_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * LeadKampagnenDesk — Tab 2: Kampagnen (Zone 1)
 * Admin-Sicht auf social_mandates — alle Partner, alle Brands
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Users, TrendingUp, DollarSign, Info } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function LeadKampagnenDesk() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mandates, setMandates] = useState<any[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      try {
        const [mandatesRes, leadsRes] = await Promise.all([
          supabase.from('social_mandates').select('*').order('created_at', { ascending: false }),
          supabase.from('social_leads').select('mandate_id'),
        ]);
        setMandates(mandatesRes.data || []);

        const counts: Record<string, number> = {};
        (leadsRes.data || []).forEach((l: any) => {
          if (l.mandate_id) {
            counts[l.mandate_id] = (counts[l.mandate_id] || 0) + 1;
          }
        });
        setLeadCounts(counts);
      } catch (err) {
        console.error('LeadKampagnenDesk fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const submittedOrLive = mandates.filter(m => m.status === 'submitted' || m.status === 'live').length;
  const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0);
  const totalBudget = mandates.reduce((sum, m) => sum + (m.budget_total_cents || 0), 0);

  const kpis = [
    { label: 'Mandates gesamt', value: mandates.length, icon: FileText, color: 'text-primary' },
    { label: 'Aktiv / Eingereicht', value: submittedOrLive, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Generierte Leads', value: totalLeads, icon: Users, color: 'text-blue-500' },
    { label: 'Gesamtbudget', value: `${(totalBudget / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, icon: DollarSign, color: 'text-amber-500' },
  ];

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      submitted: { label: 'Eingereicht', variant: 'default' },
      live: { label: 'Live', variant: 'default' },
      draft: { label: 'Entwurf', variant: 'outline' },
      paused: { label: 'Pausiert', variant: 'secondary' },
      completed: { label: 'Abgeschlossen', variant: 'secondary' },
      stopped: { label: 'Gestoppt', variant: 'destructive' },
    };
    const m = map[status];
    return m ? <Badge variant={m.variant}>{m.label}</Badge> : <Badge variant="outline">{status}</Badge>;
  }

  function getBrandBadge(brand: string) {
    const colors: Record<string, string> = {
      kaufy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      futureroom: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      acquiary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      projekt: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[brand] || 'bg-muted text-muted-foreground'}`}>{brand}</span>;
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>Veröffentlichung wird in einem späteren Entwicklungsschritt implementiert. Aktuell dokumentarische Übersicht aller gebuchten Kampagnen aus Zone 2.</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Mandates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kampagnen-Mandates</CardTitle>
          <CardDescription>{mandates.length} Mandates aus Zone 2 Leadmanager (alle Partner)</CardDescription>
        </CardHeader>
        <CardContent>
          {mandates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Kampagnen-Mandates vorhanden</p>
              <p className="text-xs text-muted-foreground mt-1">Mandates werden im Leadmanager (Zone 2) gebucht.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mandates.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.partner_display_name || '—'}</TableCell>
                    <TableCell>{getBrandBadge(m.brand_context)}</TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell className="font-mono">
                      {m.budget_total_cents ? (m.budget_total_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '—'}
                    </TableCell>
                    <TableCell className="font-mono">{leadCounts[m.id] || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.created_at ? format(new Date(m.created_at), 'dd.MM.yyyy', { locale: de }) : '—'}
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

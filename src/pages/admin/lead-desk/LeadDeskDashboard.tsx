/**
 * LeadDeskDashboard — KPI Overview + Quick Actions for Lead Desk
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aggregateCommissions } from '@/engines/provision/engine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Users, CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LeadDeskDashboard() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPool: 0, assigned: 0, pending: 0, converted: 0, lost: 0 });
  const [commissionStats, setCommissionStats] = useState({ pending: 0, approved: 0, totalPending: 0, totalPaid: 0 });

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const [leadsRes, commissionsRes] = await Promise.all([
          supabase.from('leads').select('id, status, assigned_partner_id, zone1_pool').eq('zone1_pool', true),
          supabase.from('commissions').select('id, amount, status'),
        ]);
        const leads = leadsRes.data || [];
        const comms = commissionsRes.data || [];

        setStats({
          totalPool: leads.length,
          assigned: leads.filter(l => l.assigned_partner_id).length,
          pending: leads.filter(l => l.status === 'new').length,
          converted: leads.filter(l => l.status === 'converted').length,
          lost: leads.filter(l => l.status === 'lost').length,
        });

        const agg = aggregateCommissions(
          comms.map(c => ({ amount: Number(c.amount), status: c.status })),
          ['paid'], ['cancelled'],
        );
        setCommissionStats({
          pending: comms.filter(c => c.status === 'pending').length,
          approved: comms.filter(c => c.status === 'approved').length,
          totalPending: agg.pending,
          totalPaid: agg.paid,
        });
      } catch (err) {
        console.error('LeadDeskDashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  const kpiCards = [
    { label: 'Pool Gesamt', value: stats.totalPool, icon: Target, color: 'text-primary' },
    { label: 'Offen', value: stats.pending, icon: Users, color: 'text-amber-500' },
    { label: 'Konvertiert', value: stats.converted, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Prov. ausstehend', value: commissionStats.pending, icon: CreditCard, color: 'text-amber-500', sub: fmt(commissionStats.totalPending) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Pool</CardTitle>
            <CardDescription>{stats.totalPool} Leads, {stats.pending} offen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/lead-desk/pool">Öffnen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provisionen</CardTitle>
            <CardDescription>{commissionStats.pending} ausstehend · {fmt(commissionStats.totalPaid)} ausgezahlt</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/lead-desk/commissions">Öffnen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

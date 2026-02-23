/**
 * LeadMonitorPage — Lazy-loaded wrapper for LeadMonitor
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aggregateCommissions } from '@/engines/provision/engine';
import { Loader2 } from 'lucide-react';
import { LeadMonitor } from './LeadMonitor';

export default function LeadMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [leadStats, setLeadStats] = useState({ totalPool: 0, assigned: 0, pending: 0, converted: 0, lost: 0 });
  const [commissionStats, setCommissionStats] = useState({ pending: 0, approved: 0, invoiced: 0, paid: 0, totalPending: 0, totalPaid: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [leadsRes, commsRes] = await Promise.all([
          supabase.from('leads').select('id, status, assigned_partner_id, zone1_pool').eq('zone1_pool', true),
          supabase.from('commissions').select('id, amount, status'),
        ]);
        const leads = leadsRes.data || [];
        const comms = commsRes.data || [];
        setLeadStats({
          totalPool: leads.length,
          assigned: leads.filter(l => l.assigned_partner_id).length,
          pending: leads.filter(l => l.status === 'new').length,
          converted: leads.filter(l => l.status === 'converted').length,
          lost: leads.filter(l => l.status === 'lost').length,
        });
        const agg = aggregateCommissions(comms.map(c => ({ amount: Number(c.amount), status: c.status })), ['paid'], ['cancelled']);
        setCommissionStats({
          pending: comms.filter(c => c.status === 'pending').length,
          approved: comms.filter(c => c.status === 'approved').length,
          invoiced: comms.filter(c => c.status === 'invoiced').length,
          paid: agg.paidCount,
          totalPending: agg.pending,
          totalPaid: agg.paid,
        });
      } catch (err) {
        console.error('LeadMonitor fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return <LeadMonitor stats={leadStats} commissionStats={commissionStats} />;
}

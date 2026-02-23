/**
 * LeadCommissionsPage — Lazy-loaded wrapper for LeadCommissions
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aggregateCommissions } from '@/engines/provision/engine';
import { Loader2 } from 'lucide-react';
import { LeadCommissions, type CommissionStats } from './LeadCommissions';

export default function LeadCommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState<CommissionStats>({ pending: 0, approved: 0, invoiced: 0, paid: 0, totalPending: 0, totalPaid: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [commRes, orgsRes, contactsRes, profilesRes] = await Promise.all([
          supabase.from('commissions').select('*'),
          supabase.from('organizations').select('id, name'),
          supabase.from('contacts').select('id, first_name, last_name'),
          supabase.from('profiles').select('id, display_name, email'),
        ]);
        const orgs = orgsRes.data || [];
        const contacts = contactsRes.data || [];
        const profiles = profilesRes.data || [];
        const commsData = commRes.data || [];

        setCommissions(commsData.map(c => ({
          ...c,
          tenant_name: orgs.find(o => o.id === c.tenant_id)?.name || 'Unknown',
          contact_name: contacts.find(ct => ct.id === c.contact_id) ? `${contacts.find(ct => ct.id === c.contact_id)?.first_name} ${contacts.find(ct => ct.id === c.contact_id)?.last_name}` : null,
          liable_name: c.liable_user_id ? profiles.find(p => p.id === c.liable_user_id)?.display_name || profiles.find(p => p.id === c.liable_user_id)?.email || '—' : undefined,
        })));

        const agg = aggregateCommissions(commsData.map(c => ({ amount: Number(c.amount), status: c.status })), ['paid'], ['cancelled']);
        setStats({
          pending: commsData.filter(c => c.status === 'pending').length,
          approved: commsData.filter(c => c.status === 'approved').length,
          invoiced: commsData.filter(c => c.status === 'invoiced').length,
          paid: agg.paidCount,
          totalPending: agg.pending,
          totalPaid: agg.paid,
        });
      } catch (err) {
        console.error('LeadCommissions fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return <LeadCommissions commissions={commissions} stats={stats} />;
}

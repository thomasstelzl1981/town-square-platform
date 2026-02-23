/**
 * FinanceDeskMonitorPage — Lazy-loaded wrapper
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FinanceDeskMonitor } from './FinanceDeskMonitor';

export default function FinanceDeskMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, newCount: 0, contacted: 0, qualified: 0, assigned: 0, converted: 0, lost: 0 });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('leads').select('id, status');
        const leads = data || [];
        setStats({
          total: leads.length,
          newCount: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          assigned: leads.filter(l => (l.status as string) === 'assigned').length,
          converted: leads.filter(l => l.status === 'converted').length,
          lost: leads.filter(l => l.status === 'lost').length,
        });
      } catch (err) {
        console.error('FinanceDeskMonitor fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return <FinanceDeskMonitor stats={stats} />;
}

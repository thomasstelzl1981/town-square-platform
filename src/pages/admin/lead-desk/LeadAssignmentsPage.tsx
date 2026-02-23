/**
 * LeadAssignmentsPage — Lazy-loaded wrapper for LeadAssignments
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { LeadAssignments } from './LeadAssignments';

export default function LeadAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [assignRes, orgsRes] = await Promise.all([
          supabase.from('lead_assignments').select('*'),
          supabase.from('organizations').select('id, name'),
        ]);
        const orgs = orgsRes.data || [];
        setAssignments((assignRes.data || []).map(a => ({
          ...a,
          partner_name: orgs.find(o => o.id === a.partner_org_id)?.name || 'Unknown',
        })));
      } catch (err) {
        console.error('LeadAssignments fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return <LeadAssignments assignments={assignments} />;
}

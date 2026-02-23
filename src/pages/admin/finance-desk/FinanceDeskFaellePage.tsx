/**
 * FinanceDeskFaellePage — Lazy-loaded wrapper
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FinanceDeskFaelle } from './FinanceDeskFaelle';

export default function FinanceDeskFaellePage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('leads').select('*');
        setLeads(data || []);
      } catch (err) {
        console.error('FinanceDeskFaelle fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return <FinanceDeskFaelle leads={leads} />;
}

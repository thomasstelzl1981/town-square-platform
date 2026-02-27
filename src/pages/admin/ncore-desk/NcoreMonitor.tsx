/**
 * NcoreMonitor — Monitor tab for Ncore Desk
 * Shows conversion funnel and source breakdown
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FunnelStep { label: string; count: number; color: string }

export default function NcoreMonitor() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('leads')
        .select('status, source')
        .in('source', ['ncore_projekt', 'ncore_kooperation']);
      const leads = data || [];
      const total = leads.length;
      setFunnel([
        { label: 'Eingegangen', count: total, color: 'bg-blue-500' },
        { label: 'Kontaktiert', count: leads.filter(l => ['contacted', 'qualified', 'converted'].includes(l.status)).length, color: 'bg-yellow-500' },
        { label: 'Qualifiziert', count: leads.filter(l => ['qualified', 'converted'].includes(l.status)).length, color: 'bg-emerald-500' },
        { label: 'Konvertiert', count: leads.filter(l => l.status === 'converted').length, color: 'bg-primary' },
      ]);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const maxCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-lg">Conversion Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {funnel.map(step => (
            <div key={step.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{step.label}</span>
                <span className="font-semibold">{step.count}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${step.color} transition-all`} style={{ width: `${(step.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Quellen-Aufschlüsselung</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 pt-2">
            {['ncore_projekt', 'ncore_kooperation'].map(src => {
              const count = funnel.length > 0 ? 0 : 0; // we recalculate below
              return null; // replaced by actual logic
            })}
            {/* Simple source breakdown */}
            <SourceBreakdown />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SourceBreakdown() {
  const [data, setData] = useState<{ source: string; count: number }[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data: leads } = await supabase
        .from('leads')
        .select('source')
        .in('source', ['ncore_projekt', 'ncore_kooperation']);
      const grouped: Record<string, number> = {};
      (leads || []).forEach(l => { grouped[l.source] = (grouped[l.source] || 0) + 1; });
      setData(Object.entries(grouped).map(([source, count]) => ({ source, count })));
    }
    fetch();
  }, []);

  const labels: Record<string, string> = {
    ncore_projekt: 'Projekt-Anfragen',
    ncore_kooperation: 'Kooperations-Anfragen',
  };

  return (
    <div className="space-y-3">
      {data.length === 0 && <p className="text-sm text-muted-foreground">Keine Daten vorhanden.</p>}
      {data.map(d => (
        <div key={d.source} className="flex items-center justify-between p-3 rounded-lg border">
          <span className="text-sm font-medium">{labels[d.source] || d.source}</span>
          <span className="text-lg font-bold">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

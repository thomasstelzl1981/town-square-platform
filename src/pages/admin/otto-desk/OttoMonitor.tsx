/**
 * OttoMonitor — Monitor tab for Otto² Advisory Desk
 * Conversion funnel + source breakdown
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FunnelStep { label: string; count: number; color: string }

export default function OttoMonitor() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: leads } = await supabase
        .from('leads')
        .select('status, source')
        .in('source', ['otto_advisory_kontakt', 'otto_advisory_finanzierung']);
      const all = leads || [];
      setFunnel([
        { label: 'Eingegangen', count: all.length, color: 'bg-blue-500' },
        { label: 'Kontaktiert', count: all.filter(l => ['contacted', 'qualified', 'converted'].includes(l.status)).length, color: 'bg-yellow-500' },
        { label: 'Qualifiziert', count: all.filter(l => ['qualified', 'converted'].includes(l.status)).length, color: 'bg-emerald-500' },
        { label: 'Konvertiert', count: all.filter(l => l.status === 'converted').length, color: 'bg-primary' },
      ]);
      const grouped: Record<string, number> = {};
      all.forEach(l => { grouped[l.source] = (grouped[l.source] || 0) + 1; });
      setSources(Object.entries(grouped).map(([source, count]) => ({ source, count })));
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const maxCount = Math.max(...funnel.map(f => f.count), 1);
  const labels: Record<string, string> = {
    otto_advisory_kontakt: 'Beratungsanfragen',
    otto_advisory_finanzierung: 'Finanzierungsanfragen',
  };

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
        <CardContent className="space-y-3">
          {sources.length === 0 && <p className="text-sm text-muted-foreground">Keine Daten vorhanden.</p>}
          {sources.map(d => (
            <div key={d.source} className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">{labels[d.source] || d.source}</span>
              <span className="text-lg font-bold">{d.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

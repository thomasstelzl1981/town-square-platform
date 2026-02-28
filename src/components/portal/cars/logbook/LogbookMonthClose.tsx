/**
 * LogbookMonthClose — Lock completed months (Tab D)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMemo } from 'react';

interface Props { logbookId: string; }

export function LogbookMonthClose({ logbookId }: Props) {
  const { user, activeTenantId } = useAuth();
  const qc = useQueryClient();

  // Last 6 months
  const months = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), i + 1); // only past months
      return {
        value: format(startOfMonth(d), 'yyyy-MM-dd'),
        label: format(d, 'MMMM yyyy', { locale: de }),
        start: startOfMonth(d).toISOString(),
        end: endOfMonth(d).toISOString(),
      };
    }),
  []);

  // Existing locks
  const { data: locks = [] } = useQuery({
    queryKey: ['cars-logbook-locks', logbookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_logbook_locks')
        .select('month, locked_at')
        .eq('logbook_id', logbookId);
      if (error) throw error;
      return data || [];
    },
  });

  // Open trips per month
  const { data: openCounts = {} } = useQuery({
    queryKey: ['cars-open-trips-by-month', logbookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_trips')
        .select('start_at')
        .eq('logbook_id', logbookId)
        .eq('classification', 'unclassified')
        .eq('is_locked', false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((t: any) => {
        const m = format(new Date(t.start_at), 'yyyy-MM-dd').substring(0, 7) + '-01';
        const key = format(startOfMonth(new Date(t.start_at)), 'yyyy-MM-dd');
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    },
  });

  const lockMonth = useMutation({
    mutationFn: async (month: { value: string; start: string; end: string }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      // Lock trips
      const { error: tripErr } = await supabase
        .from('cars_trips')
        .update({ is_locked: true, lock_version: 1 })
        .eq('logbook_id', logbookId)
        .gte('start_at', month.start)
        .lte('start_at', month.end);
      if (tripErr) throw new Error(tripErr.message);

      // Insert lock record
      const { error: lockErr } = await supabase.from('cars_logbook_locks').insert({
        logbook_id: logbookId,
        month: month.value,
        locked_by: user?.id || '',
        tenant_id: activeTenantId!,
      });
      if (lockErr) throw new Error(lockErr.message);
    },
    onSuccess: () => {
      toast.success('Monat abgeschlossen');
      qc.invalidateQueries({ queryKey: ['cars-logbook-locks'] });
      qc.invalidateQueries({ queryKey: ['cars-trip-list'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lockedMonths = new Set(locks.map((l: any) => l.month));

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Abgeschlossene Monate können nicht mehr bearbeitet werden.</p>
      {months.map(m => {
        const isLocked = lockedMonths.has(m.value);
        const openCount = openCounts[m.value] || 0;

        return (
          <div key={m.value} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              ) : openCount > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 text-status-success" />
              )}
              <span className="text-sm">{m.label}</span>
              {openCount > 0 && !isLocked && (
                <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-600">
                  {openCount} offen
                </Badge>
              )}
            </div>
            {isLocked ? (
              <Badge variant="outline" className="text-[8px] h-5 bg-muted">
                <Lock className="h-2.5 w-2.5 mr-1" /> Abgeschlossen
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={lockMonth.isPending}
                onClick={() => {
                  if (openCount > 0 && !confirm(`${openCount} offene Fahrten im ${m.label}. Trotzdem abschließen?`)) return;
                  lockMonth.mutate(m);
                }}
              >
                {lockMonth.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                Abschließen
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

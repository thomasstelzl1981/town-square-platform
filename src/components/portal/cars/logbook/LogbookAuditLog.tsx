/**
 * LogbookAuditLog — Change history for trips (Tab F)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props { logbookId: string; }

export function LogbookAuditLog({ logbookId }: Props) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['cars-audit-log', logbookId],
    queryFn: async () => {
      // Get trip IDs for this logbook first
      const { data: trips, error: tripsErr } = await supabase
        .from('cars_trips')
        .select('id')
        .eq('logbook_id', logbookId);
      if (tripsErr) throw tripsErr;
      if (!trips || trips.length === 0) return [];

      const tripIds = trips.map((t: any) => t.id);
      const { data, error } = await supabase
        .from('cars_trip_audit')
        .select('*')
        .in('trip_id', tripIds)
        .order('changed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Laden…</div>;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <History className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Noch keine Änderungen protokolliert</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-auto">
      {entries.map((entry: any) => (
        <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 text-xs">
          <History className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] text-muted-foreground font-mono w-[100px] flex-shrink-0">
            {format(new Date(entry.changed_at), 'dd.MM.yy HH:mm', { locale: de })}
          </span>
          <Badge variant="outline" className="text-[8px] h-4 flex-shrink-0">
            {entry.field_changed}
          </Badge>
          <span className="text-muted-foreground truncate">{entry.old_value || '—'}</span>
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{entry.new_value || '—'}</span>
          {entry.reason && (
            <span className="text-[10px] text-muted-foreground/70 ml-auto flex-shrink-0 truncate max-w-[120px]">
              {entry.reason}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

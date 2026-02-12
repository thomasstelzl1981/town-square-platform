/**
 * Ausführungs-Log — DataTable der armstrong_action_runs
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Bot, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function AusfuehrungsLog() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['armstrong-action-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_action_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <LoadingState />;

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="Noch keine Ausführungen"
        description="Armstrong-Aktionen erscheinen hier sobald sie ausgeführt werden."
      />
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      default: return <Zap className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Letzte 100 Ausführungen</p>
      <div className="space-y-1.5">
        {runs.map(run => (
          <Card key={run.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              {statusIcon(run.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground truncate">
                    {run.action_code}
                  </code>
                  <Badge variant={run.status === 'completed' ? 'default' : run.status === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {run.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{format(new Date(run.created_at || ''), 'dd.MM.yy HH:mm', { locale: de })}</span>
                  {run.duration_ms && <span>{run.duration_ms}ms</span>}
                  {run.tokens_used && <span>{run.tokens_used} Tokens</span>}
                  {run.cost_cents && <span>{(run.cost_cents / 100).toFixed(2)} €</span>}
                </div>
              </div>
              {run.error_message && (
                <p className="text-[10px] text-destructive max-w-[200px] truncate">
                  {run.error_message}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

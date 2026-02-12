/**
 * FutureRoomContracts — Zone 1: Contract management and lead tracking
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, TrendingUp, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function FutureRoomContracts() {
  const { data: mandates } = useQuery({
    queryKey: ['futureroom-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_mandates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: mandates?.length || 0,
    active: mandates?.filter(m => m.status === 'active' || m.status === 'assigned').length || 0,
    completed: mandates?.filter(m => m.status === 'completed').length || 0,
    pending: mandates?.filter(m => m.status === 'new' || m.status === 'submitted_to_zone1').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Contracts & Mandate</h2>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="h-5 w-5 text-green-500" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Aktiv</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-500" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Abgeschlossen</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Ausstehend</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mandates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mandate</CardTitle>
        </CardHeader>
        <CardContent>
          {(!mandates || mandates.length === 0) ? (
            <p className="text-center text-muted-foreground py-8">Keine Mandate vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {mandates.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-sm">{m.public_id || m.id.slice(0, 8)}</span>
                      {(m as any).source && (m as any).source !== 'portal' && (
                        <Badge variant="outline" className="ml-2 text-xs">{(m as any).source}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

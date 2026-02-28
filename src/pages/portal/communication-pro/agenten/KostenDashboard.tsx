/**
 * Kosten-Dashboard — Billing KPIs aus armstrong_billing_events
 */
import { useQuery } from '@tanstack/react-query';
import { DESIGN } from '@/config/designManifest';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DollarSign, TrendingUp, Zap, CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import { CreditTopUpDialog } from '@/components/shared/CreditTopUpDialog';

export function KostenDashboard() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['armstrong-billing-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_billing_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const totalCents = events.reduce((sum, e) => sum + (e.cost_cents || 0), 0);
    const totalCredits = events.reduce((sum, e) => sum + (e.credits_charged || 0), 0);
    
    // Group by action_code for top actions
    const byAction: Record<string, { count: number; cost: number }> = {};
    events.forEach(e => {
      if (!byAction[e.action_code]) byAction[e.action_code] = { count: 0, cost: 0 };
      byAction[e.action_code].count++;
      byAction[e.action_code].cost += e.cost_cents || 0;
    });
    
    const topActions = Object.entries(byAction)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 5);

    return { totalCents, totalCredits, totalEvents: events.length, topActions };
  }, [events]);

  if (isLoading) return <LoadingState />;

  if (events.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Keine Kostendaten"
        description="Billing-Events erscheinen hier sobald kostenpflichtige Aktionen ausgeführt werden."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header mit Top-Up Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Verbrauchsübersicht</h3>
        <CreditTopUpDialog />
      </div>
      {/* KPI Cards */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{(stats.totalCents / 100).toFixed(2)} €</p>
            <p className="text-xs text-muted-foreground">Gesamtkosten</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CreditCard className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{stats.totalCredits}</p>
            <p className="text-xs text-muted-foreground">Credits verbraucht</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Zap className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{stats.totalEvents}</p>
            <p className="text-xs text-muted-foreground">Transaktionen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">
              {stats.totalEvents > 0 ? (stats.totalCents / stats.totalEvents / 100).toFixed(2) : '0.00'} €
            </p>
            <p className="text-xs text-muted-foreground">Ø pro Aktion</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Actions */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Top 5 Aktionen (nach Kosten)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {stats.topActions.length > 0 ? (
            <div className="space-y-2">
              {stats.topActions.map(([code, data]) => (
                <div key={code} className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0">
                  <div>
                    <code className="text-xs font-mono">{code}</code>
                    <p className="text-xs text-muted-foreground">{data.count} Aufrufe</p>
                  </div>
                  <span className="text-sm font-medium">{(data.cost / 100).toFixed(2)} €</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Keine Daten vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

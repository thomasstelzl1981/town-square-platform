/**
 * Provisionen Übersicht — MOD-10
 * Dashboard mit Provisions-KPIs und Abrechnungshistorie
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { aggregateCommissions } from '@/engines/provision/engine';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Euro, TrendingUp, Clock, CheckCircle2, 
  Receipt, ArrowUpRight, Wallet, BarChart3 
} from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default function ProvisionenUebersicht() {
  const { activeTenantId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['provisionen-uebersicht', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;

      // Fetch sale transactions with commission data
      const { data: transactions } = await supabase
        .from('sale_transactions')
        .select('id, final_price, commission_amount, status, notary_date, created_at')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      const commAgg = aggregateCommissions(
        (transactions || []).map(t => ({ amount: t.commission_amount || 0, status: t.status })),
        ['completed'],
      );
      const totalVolume = (transactions || []).reduce((sum, t) => sum + (t.final_price || 0), 0);

      return {
        totalEarned: commAgg.paid,
        totalPending: commAgg.pending,
        totalVolume,
        completedCount: commAgg.paidCount,
        pendingCount: commAgg.pendingCount,
        transactions: transactions || [],
      };
    },
    enabled: !!activeTenantId,
  });

  const kpis = [
    { label: 'Ausgezahlt', value: data ? formatCurrency(data.totalEarned) : '–', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Ausstehend', value: data ? formatCurrency(data.totalPending) : '–', icon: Clock, color: 'text-amber-500' },
    { label: 'Gesamtvolumen', value: data ? formatCurrency(data.totalVolume) : '–', icon: TrendingUp, color: 'text-primary' },
    { label: 'Transaktionen', value: data ? `${data.completedCount + data.pendingCount}` : '–', icon: Receipt, color: 'text-muted-foreground' },
  ];

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: 'Ausstehend', variant: 'outline' },
    notarized: { label: 'Beurkundet', variant: 'default' },
    completed: { label: 'Ausgezahlt', variant: 'secondary' },
    cancelled: { label: 'Storniert', variant: 'destructive' },
  };

  return (
    <PageShell>
      <ModulePageHeader 
        title="LEADMANAGER" 
        description="Abrechnungen und Zahlungsübersicht" 
      />

      {isLoading ? (
        <div className={DESIGN.KPI_GRID.FULL}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className={DESIGN.KPI_GRID.FULL}>
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Provisionshistorie</CardTitle>
              <CardDescription>Übersicht aller Provisionsvorgänge</CardDescription>
            </CardHeader>
            <CardContent>
              {data && data.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Kaufpreis</TableHead>
                      <TableHead className="text-right">Provision</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((tx) => {
                      const config = statusConfig[tx.status] || { label: tx.status, variant: 'outline' as const };
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {tx.notary_date 
                              ? format(new Date(tx.notary_date), 'dd.MM.yyyy', { locale: de })
                              : format(new Date(tx.created_at), 'dd.MM.yyyy', { locale: de })
                            }
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(tx.final_price)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatCurrency(tx.commission_amount || 0)}</TableCell>
                          <TableCell><Badge variant={config.variant}>{config.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-medium">Noch keine Provisionen</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Abgeschlossene Verkäufe und deren Provisionen erscheinen hier automatisch.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}

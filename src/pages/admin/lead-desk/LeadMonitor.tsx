/**
 * Lead Desk — Monitor Tab
 * Kampagnen-KPIs und Lead-Pipeline-Übersicht.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Target, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface LeadMonitorProps {
  stats: {
    totalPool: number;
    assigned: number;
    pending: number;
    converted: number;
    lost?: number;
  };
  commissionStats: {
    pending: number;
    approved: number;
    invoiced: number;
    paid: number;
    totalPending: number;
    totalPaid: number;
  };
}

export function LeadMonitor({ stats, commissionStats }: LeadMonitorProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const conversionRate = stats.totalPool > 0
    ? ((stats.converted / stats.totalPool) * 100).toFixed(1)
    : '0.0';

  const pipelineStages = [
    { label: 'Offen', count: stats.pending, icon: Target, color: 'bg-amber-500' },
    { label: 'Zugewiesen', count: stats.assigned, icon: Users, color: 'bg-blue-500' },
    { label: 'Konvertiert', count: stats.converted, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Verloren', count: stats.lost ?? 0, icon: XCircle, color: 'bg-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{stats.totalPool}</p>
            <p className="text-sm text-muted-foreground">Leads gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-500">{conversionRate}%</p>
            <p className="text-sm text-muted-foreground">Conversion-Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-500">{formatCurrency(commissionStats.totalPending)}</p>
            <p className="text-sm text-muted-foreground">Provisionen ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{formatCurrency(commissionStats.totalPaid)}</p>
            <p className="text-sm text-muted-foreground">Provisionen ausgezahlt</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Lead-Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const width = stats.totalPool > 0 ? Math.max((stage.count / stats.totalPool) * 100, 2) : 0;
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-28 flex items-center gap-2 text-sm">
                    <stage.icon className="h-4 w-4 text-muted-foreground" />
                    {stage.label}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{stage.count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Provisionen Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Provisions-Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{commissionStats.pending}</p>
              <p className="text-xs text-muted-foreground">Ausstehend</p>
            </div>
            <div>
              <p className="text-xl font-bold">{commissionStats.approved}</p>
              <p className="text-xs text-muted-foreground">Genehmigt</p>
            </div>
            <div>
              <p className="text-xl font-bold">{commissionStats.invoiced}</p>
              <p className="text-xs text-muted-foreground">Fakturiert</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-500">{commissionStats.paid}</p>
              <p className="text-xs text-muted-foreground">Bezahlt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Finance Desk — Monitor Tab
 * Pipeline-KPIs und Conversion-Übersicht.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Target, CheckCircle, XCircle } from 'lucide-react';

interface MonitorStats {
  total: number;
  newCount: number;
  contacted: number;
  qualified: number;
  assigned: number;
  converted: number;
  lost: number;
}

interface FinanceDeskMonitorProps {
  stats: MonitorStats;
}

export function FinanceDeskMonitor({ stats }: FinanceDeskMonitorProps) {
  const conversionRate = stats.total > 0
    ? ((stats.converted / stats.total) * 100).toFixed(1)
    : '0.0';
  const qualificationRate = stats.total > 0
    ? (((stats.qualified + stats.converted) / stats.total) * 100).toFixed(1)
    : '0.0';

  const pipelineStages = [
    { label: 'Neu', count: stats.newCount, icon: Target, color: 'bg-amber-500' },
    { label: 'Kontaktiert', count: stats.contacted, icon: Users, color: 'bg-blue-500' },
    { label: 'Qualifiziert', count: stats.qualified, icon: TrendingUp, color: 'bg-primary' },
    { label: 'Zugewiesen', count: stats.assigned, icon: Users, color: 'bg-indigo-500' },
    { label: 'Konvertiert', count: stats.converted, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Verloren', count: stats.lost, icon: XCircle, color: 'bg-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Leads gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{qualificationRate}%</p>
            <p className="text-sm text-muted-foreground">Qualifizierungsrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-500">{conversionRate}%</p>
            <p className="text-sm text-muted-foreground">Conversion-Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Pipeline-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const width = stats.total > 0 ? Math.max((stage.count / stats.total) * 100, 2) : 0;
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
    </div>
  );
}

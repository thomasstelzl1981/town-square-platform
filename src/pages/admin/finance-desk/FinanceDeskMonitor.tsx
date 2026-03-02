/**
 * Finance Desk — Monitor Tab (FLC-powered)
 * Pipeline-KPIs, Stuck/SLA-Alerts, Phasenverteilung.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertTriangle, Clock, TrendingUp, CheckCircle, XCircle, Activity } from 'lucide-react';
import type { FLCMonitorCase } from '@/hooks/useFLCMonitorCases';
import { FLC_PHASE_LABELS, FLC_PHASE_ORDER } from '@/engines/flc/spec';

interface FinanceDeskMonitorProps {
  cases: FLCMonitorCase[];
  stuckCases: FLCMonitorCase[];
  breachCases: FLCMonitorCase[];
}

export function FinanceDeskMonitor({ cases, stuckCases, breachCases }: FinanceDeskMonitorProps) {
  // Phase distribution
  const phaseCounts = new Map<string, number>();
  for (const c of cases) {
    const phase = c.computed.phase;
    phaseCounts.set(phase, (phaseCounts.get(phase) || 0) + 1);
  }

  // Blocking gates count
  const blockedCount = cases.filter(c => c.computed.blockingGates.length > 0).length;

  const pipelineStages = FLC_PHASE_ORDER
    .filter(p => phaseCounts.has(p))
    .map(p => ({
      phase: p,
      label: FLC_PHASE_LABELS[p],
      count: phaseCounts.get(p) || 0,
    }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-3xl font-bold">{cases.length}</p>
            <p className="text-sm text-muted-foreground">Offene Fälle</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-3xl font-bold text-amber-500">{stuckCases.length}</p>
            <p className="text-sm text-muted-foreground">Stuck (überfällig)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-3xl font-bold text-destructive">{breachCases.length}</p>
            <p className="text-sm text-muted-foreground">SLA-Breach</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-3xl font-bold text-orange-500">{blockedCount}</p>
            <p className="text-sm text-muted-foreground">Blockierte Gates</p>
          </CardContent>
        </Card>
      </div>

      {/* Stuck Cases List */}
      {stuckCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-500" />
              Überfällige Fälle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stuckCases.map((c) => (
                <div key={c.requestId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{c.publicId || c.requestId.slice(0, 8)}</span>
                    <span className="text-muted-foreground text-sm ml-2">{c.contactName}</span>
                    {c.managerName && (
                      <span className="text-muted-foreground text-sm ml-2">→ {c.managerName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {FLC_PHASE_LABELS[c.computed.phase] || c.computed.phase}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {c.computed.stuckDays}d überfällig
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Breach List */}
      {breachCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              SLA-Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {breachCases.map((c) => (
                <div key={c.requestId} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{c.publicId || c.requestId.slice(0, 8)}</span>
                    <span className="text-muted-foreground text-sm ml-2">{c.contactName}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {c.computed.stuckDays}d in {FLC_PHASE_LABELS[c.computed.phase] || c.computed.phase}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Funnel by Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Pipeline nach Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineStages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine offenen Fälle</p>
          ) : (
            <div className="space-y-3">
              {pipelineStages.map((stage) => {
                const width = cases.length > 0 ? Math.max((stage.count / cases.length) * 100, 3) : 0;
                return (
                  <div key={stage.phase} className="flex items-center gap-3">
                    <div className="w-48 text-sm truncate" title={stage.label}>
                      {stage.label}
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium">{stage.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

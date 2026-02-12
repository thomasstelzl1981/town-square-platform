/**
 * AcquiaryMonitoring — Zone 1 KPI Dashboard for Aging + Throughput
 * 
 * Provides platform admins with oversight of mandate pipeline health
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, Clock, Users, TrendingUp, AlertTriangle, 
  CheckCircle2, Inbox, UserCheck, Loader2
} from 'lucide-react';
import { useAcqMandates, useAcqMandatesInbox, useAcqMandatesAssigned } from '@/hooks/useAcqMandate';
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG } from '@/types/acquisition';

export function AcquiaryMonitoring() {
  const { data: allMandates, isLoading } = useAcqMandates();
  const { data: inboxMandates } = useAcqMandatesInbox();
  const { data: assignedMandates } = useAcqMandatesAssigned();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mandates = allMandates || [];
  const inbox = inboxMandates || [];
  const assigned = assignedMandates || [];

  // Calculate KPIs
  const totalMandates = mandates.length;
  const activeMandates = mandates.filter(m => m.status === 'active').length;
  const closedMandates = mandates.filter(m => m.status === 'closed').length;
  const pausedMandates = mandates.filter(m => m.status === 'paused').length;

  // Aging analysis
  const now = new Date();
  const agingAnalysis = inbox.map(m => ({
    id: m.id,
    code: m.code,
    created: new Date(m.created_at),
    ageHours: differenceInHours(now, new Date(m.created_at)),
    ageDays: differenceInDays(now, new Date(m.created_at)),
  }));

  const criticalAging = agingAnalysis.filter(a => a.ageHours > 48);
  const warningAging = agingAnalysis.filter(a => a.ageHours > 24 && a.ageHours <= 48);

  // Waiting for acceptance
  const waitingAnalysis = assigned.map(m => ({
    id: m.id,
    code: m.code,
    assignedAt: m.assigned_at ? new Date(m.assigned_at) : new Date(m.created_at),
    waitingDays: differenceInDays(now, m.assigned_at ? new Date(m.assigned_at) : new Date(m.created_at)),
  }));

  const longWaiting = waitingAnalysis.filter(w => w.waitingDays > 3);

  // Status distribution
  const statusCounts = mandates.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Average processing time (submitted → active)
  const completedWithDates = mandates.filter(
    m => m.status === 'active' && m.split_terms_confirmed_at && m.created_at
  );
  const avgProcessingDays = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, m) => {
        return sum + differenceInDays(
          new Date(m.split_terms_confirmed_at!), 
          new Date(m.created_at)
        );
      }, 0) / completedWithDates.length
    : 0;

  return (
    <div className={`${DESIGN.CONTAINER.PADDING} ${DESIGN.SPACING.SECTION}`}>
      {/* Header */}
      <div>
        <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>
          <Activity className="h-6 w-6 inline mr-2" />
          Monitoring
        </h2>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Pipeline-Gesundheit und Durchlaufzeiten
        </p>
      </div>

      {/* Main KPIs */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inbox.length}</div>
                <div className="text-xs text-muted-foreground">In Inbox</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{assigned.length}</div>
                <div className="text-xs text-muted-foreground">Warten auf Annahme</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeMandates}</div>
                <div className="text-xs text-muted-foreground">Aktiv</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{closedMandates}</div>
                <div className="text-xs text-muted-foreground">Abgeschlossen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMandates}</div>
                <div className="text-xs text-muted-foreground">Gesamt</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {(criticalAging.length > 0 || longWaiting.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Critical Aging */}
          {criticalAging.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Kritisches Aging ({criticalAging.length})
                </CardTitle>
                <CardDescription>
                  Mandate in Inbox seit mehr als 48 Stunden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalAging.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <span className="font-mono text-sm">{m.code}</span>
                      <Badge variant="destructive">
                        {m.ageDays > 0 ? `${m.ageDays}d` : `${m.ageHours}h`}
                      </Badge>
                    </div>
                  ))}
                  {criticalAging.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{criticalAging.length - 5} weitere
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Long Waiting */}
          {longWaiting.length > 0 && (
            <Card className="border-accent bg-accent/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-accent-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lange Wartezeit ({longWaiting.length})
                </CardTitle>
                <CardDescription>
                  Zugewiesen, aber nicht angenommen seit mehr als 3 Tagen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {longWaiting.slice(0, 5).map(w => (
                    <div key={w.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <span className="font-mono text-sm">{w.code}</span>
                      <Badge variant="outline" className="border-accent text-accent-foreground">
                        {w.waitingDays}d
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Alerts */}
      {criticalAging.length === 0 && longWaiting.length === 0 && inbox.length === 0 && assigned.length === 0 && (
        <Card className="bg-chart-2/10 border-chart-2/30">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-chart-2 mb-4" />
            <h3 className="text-lg font-semibold">Alles im grünen Bereich</h3>
            <p className="text-muted-foreground">Keine offenen Mandate in Inbox oder wartend</p>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = MANDATE_STATUS_CONFIG[status] || { label: status, color: 'gray' };
              const percentage = totalMandates > 0 ? (count / totalMandates) * 100 : 0;
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{config.label}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Throughput Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Durchlaufzeiten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Ø Bearbeitungszeit</div>
                <div className="text-xs text-muted-foreground">Einreichung → Aktiv</div>
              </div>
              <div className="text-2xl font-bold">
                {avgProcessingDays > 0 ? `${avgProcessingDays.toFixed(1)}d` : '–'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Aktive Manager</div>
                <div className="text-xs text-muted-foreground">Mit laufenden Mandaten</div>
              </div>
              <div className="text-2xl font-bold">
                {new Set(mandates.filter(m => m.status === 'active').map(m => m.assigned_manager_user_id)).size}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Erfolgsquote</div>
                <div className="text-xs text-muted-foreground">Abgeschlossen / Gesamt</div>
              </div>
              <div className="text-2xl font-bold">
                {totalMandates > 0 ? `${((closedMandates / totalMandates) * 100).toFixed(0)}%` : '–'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AcquiaryMonitoring;

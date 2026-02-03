/**
 * FutureRoom Monitoring — KPIs and Aging Dashboard
 * 
 * Shows:
 * - Count by status
 * - Average time to assign
 * - Aging buckets (>7 days)
 * - Stuck cases
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinanceMandates } from '@/hooks/useFinanceMandate';
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  incomplete: 'Unvollständig',
  ready_to_submit: 'Bereit zur Einreichung',
  submitted_to_zone1: 'Eingereicht',
  assigned: 'Zugewiesen',
  in_processing: 'In Bearbeitung',
  needs_customer_action: 'Wartet auf Kunde',
  completed: 'Abgeschlossen',
  rejected: 'Abgelehnt',
  new: 'Neu',
};

export default function FutureRoomMonitoring() {
  const { data: mandates, isLoading } = useFinanceMandates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status counts
  const statusCounts: Record<string, number> = {};
  mandates?.forEach(m => {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
  });

  // Aging analysis
  const now = new Date();
  const agingBuckets = {
    lessThan3Days: 0,
    threeTo7Days: 0,
    moreThan7Days: 0,
  };

  const stuckCases = mandates?.filter(m => {
    const created = new Date(m.created_at);
    const days = differenceInDays(now, created);
    
    if (days < 3) agingBuckets.lessThan3Days++;
    else if (days < 7) agingBuckets.threeTo7Days++;
    else agingBuckets.moreThan7Days++;

    // Stuck = submitted_to_zone1 or assigned for >7 days
    return (m.status === 'submitted_to_zone1' || m.status === 'assigned') && days > 7;
  }) || [];

  const totalCases = mandates?.length || 0;
  const avgDaysToAssign = mandates
    ?.filter(m => m.delegated_at)
    .reduce((acc, m) => {
      const days = differenceInDays(new Date(m.delegated_at!), new Date(m.created_at));
      return acc + days;
    }, 0) || 0;
  
  const assignedCount = mandates?.filter(m => m.delegated_at).length || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt Fälle</CardDescription>
            <CardTitle className="text-3xl">{totalCases}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>⌀ Tage bis Zuweisung</CardDescription>
            <CardTitle className="text-3xl">
              {(avgDaysToAssign / assignedCount).toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Älter als 7 Tage</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {agingBuckets.moreThan7Days}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stuck Cases</CardDescription>
            <CardTitle className="text-3xl text-warning">
              {stuckCases.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status-Verteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm text-muted-foreground">
                  {STATUS_LABELS[status] || status}
                </span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aging Buckets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Altersstruktur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {agingBuckets.lessThan3Days}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                &lt; 3 Tage
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {agingBuckets.threeTo7Days}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                3-7 Tage
              </div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {agingBuckets.moreThan7Days}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                &gt; 7 Tage
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stuck Cases */}
      {stuckCases.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Stuck Cases (Handlungsbedarf)
            </CardTitle>
            <CardDescription>
              Fälle mit Status "Eingereicht" oder "Zugewiesen" seit mehr als 7 Tagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alter</TableHead>
                  <TableHead>Zugewiesen an</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stuckCases.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      {m.public_id || m.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {STATUS_LABELS[m.status] || m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(m.created_at), { 
                        addSuffix: false, 
                        locale: de 
                      })}
                    </TableCell>
                    <TableCell>
                      {m.assigned_manager_id || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

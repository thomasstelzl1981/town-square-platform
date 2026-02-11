/**
 * FM Status — System View with Pipeline Status Definitions
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Info } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { FM_PIPELINE_STEPS, getStatusLabel } from '@/types/finance';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
}

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

export default function FMStatus({ cases }: Props) {
  const statusCounts: Record<string, number> = {};
  cases.forEach(c => {
    const status = getRequestStatus(c);
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return (
    <PageShell>
      <ModulePageHeader title="STATUS" description="Pipeline-Übersicht, Status-Definitionen und Ihre persönliche Statistik." />

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <WidgetHeader icon={Info} title="Pipeline-Status" description="Alle möglichen Status-Werte im Finanzierungsprozess" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Anzahl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FM_PIPELINE_STEPS.map(s => (
                <TableRow key={s.key}>
                  <TableCell><Badge variant="outline">{s.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{s.description}</TableCell>
                  <TableCell className="text-right font-mono">{statusCounts[s.key] || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <WidgetHeader icon={BarChart3} title="Meine Statistik" description="Zusammenfassung Ihrer Fälle" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{cases.length}</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{cases.filter(c => c.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Aktiv</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{cases.filter(c => getRequestStatus(c) === 'completed' || c.status === 'completed').length}</div>
              <div className="text-sm text-muted-foreground">Abgeschlossen</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-destructive">{statusCounts['needs_customer_action'] || 0}</div>
              <div className="text-sm text-muted-foreground">Rückfragen</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

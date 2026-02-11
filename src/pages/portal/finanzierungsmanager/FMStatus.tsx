/**
 * FM Status — Clean pipeline overview, no big stat boxes
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
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
      <ModulePageHeader
        title="STATUS"
        description={`${cases.length} Fälle insgesamt — Pipeline-Übersicht und Status-Definitionen.`}
      />

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[180px]">Status</TableHead>
                <TableHead className="text-xs">Beschreibung</TableHead>
                <TableHead className="text-xs text-right w-[80px]">Anzahl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FM_PIPELINE_STEPS.map(s => (
                <TableRow key={s.key}>
                  <TableCell className="py-2"><Badge variant="outline" className="text-[10px]">{s.label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground py-2">{s.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm py-2">{statusCounts[s.key] || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

/**
 * FM Status — System View and Audit Trail
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Info } from 'lucide-react';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
}

const STATUS_FLOW = [
  { key: 'draft', label: 'Entwurf', description: 'Kunde erstellt Anfrage' },
  { key: 'incomplete', label: 'Unvollständig', description: 'Fehlende Angaben/Dokumente' },
  { key: 'ready_to_submit', label: 'Bereit', description: 'Alle Pflichtfelder ausgefüllt' },
  { key: 'submitted_to_zone1', label: 'Eingereicht', description: 'An FutureRoom übermittelt' },
  { key: 'assigned', label: 'Zugewiesen', description: 'Manager zugewiesen' },
  { key: 'in_processing', label: 'In Bearbeitung', description: 'Manager bearbeitet Fall' },
  { key: 'needs_customer_action', label: 'Warte auf Kunde', description: 'Rückfrage offen' },
  { key: 'completed', label: 'Abgeschlossen', description: 'Erfolgreich abgeschlossen' },
  { key: 'rejected', label: 'Abgelehnt', description: 'Fall wurde abgelehnt' },
];

export default function FMStatus({ cases }: Props) {
  // Status distribution
  const statusCounts: Record<string, number> = {};
  cases.forEach(c => {
    const status = c.finance_mandates?.finance_requests?.status || c.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Status Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Status-Definitionen
          </CardTitle>
          <CardDescription>
            Übersicht der möglichen Status-Werte im Finanzierungsprozess
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Anzahl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATUS_FLOW.map((s) => (
                <TableRow key={s.key}>
                  <TableCell>
                    <Badge variant="outline">{s.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {statusCounts[s.key] || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* My Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Meine Statistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{cases.length}</div>
              <div className="text-sm text-muted-foreground">Gesamt Fälle</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {cases.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Aktiv</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-green-600">
                {cases.filter(c => c.status === 'completed' || c.status === 'closed').length}
              </div>
              <div className="text-sm text-muted-foreground">Abgeschlossen</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-destructive">
                {statusCounts['needs_customer_action'] || 0}
              </div>
              <div className="text-sm text-muted-foreground">Warte auf Kunde</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

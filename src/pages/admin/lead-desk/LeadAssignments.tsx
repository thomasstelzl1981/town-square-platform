/**
 * LeadAssignments — Tab 2: Lead-Zuweisungen
 */
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface LeadAssignment {
  id: string;
  lead_id: string;
  partner_org_id: string;
  partner_name?: string;
  status: string;
  offered_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
}

interface LeadAssignmentsProps {
  assignments: LeadAssignment[];
}

export function LeadAssignments({ assignments }: LeadAssignmentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead-Zuweisungen</CardTitle>
        <CardDescription>{assignments.length} Zuweisungen im System</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">Keine Zuweisungen</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Angeboten</TableHead>
                <TableHead>Akzeptiert</TableHead>
                <TableHead>Abgelehnt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.lead_id.slice(0, 8)}</TableCell>
                  <TableCell>{a.partner_name}</TableCell>
                  <TableCell>
                    <Badge variant={a.accepted_at ? 'default' : a.rejected_at ? 'destructive' : 'secondary'}>
                      {a.accepted_at ? 'Akzeptiert' : a.rejected_at ? 'Abgelehnt' : 'Ausstehend'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(a.offered_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                  <TableCell>{a.accepted_at ? <span className="text-primary">{format(new Date(a.accepted_at), 'dd.MM.yyyy', { locale: de })}</span> : '—'}</TableCell>
                  <TableCell>{a.rejected_at ? <span className="text-destructive">{format(new Date(a.rejected_at), 'dd.MM.yyyy', { locale: de })}</span> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

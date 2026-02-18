/**
 * Finance Desk — Fälle Tab
 * Zeigt zugewiesene/aktive Beratungsfälle.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Lead {
  id: string;
  public_id: string | null;
  source: string;
  status: string;
  interest_type: string | null;
  created_at: string;
  contact_name?: string | null;
  assigned_partner_name?: string | null;
}

interface FinanceDeskFaelleProps {
  leads: Lead[];
}

export function FinanceDeskFaelle({ leads }: FinanceDeskFaelleProps) {
  const activeCases = leads.filter(l => l.status === 'assigned' || l.status === 'qualified');

  if (activeCases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">Keine aktiven Fälle.</p>
          <p className="text-xs text-muted-foreground mt-1">Zugewiesene Beratungsanfragen erscheinen hier als aktive Fälle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-primary" />
          Aktive Beratungsfälle ({activeCases.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Berater</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCases.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell className="font-medium">{lead.contact_name || lead.public_id || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{lead.interest_type || 'Allgemein'}</Badge>
                </TableCell>
                <TableCell>{lead.assigned_partner_name || '—'}</TableCell>
                <TableCell>
                  <Badge variant={lead.status === 'qualified' ? 'default' : 'secondary'}>
                    {lead.status === 'qualified' ? 'Qualifiziert' : 'Zugewiesen'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

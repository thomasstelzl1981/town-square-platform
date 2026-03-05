/**
 * OversightFinanceTab — Finance packages table
 * R-24 sub-component
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface FinancePackageOverview {
  id: string;
  tenant_name: string;
  property_name: string;
  contact_name: string;
  status: string;
  requested_amount: number | null;
  created_at: string;
  exported_at: string | null;
}

export function OversightFinanceTab({ packages }: { packages: FinancePackageOverview[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Finance Pakete</CardTitle><CardDescription>{packages.length} Pakete im System</CardDescription></CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <div className="text-center py-8"><Banknote className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="mt-2 text-muted-foreground">Keine Finance-Pakete gefunden</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Kontakt</TableHead><TableHead>Tenant</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Betrag</TableHead><TableHead>Erstellt</TableHead><TableHead>Exportiert</TableHead></TableRow></TableHeader>
            <TableBody>
              {packages.map(fp => (
                <TableRow key={fp.id}>
                  <TableCell className="font-medium">{fp.property_name}</TableCell>
                  <TableCell>{fp.contact_name}</TableCell>
                  <TableCell><Badge variant="outline">{fp.tenant_name}</Badge></TableCell>
                  <TableCell><Badge variant={fp.status === 'ready_for_handoff' ? 'default' : 'secondary'}>{fp.status}</Badge></TableCell>
                  <TableCell className="text-right">{fp.requested_amount ? `€${fp.requested_amount.toLocaleString()}` : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(fp.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                  <TableCell>{fp.exported_at ? <Badge variant="default" className="bg-green-600">Exportiert</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

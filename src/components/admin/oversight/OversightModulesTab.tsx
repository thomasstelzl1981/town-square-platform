/**
 * OversightModulesTab — Tile activations table
 * R-24 sub-component
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TileActivation {
  id: string;
  tile_name: string;
  tenant_name: string;
  status: string;
  activated_at: string;
}

export function OversightModulesTab({ activations }: { activations: TileActivation[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Modul-Aktivierungen</CardTitle><CardDescription>{activations.length} Aktivierungen im System</CardDescription></CardHeader>
      <CardContent>
        {activations.length === 0 ? (
          <div className="text-center py-8"><LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="mt-2 text-muted-foreground">Keine Modul-Aktivierungen gefunden</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Modul</TableHead><TableHead>Tenant</TableHead><TableHead>Status</TableHead><TableHead>Aktiviert</TableHead></TableRow></TableHeader>
            <TableBody>
              {activations.map(act => (
                <TableRow key={act.id}>
                  <TableCell className="font-medium">{act.tile_name}</TableCell>
                  <TableCell>{act.tenant_name}</TableCell>
                  <TableCell><Badge variant={act.status === 'active' ? 'default' : 'secondary'}>{act.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(act.activated_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

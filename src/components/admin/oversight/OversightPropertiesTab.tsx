/**
 * OversightPropertiesTab — Properties table
 * R-24 sub-component
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, Eye, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PropertyOverview {
  id: string;
  name: string;
  street: string;
  city: string;
  tenant_name: string;
  unit_count: number;
  created_at: string;
  is_public_listing: boolean;
}

interface Props {
  properties: PropertyOverview[];
  onSelect: (prop: PropertyOverview) => void;
}

export function OversightPropertiesTab({ properties, onSelect }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Alle Immobilien</CardTitle><CardDescription>Systemweite Übersicht aller {properties.length} Immobilien</CardDescription></CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8"><Home className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="mt-2 text-muted-foreground">Keine Immobilien gefunden</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Adresse</TableHead><TableHead>Eigentümer</TableHead><TableHead className="text-right">Einheiten</TableHead><TableHead>Public</TableHead><TableHead>Erstellt</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
            <TableBody>
              {properties.map(prop => (
                <TableRow key={prop.id}>
                  <TableCell className="font-medium">{prop.name}</TableCell>
                  <TableCell className="text-muted-foreground">{prop.street ? `${prop.street}, ${prop.city}` : prop.city || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{prop.tenant_name}</Badge></TableCell>
                  <TableCell className="text-right">{prop.unit_count}</TableCell>
                  <TableCell>{prop.is_public_listing ? <Badge variant="default" className="bg-green-600"><Globe className="h-3 w-3 mr-1" />Öffentlich</Badge> : <Badge variant="secondary">Privat</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(prop.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => onSelect(prop)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Check, Clock, UserPlus, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HowItWorks } from '@/components/vertriebspartner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Commission {
  id: string;
  property: string;
  customer: string;
  closedAt: Date;
  amount: number;
  status: 'paid' | 'pending';
}

const mockCommissions: Commission[] = [
  {
    id: '1',
    property: 'MFH Leipzig-Connewitz',
    customer: 'Müller GmbH',
    closedAt: new Date(2026, 0, 15),
    amount: 7500,
    status: 'paid',
  },
  {
    id: '2',
    property: 'Zinshaus Chemnitz',
    customer: 'Schmidt & Partner',
    closedAt: new Date(2026, 0, 20),
    amount: 3200,
    status: 'pending',
  },
];

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const NetworkTab = () => {
  const [commissions] = useState(mockCommissions);

  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <HowItWorks variant="network" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt (2026)</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offen</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{formatCurrency(pendingCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ausgezahlt</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(paidCommissions)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Provisionen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Abschluss</TableHead>
                <TableHead className="text-right">Provision</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Noch keine abgeschlossenen Provisionen.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.property}</TableCell>
                    <TableCell>{commission.customer}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(commission.closedAt, 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(commission.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {commission.status === 'paid' ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="mr-1 h-3 w-3" />
                          Bezahlt
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Offen
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Section (Phase 2 Placeholder) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mein Team
              </CardTitle>
              <CardDescription>Eigene Vertriebspartner einladen</CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Einladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Phase 2</AlertTitle>
            <AlertDescription>
              Diese Funktion wird in einer späteren Version verfügbar sein. 
              Sie können dann eigene Vertriebspartner einladen, die unter Ihrem Account arbeiten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Customer Portal Section (Phase 2 Placeholder) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Kunden einladen
              </CardTitle>
              <CardDescription>Kundenportale erstellen</CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Einladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Phase 2</AlertTitle>
            <AlertDescription>
              Diese Funktion wird in einer späteren Version verfügbar sein. 
              Sie können dann Ihren Kunden ein eigenes Portal einrichten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTab;

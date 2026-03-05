/**
 * AncillaryCostsTab — Maintenance + GrESt tables
 * R-18 sub-component
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  maintenanceCost: number;
  onMaintenanceCostChange: (val: number) => void;
}

export function AncillaryCostsTab({ maintenanceCost, onMaintenanceCostChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Instandhaltungskosten</CardTitle><CardDescription>Pauschalen für laufende Objektkosten</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Standard-Instandhaltung</Label>
            <div className="flex items-center gap-2">
              <Input type="number" step="0.05" value={maintenanceCost} onChange={(e) => onMaintenanceCostChange(parseFloat(e.target.value) || 0.4)} className="w-24" />
              <span className="text-muted-foreground">€/qm/Monat</span>
            </div>
            <p className="text-xs text-muted-foreground">Entspricht ca. {(maintenanceCost * 12).toFixed(2)} €/qm/Jahr</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Erwerbsnebenkosten</CardTitle><CardDescription>Grunderwerbsteuer nach Bundesland</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Bundesland</TableHead><TableHead className="text-right">GrESt</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell>Bayern, Sachsen</TableCell><TableCell className="text-right">3,5%</TableCell></TableRow>
              <TableRow><TableCell>Hamburg, Baden-Württemberg</TableCell><TableCell className="text-right">5,0%</TableCell></TableRow>
              <TableRow><TableCell>Berlin, Hessen, ...</TableCell><TableCell className="text-right">6,0%</TableCell></TableRow>
              <TableRow><TableCell>Brandenburg, NRW, ...</TableCell><TableCell className="text-right">6,5%</TableCell></TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-2">+ Notar/Grundbuch: ca. 1,5-2% | + Makler: 3-7%</p>
        </CardContent>
      </Card>
    </div>
  );
}

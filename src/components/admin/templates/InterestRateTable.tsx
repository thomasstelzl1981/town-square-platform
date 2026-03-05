/**
 * InterestRateTable — Editable interest rate table
 * R-18 sub-component
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface InterestRateRow {
  fixedPeriod: number;
  ltv60: number;
  ltv80: number;
  ltv90: number;
  ltv100: number;
}

interface Props {
  rates: InterestRateRow[];
  lastUpdated: string;
  onRateChange: (index: number, field: keyof InterestRateRow, value: string) => void;
}

export function InterestRateTable({ rates, lastUpdated, onRateChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Zinstabelle nach Beleihung & Zinsbindung</span>
          <Badge variant="outline">Stand: {lastUpdated}</Badge>
        </CardTitle>
        <CardDescription>
          Diese Zinssätze werden für alle Investment-Berechnungen in Zone 2 und Zone 3 verwendet.
          Quelle: Finanztip / Statista (Januar 2026)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Zinsbindung</TableHead>
              <TableHead className="text-center">LTV ≤60%</TableHead>
              <TableHead className="text-center">LTV ≤80%</TableHead>
              <TableHead className="text-center">LTV ≤90%</TableHead>
              <TableHead className="text-center">LTV ≤100%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((row, index) => (
              <TableRow key={row.fixedPeriod}>
                <TableCell className="font-medium">
                  {row.fixedPeriod} Jahre
                  {row.fixedPeriod === 15 && <Badge variant="secondary" className="ml-2">Standard</Badge>}
                </TableCell>
                {(['ltv60', 'ltv80', 'ltv90', 'ltv100'] as const).map(field => (
                  <TableCell key={field}>
                    <div className="flex items-center justify-center gap-1">
                      <Input type="number" step="0.01" value={row[field]} onChange={(e) => onRateChange(index, field, e.target.value)} className="w-20 text-center" />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> LTV (Loan-to-Value) = Darlehenssumme / Kaufpreis × 100. Niedrigere Beleihung führt zu besseren Konditionen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

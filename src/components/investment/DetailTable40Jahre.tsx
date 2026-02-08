import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { YearlyData } from '@/hooks/useInvestmentEngine';
import { ChevronDown, ChevronUp, TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DetailTable40JahreProps {
  projection: YearlyData[];
  defaultOpen?: boolean;
  showAllYears?: boolean;
}

export function DetailTable40Jahre({ 
  projection, 
  defaultOpen = false,
  showAllYears = false 
}: DetailTable40JahreProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Filter years to show (all or every 5th + first 10)
  const displayData = showAllYears 
    ? projection 
    : projection.filter((_, i) => i < 10 || i % 5 === 4 || i === projection.length - 1);

  // Mobile: Card-based layout
  const MobileCardView = () => (
    <div className="space-y-3">
      {displayData.map((row) => (
        <div 
          key={row.year} 
          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-lg">Jahr {row.year}</span>
            <span className={cn(
              "text-lg font-bold",
              row.netWealth >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(row.netWealth)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashflow</span>
              <span className={cn(
                "font-medium",
                row.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(row.cashFlowAfterTax)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restschuld</span>
              <span className="font-medium">{formatCurrency(row.remainingDebt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Immobilienwert</span>
              <span className="font-medium">{formatCurrency(row.propertyValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Steuerersparnis</span>
              <span className="font-medium text-green-600">{formatCurrency(row.taxSavings)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop: Full table view
  const DesktopTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Jahr</TableHead>
            <TableHead className="text-right">Miete</TableHead>
            <TableHead className="text-right">Zinsen</TableHead>
            <TableHead className="text-right">Tilgung</TableHead>
            <TableHead className="text-right">Restschuld</TableHead>
            <TableHead className="text-right">Steuerersparnis</TableHead>
            <TableHead className="text-right">Cashflow</TableHead>
            <TableHead className="text-right">Immobilienwert</TableHead>
            <TableHead className="text-right">Nettovermögen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row) => (
            <TableRow key={row.year} className="hover:bg-muted/50">
              <TableCell className="font-medium">{row.year}</TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(row.rent)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {formatCurrency(row.interest)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.repayment)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(row.remainingDebt)}
              </TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(row.taxSavings)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-medium",
                row.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(row.cashFlowAfterTax)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(row.propertyValue)}
              </TableCell>
              <TableCell className="text-right font-bold text-green-600">
                {formatCurrency(row.netWealth)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                40-Jahres-Detailtabelle
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isMobile ? <MobileCardView /> : <DesktopTableView />}
            
            {/* Footer Legend - hidden on mobile */}
            {!isMobile && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2" />
                  Positive Werte (Einnahmen/Gewinne)
                </div>
                <div>
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2" />
                  Negative Werte (Ausgaben/Kosten)
                </div>
                <div>
                  <strong>Cashflow:</strong> Netto nach Steuern
                </div>
                <div>
                  <strong>Nettovermögen:</strong> Wert − Restschuld
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * R-8: Portfolio property table with search, row actions, summary row
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PropertyTable, PropertyCodeCell, PropertyCurrencyCell, type PropertyTableColumn } from '@/components/shared/PropertyTable';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { Plus, Trash2, Calculator, Table2, ChevronDown } from 'lucide-react';
import { isDemoId } from '@/engines/demoData/engine';
import { formatCurrency } from './portfolioHelpers';
import type { UnitWithProperty, PortfolioTotals } from './portfolioTypes';

interface PortfolioPropertyTableProps {
  displayUnits: UnitWithProperty[];
  isLoading: boolean;
  totals: PortfolioTotals | null;
  hasData: boolean;
  isDeleting: boolean;
  onDeleteProperty: (id: string) => void;
  onShowSummary: () => void;
  projectionData: Array<{ year: number; rent: number; interest: number; amortization: number; objektwert: number; restschuld: number; vermoegen: number }>;
  showAllYears: boolean;
  setShowAllYears: (v: boolean) => void;
}

export function PortfolioPropertyTable({
  displayUnits, isLoading, totals, hasData,
  isDeleting, onDeleteProperty, onShowSummary,
  projectionData, showAllYears, setShowAllYears,
}: PortfolioPropertyTableProps) {
  const navigate = useNavigate();

  const columns: PropertyTableColumn<UnitWithProperty>[] = useMemo(() => [
    { key: 'property_code', header: 'Code', width: '80px', render: (value) => <PropertyCodeCell code={value} /> },
    { key: 'property_type', header: 'Art', render: (value) => <Badge variant="outline" className="text-sm">{value}</Badge> },
    { key: 'address', header: 'Objekt', minWidth: '180px', render: (value) => value || '–' },
    { key: 'city', header: 'Ort', render: (value) => value || '–' },
    { key: 'unit_number', header: 'Einheit', render: (value) => <span className="text-sm text-muted-foreground">{value || 'MAIN'}</span> },
    { key: 'area_sqm', header: 'm²', align: 'right', render: (value) => value?.toLocaleString('de-DE') || '–' },
    { key: 'tenant_name', header: 'Mieter', render: (value, row) => value ? (<span className="truncate max-w-[150px] block" title={value}>{value}{row.leases_count > 1 && <Badge variant="outline" className="ml-1 text-xs">{row.leases_count}</Badge>}</span>) : <span className="text-muted-foreground">—</span> },
    { key: 'annual_net_cold_rent', header: 'Miete p.a.', align: 'right', render: (value) => <PropertyCurrencyCell value={value} /> },
    { key: 'market_value', header: 'Verkehrswert', align: 'right', render: (value) => <PropertyCurrencyCell value={value} variant="bold" /> },
    { key: 'financing_balance', header: 'Restschuld', align: 'right', render: (value) => <PropertyCurrencyCell value={value} variant="destructive" /> },
    { key: 'annuity_pa', header: 'Annuität p.a.', align: 'right', render: (value) => <PropertyCurrencyCell value={value} /> },
    { key: 'interest_pa', header: 'Zins p.a.', align: 'right', render: (value) => <PropertyCurrencyCell value={value} variant="muted" /> },
  ], []);

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle>Immobilienportfolio (Jahreswerte)</CardTitle></CardHeader>
      <CardContent>
        <PropertyTable
          data={displayUnits} columns={columns} isLoading={isLoading} showSearch
          searchPlaceholder="Nach Adresse, Code oder Mieter suchen..."
          searchFilter={(row, search) => row.address.toLowerCase().includes(search) || row.city.toLowerCase().includes(search) || (row.property_code?.toLowerCase().includes(search) ?? false) || (row.tenant_name?.toLowerCase().includes(search) ?? false)}
          onRowClick={(row) => navigate(`/portal/immobilien/${row.property_id}`)}
          rowActions={(row) => (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isDemoId(row.property_id) || isDeleting}
              onClick={(e) => { e.stopPropagation(); onDeleteProperty(row.property_id); }}
              title={isDemoId(row.property_id) ? 'Demo-Objekte können nicht gelöscht werden' : 'Immobilie löschen'}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          emptyState={{ message: 'Noch keine Einheiten im Portfolio. Beginnen Sie mit dem ersten Objekt.', actionLabel: 'Erste Immobilie anlegen', actionRoute: '/portal/immobilien/neu' }}
          headerActions={<DesktopOnly><Button onClick={() => navigate('/portal/immobilien/neu')}><Plus className="mr-2 h-4 w-4" />Neu</Button></DesktopOnly>}
        />

        {/* Summary Row */}
        {hasData && totals && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border-t-2 border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={onShowSummary}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary" />
                <div><p className="font-semibold">Σ Portfolio-Summe</p><p className="text-xs text-muted-foreground">{totals.propertyCount} Objekt(e), {totals.unitCount} Einheit(en)</p></div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right"><p className="font-semibold">{formatCurrency(totals.totalIncome)}</p><p className="text-xs text-muted-foreground">Miete p.a.</p></div>
                <div className="text-right"><p className="font-semibold">{formatCurrency(totals.totalValue)}</p><p className="text-xs text-muted-foreground">Verkehrswert</p></div>
                <div className="text-right"><p className="font-semibold text-destructive">{formatCurrency(totals.totalDebt)}</p><p className="text-xs text-muted-foreground">Restschuld</p></div>
                <div className="text-right"><p className="font-semibold">{formatCurrency(totals.totalAnnuity)}</p><p className="text-xs text-muted-foreground">Annuität p.a.</p></div>
                <Badge variant="outline" className="ml-2">Details →</Badge>
              </div>
            </div>
          </div>
        )}

        {/* 10/30-Year Projection Table */}
        {hasData && projectionData.length > 0 && (
          <div className={cn('mt-6', DESIGN.TABLE.WRAPPER)}>
            <div className={cn(DESIGN.CARD.SECTION_HEADER, 'flex items-center justify-between')}>
              <div className="flex items-center gap-2"><Table2 className="h-4 w-4" /><h3 className="font-semibold">Investmentkalkulation ({showAllYears ? '30' : '10'} Jahre)</h3></div>
              {projectionData.length > 11 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllYears(!showAllYears)}>
                  <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllYears ? 'rotate-180' : ''}`} />{showAllYears ? 'Weniger anzeigen' : 'Alle Jahre'}
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Jahr</TableHead>
                    <TableHead className="text-right">Miete p.a.</TableHead>
                    <TableHead className="text-right text-destructive">Zinsen</TableHead>
                    <TableHead className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>Tilgung</TableHead>
                    <TableHead className="text-right" style={{ color: 'hsl(0, 70%, 50%)' }}>Restschuld</TableHead>
                    <TableHead className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>Objektwert</TableHead>
                    <TableHead className="text-right" style={{ color: 'hsl(142, 70%, 45%)' }}>Vermögen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectionData.slice(1, showAllYears ? 31 : 11).map((row) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.rent)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(row.interest)}</TableCell>
                      <TableCell className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>{formatCurrency(row.amortization)}</TableCell>
                      <TableCell className="text-right" style={{ color: 'hsl(0, 70%, 50%)' }}>{formatCurrency(row.restschuld)}</TableCell>
                      <TableCell className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>{formatCurrency(row.objektwert)}</TableCell>
                      <TableCell className="text-right font-medium" style={{ color: 'hsl(142, 70%, 45%)' }}>{formatCurrency(row.vermoegen)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

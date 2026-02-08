/**
 * Project Pricing Block (Block E)
 * MOD-13 PROJEKTE
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { UnitStatusBadge } from '../UnitStatusBadge';
import type { DevProjectUnit, DevProject } from '@/types/projekte';

interface ProjectPricingBlockProps {
  project: DevProject;
  units: DevProjectUnit[];
}

export function ProjectPricingBlock({ project, units }: ProjectPricingBlockProps) {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate aggregates
  const totalListPrice = units.reduce((sum, u) => sum + (u.list_price || 0), 0);
  const totalMinPrice = units.reduce((sum, u) => sum + (u.min_price || 0), 0);
  const avgPricePerSqm = units.length > 0
    ? units.reduce((sum, u) => sum + (u.price_per_sqm || 0), 0) / units.length
    : 0;

  const soldUnits = units.filter(u => u.status === 'sold');
  const soldValue = soldUnits.reduce((sum, u) => sum + (u.list_price || 0), 0);

  const commissionRate = project.commission_rate_percent || 0;
  const totalCommission = totalListPrice * (commissionRate / 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Euro className="h-5 w-5 text-primary" />
          <CardTitle>E. Preisliste & Provision</CardTitle>
        </div>
        <Badge variant="secondary">{units.length} Einheiten</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Gesamt-Listenpreis</div>
            <div className="text-xl font-bold">{formatCurrency(totalListPrice)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Ø Preis/m²</div>
            <div className="text-xl font-bold">{formatCurrency(avgPricePerSqm)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Provision ({commissionRate}%)</div>
            <div className="text-xl font-bold">{formatCurrency(totalCommission)}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700">Bereits verkauft</div>
            <div className="text-xl font-bold text-green-700">{formatCurrency(soldValue)}</div>
          </div>
        </div>

        {/* Units Table */}
        {units.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Einheiten angelegt</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Einheit</th>
                  <th className="text-right py-2 px-2">Fläche</th>
                  <th className="text-right py-2 px-2">Listenpreis</th>
                  <th className="text-right py-2 px-2">Mindestpreis</th>
                  <th className="text-right py-2 px-2">€/m²</th>
                  <th className="text-right py-2 px-2">Provision</th>
                  <th className="text-right py-2 px-2">Netto</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const commission = (unit.list_price || 0) * (commissionRate / 100);
                  const netProceeds = (unit.list_price || 0) - commission;
                  const priceDeviation = unit.list_price && unit.min_price 
                    ? ((unit.list_price - unit.min_price) / unit.list_price) * 100
                    : null;

                  return (
                    <tr key={unit.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{unit.unit_number}</td>
                      <td className="py-2 px-2 text-right">{unit.area_sqm?.toFixed(1)} m²</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(unit.list_price)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="flex items-center justify-end gap-1">
                          {formatCurrency(unit.min_price)}
                          {priceDeviation !== null && priceDeviation > 0 && (
                            <TrendingDown className="h-3 w-3 text-yellow-600" />
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">{formatCurrency(unit.price_per_sqm)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">
                        {formatCurrency(commission)}
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-green-600">
                        {formatCurrency(netProceeds)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <UnitStatusBadge status={unit.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-2 px-2">Gesamt</td>
                  <td className="py-2 px-2 text-right">
                    {units.reduce((sum, u) => sum + (u.area_sqm || 0), 0).toFixed(1)} m²
                  </td>
                  <td className="py-2 px-2 text-right">{formatCurrency(totalListPrice)}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(totalMinPrice)}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(avgPricePerSqm)}</td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {formatCurrency(totalCommission)}
                  </td>
                  <td className="py-2 px-2 text-right text-green-600">
                    {formatCurrency(totalListPrice - totalCommission)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

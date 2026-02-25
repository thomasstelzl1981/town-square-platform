/**
 * InvestPreislisteTable — Tabellarische Preisliste mit Investment-Spalten
 * Zeigt Steuereffekt + Monatsbelastung nach Berechnung via sot-investment-engine
 * MOD-13 PROJEKTE — InvestEngine Tile
 */
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CalculationResult } from '@/hooks/useInvestmentEngine';

interface UnitRow {
  id: string;
  public_id: string;
  unit_number: string;
  rooms: number;
  floor: number;
  area_sqm: number;
  list_price: number;
  rent_monthly: number;
  hausgeld: number;
  status: string;
}

interface InvestPreislisteTableProps {
  units: UnitRow[];
  metricsCache: Record<string, CalculationResult['summary']>;
  hasCalculated: boolean;
  isCalculating: boolean;
  searchParams: string; // URL query params to pass through
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function eurSigned(v: number) {
  const prefix = v >= 0 ? '+' : '';
  return `${prefix}${v.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: 'Frei', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  reserved: { label: 'Reserviert', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  sold: { label: 'Verkauft', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  verkauft: { label: 'Verkauft', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  reserviert: { label: 'Reserviert', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

function floorLabel(floor: number): string {
  if (floor === 0) return 'EG';
  if (floor < 0) return `${Math.abs(floor)}. UG`;
  return `${floor}. OG`;
}

export function InvestPreislisteTable({ units, metricsCache, hasCalculated, isCalculating, searchParams }: InvestPreislisteTableProps) {
  const navigate = useNavigate();

  // Summary calculations
  const totalArea = units.reduce((s, u) => s + u.area_sqm, 0);
  const totalPrice = units.reduce((s, u) => s + u.list_price, 0);
  const totalRentAnnual = units.reduce((s, u) => s + u.rent_monthly * 12, 0);
  const avgYield = totalPrice > 0 ? (totalRentAnnual / totalPrice) * 100 : 0;

  // Investment metrics summaries
  const calculatedUnits = units.filter(u => metricsCache[u.id]);
  const avgTaxEffect = calculatedUnits.length > 0
    ? calculatedUnits.reduce((s, u) => s + (metricsCache[u.id]?.yearlyTaxSavings || 0) / 12, 0) / calculatedUnits.length
    : 0;
  const avgBurden = calculatedUnits.length > 0
    ? calculatedUnits.reduce((s, u) => s + (metricsCache[u.id]?.monthlyBurden || 0), 0) / calculatedUnits.length
    : 0;

  const handleRowClick = (unitId: string) => {
    navigate(`/portal/projekte/invest-engine/${unitId}${searchParams ? `?${searchParams}` : ''}`);
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">WE-Nr</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Typ</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Etage</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Fläche m²</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Kaufpreis</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Miete/Mo</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Hausgeld</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Bruttorendite</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Steuereffekt/Mo</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Monatsbelastung</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const yieldPercent = u.list_price > 0 ? (u.rent_monthly * 12 / u.list_price) * 100 : 0;
              const metrics = metricsCache[u.id];
              const monthlyTaxEffect = metrics ? metrics.yearlyTaxSavings / 12 : null;
              const monthlyBurden = metrics?.monthlyBurden ?? null;
              const status = STATUS_LABELS[u.status] || STATUS_LABELS.available;

              return (
                <tr
                  key={u.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/20 cursor-pointer"
                  onClick={() => handleRowClick(u.id)}
                >
                  <td className="px-3 py-2 font-medium">{u.unit_number}</td>
                  <td className="px-3 py-2 text-center">{u.rooms > 0 ? `${u.rooms}-Zi` : '—'}</td>
                  <td className="px-3 py-2 text-center">{floorLabel(u.floor)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{u.area_sqm.toFixed(1)} m²</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{eur(u.list_price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{eur(u.rent_monthly)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{eur(u.hausgeld)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{yieldPercent.toFixed(2)} %</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {isCalculating ? (
                      <span className="text-muted-foreground animate-pulse">···</span>
                    ) : monthlyTaxEffect !== null ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {eurSigned(Math.round(monthlyTaxEffect))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {isCalculating ? (
                      <span className="text-muted-foreground animate-pulse">···</span>
                    ) : monthlyBurden !== null ? (
                      <span className={cn(
                        'font-bold',
                        monthlyBurden >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {eurSigned(Math.round(monthlyBurden))}/Mo
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium', status.className)}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/40 font-semibold text-xs">
              <td className="px-3 py-2.5">Summe / Ø</td>
              <td className="px-3 py-2.5 text-center">{units.length} WE</td>
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5 text-right tabular-nums">{totalArea.toFixed(1)} m²</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{eur(totalPrice)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{eur(totalRentAnnual / 12)}</td>
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5 text-right tabular-nums">Ø {avgYield.toFixed(2)} %</td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {hasCalculated && calculatedUnits.length > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Ø {eurSigned(Math.round(avgTaxEffect))}</span>
                ) : '—'}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {hasCalculated && calculatedUnits.length > 0 ? (
                  <span className={cn('font-bold', avgBurden >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                    Ø {eurSigned(Math.round(avgBurden))}/Mo
                  </span>
                ) : '—'}
              </td>
              <td className="px-3 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
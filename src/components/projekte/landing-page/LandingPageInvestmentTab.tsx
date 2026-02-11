/**
 * Landing Page — Tab 1: Investment
 * Hero + Preislisten-Tabelle (alle Einheiten)
 * Click on row → LandingPageUnitExpose (SSOT Investment Engine)
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Ruler, ArrowRight } from 'lucide-react';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { DEMO_PROJECT, DEMO_UNITS, DEMO_PROJECT_DESCRIPTION } from '@/components/projekte/demoProjectData';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import { LandingPageUnitExpose } from './LandingPageUnitExpose';

interface LandingPageInvestmentTabProps {
  project: ProjectPortfolioRow | null;
  isDemo: boolean;
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
  onBack: () => void;
}

export function LandingPageInvestmentTab({ project, isDemo, selectedUnitId, onSelectUnit, onBack }: LandingPageInvestmentTabProps) {
  const p = project || DEMO_PROJECT;
  const units = DEMO_UNITS;
  const desc = DEMO_PROJECT_DESCRIPTION;

  // If a unit is selected, show the expose detail
  if (selectedUnitId) {
    const unit = units.find(u => u.id === selectedUnitId);
    if (unit) {
      return <LandingPageUnitExpose unit={unit} isDemo={isDemo} onBack={onBack} />;
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const priceRange = units.length > 0
    ? `${formatCurrency(Math.min(...units.map(u => u.list_price)))} – ${formatCurrency(Math.max(...units.map(u => u.list_price)))}`
    : '–';

  // Estimate monthly burden for each unit (simple: rent - annuity at 3.5% + 2% on 80% LTV)
  const estimateMonthlyBurden = (unit: DemoUnit) => {
    const loan = unit.list_price * 0.8;
    const annualRate = (3.5 + 2) / 100;
    const monthlyRate = (loan * annualRate) / 12;
    const mgmt = 25;
    return unit.rent_monthly - monthlyRate - mgmt;
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{desc.city} · {desc.postal_code}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{p.name}</h2>
          <p className="text-lg text-muted-foreground mt-2">{desc.address}, {desc.postal_code} {desc.city}</p>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-background/80 rounded-lg px-4 py-2">
              <Home className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{p.total_units_count} Einheiten</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 rounded-lg px-4 py-2">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{desc.total_living_area?.toLocaleString('de-DE')} m² Wohnfläche</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">{priceRange}</span>
            </div>
            <Badge variant="outline" className="bg-background/80">
              {desc.energy_class && `Energieeffizienzklasse ${desc.energy_class}`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Preisliste Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Preisliste ({units.length} Einheiten)
        </h3>
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Einheit</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Zimmer</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Fläche</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Etage</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Kaufpreis</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">€/m²</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Rendite</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Mtl. Belastung</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((unit) => {
                  const burden = estimateMonthlyBurden(unit);
                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group"
                      onClick={() => onSelectUnit(unit.id)}
                    >
                      <td className="px-4 py-3 font-medium">{unit.unit_number}</td>
                      <td className="px-4 py-3 text-center">{unit.rooms}</td>
                      <td className="px-4 py-3 text-right">{unit.area_sqm} m²</td>
                      <td className="px-4 py-3 text-center">{unit.floor}. OG</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(unit.list_price)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(unit.price_per_sqm)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{unit.yield_percent}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={burden >= 0 ? 'text-primary font-medium' : 'text-destructive font-medium'}>
                          {burden >= 0 ? '+' : ''}{formatCurrency(Math.round(burden))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={unit.status === 'available' ? 'outline' : 'secondary'} className="text-xs">
                          {unit.status === 'available' ? 'Verfügbar' : unit.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

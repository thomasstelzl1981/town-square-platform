/**
 * Landing Page — Tab 1: Investment
 * Hero + Unit Kacheln Grid (all visible, no search required)
 * Click on unit → LandingPageUnitExpose
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Ruler, ArrowLeft } from 'lucide-react';
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
  const units = DEMO_UNITS; // Always use demo units for now
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

      {/* Unit Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Alle Einheiten ({units.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} onClick={() => onSelectUnit(unit.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitCard({ unit, onClick }: { unit: DemoUnit; onClick: () => void }) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        {/* Placeholder image area */}
        <div className="h-32 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Home className="h-8 w-8 text-muted-foreground/40" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{unit.unit_number}</h4>
            <Badge variant={unit.status === 'available' ? 'outline' : 'secondary'} className="text-xs">
              {unit.status === 'available' ? 'Verfügbar' : unit.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {unit.rooms} Zi. · {unit.area_sqm} m² · {unit.floor}. OG
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-lg font-bold">{formatCurrency(unit.list_price)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(unit.price_per_sqm)}/m²</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">{unit.yield_percent}% Rendite</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(unit.rent_monthly)}/Monat</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Exposé öffnen
        </Button>
      </CardContent>
    </Card>
  );
}

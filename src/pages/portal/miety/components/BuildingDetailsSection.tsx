/**
 * BuildingDetailsSection — Displays extended building data in a compact grid
 */
import { Badge } from '@/components/ui/badge';
import { Calendar, Ruler, Bath, Flame, Car, Trees, ArrowDownToLine, LandPlot, Euro, Layers } from 'lucide-react';

interface BuildingDetailsSectionProps {
  home: {
    construction_year?: number | null;
    market_value?: number | null;
    floor_count?: number | null;
    bathrooms_count?: number | null;
    heating_type?: string | null;
    has_garage?: boolean;
    has_garden?: boolean;
    has_basement?: boolean;
    last_renovation_year?: number | null;
    plot_area_sqm?: number | null;
  };
}

export function BuildingDetailsSection({ home }: BuildingDetailsSectionProps) {
  const items = [
    { icon: Calendar, label: 'Baujahr', value: home.construction_year },
    { icon: Euro, label: 'Verkehrswert', value: home.market_value ? `${home.market_value.toLocaleString('de-DE')} €` : null },
    { icon: Layers, label: 'Etagen', value: home.floor_count },
    { icon: Bath, label: 'Badezimmer', value: home.bathrooms_count },
    { icon: Flame, label: 'Heizung', value: home.heating_type },
    { icon: LandPlot, label: 'Grundstück', value: home.plot_area_sqm ? `${home.plot_area_sqm} m²` : null },
    { icon: Calendar, label: 'Letzte Sanierung', value: home.last_renovation_year },
  ];

  const flags = [
    { label: 'Garage', active: home.has_garage, icon: Car },
    { label: 'Garten', active: home.has_garden, icon: Trees },
    { label: 'Keller', active: home.has_basement, icon: ArrowDownToLine },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium">{item.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <Badge key={f.label} variant={f.active ? 'default' : 'outline'} className="text-xs gap-1">
            <f.icon className="h-3 w-3" />
            {f.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

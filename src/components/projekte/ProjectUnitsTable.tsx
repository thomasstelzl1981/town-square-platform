/**
 * ProjectUnitsTable — Units table for tab C
 * Extracted from ProjectDetailPage R-31
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { UnitStatusBadge } from '@/components/projekte';
import { CreatePropertyFromUnits } from '@/components/projekte/CreatePropertyFromUnits';

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

interface Props {
  project: any;
  units: any[];
}

export function ProjectUnitsTable({ project, units }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>C. Einheiten ({units.length})</CardTitle>
        <div className="flex items-center gap-2">
          <CreatePropertyFromUnits
            projectId={project.id}
            projectName={project.name}
            projectAddress={project.address || ''}
            projectCity={project.city || ''}
            projectPostalCode={project.postal_code}
            projectYearBuilt={undefined}
            projectData={{
              full_description: (project as any).full_description,
              location_description: (project as any).location_description,
              features: (project as any).features,
              energy_cert_type: (project as any).energy_cert_type,
              energy_cert_value: (project as any).energy_cert_value,
              energy_class: (project as any).energy_class,
              heating_type: (project as any).heating_type,
              energy_source: (project as any).energy_source,
              renovation_year: (project as any).renovation_year,
              parking_type: (project as any).parking_type,
              afa_rate_percent: (project as any).afa_rate_percent,
              afa_model: (project as any).afa_model,
              land_share_percent: (project as any).land_share_percent,
            }}
            units={units}
          />
          <Button size="sm">+ Einheit hinzufügen</Button>
        </div>
      </CardHeader>
      <CardContent>
        {units.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Einheiten angelegt</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Nr.</th>
                  <th className="text-left py-2">Etage</th>
                  <th className="text-right py-2">Fläche</th>
                  <th className="text-right py-2">Zimmer</th>
                  <th className="text-right py-2">Listenpreis</th>
                  <th className="text-right py-2">€/m²</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{unit.unit_number}</td>
                    <td className="py-2">{unit.floor === 0 ? 'EG' : unit.floor === -1 ? 'UG' : unit.floor != null ? `${unit.floor}. OG` : '—'}</td>
                    <td className="py-2 text-right">{unit.area_sqm?.toFixed(1)} m²</td>
                    <td className="py-2 text-right">{unit.rooms_count}</td>
                    <td className="py-2 text-right">{formatCurrency(unit.list_price)}</td>
                    <td className="py-2 text-right">{formatCurrency(unit.price_per_sqm)}</td>
                    <td className="py-2 text-center"><UnitStatusBadge status={unit.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

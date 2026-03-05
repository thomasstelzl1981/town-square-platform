/**
 * R-2: Objektdaten tab — Read-only 3-column grid from MOD-04
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, ExternalLink, Home, Ruler, Calendar, MapPin } from 'lucide-react';
import type { PropertyData, UnitData } from './exposeTypes';

interface ExposeObjektdatenTabProps {
  property: PropertyData;
  unit: UnitData;
}

export function ExposeObjektdatenTab({ property, unit }: ExposeObjektdatenTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Objektdaten
            </CardTitle>
            <CardDescription>Stammdaten aus der Immobilienakte (nicht editierbar)</CardDescription>
          </div>
          <Link 
            to={`/portal/immobilien/${property.id}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Bearbeiten
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Grunddaten</h4>
            <div className="space-y-3">
              <DataRow icon={Home} label="Objektart" value={property.property_type || '—'} />
              <DataRow icon={Ruler} label="Wohnfläche" value={unit.area_sqm ? `${unit.area_sqm} m²` : '—'} />
              <DataRow icon={Ruler} label="Grundstück" value="—" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Baujahr & Zustand</h4>
            <div className="space-y-3">
              <DataRow icon={Calendar} label="Baujahr" value={property.year_built?.toString() || '—'} />
              <DataRow icon={Calendar} label="Sanierung" value={property.renovation_year?.toString() || '—'} />
              <DataRow icon={Building2} label="Etagen" value="—" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Adresse</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-sm text-muted-foreground">{property.postal_code} {property.city}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

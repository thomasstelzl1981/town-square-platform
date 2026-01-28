import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ruler, DoorOpen, Thermometer, Zap } from 'lucide-react';

interface CoreDataBlockProps {
  areaLivingSqm: number;
  roomsCount?: number;
  bathroomsCount?: number;
  heatingType?: string;
  energySource?: string;
  energyCertificateValue?: number;
  energyCertificateValidUntil?: string;
  featuresTags?: string[];
}

export function CoreDataBlock({
  areaLivingSqm,
  roomsCount,
  bathroomsCount,
  heatingType,
  energySource,
  energyCertificateValue,
  energyCertificateValidUntil,
  featuresTags = [],
}: CoreDataBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Eckdaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{areaLivingSqm} m²</span>
          </div>
          {roomsCount && (
            <div className="flex items-center gap-2">
              <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{roomsCount} Zimmer</span>
            </div>
          )}
        </div>

        {(heatingType || energySource) && (
          <div className="pt-2 border-t space-y-1">
            {heatingType && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{heatingType}</span>
              </div>
            )}
            {energySource && (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{energySource}</span>
              </div>
            )}
          </div>
        )}

        {energyCertificateValue && (
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Energiekennwert</span>
              <span>{energyCertificateValue} kWh/(m²·a)</span>
            </div>
            {energyCertificateValidUntil && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Gültig bis</span>
                <span>{energyCertificateValidUntil}</span>
              </div>
            )}
          </div>
        )}

        {featuresTags.length > 0 && (
          <div className="pt-2 border-t flex flex-wrap gap-1">
            {featuresTags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

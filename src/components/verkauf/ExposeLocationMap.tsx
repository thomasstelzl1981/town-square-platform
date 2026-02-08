/**
 * ExposeLocationMap - Kartenansicht für Verkaufsexposé
 * Zeigt Immobilienstandort (ohne exakte Adresse für Datenschutz)
 * Vorbereitet für Google Maps API Integration
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface ExposeLocationMapProps {
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  showExactLocation?: boolean; // Default: false (Datenschutz)
}

const ExposeLocationMap = ({ 
  address, 
  city, 
  postalCode,
  latitude,
  longitude,
  showExactLocation = false 
}: ExposeLocationMapProps) => {
  // Generate Google Maps URLs (Embed + Link). We avoid hardcoded API keys here.
  const searchQuery = showExactLocation
    ? `${address}, ${postalCode} ${city}, Germany`
    : `${postalCode} ${city}, Germany`;

  const hasCoordinates = latitude != null && longitude != null;

  // For exact location we prefer coordinates (if available); otherwise fall back to the address query.
  const embedQuery = showExactLocation && hasCoordinates ? `${latitude},${longitude}` : searchQuery;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(embedQuery)}&output=embed`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Standort
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            asChild
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3 w-3" />
              In Google Maps öffnen
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/9] bg-muted rounded-lg relative overflow-hidden">
          <iframe
            title="Standortkarte"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Address Info */}
        <div className="mt-3 flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            {showExactLocation ? (
              <>
                <p className="font-medium">{address}</p>
                <p className="text-muted-foreground">
                  {postalCode} {city}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  {postalCode} {city}
                </p>
                <p className="text-muted-foreground">Exakte Adresse auf Anfrage</p>
              </>
            )}
          </div>
        </div>

        {showExactLocation && !hasCoordinates && (
          <p className="mt-3 text-xs text-muted-foreground p-2 bg-muted rounded">
            <strong>Tipp:</strong> Wenn Koordinaten hinterlegt sind, kann die Karte noch
            präziser zentriert werden (MOD-04 → Block B: Adresse).
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposeLocationMap;

/**
 * ExposeLocationMap - Kartenansicht für Verkaufsexposé
 * Zeigt Immobilienstandort (ohne exakte Adresse für Datenschutz)
 * Vorbereitet für Google Maps API Integration
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

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
  // Generate Google Maps URL
  const searchQuery = showExactLocation 
    ? `${address}, ${postalCode} ${city}, Germany`
    : `${postalCode} ${city}, Germany`;
    
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  
  // Generate static map image URL (ohne API-Key = Platzhalter)
  const hasCoordinates = latitude && longitude;
  
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
        {/* Map Placeholder - wird mit Google Maps API ersetzt */}
        <div className="aspect-[16/9] bg-muted rounded-lg relative overflow-hidden">
          {hasCoordinates ? (
            // Mit Koordinaten: Iframe-Embed (kostenlos)
            <iframe
              title="Standortkarte"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=14`}
            />
          ) : (
            // Ohne Koordinaten: Platzhalter mit Stadt/PLZ
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <MapPin className="h-12 w-12 text-primary/50 mb-3" />
              <div className="text-center">
                <p className="font-medium text-foreground">{postalCode} {city}</p>
                {!showExactLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Genaue Lage nach Anfrage
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Address Info */}
        <div className="mt-3 flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            {showExactLocation ? (
              <>
                <p className="font-medium">{address}</p>
                <p className="text-muted-foreground">{postalCode} {city}</p>
              </>
            ) : (
              <>
                <p className="font-medium">{postalCode} {city}</p>
                <p className="text-muted-foreground">
                  Exakte Adresse auf Anfrage
                </p>
              </>
            )}
          </div>
        </div>
        
        {/* Google Maps API Integration Hinweis (für Entwickler) */}
        {!hasCoordinates && (
          <p className="mt-3 text-xs text-muted-foreground p-2 bg-muted rounded">
            <strong>Tipp:</strong> Für eine interaktive Karte können Sie die Koordinaten 
            in der Immobilienakte hinterlegen (MOD-04 → Block B: Adresse).
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposeLocationMap;

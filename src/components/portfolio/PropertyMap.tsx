import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  address: string;
  city: string;
  postalCode: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function PropertyMap({ 
  address, 
  city, 
  postalCode, 
  country = 'Deutschland',
  latitude,
  longitude 
}: PropertyMapProps) {
  // Build full address for Google Maps
  const fullAddress = [address, postalCode, city, country].filter(Boolean).join(', ');
  const encodedAddress = encodeURIComponent(fullAddress);
  
  // Static map URL (works without API key for embed)
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Standort
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href={mapsLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              In Google Maps öffnen
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Karte: ${address}`}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {fullAddress}
        </p>
      </CardContent>
    </Card>
  );
}

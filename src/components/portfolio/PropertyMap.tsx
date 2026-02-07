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
  /** Height of the map container (default: 300px) */
  height?: string;
  /** Whether to show the card wrapper (default: true) */
  showCard?: boolean;
}

export function PropertyMap({ 
  address, 
  city, 
  postalCode, 
  country = 'Deutschland',
  latitude,
  longitude,
  height = '300px',
  showCard = true
}: PropertyMapProps) {
  // Build full address for Google Maps
  const fullAddress = [address, postalCode, city, country].filter(Boolean).join(', ');
  const encodedAddress = encodeURIComponent(fullAddress);
  
  // Static map URL (works without API key for embed)
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  const mapContent = (
    <>
      <div className="relative w-full rounded-lg overflow-hidden border" style={{ height }}>
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
    </>
  );

  if (!showCard) {
    return <div>{mapContent}</div>;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Standort
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href={mapsLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              In Maps öffnen
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mapContent}
      </CardContent>
    </Card>
  );
}

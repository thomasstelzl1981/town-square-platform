/**
 * StreetViewWidget — Google Street View als Widget (aspect-square)
 * Falls kein Street View verfügbar → gestylter Platzhalter
 */
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Navigation, MapPinOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StreetViewWidgetProps {
  home: any;
}

export function StreetViewWidget({ home }: StreetViewWidgetProps) {
  const { data: mapsApiKey } = useQuery({
    queryKey: ['google-maps-api-key'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-google-maps-key');
      if (error) throw error;
      return data?.key as string || '';
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const mapQuery = encodeURIComponent(
    [`${home.address || ''} ${home.address_house_no || ''}`.trim(), `${home.zip || ''} ${home.city || ''}`.trim()]
      .filter(Boolean).join(', ')
  );

  // Pre-check: does Street View imagery exist for this location?
  const { data: hasStreetView, isLoading: checkingStreetView } = useQuery({
    queryKey: ['streetview-check', mapQuery],
    queryFn: async () => {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/streetview/metadata?location=${mapQuery}&key=${mapsApiKey}`
      );
      const json = await res.json();
      return json.status === 'OK';
    },
    enabled: !!mapsApiKey && mapQuery.length > 3,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const hasAddress = !!(home.city || home.address);

  return (
    <Card className="glass-card overflow-hidden h-full">
      <CardContent className="p-0 h-full relative">
        {hasAddress && mapsApiKey && hasStreetView ? (
          /* Street View available → show image */
          <div
            className="w-full h-full cursor-pointer group"
            onClick={() => window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${decodeURIComponent(mapQuery)}`, '_blank')}
          >
            <img
              src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${mapQuery}&source=outdoor&key=${mapsApiKey}`}
              alt="Street View"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Street View öffnen</span>
              </div>
            </div>
          </div>
        ) : hasAddress && mapsApiKey && hasStreetView === false ? (
          /* No Street View → styled placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20 gap-3">
            <div className="rounded-full bg-muted/50 p-4">
              <MapPinOff className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-muted-foreground/70">Street View</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">Nicht verfügbar für diesen Standort</p>
            </div>
          </div>
        ) : (
          /* Loading or no address */
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
            <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {!mapsApiKey || checkingStreetView ? 'Lädt...' : 'Adresse fehlt'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

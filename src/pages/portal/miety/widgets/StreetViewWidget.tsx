/**
 * StreetViewWidget — Google Street View als Widget (aspect-square)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Navigation, ImageOff } from 'lucide-react';
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

  return (
    <Card className="glass-card overflow-hidden h-full">
      <CardContent className="p-0 h-full relative">
        {(home.city || home.address) && mapsApiKey ? (
          <div
            className="w-full h-full cursor-pointer group"
            onClick={() => window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${decodeURIComponent(mapQuery)}`, '_blank')}
          >
            <img
              src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${mapQuery}&source=outdoor&key=${mapsApiKey}`}
              alt="Street View"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.nextElementSibling) target.nextElementSibling.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex-col items-center justify-center bg-muted/30 absolute inset-0">
              <ImageOff className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Street View nicht verfügbar</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Street View öffnen</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
            <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{!mapsApiKey ? 'Lädt...' : 'Adresse fehlt'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SatelliteWidget — Google Maps Satellite als Widget (aspect-square)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SatelliteWidgetProps {
  home: any;
}

export function SatelliteWidget({ home }: SatelliteWidgetProps) {
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
    <Card className="glass-card h-full overflow-hidden">
      <CardContent className="p-0 h-full">
        {(home.city || home.address) && mapsApiKey ? (
          <iframe
            title="Satellitenansicht"
            className="w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${mapQuery}&maptype=satellite&zoom=18`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{!mapsApiKey ? 'Lädt...' : 'Satellitenansicht'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

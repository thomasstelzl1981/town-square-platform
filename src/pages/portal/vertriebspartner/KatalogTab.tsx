import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  MapPin, 
  Euro, 
  Building2,
  Eye,
  Heart,
  ExternalLink
} from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useNavigate } from 'react-router-dom';

interface PartnerListing {
  id: string;
  public_id: string | null;
  title: string;
  asking_price: number | null;
  commission_rate: number | null;
  status: string;
  property_address: string;
  property_city: string;
  property_type: string | null;
  total_area_sqm: number | null;
  kaufy_active: boolean;
}

const KatalogTab = () => {
  const navigate = useNavigate();

  // Fetch partner-released listings from listing_publications
  const { data: listings, isLoading } = useQuery({
    queryKey: ['partner-katalog'],
    queryFn: async () => {
      // Get listings with active partner_network publication
      const { data: publications, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'partner_network')
        .eq('status', 'active');

      if (pubError) throw pubError;
      
      const listingIds = publications?.map(p => p.listing_id) || [];
      
      if (listingIds.length === 0) return [];

      // Fetch listing details
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id, public_id, title, asking_price, commission_rate, status,
          properties (address, city, property_type, total_area_sqm)
        `)
        .in('id', listingIds)
        .in('status', ['active', 'reserved']);

      if (listingsError) throw listingsError;

      // Check for Kaufy publications
      const { data: kaufyPubs } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'kaufy')
        .eq('status', 'active')
        .in('listing_id', listingIds);

      const kaufySet = new Set(kaufyPubs?.map(p => p.listing_id));

      return listingsData?.map(l => ({
        id: l.id,
        public_id: l.public_id,
        title: l.title,
        asking_price: l.asking_price,
        commission_rate: l.commission_rate,
        status: l.status || 'active',
        property_address: (l.properties as any)?.address || '',
        property_city: (l.properties as any)?.city || '',
        property_type: (l.properties as any)?.property_type,
        total_area_sqm: (l.properties as any)?.total_area_sqm,
        kaufy_active: kaufySet.has(l.id)
      })) || [];
    }
  });

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Keine Objekte im Katalog"
        description="Sobald Eigentümer ihre Objekte für das Partner-Netzwerk freigeben, erscheinen sie hier."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {listings.length} Objekt{listings.length !== 1 ? 'e' : ''} verfügbar
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Image Placeholder */}
            <div className="h-40 bg-muted flex items-center justify-center relative">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              {listing.status === 'reserved' && (
                <Badge className="absolute top-2 left-2" variant="secondary">
                  Reserviert
                </Badge>
              )}
              {listing.kaufy_active && (
                <Badge className="absolute top-2 right-2 text-xs" variant="outline">
                  Kaufy
                </Badge>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-medium line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.property_address}, {listing.property_city}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Preis</p>
                  <p className="font-semibold">{formatCurrency(listing.asking_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provision</p>
                  <p className="font-semibold text-green-600">
                    {listing.commission_rate ? `${listing.commission_rate}%` : '—'}
                  </p>
                </div>
                {listing.total_area_sqm && (
                  <div>
                    <p className="text-muted-foreground">Fläche</p>
                    <p className="font-medium">{listing.total_area_sqm} m²</p>
                  </div>
                )}
                {listing.property_type && (
                  <div>
                    <p className="text-muted-foreground">Typ</p>
                    <p className="font-medium capitalize">{listing.property_type.replace('_', ' ')}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KatalogTab;

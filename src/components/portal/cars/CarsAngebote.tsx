import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Car, Truck, Star, ShoppingCart } from 'lucide-react';

type OfferType = 'leasing' | 'rental';

interface Offer {
  id: string;
  offer_type: OfferType;
  provider: string;
  title: string;
  description: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  price_monthly_cents: number | null;
  price_daily_cents: number | null;
  term_months: number | null;
  km_per_year: number | null;
  down_payment_cents: number | null;
  image_url: string | null;
  link_url: string;
  is_featured: boolean;
}

export function CarsAngebote() {
  const [activeTab, setActiveTab] = useState<'leasing' | 'rental'>('leasing');

  const { data: offers, isLoading } = useQuery({
    queryKey: ['cars_offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_offers')
        .select('*')
        .eq('active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Offer[];
    },
  });

  const leasingOffers = offers?.filter((o) => o.offer_type === 'leasing') || [];
  const rentalOffers = offers?.filter((o) => o.offer_type === 'rental') || [];

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return '—';
    return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const formatKm = (km: number | null) => {
    if (km === null) return '—';
    return km.toLocaleString('de-DE') + ' km/Jahr';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} className={offer.is_featured ? 'border-primary' : ''}>
      {offer.is_featured && (
        <div className="bg-primary text-primary-foreground text-xs px-3 py-1 flex items-center gap-1">
          <Star className="h-3 w-3" />
          Empfohlen
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {offer.offer_type === 'leasing' ? (
              <Car className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Truck className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">
                {offer.vehicle_make && offer.vehicle_model
                  ? `${offer.vehicle_make} ${offer.vehicle_model}`
                  : offer.title}
              </CardTitle>
              {offer.description && (
                <CardDescription>{offer.description}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant="outline">{offer.provider}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {offer.offer_type === 'leasing' ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Laufzeit</div>
              <div className="font-medium">{offer.term_months} Monate</div>
            </div>
            <div>
              <div className="text-muted-foreground">Kilometer</div>
              <div className="font-medium">{formatKm(offer.km_per_year)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Anzahlung</div>
              <div className="font-medium">{formatCurrency(offer.down_payment_cents)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <div className="text-muted-foreground">Tagespreis</div>
            <div className="font-medium text-lg">{formatCurrency(offer.price_daily_cents)}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {offer.offer_type === 'leasing' && (
              <>
                <span className="text-2xl font-bold">
                  {formatCurrency(offer.price_monthly_cents)}
                </span>
                <span className="text-muted-foreground">/Monat</span>
              </>
            )}
          </div>
          <Button asChild>
            <a href={offer.link_url} target="_blank" rel="noopener noreferrer">
              Zum Angebot
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leasing' | 'rental')}>
        <TabsList>
          <TabsTrigger value="leasing" className="gap-2">
            <Car className="h-4 w-4" />
            Leasing-Deals
          </TabsTrigger>
          <TabsTrigger value="rental" className="gap-2">
            <Truck className="h-4 w-4" />
            Automiete
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leasing" className="mt-4">
          {leasingOffers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {leasingOffers.map(renderOfferCard)}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Keine Leasing-Angebote</h3>
                <p className="text-muted-foreground max-w-md">
                  Aktuell sind keine Leasing-Angebote verfügbar. Schauen Sie später wieder vorbei.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rental" className="mt-4">
          {rentalOffers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rentalOffers.map(renderOfferCard)}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Truck className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Keine Mietangebote</h3>
                <p className="text-muted-foreground max-w-md">
                  Aktuell sind keine Mietangebote verfügbar. Besuchen Sie{' '}
                  <a
                    href="https://www.miete24.de?ref=sot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Miete24
                  </a>{' '}
                  für aktuelle Angebote.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

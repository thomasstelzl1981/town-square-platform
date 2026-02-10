/**
 * CarsAngebote — Widget-based vehicle offers with BMW examples
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Car, Truck, Star, ShoppingCart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Demo BMW offers
const DEMO_LEASING_OFFERS: Offer[] = [
  {
    id: 'demo-1',
    offer_type: 'leasing',
    provider: 'BMW Financial Services',
    title: 'BMW 320i Limousine',
    description: 'Sport Line, Navi, LED, Klimaautomatik, PDC',
    vehicle_make: 'BMW',
    vehicle_model: '320i Limousine',
    price_monthly_cents: 39900,
    price_daily_cents: null,
    term_months: 48,
    km_per_year: 15000,
    down_payment_cents: 500000,
    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=220&fit=crop',
    link_url: 'https://www.bmw.de/leasing',
    is_featured: true,
  },
  {
    id: 'demo-2',
    offer_type: 'leasing',
    provider: 'BMW Financial Services',
    title: 'BMW X3 xDrive20d',
    description: 'xLine, Panoramadach, Harman Kardon, Head-Up',
    vehicle_make: 'BMW',
    vehicle_model: 'X3 xDrive20d',
    price_monthly_cents: 52900,
    price_daily_cents: null,
    term_months: 36,
    km_per_year: 20000,
    down_payment_cents: 750000,
    image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=220&fit=crop',
    link_url: 'https://www.bmw.de/leasing',
    is_featured: false,
  },
  {
    id: 'demo-3',
    offer_type: 'leasing',
    provider: 'BMW Financial Services',
    title: 'BMW iX1 xDrive30',
    description: 'Elektro, 313 PS, Curved Display, Driving Assistant',
    vehicle_make: 'BMW',
    vehicle_model: 'iX1 xDrive30',
    price_monthly_cents: 45900,
    price_daily_cents: null,
    term_months: 48,
    km_per_year: 15000,
    down_payment_cents: 600000,
    image_url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=220&fit=crop',
    link_url: 'https://www.bmw.de/leasing',
    is_featured: true,
  },
  {
    id: 'demo-4',
    offer_type: 'leasing',
    provider: 'Sixt Leasing',
    title: 'BMW 520d Touring',
    description: 'Business, AHK, Standheizung, Laserlicht',
    vehicle_make: 'BMW',
    vehicle_model: '520d Touring',
    price_monthly_cents: 61900,
    price_daily_cents: null,
    term_months: 36,
    km_per_year: 25000,
    down_payment_cents: 0,
    image_url: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400&h=220&fit=crop',
    link_url: 'https://www.sixt-leasing.de',
    is_featured: false,
  },
];

const DEMO_RENTAL_OFFERS: Offer[] = [
  {
    id: 'demo-r1',
    offer_type: 'rental',
    provider: 'SIXT',
    title: 'BMW 3er oder ähnlich',
    description: 'Premiumklasse, Automatik, Navi',
    vehicle_make: 'BMW',
    vehicle_model: '3er',
    price_monthly_cents: null,
    price_daily_cents: 8900,
    term_months: null,
    km_per_year: null,
    down_payment_cents: null,
    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=220&fit=crop',
    link_url: 'https://www.sixt.de',
    is_featured: true,
  },
  {
    id: 'demo-r2',
    offer_type: 'rental',
    provider: 'Europcar',
    title: 'BMW X1 oder ähnlich',
    description: 'SUV Kompakt, Automatik',
    vehicle_make: 'BMW',
    vehicle_model: 'X1',
    price_monthly_cents: null,
    price_daily_cents: 7500,
    term_months: null,
    km_per_year: null,
    down_payment_cents: null,
    image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=220&fit=crop',
    link_url: 'https://www.europcar.de',
    is_featured: false,
  },
];

export function CarsAngebote() {
  const [activeTab, setActiveTab] = useState<'leasing' | 'rental'>('leasing');

  const { data: dbOffers, isLoading } = useQuery({
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

  // Use DB offers if available, otherwise show demo data
  const leasingOffers = dbOffers?.filter(o => o.offer_type === 'leasing').length
    ? dbOffers.filter(o => o.offer_type === 'leasing')
    : DEMO_LEASING_OFFERS;
  
  const rentalOffers = dbOffers?.filter(o => o.offer_type === 'rental').length
    ? dbOffers.filter(o => o.offer_type === 'rental')
    : DEMO_RENTAL_OFFERS;

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

  const renderOfferWidget = (offer: Offer) => (
    <Card key={offer.id} className={cn(
      "glass-card overflow-hidden group hover:border-primary/30 transition-all",
      offer.is_featured ? "border-primary/20" : "border-primary/10"
    )}>
      {/* Image */}
      {offer.image_url && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          {offer.is_featured && (
            <div className="absolute top-2 left-2">
              <Badge className="text-[9px] gap-1 bg-primary text-primary-foreground">
                <Star className="h-2.5 w-2.5" />
                Empfohlen
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 left-3">
            <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur-sm">
              {offer.provider}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm">{offer.title}</h3>
          {offer.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{offer.description}</p>
          )}
        </div>

        {offer.offer_type === 'leasing' ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Laufzeit</p>
              <p className="text-xs font-medium">{offer.term_months} Mo.</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Kilometer</p>
              <p className="text-xs font-medium">{formatKm(offer.km_per_year)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Anzahlung</p>
              <p className="text-xs font-medium">{formatCurrency(offer.down_payment_cents)}</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Tagespreis</p>
            <p className="text-lg font-bold">{formatCurrency(offer.price_daily_cents)}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          {offer.offer_type === 'leasing' && (
            <div>
              <span className="text-lg font-bold">{formatCurrency(offer.price_monthly_cents)}</span>
              <span className="text-[10px] text-muted-foreground">/Mo.</span>
            </div>
          )}
          <Button size="sm" className="gap-1 text-xs ml-auto" asChild>
            <a href={offer.link_url} target="_blank" rel="noopener noreferrer">
              Zum Angebot
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {leasingOffers.map(renderOfferWidget)}
          </div>
        </TabsContent>

        <TabsContent value="rental" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rentalOffers.map(renderOfferWidget)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

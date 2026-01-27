import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Eye, 
  Users, 
  Globe, 
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { EmptyState } from '@/components/shared';

interface ListingStats {
  id: string;
  title: string;
  status: string;
  asking_price: number | null;
  property_address: string;
  kaufy_active: boolean;
  partner_active: boolean;
  inquiry_count: number;
}

const ReportingTab = () => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['verkauf-reporting'],
    queryFn: async () => {
      // Fetch listings with property info
      const { data: listingsData, error } = await supabase
        .from('listings')
        .select(`
          id, title, status, asking_price,
          properties (address, city)
        `)
        .in('status', ['active', 'reserved', 'sold'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch publications
      const listingIds = listingsData?.map(l => l.id) || [];
      const { data: publications } = await supabase
        .from('listing_publications')
        .select('listing_id, channel, status')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch inquiries count
      const { data: inquiries } = await supabase
        .from('listing_inquiries')
        .select('listing_id')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const pubMap = new Map<string, { kaufy: boolean; partner: boolean }>();
      publications?.forEach(p => {
        const current = pubMap.get(p.listing_id) || { kaufy: false, partner: false };
        if (p.channel === 'kaufy' && p.status === 'active') current.kaufy = true;
        if (p.channel === 'partner_network' && p.status === 'active') current.partner = true;
        pubMap.set(p.listing_id, current);
      });

      const inqCounts = new Map<string, number>();
      inquiries?.forEach(i => inqCounts.set(i.listing_id, (inqCounts.get(i.listing_id) || 0) + 1));

      return listingsData?.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        asking_price: l.asking_price,
        property_address: l.properties ? `${(l.properties as any).address}, ${(l.properties as any).city}` : '',
        kaufy_active: pubMap.get(l.id)?.kaufy || false,
        partner_active: pubMap.get(l.id)?.partner || false,
        inquiry_count: inqCounts.get(l.id) || 0
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Keine Statistiken verfügbar"
        description="Sobald Sie aktive Inserate haben, erscheinen hier die Performance-Daten."
      />
    );
  }

  // Calculate summary stats
  const totalListings = listings.length;
  const activeKaufy = listings.filter(l => l.kaufy_active).length;
  const activePartner = listings.filter(l => l.partner_active).length;
  const totalInquiries = listings.reduce((sum, l) => sum + l.inquiry_count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalListings}</p>
                <p className="text-xs text-muted-foreground">Aktive Inserate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeKaufy}</p>
                <p className="text-xs text-muted-foreground">Auf Kaufy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePartner}</p>
                <p className="text-xs text-muted-foreground">Im Partner-Netzwerk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInquiries}</p>
                <p className="text-xs text-muted-foreground">Anfragen gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance nach Objekt</CardTitle>
          <CardDescription>
            Übersicht aller aktiven Inserate und ihrer Kanäle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {listings.map(listing => (
              <div 
                key={listing.id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{listing.property_address}</p>
                </div>
                
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(listing.asking_price)}</p>
                    <Badge 
                      variant={listing.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {listing.status === 'active' ? 'Aktiv' : 
                       listing.status === 'reserved' ? 'Reserviert' : 'Verkauft'}
                    </Badge>
                  </div>

                  <div className="flex gap-1">
                    <Badge 
                      variant={listing.kaufy_active ? 'default' : 'outline'}
                      className="text-xs gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      K
                    </Badge>
                    <Badge 
                      variant={listing.partner_active ? 'default' : 'outline'}
                      className="text-xs gap-1"
                    >
                      <Users className="h-3 w-3" />
                      P
                    </Badge>
                  </div>

                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{listing.inquiry_count}</p>
                    <p className="text-[10px] text-muted-foreground">Anfragen</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note about views */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">View-Statistiken kommen bald</p>
            <p className="mt-1">
              Detaillierte Aufrufzahlen pro Kanal werden in einer zukünftigen Version verfügbar sein.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportingTab;

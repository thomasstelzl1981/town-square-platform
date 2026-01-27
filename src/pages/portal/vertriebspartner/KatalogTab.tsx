import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  MapPin, 
  Building2,
  Eye,
  Heart,
  Handshake,
  Globe,
  Users
} from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';
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

  // Fetch partner-released listings with unit data
  const { data: listings = [], isLoading } = useQuery({
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

      // Fetch listing details with property info
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

  const columns: PropertyTableColumn<PartnerListing>[] = [
    {
      key: 'title',
      header: 'Objekt',
      minWidth: '220px',
      render: (_, row) => (
        <PropertyAddressCell 
          address={row.title} 
          subtitle={`${row.property_address}, ${row.property_city}`} 
        />
      )
    },
    {
      key: 'property_type',
      header: 'Typ',
      minWidth: '100px',
      render: (val) => val ? (
        <Badge variant="outline" className="text-xs capitalize">
          {String(val).replace('_', ' ')}
        </Badge>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'total_area_sqm',
      header: 'm²',
      align: 'right',
      minWidth: '80px',
      render: (val) => val ? `${val}` : '—'
    },
    {
      key: 'asking_price',
      header: 'Preis',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'commission_rate',
      header: 'Provision',
      align: 'right',
      minWidth: '100px',
      render: (val) => val ? (
        <span className="font-semibold text-green-600">{val}%</span>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '100px',
      render: (val) => (
        <Badge variant={val === 'reserved' ? 'secondary' : 'default'}>
          {val === 'reserved' ? 'Reserviert' : 'Verfügbar'}
        </Badge>
      )
    },
    {
      key: 'kaufy_active',
      header: 'Kanäle',
      minWidth: '80px',
      align: 'center',
      render: (_, row) => (
        <div className="flex gap-1 justify-center">
          {row.kaufy_active && (
            <Badge variant="outline" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />K
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />P
          </Badge>
        </div>
      )
    }
  ];

  const renderRowActions = (row: PartnerListing) => (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="Merken"
      >
        <Heart className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        className="h-8 text-xs gap-1"
        title="Deal starten"
      >
        <Handshake className="h-3 w-3" />
        Deal
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {listings.length} Objekt{listings.length !== 1 ? 'e' : ''} verfügbar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Objektkatalog</CardTitle>
          <CardDescription>
            Für Partner freigegebene Objekte – starten Sie einen Deal, um eine Reservierung vorzunehmen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyTable
            data={listings}
            columns={columns}
            isLoading={isLoading}
            showSearch
            searchPlaceholder="Objekte durchsuchen..."
            searchFilter={(row, search) => 
              row.title?.toLowerCase().includes(search) ||
              row.property_address?.toLowerCase().includes(search) ||
              row.property_city?.toLowerCase().includes(search) ||
              false
            }
            rowActions={renderRowActions}
            emptyState={{
              message: 'Keine Objekte im Katalog. Sobald Eigentümer ihre Objekte für das Partner-Netzwerk freigeben, erscheinen sie hier.',
              actionLabel: '',
              actionRoute: ''
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default KatalogTab;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Eye, Globe, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';

interface PropertyWithListing {
  id: string;
  code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  total_area_sqm: number | null;
  listing_id: string | null;
  listing_status: string | null;
  listing_title: string | null;
  asking_price: number | null;
  kaufy_active: boolean;
  partner_active: boolean;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  active: { label: 'Aktiv', variant: 'default' },
  reserved: { label: 'Reserviert', variant: 'outline' },
  sold: { label: 'Verkauft', variant: 'default' },
  withdrawn: { label: 'Zurückgezogen', variant: 'destructive' }
};

const ObjekteTab = () => {
  const navigate = useNavigate();

  // Fetch properties LEFT JOIN listings (gemäß Plan)
  const { data: properties, isLoading } = useQuery({
    queryKey: ['verkauf-properties-with-listings'],
    queryFn: async () => {
      // 1. Alle Properties laden
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('id, code, address, city, postal_code, property_type, total_area_sqm')
        .order('code', { ascending: true });

      if (propsError) throw propsError;

      // 2. Alle Listings laden
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, property_id, status, title, asking_price')
        .in('status', ['draft', 'active', 'reserved', 'sold']);

      // 3. Publications laden für Kanal-Status
      const listingIds = listingsData?.map(l => l.id) || [];
      const { data: pubData } = await supabase
        .from('listing_publications')
        .select('listing_id, channel, status')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      // Maps für schnellen Zugriff
      const listingByProperty = new Map(listingsData?.map(l => [l.property_id, l]));
      
      const pubMap = new Map<string, { kaufy: boolean; partner: boolean }>();
      pubData?.forEach(p => {
        const current = pubMap.get(p.listing_id) || { kaufy: false, partner: false };
        if (p.channel === 'kaufy' && p.status === 'active') current.kaufy = true;
        if (p.channel === 'partner_network' && p.status === 'active') current.partner = true;
        pubMap.set(p.listing_id, current);
      });

      // Properties mit Listing-Daten zusammenführen
      return propsData?.map(prop => {
        const listing = listingByProperty.get(prop.id);
        const channels = listing ? pubMap.get(listing.id) : undefined;
        
        return {
          id: prop.id,
          code: prop.code,
          address: prop.address,
          city: prop.city,
          postal_code: prop.postal_code,
          property_type: prop.property_type,
          total_area_sqm: prop.total_area_sqm,
          listing_id: listing?.id || null,
          listing_status: listing?.status || null,
          listing_title: listing?.title || null,
          asking_price: listing?.asking_price || null,
          kaufy_active: channels?.kaufy || false,
          partner_active: channels?.partner || false
        };
      }) || [];
    }
  });

  const columns: PropertyTableColumn<PropertyWithListing>[] = [
    {
      key: 'code',
      header: 'Code',
      minWidth: '80px',
      render: (val) => <PropertyCodeCell code={val} />
    },
    {
      key: 'address',
      header: 'Objekt',
      minWidth: '200px',
      render: (_, row) => <PropertyAddressCell address={row.address || ''} subtitle={row.city || ''} />
    },
    {
      key: 'asking_price',
      header: 'Preis',
      minWidth: '120px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'listing_status',
      header: 'Exposé',
      minWidth: '100px',
      render: (val) => {
        if (!val) return <span className="text-muted-foreground">—</span>;
        const config = statusLabels[val as string] || { label: val, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      }
    },
    {
      key: 'kaufy_active',
      header: 'Kanäle',
      minWidth: '100px',
      align: 'center',
      render: (_, row) => {
        if (!row.listing_status || row.listing_status === 'draft') {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex gap-1 justify-center">
            {row.kaufy_active && (
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="h-3 w-3" />
                K
              </Badge>
            )}
            {row.partner_active && (
              <Badge variant="outline" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                P
              </Badge>
            )}
            {!row.kaufy_active && !row.partner_active && (
              <span className="text-muted-foreground text-xs">Keine</span>
            )}
          </div>
        );
      }
    }
  ];

  const renderRowActions = (row: PropertyWithListing) => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/portal/verkauf/expose/${row.id}`);
      }}
      title="Exposé öffnen"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {properties?.length || 0} Objekt{properties?.length !== 1 ? 'e' : ''} im Portfolio
        </p>
      </div>

      <PropertyTable
        data={properties || []}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Objekte durchsuchen..."
        searchFilter={(row, search) => 
          row.address?.toLowerCase().includes(search) ||
          row.city?.toLowerCase().includes(search) ||
          row.code?.toLowerCase().includes(search) ||
          row.listing_title?.toLowerCase().includes(search) ||
          false
        }
        emptyState={{
          message: 'Keine Objekte im Portfolio',
          actionLabel: 'Objekt anlegen',
          actionRoute: '/portal/immobilien'
        }}
        onRowClick={(row) => navigate(`/portal/verkauf/expose/${row.id}`)}
        rowActions={renderRowActions}
      />
    </div>
  );
};

export default ObjekteTab;

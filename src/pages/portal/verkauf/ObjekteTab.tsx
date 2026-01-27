import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Eye, Globe, Users, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';

// Unit-based data structure (1 row = 1 unit) - Source of Truth from MOD-04
interface UnitWithListing {
  id: string;
  unit_number: string | null;
  property_id: string;
  property_code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  area_sqm: number | null;
  current_monthly_rent: number | null;
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

  // Fetch UNITS with LEFT JOIN to properties and listings (Unit-based view)
  const { data: units, isLoading } = useQuery({
    queryKey: ['verkauf-units-with-listings'],
    queryFn: async () => {
      // 1. Get all units with their properties
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          area_sqm,
          current_monthly_rent,
          property_id,
          properties!inner (
            id,
            code,
            address,
            city,
            postal_code,
            property_type,
            status
          )
        `)
        .eq('properties.status', 'active')
        .order('properties(code)', { ascending: true });

      if (unitsError) throw unitsError;

      // 2. Get listings (may be linked to property_id or unit_id)
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, property_id, unit_id, status, title, asking_price')
        .in('status', ['draft', 'active', 'reserved', 'sold']);

      // 3. Get publications for channel status
      const listingIds = listingsData?.map(l => l.id) || [];
      const { data: pubData } = await supabase
        .from('listing_publications')
        .select('listing_id, channel, status')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      // Build maps
      const listingByUnit = new Map(
        listingsData?.filter(l => l.unit_id).map(l => [l.unit_id, l])
      );
      const listingByProperty = new Map(
        listingsData?.filter(l => !l.unit_id).map(l => [l.property_id, l])
      );

      const pubMap = new Map<string, { kaufy: boolean; partner: boolean }>();
      pubData?.forEach(p => {
        const current = pubMap.get(p.listing_id) || { kaufy: false, partner: false };
        if (p.channel === 'kaufy' && p.status === 'active') current.kaufy = true;
        if (p.channel === 'partner_network' && p.status === 'active') current.partner = true;
        pubMap.set(p.listing_id, current);
      });

      // Transform to flat structure (1 row = 1 unit)
      return unitsData?.map(u => {
        const prop = u.properties as any;
        // First check for unit-specific listing, then fall back to property-level
        const listing = listingByUnit.get(u.id) || listingByProperty.get(prop.id);
        const channels = listing ? pubMap.get(listing.id) : undefined;

        return {
          id: u.id,
          unit_number: u.unit_number,
          property_id: prop.id,
          property_code: prop.code,
          address: prop.address,
          city: prop.city,
          postal_code: prop.postal_code,
          property_type: prop.property_type,
          area_sqm: u.area_sqm,
          current_monthly_rent: u.current_monthly_rent,
          listing_id: listing?.id || null,
          listing_status: listing?.status || null,
          listing_title: listing?.title || null,
          asking_price: listing?.asking_price || null,
          kaufy_active: channels?.kaufy || false,
          partner_active: channels?.partner || false
        } as UnitWithListing;
      }) || [];
    }
  });

  const columns: PropertyTableColumn<UnitWithListing>[] = [
    {
      key: 'property_code',
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
      key: 'unit_number',
      header: 'Einheit',
      minWidth: '80px',
      render: (val) => <span className="text-xs text-muted-foreground">{val || 'MAIN'}</span>
    },
    {
      key: 'area_sqm',
      header: 'm²',
      minWidth: '70px',
      align: 'right',
      render: (val) => val?.toLocaleString('de-DE') || '–'
    },
    {
      key: 'current_monthly_rent',
      header: 'Miete',
      minWidth: '100px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'asking_price',
      header: 'Preis',
      minWidth: '120px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
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

  const renderRowActions = (row: UnitWithListing) => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/portal/verkauf/expose/${row.id}`);
      }}
      title="Verkaufsexposé öffnen"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {units?.length || 0} Einheit{units?.length !== 1 ? 'en' : ''} im Portfolio
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Stammdaten bearbeiten Sie im{' '}
          <Link to="/portal/immobilien/portfolio" className="text-primary hover:underline">
            Immobilien-Portfolio
          </Link>
        </p>
      </div>

      <PropertyTable
        data={units || []}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Objekte durchsuchen..."
        searchFilter={(row, search) => 
          row.address?.toLowerCase().includes(search) ||
          row.city?.toLowerCase().includes(search) ||
          row.property_code?.toLowerCase().includes(search) ||
          row.listing_title?.toLowerCase().includes(search) ||
          row.unit_number?.toLowerCase().includes(search) ||
          false
        }
        emptyState={{
          message: 'Keine Einheiten im Portfolio',
          actionLabel: 'Zum Immobilien-Modul',
          actionRoute: '/portal/immobilien'
        }}
        onRowClick={(row) => navigate(`/portal/verkauf/expose/${row.id}`)}
        rowActions={renderRowActions}
      />
    </div>
  );
};

export default ObjekteTab;

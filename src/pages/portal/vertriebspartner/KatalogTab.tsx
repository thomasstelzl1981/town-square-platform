/**
 * KatalogTab — MOD-09 Vertriebspartner Objektkatalog
 * Mit erweiterten Filtern: Lage, Typ, Preis, Provision, Rendite
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDemoListings, isDemoListingId, deduplicateByField } from '@/hooks/useDemoListings';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  X, Search, SlidersHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  gross_yield: number | null;
}

// Property types for filter
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Eigentumswohnung' },
  { value: 'multi_family', label: 'Mehrfamilienhaus' },
  { value: 'single_family', label: 'Einfamilienhaus' },
  { value: 'commercial', label: 'Gewerbe' },
  { value: 'mixed_use', label: 'Mischnutzung' },
];

const KatalogTab = () => {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [cityFilter, setCityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [commissionRange, setCommissionRange] = useState<[number, number]>([0, 15]);
  const [yieldRange, setYieldRange] = useState<[number, number]>([0, 15]);
  
  // Demo listings
  const { partnerKatalog: demoPartnerListings } = useDemoListings();

  // Exclusions removed — entire row is clickable

  // Fetch partner-released listings
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
          properties (address, city, property_type, total_area_sqm, annual_income)
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

      return listingsData?.map(l => {
        const props = l.properties as any;
        const annualRent = props?.annual_income || 0;
        const price = l.asking_price || 0;
        const grossYield = price > 0 ? (annualRent / price) * 100 : null;
        
        return {
          id: l.id,
          public_id: l.public_id,
          title: l.title,
          asking_price: l.asking_price,
          commission_rate: l.commission_rate,
          status: l.status || 'active',
          property_address: props?.address || '',
          property_city: props?.city || '',
          property_type: props?.property_type,
          total_area_sqm: props?.total_area_sqm,
          kaufy_active: kaufySet.has(l.id),
          gross_yield: grossYield
        };
      }) || [];
    }
  });

  // Get unique cities for filter (including demo)
  const allListings = useMemo(() => deduplicateByField(
    demoPartnerListings as any[],
    listings,
    (item: any) => item.public_id || item.id
  ), [demoPartnerListings, listings]);
  
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(allListings.map((l: any) => l.property_city).filter(Boolean))];
    return cities.sort();
  }, [allListings]);

  // Apply filters
  const filteredListings = useMemo(() => {
    return allListings.filter((listing: any) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          listing.title?.toLowerCase().includes(search) ||
          listing.property_address?.toLowerCase().includes(search) ||
          listing.property_city?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // City filter
      if (cityFilter && listing.property_city !== cityFilter) return false;
      
      // Type filter
      if (typeFilter !== 'all' && listing.property_type !== typeFilter) return false;
      
      // Price range
      const price = listing.asking_price || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Commission range
      const commission = listing.commission_rate || 0;
      if (commission < commissionRange[0] || commission > commissionRange[1]) return false;
      
      // Yield range
      const yieldVal = listing.gross_yield || 0;
      if (yieldVal < yieldRange[0] || yieldVal > yieldRange[1]) return false;
      
      return true;
    });
  }, [allListings, searchTerm, cityFilter, typeFilter, priceRange, commissionRange, yieldRange]);

  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setTypeFilter('all');
    setPriceRange([0, 5000000]);
    setCommissionRange([0, 15]);
    setYieldRange([0, 15]);
  };

  const hasActiveFilters = searchTerm || cityFilter || typeFilter !== 'all' || 
    priceRange[0] > 0 || priceRange[1] < 5000000 ||
    commissionRange[0] > 0 || commissionRange[1] < 15 ||
    yieldRange[0] > 0 || yieldRange[1] < 15;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const columns: PropertyTableColumn<PartnerListing>[] = [
    {
      key: 'title',
      header: 'Objekt',
      minWidth: '220px',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <PropertyAddressCell 
            address={row.title} 
            subtitle={`${row.property_address}, ${row.property_city}`} 
          />
          {row.isDemo && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-1.5 py-0">
              DEMO
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'property_type',
      header: 'Typ',
      minWidth: '100px',
      render: (val) => val ? (
        <span className="text-sm capitalize">{String(val).replace('_', ' ')}</span>
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
      key: 'gross_yield',
      header: 'Rendite',
      align: 'right',
      minWidth: '80px',
      render: (val) => val ? (
        <span className="font-medium text-primary">{(val as number).toFixed(1)}%</span>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'commission_rate',
      header: 'Provision',
      align: 'right',
      minWidth: '100px',
      render: (val) => val ? (
        <span className="font-semibold text-accent-foreground">{val}%</span>
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
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Objektkatalog" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} von {allListings.length} Objekt{allListings.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card className="glass-card">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <CardTitle className="text-base">Filter</CardTitle>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">Aktiv</Badge>
                  )}
                </div>
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Row 1: Search, City, Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Suche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Titel, Adresse, Stadt..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stadt/Lage</Label>
                  <Select 
                    value={cityFilter || "__all__"} 
                    onValueChange={(v) => setCityFilter(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Städte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Alle Städte</SelectItem>
                      {uniqueCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Objekttyp</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Typen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Typen</SelectItem>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Ranges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Kaufpreis</Label>
                    <span className="text-xs font-medium">
                      {formatCurrency(priceRange[0])} – {formatCurrency(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    min={0}
                    max={5000000}
                    step={50000}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Provision</Label>
                    <span className="text-xs font-medium">
                      {commissionRange[0]}% – {commissionRange[1]}%
                    </span>
                  </div>
                  <Slider
                    value={commissionRange}
                    onValueChange={(v) => setCommissionRange(v as [number, number])}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Bruttorendite</Label>
                    <span className="text-xs font-medium">
                      {yieldRange[0]}% – {yieldRange[1]}%
                    </span>
                  </div>
                  <Slider
                    value={yieldRange}
                    onValueChange={(v) => setYieldRange(v as [number, number])}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Listings Table */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <PropertyTable
            data={filteredListings}
            onRowClick={(row) => {
              const identifier = row.public_id || row.id;
              navigate(`/portal/vertriebspartner/katalog/${identifier}`);
            }}
            columns={columns}
            isLoading={isLoading}
            emptyState={{
              message: hasActiveFilters 
                ? 'Keine Objekte entsprechen Ihren Filterkriterien.'
                : 'Keine Objekte im Katalog. Sobald Eigentümer ihre Objekte für das Partner-Netzwerk freigeben, erscheinen sie hier.',
              actionLabel: hasActiveFilters ? 'Filter zurücksetzen' : '',
              actionRoute: ''
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default KatalogTab;

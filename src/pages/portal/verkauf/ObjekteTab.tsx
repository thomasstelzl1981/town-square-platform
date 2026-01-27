import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MoreVertical, 
  Plus, 
  Eye, 
  Globe,
  Users,
  Pause,
  Trash2,
  FileText,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  PropertyStatusCell,
  type PropertyTableColumn 
} from '@/components/shared';

interface ListingWithProperty {
  id: string;
  public_id: string | null;
  title: string;
  description: string | null;
  asking_price: number | null;
  min_price: number | null;
  status: string;
  partner_visibility: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  property_id: string;
  tenant_id: string;
  properties: {
    id: string;
    address: string | null;
    city: string | null;
    code: string | null;
    total_area_sqm: number | null;
    property_type: string | null;
  } | null;
  publication_count: number;
  inquiry_count: number;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  internal_review: { label: 'Prüfung', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  reserved: { label: 'Reserviert', variant: 'outline' },
  sold: { label: 'Verkauft', variant: 'default' },
  withdrawn: { label: 'Zurückgezogen', variant: 'destructive' }
};

const ObjekteTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asking_price: '',
    commission_rate: '3.0'
  });

  // Fetch listings with property data
  const { data: listings, isLoading } = useQuery({
    queryKey: ['verkauf-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, public_id, title, description, asking_price, min_price,
          status, partner_visibility, commission_rate,
          created_at, updated_at, published_at, property_id, tenant_id,
          properties (
            id, address, city, code, total_area_sqm, property_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch publication counts
      const listingIds = data?.map(l => l.id) || [];
      const { data: pubData } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('status', 'active');

      const { data: inqData } = await supabase
        .from('listing_inquiries')
        .select('listing_id')
        .in('listing_id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const pubCounts = new Map<string, number>();
      pubData?.forEach(p => pubCounts.set(p.listing_id, (pubCounts.get(p.listing_id) || 0) + 1));

      const inqCounts = new Map<string, number>();
      inqData?.forEach(i => inqCounts.set(i.listing_id, (inqCounts.get(i.listing_id) || 0) + 1));

      return data?.map(listing => ({
        ...listing,
        properties: listing.properties as ListingWithProperty['properties'],
        publication_count: pubCounts.get(listing.id) || 0,
        inquiry_count: inqCounts.get(listing.id) || 0
      })) || [];
    }
  });

  // Fetch properties without active listings for create dialog
  const { data: availableProperties } = useQuery({
    queryKey: ['available-properties-for-listing'],
    queryFn: async () => {
      const { data: allProps } = await supabase
        .from('properties')
        .select('id, address, city, code')
        .order('address');

      const { data: activeListings } = await supabase
        .from('listings')
        .select('property_id')
        .in('status', ['draft', 'internal_review', 'active', 'reserved']);

      const activePropertyIds = new Set(activeListings?.map(l => l.property_id) || []);
      return allProps?.filter(p => !activePropertyIds.has(p.id)) || [];
    },
    enabled: createDialogOpen
  });

  // Create listing mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-listing-publish', {
        body: {
          action: 'create',
          data: {
            property_id: selectedPropertyId,
            title: formData.title,
            description: formData.description,
            asking_price: parseFloat(formData.asking_price) || undefined,
            commission_rate: parseFloat(formData.commission_rate) || 3.0
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verkauf-listings'] });
      setCreateDialogOpen(false);
      setFormData({ title: '', description: '', asking_price: '', commission_rate: '3.0' });
      toast.success('Inserat erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async ({ listingId, visibility }: { listingId: string; visibility: string }) => {
      const { data, error } = await supabase.functions.invoke('sot-listing-publish', {
        body: { action: 'publish', listing_id: listingId, partner_visibility: visibility }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verkauf-listings'] });
      toast.success('Inserat veröffentlicht');
    }
  });

  const columns: PropertyTableColumn<ListingWithProperty>[] = [
    {
      key: 'code',
      header: 'Code',
      minWidth: '80px',
      render: (_, row) => <PropertyCodeCell code={row.properties?.code || null} fallback={row.public_id || '—'} />
    },
    {
      key: 'title',
      header: 'Titel & Objekt',
      minWidth: '200px',
      render: (_, row) => (
        <div>
          <p className="font-medium truncate">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {row.properties?.address}, {row.properties?.city}
          </p>
        </div>
      )
    },
    {
      key: 'asking_price',
      header: 'Preis',
      minWidth: '120px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '100px',
      render: (val) => {
        return <PropertyStatusCell status={val as string} labels={statusLabels} />;
      }
    },
    {
      key: 'publication_count',
      header: 'Kanäle',
      minWidth: '80px',
      align: 'center',
      render: (val) => (
        <Badge variant="outline" className="font-mono">
          <Globe className="h-3 w-3 mr-1" />
          {val}
        </Badge>
      )
    },
    {
      key: 'inquiry_count',
      header: 'Anfragen',
      minWidth: '80px',
      align: 'center',
      render: (val) => (
        <Badge variant={val > 0 ? 'default' : 'outline'} className="font-mono">
          {val}
        </Badge>
      )
    }
  ];

  const renderRowActions = (row: ListingWithProperty) => (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => navigate(`/portal/immobilien/${row.property_id}`)}
        title="Objekt öffnen"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.status === 'draft' && (
            <>
              <DropdownMenuItem onClick={() => publishMutation.mutate({ listingId: row.id, visibility: 'none' })}>
                <Globe className="h-4 w-4 mr-2" />
                Auf Kaufy veröffentlichen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => publishMutation.mutate({ listingId: row.id, visibility: 'network' })}>
                <Users className="h-4 w-4 mr-2" />
                + Partner-Netzwerk
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {row.status === 'active' && (
            <DropdownMenuItem onClick={() => toast.info('Pausieren kommt bald')}>
              <Pause className="h-4 w-4 mr-2" />
              Pausieren
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate(`/portal/immobilien/${row.property_id}`)}>
            <Building2 className="h-4 w-4 mr-2" />
            Objekt öffnen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info('Exposé-Export kommt bald')}>
            <FileText className="h-4 w-4 mr-2" />
            Exposé exportieren
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => toast.info('Löschen kommt bald')}>
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {listings?.length || 0} Inserat{listings?.length !== 1 ? 'e' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Inserat
        </Button>
      </div>

      <PropertyTable
        data={listings || []}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Inserate durchsuchen..."
        searchFilter={(row, search) => 
          row.title?.toLowerCase().includes(search) ||
          row.properties?.address?.toLowerCase().includes(search) ||
          row.properties?.city?.toLowerCase().includes(search) ||
          row.public_id?.toLowerCase().includes(search) ||
          false
        }
        emptyState={{
          message: 'Keine Inserate vorhanden',
          actionLabel: 'Erstes Inserat erstellen',
          actionRoute: '/portal/verkauf/objekte'
        }}
        onRowClick={(row) => navigate(`/portal/immobilien/${row.property_id}`)}
        rowActions={renderRowActions}
      />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Verkaufsinserat</DialogTitle>
            <DialogDescription>
              Wählen Sie ein Objekt und geben Sie die Inseratsdaten ein.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objekt auswählen</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">Objekt wählen...</option>
                {availableProperties?.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `[${p.code}] ` : ''}{p.address}, {p.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                placeholder="z.B. Sonnige 3-Zimmer-Wohnung"
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                placeholder="Beschreiben Sie das Objekt..."
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kaufpreis (€)</Label>
                <Input
                  type="number"
                  placeholder="350000"
                  value={formData.asking_price}
                  onChange={(e) => setFormData(f => ({ ...f, asking_price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Provision (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="3.0"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(f => ({ ...f, commission_rate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!selectedPropertyId || !formData.title || createMutation.isPending}
            >
              {createMutation.isPending ? 'Erstelle...' : 'Inserat erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObjekteTab;

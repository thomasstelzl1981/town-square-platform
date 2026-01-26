import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  FileText, 
  Home,
  Megaphone,
  Download, 
  X as XIcon, 
  Plus, 
  Lightbulb,
  Eye
} from 'lucide-react';
import { RentalListingWizard } from '@/components/msv/RentalListingWizard';
import { RentalPublishDialog } from '@/components/msv/RentalPublishDialog';
import { 
  PropertyTable, 
  PropertyCodeCell,
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';

type RentalListing = {
  id: string;
  public_id: string;
  status: string;
  cold_rent: number | null;
  warm_rent: number | null;
  utilities_estimate: number | null;
  available_from: string | null;
  property_id: string;
  unit_id: string | null;
  properties: {
    id: string;
    address: string;
    code: string | null;
    property_type: string | null;
  } | null;
  units: {
    id: string;
    area_sqm: number | null;
  } | null;
  rental_publications: {
    channel: string;
    status: string;
  }[];
};

const VermietungTab = () => {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<RentalListing | null>(null);
  const [publishChannel, setPublishChannel] = useState<'scout24' | 'kleinanzeigen'>('scout24');

  const { data: listings, isLoading, refetch } = useQuery({
    queryKey: ['rental-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          id,
          public_id,
          status,
          cold_rent,
          warm_rent,
          utilities_estimate,
          available_from,
          property_id,
          unit_id,
          properties!rental_listings_property_id_fkey (
            id,
            address,
            code,
            property_type
          ),
          units (
            id,
            area_sqm
          ),
          rental_publications (
            channel,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RentalListing[];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Entwurf</Badge>;
      case 'active':
        return <Badge className="bg-status-success">Aktiv</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-status-warning">Pausiert</Badge>;
      case 'rented':
        return <Badge className="bg-primary">Vermietet</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getChannelIcons = (publications: { channel: string; status: string }[]) => {
    const scout24 = publications?.find(p => p.channel === 'scout24');
    const kleinanzeigen = publications?.find(p => p.channel === 'kleinanzeigen');

    return (
      <div className="flex gap-1">
        {scout24?.status === 'published' && (
          <span title="ImmobilienScout24" className="text-lg">🏠</span>
        )}
        {kleinanzeigen?.status === 'published' && (
          <span title="Kleinanzeigen" className="text-lg">📢</span>
        )}
        {!publications?.some(p => p.status === 'published') && (
          <span className="text-muted-foreground">–</span>
        )}
      </div>
    );
  };

  const handleAction = (action: string, listing: RentalListing) => {
    setSelectedListing(listing);
    
    switch (action) {
      case 'edit':
        setWizardOpen(true);
        break;
      case 'scout24':
        setPublishChannel('scout24');
        setPublishDialogOpen(true);
        break;
      case 'kleinanzeigen':
        setPublishChannel('kleinanzeigen');
        setPublishDialogOpen(true);
        break;
      case 'deactivate':
        handleDeactivate(listing);
        break;
    }
  };

  const handleDeactivate = async (listing: RentalListing) => {
    const newStatus = listing.status === 'paused' ? 'active' : 'paused';
    await supabase
      .from('rental_listings')
      .update({ status: newStatus })
      .eq('id', listing.id);
    refetch();
  };

  const handleCreateNew = () => {
    setSelectedListing(null);
    setWizardOpen(true);
  };

  // Column definitions - consistent with MOD-04 pattern
  const columns: PropertyTableColumn<RentalListing>[] = [
    {
      key: 'code',
      header: 'Code',
      minWidth: '80px',
      render: (_, row) => <PropertyCodeCell code={row.properties?.code || null} fallback={row.public_id} />
    },
    {
      key: 'address',
      header: 'Adresse',
      minWidth: '180px',
      render: (_, row) => (
        <span className="font-medium">{row.properties?.address || '–'}</span>
      )
    },
    {
      key: 'type',
      header: 'Typ',
      minWidth: '100px',
      render: (_, row) => (
        <span className="text-sm">{row.properties?.property_type || 'Wohnung'}</span>
      )
    },
    {
      key: 'area',
      header: 'Fläche',
      minWidth: '80px',
      render: (_, row) => row.units?.area_sqm ? `${row.units.area_sqm} m²` : '–'
    },
    {
      key: 'cold_rent',
      header: 'Kaltmiete',
      minWidth: '100px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'warm_rent',
      header: 'Warmmiete',
      minWidth: '100px',
      align: 'right',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '100px',
      render: (_, row) => getStatusBadge(row.status)
    },
    {
      key: 'channels',
      header: 'Kanäle',
      minWidth: '80px',
      render: (_, row) => getChannelIcons(row.rental_publications)
    }
  ];

  const renderRowActions = (row: RentalListing) => (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => navigate(`/portal/msv/vermietung/${row.id}`)}
        title="Exposé öffnen"
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
          <DropdownMenuItem onClick={() => handleAction('edit', row)}>
            <FileText className="h-4 w-4 mr-2" />
            Exposé bearbeiten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('scout24', row)}>
            <Home className="h-4 w-4 mr-2" />
            Bei Scout24 veröffentlichen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('kleinanzeigen', row)}>
            <Megaphone className="h-4 w-4 mr-2" />
            Zu Kleinanzeigen exportieren
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('deactivate', row)}>
            <XIcon className="h-4 w-4 mr-2" />
            {row.status === 'paused' ? 'Aktivieren' : 'Deaktivieren'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4">
      <PropertyTable
        data={listings || []}
        columns={columns}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Inserate durchsuchen..."
        searchFilter={(row, search) => 
          row.properties?.address?.toLowerCase().includes(search) ||
          row.properties?.code?.toLowerCase().includes(search) ||
          row.public_id?.toLowerCase().includes(search) ||
          false
        }
        emptyState={{
          message: 'Keine Vermietungsinserate — erstellen Sie ein Exposé',
          actionLabel: 'Neues Vermietungsexposé erstellen',
          actionRoute: '/portal/msv/vermietung'
        }}
        onRowClick={(row) => navigate(`/portal/msv/vermietung/${row.id}`)}
        rowActions={renderRowActions}
        headerActions={
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Vermietungsexposé
          </Button>
        }
      />

      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm">
                Veröffentlichen Sie Ihre Mietobjekte direkt auf <strong>ImmobilienScout24</strong> oder 
                exportieren Sie für <strong>Kleinanzeigen</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Die Exposé-Daten werden aus Ihren MOD-04 Objektdaten übernommen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RentalListingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        listing={selectedListing}
        onSuccess={() => {
          refetch();
          setWizardOpen(false);
        }}
      />

      <RentalPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        listing={selectedListing}
        channel={publishChannel}
        onSuccess={() => {
          refetch();
          setPublishDialogOpen(false);
        }}
      />
    </div>
  );
};

export default VermietungTab;

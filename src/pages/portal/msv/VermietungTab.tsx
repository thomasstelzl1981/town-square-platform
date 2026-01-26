import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Building, 
  ExternalLink, 
  Download, 
  X as XIcon, 
  Plus, 
  Search, 
  Loader2,
  Home,
  Megaphone,
  Lightbulb
} from 'lucide-react';
import { RentalListingWizard } from '@/components/msv/RentalListingWizard';
import { RentalPublishDialog } from '@/components/msv/RentalPublishDialog';

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
  const [search, setSearch] = useState('');
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

  const filteredListings = listings?.filter(l => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      l.properties?.address?.toLowerCase().includes(searchLower) ||
      l.properties?.code?.toLowerCase().includes(searchLower) ||
      l.public_id?.toLowerCase().includes(searchLower)
    );
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
          <span className="text-muted-foreground">—</span>
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
      case 'pdf':
        // TODO: Implement PDF export
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Inserate durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Vermietungsexposé
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objekt</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Fläche</TableHead>
              <TableHead>Kaltmiete</TableHead>
              <TableHead>Warmmiete</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kanäle</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredListings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Keine Vermietungsinserate vorhanden
                </TableCell>
              </TableRow>
            ) : (
              filteredListings?.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {listing.properties?.code || listing.public_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {listing.properties?.address || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {listing.properties?.property_type || 'Wohnung'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {listing.units?.area_sqm 
                      ? `${listing.units.area_sqm} m²` 
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {listing.cold_rent 
                      ? `${listing.cold_rent.toLocaleString('de-DE')} €` 
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {listing.warm_rent 
                        ? `${listing.warm_rent.toLocaleString('de-DE')} €` 
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(listing.status)}
                  </TableCell>
                  <TableCell>
                    {getChannelIcons(listing.rental_publications)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction('edit', listing)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exposé bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction('scout24', listing)}>
                          <Home className="h-4 w-4 mr-2" />
                          Bei Scout24 veröffentlichen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('kleinanzeigen', listing)}>
                          <Megaphone className="h-4 w-4 mr-2" />
                          Zu Kleinanzeigen exportieren
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction('pdf', listing)}>
                          <Download className="h-4 w-4 mr-2" />
                          Als PDF exportieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('deactivate', listing)}>
                          <XIcon className="h-4 w-4 mr-2" />
                          {listing.status === 'paused' ? 'Aktivieren' : 'Deaktivieren'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

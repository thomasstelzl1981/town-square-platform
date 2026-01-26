import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Loader2, 
  AlertTriangle, 
  Edit, 
  Sparkles,
  Home,
  Megaphone,
  Download,
  Save
} from 'lucide-react';
import { RentalPublishDialog } from '@/components/msv/RentalPublishDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RentalListing {
  id: string;
  public_id: string;
  status: string;
  description: string | null;
  cold_rent: number | null;
  warm_rent: number | null;
  utilities_estimate: number | null;
  deposit_months: number | null;
  available_from: string | null;
  property_id: string;
  unit_id: string | null;
  tenant_id: string;
  created_at: string;
  properties: {
    id: string;
    address: string;
    city: string;
    postal_code: string | null;
    code: string | null;
    property_type: string | null;
    year_built: number | null;
    total_area_sqm: number | null;
    heating_type: string | null;
    energy_source: string | null;
    renovation_year: number | null;
    description: string | null;
  } | null;
  units: {
    id: string;
    unit_number: string;
    area_sqm: number | null;
    rooms: number | null;
  } | null;
  rental_publications: {
    channel: string;
    status: string;
    external_id: string | null;
    published_at: string | null;
  }[];
}

export default function RentalExposeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();
  const { toast } = useToast();
  
  const [listing, setListing] = useState<RentalListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('daten');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishChannel, setPublishChannel] = useState<'scout24' | 'kleinanzeigen'>('scout24');

  async function fetchListing() {
    if (!id || !activeOrganization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('rental_listings')
        .select(`
          id,
          public_id,
          status,
          description,
          cold_rent,
          warm_rent,
          utilities_estimate,
          deposit_months,
          available_from,
          property_id,
          unit_id,
          tenant_id,
          created_at,
          properties!rental_listings_property_id_fkey (
            id,
            address,
            city,
            postal_code,
            code,
            property_type,
            year_built,
            total_area_sqm,
            heating_type,
            energy_source,
            renovation_year,
            description
          ),
          units (
            id,
            unit_number,
            area_sqm,
            rooms
          ),
          rental_publications (
            channel,
            status,
            external_id,
            published_at
          )
        `)
        .eq('id', id)
        .eq('tenant_id', activeOrganization.id)
        .single();

      if (fetchError) throw fetchError;
      
      setListing(data as unknown as RentalListing);
      setEditedDescription(data?.description || '');
    } catch (err: any) {
      setError(err.message || 'Vermietungsexposé nicht gefunden');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchListing();
  }, [id, activeOrganization]);

  const handleGenerateDescription = async () => {
    if (!listing?.properties) return;
    
    setIsGeneratingDescription(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-expose-description', {
        body: { 
          property: {
            address: listing.properties.address,
            city: listing.properties.city,
            postal_code: listing.properties.postal_code,
            property_type: listing.properties.property_type,
            year_built: listing.properties.year_built,
            total_area_sqm: listing.units?.area_sqm || listing.properties.total_area_sqm,
            heating_type: listing.properties.heating_type,
            energy_source: listing.properties.energy_source,
            renovation_year: listing.properties.renovation_year
          }
        }
      });
      
      if (fnError) throw fnError;
      
      if (data?.description) {
        setEditedDescription(data.description);
        toast({ title: 'Beschreibung generiert' });
      }
    } catch (err: any) {
      console.error('Error generating description:', err);
      toast({
        title: 'Fehler bei KI-Generierung',
        description: err.message || 'Unbekannter Fehler',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!listing) return;
    
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('rental_listings')
        .update({ description: editedDescription })
        .eq('id', listing.id);
      
      if (updateError) throw updateError;
      
      setListing({ ...listing, description: editedDescription });
      toast({ title: 'Beschreibung gespeichert' });
    } catch (err: any) {
      toast({
        title: 'Fehler beim Speichern',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = (channel: 'scout24' | 'kleinanzeigen') => {
    setPublishChannel(channel);
    setPublishDialogOpen(true);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/portal/msv/vermietung">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Vermietungsexposé nicht gefunden'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const property = listing.properties;
  const unit = listing.units;

  return (
    <div className="space-y-6">
      {/* Header - identical structure to PropertyDetail */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/portal/msv/vermietung">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              {property?.code ? `${property.code} – ` : ''}{property?.address || 'Vermietungsexposé'}
            </h2>
            {getStatusBadge(listing.status)}
          </div>
          <div className="flex items-center gap-2 ml-10">
            <Badge variant="outline">{property?.property_type || 'Wohnung'}</Badge>
            <span className="text-muted-foreground">
              {property?.postal_code} {property?.city}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateDescription}
            disabled={isGeneratingDescription}
          >
            {isGeneratingDescription ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Beschreibung generieren
          </Button>
        </div>
      </div>

      {/* Tabs - identical structure to PropertyDetail */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daten">Daten</TabsTrigger>
          <TabsTrigger value="beschreibung">Beschreibung</TabsTrigger>
          <TabsTrigger value="publikation">Publikation</TabsTrigger>
        </TabsList>

        <TabsContent value="daten">
          {/* Card Grid - identical to ExposeTab structure */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Objekt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Objekt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Adresse" value={property?.address} />
                <InfoRow label="PLZ / Ort" value={`${property?.postal_code || ''} ${property?.city || ''}`} />
                <InfoRow label="Art" value={property?.property_type} />
                <InfoRow label="Fläche" value={unit?.area_sqm ? `${unit.area_sqm} m²` : (property?.total_area_sqm ? `${property.total_area_sqm} m²` : null)} />
                <InfoRow label="Zimmer" value={unit?.rooms?.toString()} />
                <InfoRow label="Einheit" value={unit?.unit_number} />
              </CardContent>
            </Card>

            {/* Mietkonditionen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mietkonditionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Kaltmiete" value={formatCurrency(listing.cold_rent)} />
                <InfoRow label="Nebenkosten" value={formatCurrency(listing.utilities_estimate)} />
                <InfoRow label="Warmmiete" value={formatCurrency(listing.warm_rent)} highlight />
                <Separator className="my-2" />
                <InfoRow label="Kaution" value={listing.deposit_months ? `${listing.deposit_months} Monatsmieten` : '–'} />
                <InfoRow label="Verfügbar ab" value={formatDate(listing.available_from)} />
              </CardContent>
            </Card>

            {/* Ausstattung */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ausstattung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Baujahr" value={property?.year_built?.toString()} />
                <InfoRow label="Sanierung" value={property?.renovation_year?.toString()} />
                <InfoRow label="Heizung" value={property?.heating_type} />
                <InfoRow label="Energieträger" value={property?.energy_source} />
              </CardContent>
            </Card>

            {/* Publikation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Veröffentlichung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.rental_publications.length > 0 ? (
                  listing.rental_publications.map((pub, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {pub.channel === 'scout24' ? 'ImmobilienScout24' : 'Kleinanzeigen'}
                      </span>
                      <Badge variant={pub.status === 'published' ? 'default' : 'outline'}>
                        {pub.status === 'published' ? 'Online' : pub.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Noch nicht veröffentlicht</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="beschreibung">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Objektbeschreibung</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription}
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Mit KI generieren
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={isSaving || editedDescription === listing.description}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Speichern
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Beschreiben Sie das Mietobjekt professionell..."
                rows={12}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publikation">
          <div className="grid gap-6 md:grid-cols-2">
            {/* ImmobilienScout24 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  ImmobilienScout24
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listing.rental_publications.find(p => p.channel === 'scout24') ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge className="bg-status-success">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Veröffentlicht am</span>
                      <span className="text-sm">
                        {formatDate(listing.rental_publications.find(p => p.channel === 'scout24')?.published_at || null)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch nicht auf ImmobilienScout24 veröffentlicht.
                  </p>
                )}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handlePublish('scout24')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Bei Scout24 veröffentlichen
                </Button>
              </CardContent>
            </Card>

            {/* Kleinanzeigen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Kleinanzeigen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listing.rental_publications.find(p => p.channel === 'kleinanzeigen') ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge className="bg-status-success">Online</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Für Kleinanzeigen exportieren Sie die Daten manuell.
                  </p>
                )}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handlePublish('kleinanzeigen')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Für Kleinanzeigen exportieren
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <RentalPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        listing={listing as any}
        channel={publishChannel}
        onSuccess={() => {
          fetchListing();
          setPublishDialogOpen(false);
        }}
      />
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold' : 'font-medium'}>
        {value || '–'}
      </span>
    </div>
  );
}

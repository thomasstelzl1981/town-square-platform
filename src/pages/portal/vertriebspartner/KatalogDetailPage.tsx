/**
 * KatalogDetailPage — Read-Only Verkaufsexposé für Partner
 * Route: /portal/vertriebspartner/katalog/:publicId
 * 
 * Architektur: Zeigt das freigegebene Exposé aus MOD-04/06 (KEINE Investment Engine!)
 * Die Investment Engine wird nur im Beratung-Tab verwendet.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { 
  ArrowLeft, Download, FileText, MapPin, Calendar, 
  Building2, Maximize2, Handshake, MessageSquare, Zap,
  TrendingUp, Percent, PiggyBank, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExposeLocationMap } from '@/components/verkauf';

interface DocumentItem {
  id: string;
  name: string;
  file_path: string;
  doc_type: string | null;
  mime_type: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  'energy_certificate': 'Energieausweis',
  'division_declaration': 'Teilungserklärung',
  'land_register': 'Grundbuchauszug',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'multi_family': 'Mehrfamilienhaus',
  'single_family': 'Einfamilienhaus',
  'apartment': 'Eigentumswohnung',
  'commercial': 'Gewerbe',
};

const KatalogDetailPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();

  // Helper to validate UUID format
  const isValidUUID = (str: string) => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Fetch listing with full property data
  const { data: listing, isLoading: isLoadingListing } = useQuery({
    queryKey: ['partner-listing-detail', publicId],
    queryFn: async () => {
      if (!publicId) return null;

      let query = supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          description,
          asking_price,
          commission_rate,
          properties!inner (
            id,
            code,
            property_type,
            address,
            address_house_no,
            city,
            postal_code,
            total_area_sqm,
            year_built,
            renovation_year,
            energy_source,
            heating_type,
            annual_income,
            market_value
          )
        `);

      if (isValidUUID(publicId)) {
        query = query.or(`public_id.eq.${publicId},id.eq.${publicId}`);
      } else {
        query = query.eq('public_id', publicId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error || !data) {
        console.error('Listing query error:', error);
        return null;
      }

      const props = data.properties as any;
      return {
        id: data.id,
        public_id: data.public_id,
        property_id: props?.id,
        title: data.title || 'Immobilie',
        description: data.description || '',
        asking_price: data.asking_price || 0,
        commission_rate: data.commission_rate || 0,
        property_code: props?.code || '',
        property_type: props?.property_type || 'multi_family',
        address: props?.address || '',
        address_house_no: props?.address_house_no || '',
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.year_built || null,
        renovation_year: props?.renovation_year || null,
        energy_source: props?.energy_source || null,
        heating_type: props?.heating_type || null,
        annual_income: props?.annual_income || 0,
        market_value: props?.market_value || 0,
      };
    },
    enabled: !!publicId,
  });

  // Fetch property accounting (AfA)
  const { data: accounting } = useQuery({
    queryKey: ['property-accounting', listing?.property_id],
    queryFn: async () => {
      if (!listing?.property_id) return null;
      const { data } = await supabase
        .from('property_accounting')
        .select('afa_rate_percent, afa_method, book_value_eur, land_share_percent, building_share_percent')
        .eq('property_id', listing.property_id)
        .maybeSingle();
      return data;
    },
    enabled: !!listing?.property_id,
  });

  // Fetch images
  const { data: images = [] } = useQuery({
    queryKey: ['partner-listing-images', listing?.property_id],
    queryFn: async () => {
      if (!listing?.property_id) return [];

      const { data: links, error } = await supabase
        .from('document_links')
        .select(`
          display_order,
          is_title_image,
          documents!inner (
            id,
            name,
            file_path,
            mime_type
          )
        `)
        .eq('object_type', 'property')
        .eq('object_id', listing.property_id)
        .like('documents.mime_type', 'image/%')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Images query error:', error);
        return [];
      }

      const imagePromises = (links || []).map(async (link: any) => {
        const doc = link.documents;
        const url = await getCachedSignedUrl(doc.file_path);

        return {
          id: doc.id,
          name: doc.name,
          url: url || '',
          is_cover: link.is_title_image || false,
        };
      });

      return Promise.all(imagePromises);
    },
    enabled: !!listing?.property_id,
  });

  // Fetch documents (PDFs)
  const { data: documents = [] } = useQuery({
    queryKey: ['partner-listing-documents', listing?.property_id],
    queryFn: async () => {
      if (!listing?.property_id) return [];

      const { data: links, error } = await supabase
        .from('document_links')
        .select(`
          documents!inner (
            id,
            name,
            file_path,
            doc_type,
            mime_type
          )
        `)
        .eq('object_type', 'property')
        .eq('object_id', listing.property_id)
        .in('documents.doc_type', ['energy_certificate', 'division_declaration', 'land_register']);

      if (error) {
        console.error('Documents query error:', error);
        return [];
      }

      return (links || []).map((link: any) => link.documents as DocumentItem);
    },
    enabled: !!listing?.property_id,
  });

  const handleDownload = async (doc: DocumentItem) => {
    const url = await getCachedSignedUrl(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (!value) return '—';
    return `${value.toFixed(2)} %`;
  };

  if (isLoadingListing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Objekt nicht gefunden</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/portal/vertriebspartner/katalog')}
        >
          Zurück zum Katalog
        </Button>
      </div>
    );
  }

  const propertyTypeLabel = PROPERTY_TYPE_LABELS[listing.property_type] || 'Immobilie';
  const coverImage = images.find(img => img.is_cover) || images[0];
  const otherImages = images.filter(img => img.id !== coverImage?.id);
  
  // Calculate metrics
  const annualRent = listing.annual_income || 0;
  const monthlyRent = Math.round(annualRent / 12);
  const grossYield = listing.asking_price > 0 ? (annualRent / listing.asking_price) * 100 : 0;
  const pricePerSqm = listing.total_area_sqm > 0 && listing.asking_price > 0 
    ? listing.asking_price / listing.total_area_sqm 
    : 0;

  // Full address
  const fullAddress = listing.address_house_no 
    ? `${listing.address} ${listing.address_house_no}` 
    : listing.address;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/portal/vertriebspartner/katalog')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Katalog
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Property Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-4">
              {images.length > 0 ? (
                <div className="space-y-3">
                  {coverImage && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={coverImage.url} 
                        alt={coverImage.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {otherImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {otherImages.map(img => (
                        <div 
                          key={img.id}
                          className="flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-muted"
                        >
                          <img 
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Facts Bar */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(listing.asking_price)}
                  </p>
                  <p className="text-xs text-muted-foreground">Kaufpreis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.total_area_sqm?.toLocaleString('de-DE') || '—'} m²</p>
                  <p className="text-xs text-muted-foreground">Wohnfläche</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.year_built || '—'}</p>
                  <p className="text-xs text-muted-foreground">Baujahr</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Bruttorendite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
                  <CardTitle className="text-xl">{listing.title}</CardTitle>
                  <p className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    {listing.postal_code} {listing.city}, {fullAddress}
                  </p>
                  {listing.property_code && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Objekt-ID: {listing.property_code}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            {listing.description && (
              <CardContent>
                <h3 className="font-semibold mb-2">Beschreibung</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{listing.description}</p>
              </CardContent>
            )}
          </Card>

          {/* Tab-Content (READ-ONLY) */}
          <Tabs defaultValue="objekt" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="objekt">Objektdaten</TabsTrigger>
              <TabsTrigger value="rendite">Rendite & AfA</TabsTrigger>
              <TabsTrigger value="energie">Energie</TabsTrigger>
            </TabsList>

            {/* Tab: Objektdaten */}
            <TabsContent value="objekt" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Objektdaten
                  </CardTitle>
                  <CardDescription>Stammdaten aus der Immobilienakte</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Grunddaten */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Grunddaten</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Objektart</span>
                          <span className="font-medium">{propertyTypeLabel}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Wohnfläche</span>
                          </div>
                          <span className="font-medium">{listing.total_area_sqm?.toLocaleString('de-DE')} m²</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">€/m²</span>
                          <span className="font-medium">{formatCurrency(pricePerSqm)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Baujahr & Zustand */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Baujahr & Zustand</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Baujahr</span>
                          </div>
                          <span className="font-medium">{listing.year_built || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Modernisierung</span>
                          <span className="font-medium">{listing.renovation_year || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Standort</h4>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Adresse</span>
                      </div>
                      <span className="font-medium">
                        {fullAddress}, {listing.postal_code} {listing.city}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Rendite & AfA */}
            <TabsContent value="rendite" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Rendite & Abschreibung
                  </CardTitle>
                  <CardDescription>Investmentkennzahlen für Kapitalanleger</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Mietrendite */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Mieteinnahmen</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Monatliche Miete (Kalt)</span>
                          <span className="font-bold">{formatCurrency(monthlyRent)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Jahresmiete</span>
                          <span className="font-bold">{formatCurrency(annualRent)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <span className="text-sm font-medium">Bruttorendite</span>
                          <span className="font-bold text-primary text-lg">{grossYield.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* AfA-Daten */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Abschreibung (AfA)</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">AfA-Modell</span>
                          </div>
                          <span className="font-medium">{accounting?.afa_method || 'Linear'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">AfA-Satz</span>
                          </div>
                          <span className="font-medium">{formatPercent(accounting?.afa_rate_percent)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Gebäudeanteil</span>
                          <span className="font-medium">{formatPercent(accounting?.building_share_percent)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Grundstücksanteil</span>
                          <span className="font-medium">{formatPercent(accounting?.land_share_percent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Energie */}
            <TabsContent value="energie" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Energieausweis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Ausweistyp</span>
                        <span className="font-medium">—</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Effizienzklasse</span>
                        <Badge variant="outline" className="font-bold">—</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Heizungsart</span>
                        <span className="font-medium">{listing.heating_type || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Energieträger</span>
                        <span className="font-medium">{listing.energy_source || '—'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Documents Section */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Unterlagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {doc.doc_type ? DOC_TYPE_LABELS[doc.doc_type] || doc.name : doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{doc.name}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Map — GANZ UNTEN */}
          <ExposeLocationMap 
            address={fullAddress}
            city={listing.city}
            postalCode={listing.postal_code}
            showExactLocation={true}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          <div className="sticky top-24">
            {/* Kennzahlen Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-3xl font-bold text-primary">
                  {formatCurrency(listing.asking_price)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Kaufpreis</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bruttorendite</span>
                    <span className="font-bold text-primary">{grossYield.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mieteinnahmen</span>
                    <span className="font-medium">{formatCurrency(monthlyRent)}/Mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wohnfläche</span>
                    <span className="font-medium">{listing.total_area_sqm?.toLocaleString('de-DE')} m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Baujahr</span>
                    <span className="font-medium">{listing.year_built || '—'}</span>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button className="w-full gap-2">
                    <Handshake className="h-4 w-4" />
                    Deal starten
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Anfrage senden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KatalogDetailPage;

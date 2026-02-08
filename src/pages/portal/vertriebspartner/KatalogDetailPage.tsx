/**
 * KatalogDetailPage — Partner-Exposé mit Bildern und Unterlagen
 * Route: /portal/vertriebspartner/katalog/:publicId
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Download, FileText, MapPin, Calendar, 
  Building2, Maximize2, Loader2, Handshake, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestmentEngine, defaultInput, CalculationInput } from '@/hooks/useInvestmentEngine';
import { 
  MasterGraph, 
  Haushaltsrechnung, 
  InvestmentSliderPanel, 
  DetailTable40Jahre 
} from '@/components/investment';

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

const KatalogDetailPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();
  
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Helper to validate UUID format
  const isValidUUID = (str: string) => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Fetch listing with property data
  const { data: listing, isLoading: isLoadingListing } = useQuery({
    queryKey: ['partner-listing-detail', publicId],
    queryFn: async () => {
      if (!publicId) return null;

      // Build query - only check id if it's a valid UUID format
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
            property_type,
            address,
            city,
            postal_code,
            total_area_sqm,
            year_built,
            annual_income
          )
        `);

      // If it's a valid UUID, check both id and public_id
      // Otherwise, only check public_id (to avoid PostgreSQL cast error)
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
        property_type: props?.property_type || 'multi_family',
        address: props?.address || '',
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.year_built || 0,
        monthly_rent: Math.round((props?.annual_income || 0) / 12),
      };
    },
    enabled: !!publicId,
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

      // Generate signed URLs
      const imagePromises = (links || []).map(async (link: any) => {
        const doc = link.documents;
        const { data: urlData } = await supabase.storage
          .from('tenant-documents')
          .createSignedUrl(doc.file_path, 3600);

        return {
          id: doc.id,
          name: doc.name,
          url: urlData?.signedUrl || '',
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

  // Initialize params with listing data
  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
      }));
    }
  }, [listing]);

  // Calculate when params change
  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const handleDownload = async (doc: DocumentItem) => {
    const { data } = await supabase.storage
      .from('tenant-documents')
      .createSignedUrl(doc.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);

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

  const propertyTypeLabel = {
    'multi_family': 'Mehrfamilienhaus',
    'single_family': 'Einfamilienhaus',
    'apartment': 'Eigentumswohnung',
    'commercial': 'Gewerbe',
  }[listing.property_type] || 'Immobilie';

  const coverImage = images.find(img => img.is_cover) || images[0];
  const otherImages = images.filter(img => img.id !== coverImage?.id);

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
        {/* Left Column - Property Info & Calculations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-4">
              {images.length > 0 ? (
                <div className="space-y-3">
                  {/* Hero Image */}
                  {coverImage && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={coverImage.url} 
                        alt={coverImage.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Thumbnail Row */}
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

          {/* Property Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
                  <CardTitle className="text-xl">{listing.title}</CardTitle>
                  <p className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    {listing.postal_code} {listing.city}, {listing.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(listing.asking_price)}
                  </p>
                  {/* Provision nur in Katalog-Liste sichtbar, nicht im Exposé */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built || '–'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mieteinnahmen</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bruttorendite</p>
                  <p className="font-semibold text-primary">
                    {listing.asking_price > 0 
                      ? ((params.monthlyRent * 12 / listing.asking_price) * 100).toFixed(1) + '%'
                      : '–'}
                  </p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className="text-muted-foreground text-sm">{listing.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Investment Graphs */}
          {isCalculating ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : calcResult ? (
            <>
              <MasterGraph 
                projection={calcResult.projection} 
                title="Wertentwicklung (40 Jahre)"
                variant="full"
              />
              <Haushaltsrechnung 
                result={calcResult} 
                variant="detailed"
                showMonthly={true}
              />
              <DetailTable40Jahre 
                projection={calcResult.projection}
                defaultOpen={false}
              />
            </>
          ) : null}
        </div>

        {/* Right Column - Controls */}
        <div className="space-y-6">
          <div className="sticky top-24">
            {/* Investment Slider Panel */}
            <InvestmentSliderPanel
              value={params}
              onChange={setParams}
              layout="vertical"
              showAdvanced={true}
              purchasePrice={listing.asking_price}
            />

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button className="w-full gap-2">
                <Handshake className="h-4 w-4" />
                Deal starten
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Anfrage senden
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KatalogDetailPage;

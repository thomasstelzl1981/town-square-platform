/**
 * ExposeDetail - Professionelles Verkaufsexposé im Scout24-Stil
 * 
 * SSOT-Prinzip:
 * - Alle Objektdaten werden READ-ONLY aus MOD-04 (properties, units) geladen
 * - Nur Verkaufsdaten (Titel, Beschreibung, Preis) sind editierbar (listings)
 * - Bilder kommen aus DMS (document_links)
 * 
 * Features:
 * - Bildergalerie mit DMS-Integration
 * - Objektdaten aus MOD-04 (read-only)
 * - AfA-Daten und Mietrendite
 * - KI-generierte Beschreibung
 * - Freigabe-Workflow mit Provision
 * - Kaufy-Marktplatz-Aktivierung
 * - View Tracking für Reporting
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  FileCheck, 
  Globe, 
  Users, 
  Lock,
  Building2,
  Euro,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Ruler,
  Calendar,
  Zap,
  TrendingUp,
  Percent,
  Home,
  Loader2,
  PiggyBank
} from 'lucide-react';
import { PartnerReleaseDialog, ExposeImageGallery, ExposeLocationMap } from '@/components/verkauf';
import { useViewTracking } from '@/hooks/useViewTracking';


// Types
interface UnitData {
  id: string;
  unit_number: string | null;
  area_sqm: number | null;
  current_monthly_rent: number | null;
  property_id: string;
}

interface PropertyData {
  id: string;
  code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  total_area_sqm: number | null;
  year_built: number | null;
  renovation_year: number | null;
  energy_source: string | null;
  heating_type: string | null;
  market_value: number | null;
  purchase_price: number | null;
  tenant_id: string;
}

interface PropertyAccountingData {
  afa_rate_percent: number | null;
  afa_method: string | null;
  book_value_eur: number | null;
  land_share_percent: number | null;
  building_share_percent: number | null;
}

interface ListingData {
  id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string;
  title: string;
  description: string | null;
  asking_price: number | null;
  commission_rate: number | null;
  status: string;
  partner_visibility: string | null;
  sales_mandate_consent_id: string | null;
}

interface PublicationData {
  channel: string;
  status: string;
}

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

const ExposeDetail = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asking_price: '',
    commission_rate: [7]
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [partnerReleaseOpen, setPartnerReleaseOpen] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Fetch unit data
  const { data: unit, isLoading: unitLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, area_sqm, current_monthly_rent, property_id')
        .eq('id', unitId!)
        .single();
      if (error) throw error;
      return data as UnitData;
    },
    enabled: !!unitId
  });

  // Fetch property data
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', unit?.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id, code, address, city, postal_code, property_type, 
          total_area_sqm, year_built, renovation_year, energy_source, 
          heating_type, market_value, purchase_price, tenant_id
        `)
        .eq('id', unit!.property_id)
        .single();
      if (error) throw error;
      return data as unknown as PropertyData;
    },
    enabled: !!unit?.property_id
  });

  // Fetch property accounting (AfA)
  const { data: accounting } = useQuery({
    queryKey: ['property-accounting', unit?.property_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_accounting')
        .select('afa_rate_percent, afa_method, book_value_eur, land_share_percent, building_share_percent')
        .eq('property_id', unit!.property_id)
        .maybeSingle();
      return data as unknown as PropertyAccountingData | null;
    },
    enabled: !!unit?.property_id
  });

  // Fetch or create listing
  const { data: listing, isLoading: listingLoading, refetch: refetchListing } = useQuery({
    queryKey: ['listing-for-unit', unitId],
    queryFn: async () => {
      if (!unit || !property) return null;

      const { data: existing } = await supabase
        .from('listings')
        .select('*')
        .eq('unit_id', unitId!)
        .in('status', ['draft', 'active', 'reserved'])
        .maybeSingle();

      if (existing) return existing as unknown as ListingData;

      const { data: propListing } = await supabase
        .from('listings')
        .select('*')
        .eq('property_id', property.id)
        .is('unit_id', null)
        .in('status', ['draft', 'active', 'reserved'])
        .maybeSingle();

      if (propListing) return propListing as unknown as ListingData;

      const { data: newListing, error } = await supabase
        .from('listings')
        .insert({
          property_id: property.id,
          unit_id: unitId,
          tenant_id: property.tenant_id,
          title: `${property.address || 'Immobilie'}, ${property.city || ''} ${unit.unit_number ? `- ${unit.unit_number}` : ''}`.trim(),
          status: 'draft',
          commission_rate: 7
        })
        .select()
        .single();

      if (error) throw error;
      return newListing as unknown as ListingData;
    },
    enabled: !!unit && !!property
  });

  // Fetch publications
  const { data: publications = [] } = useQuery({
    queryKey: ['listing-publications', listing?.id],
    queryFn: async () => {
      if (!listing?.id) return [];
      const { data } = await supabase
        .from('listing_publications')
        .select('channel, status')
        .eq('listing_id', listing.id);
      return (data || []) as PublicationData[];
    },
    enabled: !!listing?.id
  });

  // Initialize form
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        asking_price: listing.asking_price?.toString() || '',
        commission_rate: [listing.commission_rate || 7]
      });
    }
  }, [listing]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          asking_price: parseFloat(formData.asking_price) || null,
          commission_rate: formData.commission_rate[0]
        })
        .eq('id', listing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-for-unit', unitId] });
      setHasChanges(false);
      toast.success('Änderungen gespeichert');
    },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

  // Note: Listing activation now happens in MOD-04 VerkaufsauftragTab
  // This mutation is kept for backward compatibility but should not be used directly


  // Partner release mutation
  const partnerReleaseMutation = useMutation({
    mutationFn: async (commissionRate: number) => {
      const { error: listingError } = await supabase
        .from('listings')
        .update({ 
          partner_visibility: 'network',
          commission_rate: commissionRate
        })
        .eq('id', listing!.id);
      if (listingError) throw listingError;

      const { error: pubError } = await supabase
        .from('listing_publications')
        .upsert({
          listing_id: listing!.id,
          tenant_id: listing!.tenant_id,
          channel: 'partner_network',
          status: 'active',
          published_at: new Date().toISOString()
        }, { onConflict: 'listing_id,channel' });
      if (pubError) throw pubError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-publications', listing?.id] });
      refetchListing();
      setPartnerReleaseOpen(false);
      toast.success('Partner-Freigabe aktiviert');
    },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

  // Kaufy toggle mutation
  const kaufyToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        const { error } = await supabase
          .from('listing_publications')
          .upsert({
            listing_id: listing!.id,
            tenant_id: listing!.tenant_id,
            channel: 'kaufy',
            status: 'active',
            published_at: new Date().toISOString()
          }, { onConflict: 'listing_id,channel' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('listing_publications')
          .update({ status: 'paused' as const, removed_at: new Date().toISOString() })
          .eq('listing_id', listing!.id)
          .eq('channel', 'kaufy');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-publications', listing?.id] });
      toast.success('Kaufy-Veröffentlichung aktualisiert');
    }
  });

  // Generate AI description
  const generateDescription = async () => {
    if (!property || !unit) return;
    
    setIsGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-expose-description', {
        body: {
          property_id: property.id,
          style: 'verkauf',
          include_investment: true
        }
      });

      if (error) throw error;
      
      if (data?.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        setHasChanges(true);
        toast.success('Beschreibung generiert – bitte prüfen und anpassen');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('Beschreibung konnte nicht generiert werden');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const isLoading = unitLoading || propertyLoading || listingLoading;
  const isActive = listing?.status === 'active';
  const hasPartnerRelease = publications.some(p => p.channel === 'partner_network' && p.status === 'active');
  const isKaufyActive = publications.some(p => p.channel === 'kaufy' && p.status === 'active');
  
  // Validation
  const canActivate = formData.title && formData.asking_price && formData.commission_rate[0] >= 3;
  const canEnableKaufy = hasPartnerRelease;

  // Calculate metrics
  const annualRent = (unit?.current_monthly_rent || 0) * 12;
  const askingPrice = parseFloat(formData.asking_price) || 0;
  const grossYield = askingPrice > 0 ? (annualRent / askingPrice) * 100 : 0;
  const pricePerSqm = unit?.area_sqm && askingPrice > 0 ? askingPrice / unit.area_sqm : 0;

  // View Tracking - tracks when listing is viewed
  useViewTracking({
    listingId: listing?.id || null,
    tenantId: listing?.tenant_id || null,
    source: 'portal',
    enabled: !!listing?.id && listing?.status !== 'draft' // Only track active listings
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Einheit nicht gefunden</p>
        <Button variant="outline" onClick={() => navigate('/portal/verkauf/objekte')} className="mt-4">
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/verkauf/objekte')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Verkaufsexposé</h1>
            <p className="text-muted-foreground">
              {property.code && `[${property.code}] `}{property.address}, {property.postal_code} {property.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-sm">
            {listing?.status === 'draft' ? 'Entwurf' : 
             listing?.status === 'active' ? 'Aktiv' :
             listing?.status === 'reserved' ? 'Reserviert' : listing?.status}
          </Badge>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Image Gallery - DMS Integration */}
          <ExposeImageGallery propertyId={property.id} unitId={unitId} />

          {/* Location Map */}
          <ExposeLocationMap 
            address={property.address || ''}
            city={property.city || ''}
            postalCode={property.postal_code || ''}
            showExactLocation={isActive} // Show exact location only for active listings
          />

          {/* Key Facts Bar - Scout24 Style */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(formData.asking_price) || property.market_value)}
                  </p>
                  <p className="text-xs text-muted-foreground">Kaufpreis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{unit.area_sqm?.toLocaleString('de-DE') || '—'} m²</p>
                  <p className="text-xs text-muted-foreground">Wohnfläche</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Zimmer</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Bruttorendite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exposé Content Tabs */}
          <Tabs defaultValue="verkauf" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verkauf">Verkaufsdaten</TabsTrigger>
              <TabsTrigger value="objekt">Objektdaten</TabsTrigger>
              <TabsTrigger value="rendite">Rendite & AfA</TabsTrigger>
              <TabsTrigger value="energie">Energie</TabsTrigger>
            </TabsList>

            {/* Tab: Verkaufsdaten */}
            <TabsContent value="verkauf" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verkaufsinformationen</CardTitle>
                  <CardDescription>Titel, Beschreibung und Preisangaben für das Inserat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Überschrift *</Label>
                    <Input
                      id="title"
                      placeholder="z.B. Kapitalanlage: Vermietetes MFH in Toplage mit 5,2% Rendite"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Objektbeschreibung</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1" 
                        onClick={generateDescription}
                        disabled={isGeneratingDescription}
                      >
                        {isGeneratingDescription ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Mit KI generieren
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Beschreiben Sie das Objekt für potenzielle Käufer. Heben Sie Vorteile wie Lage, Zustand, Rendite und Potenzial hervor..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={8}
                      className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tipp: Die KI-Beschreibung berücksichtigt automatisch Objektdaten, Lage und Renditepotenzial
                    </p>
                  </div>

                  <Separator />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Kaufpreis (€) *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="890000"
                          value={formData.asking_price}
                          onChange={(e) => handleChange('asking_price', e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {pricePerSqm > 0 && (
                        <p className="text-xs text-muted-foreground">
                          = {formatCurrency(pricePerSqm)}/m²
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Käufer-Provision: {formData.commission_rate[0].toFixed(1)}% netto</Label>
                      <Slider
                        value={formData.commission_rate}
                        onValueChange={(val) => handleChange('commission_rate', val)}
                        min={3}
                        max={15}
                        step={0.5}
                        className="py-3"
                      />
                      <p className="text-xs text-muted-foreground">
                        Brutto: {(formData.commission_rate[0] * 1.19).toFixed(2)}% inkl. MwSt.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Objektdaten */}
            <TabsContent value="objekt" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Objektdaten
                      </CardTitle>
                      <CardDescription>Stammdaten aus der Immobilienakte (nicht editierbar)</CardDescription>
                    </div>
                    <Link 
                      to={`/portal/immobilien/${property.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Bearbeiten
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Grunddaten</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Objektart</p>
                            <p className="font-medium">{property.property_type || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Wohnfläche</p>
                            <p className="font-medium">{unit.area_sqm ? `${unit.area_sqm} m²` : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Grundstück</p>
                            <p className="font-medium">—</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Baujahr & Zustand</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Baujahr</p>
                            <p className="font-medium">{property.year_built || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Sanierung</p>
                            <p className="font-medium">{property.renovation_year || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Etagen</p>
                            <p className="font-medium">—</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Adresse</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-muted-foreground">{property.postal_code} {property.city}</p>
                          </div>
                        </div>
                      </div>
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
                          <span className="font-bold">{formatCurrency(unit.current_monthly_rent)}</span>
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
            <TabsContent value="rendite" className="mt-4">
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ausweistyp</span>
                        <span className="font-medium">—</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Effizienzklasse</span>
                        <Badge variant="outline" className="font-bold">—</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Heizungsart</span>
                        <span className="font-medium">{property.heating_type || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Energieträger</span>
                        <span className="font-medium">{property.energy_source || '—'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Freigabe & Veröffentlichung */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card className={listing?.status === 'draft' ? 'border-primary/30 bg-primary/5' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                {listing?.status === 'draft' ? 'Exposé freigeben' : 'Veröffentlichung'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing?.status === 'draft' ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Verkaufsauftrag nicht erteilt. Bitte aktivieren Sie den Verkaufsauftrag im{' '}
                      <Link 
                        to={`/portal/immobilien/${property.id}?tab=verkaufsauftrag`}
                        className="text-primary hover:underline font-medium"
                      >
                        Immobilien-Dossier → Verkaufsauftrag
                      </Link>.
                    </AlertDescription>
                  </Alert>
                  
                  {/* Validation Checklist (informativ) */}
                  <div className="space-y-2 p-3 bg-muted rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Exposé-Status</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {formData.title ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className={formData.title ? '' : 'text-muted-foreground'}>Titel vorhanden</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.asking_price ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className={formData.asking_price ? '' : 'text-muted-foreground'}>Kaufpreis angegeben</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.description ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span className={formData.description ? '' : 'text-muted-foreground'}>Beschreibung vorhanden</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Partner Release */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Partner-Netzwerk</span>
                      </div>
                      {hasPartnerRelease ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                    </div>
                    
                    {!hasPartnerRelease ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Pflichtschritt: Aktivieren Sie die Partner-Freigabe für alle weiteren Kanäle.
                        </p>
                        <Button 
                          variant="default" 
                          className="w-full"
                          onClick={() => setPartnerReleaseOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Partner-Freigabe starten
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-primary">
                        ✓ Objekt ist im Objektkatalog für Vertriebspartner sichtbar
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Kaufy Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">Kaufy-Marktplatz</span>
                      </div>
                      <Switch
                        checked={isKaufyActive}
                        onCheckedChange={(checked) => kaufyToggleMutation.mutate(checked)}
                        disabled={!canEnableKaufy || kaufyToggleMutation.isPending}
                      />
                    </div>
                    
                    {!canEnableKaufy ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Erst nach Partner-Freigabe verfügbar
                      </p>
                    ) : isKaufyActive ? (
                      <p className="text-xs text-primary">
                        ✓ Objekt ist auf kaufy.de öffentlich sichtbar
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Auf dem öffentlichen Marktplatz veröffentlichen
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Scout24 Placeholder */}
                  <div className="space-y-2 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">ImmobilienScout24</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Demnächst</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kostenpflichtige Buchung (Phase 2)
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fee Summary */}
          {hasPartnerRelease && (
            <Card className="bg-secondary/50 border-secondary">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-secondary-foreground flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Ihre Kosten bei Erfolg</p>
                    <p className="text-muted-foreground mt-1">
                      100 € (Notarauftrag) + 1.900 € (BNL) = <strong>2.000 €</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kennzahlen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kaufpreis</span>
                <span className="font-medium">{formatCurrency(parseFloat(formData.asking_price) || property.market_value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preis/m²</span>
                <span className="font-medium">{formatCurrency(pricePerSqm)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jahresmiete</span>
                <span className="font-medium">{formatCurrency(annualRent)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bruttorendite</span>
                <span className="font-bold text-primary">{grossYield.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Käufer-Provision</span>
                <span className="font-medium">{formData.commission_rate[0].toFixed(1)}% netto</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}

      <PartnerReleaseDialog
        open={partnerReleaseOpen}
        onOpenChange={setPartnerReleaseOpen}
        listingTitle={formData.title || property.address || 'Objekt'}
        askingPrice={parseFloat(formData.asking_price) || 0}
        onConfirm={async (rate) => partnerReleaseMutation.mutateAsync(rate)}
        isLoading={partnerReleaseMutation.isPending}
      />
    </div>
  );
};

export default ExposeDetail;

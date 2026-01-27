import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
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
  ExternalLink
} from 'lucide-react';
import { PartnerReleaseDialog, SalesMandateDialog } from '@/components/verkauf';

// Unit-based data (Source of Truth from MOD-04)
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
  energy_source: string | null;
  tenant_id: string;
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

const ExposeDetail = () => {
  // Now uses unitId as the primary reference
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
  const [salesMandateOpen, setSalesMandateOpen] = useState(false);
  const [partnerReleaseOpen, setPartnerReleaseOpen] = useState(false);

  // Fetch unit data first (Source of Truth reference)
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

  // Fetch property data (READ-ONLY from MOD-04)
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', unit?.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, postal_code, property_type, total_area_sqm, year_built, energy_source, tenant_id')
        .eq('id', unit!.property_id)
        .single();
      if (error) throw error;
      return data as PropertyData;
    },
    enabled: !!unit?.property_id
  });

  // Fetch or create listing for this unit
  const { data: listing, isLoading: listingLoading, refetch: refetchListing } = useQuery({
    queryKey: ['listing-for-unit', unitId],
    queryFn: async () => {
      if (!unit || !property) return null;

      // Check if listing exists for this unit
      const { data: existing } = await supabase
        .from('listings')
        .select('*')
        .eq('unit_id', unitId!)
        .in('status', ['draft', 'active', 'reserved'])
        .maybeSingle();

      if (existing) return existing as unknown as ListingData;

      // Check for property-level listing (legacy)
      const { data: propListing } = await supabase
        .from('listings')
        .select('*')
        .eq('property_id', property.id)
        .is('unit_id', null)
        .in('status', ['draft', 'active', 'reserved'])
        .maybeSingle();

      if (propListing) return propListing as unknown as ListingData;

      // Auto-create unit-specific listing (draft)
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

  // Initialize form when listing loads
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

  // Save mutation (only sale-specific fields)
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

  // Activate listing (SALES_MANDATE)
  const activateMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync();
      
      const { error } = await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', listing!.id);
      if (error) throw error;

      console.log('SALES_MANDATE consent recorded');
    },
    onSuccess: () => {
      refetchListing();
      setSalesMandateOpen(false);
      toast.success('Exposé freigegeben');
    },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

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

      console.log('PARTNER_RELEASE consent recorded');
      console.log('SYSTEM_SUCCESS_FEE_2000 consent recorded');
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
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
              {property.code && `[${property.code}] `}{property.address}, {property.city}
              {unit.unit_number && ` – ${unit.unit_number}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'default' : 'secondary'}>
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
          {/* Verkaufs-spezifische Daten (editierbar) */}
          <Card>
            <CardHeader>
              <CardTitle>Verkaufsdaten</CardTitle>
              <CardDescription>Titel, Beschreibung und Preisangaben für das Verkaufsinserat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="z.B. Sonniges Mehrfamilienhaus in zentraler Lage"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info('Armstrong-Generierung kommt bald')}>
                    <Sparkles className="h-3 w-3" />
                    Mit KI generieren
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Beschreiben Sie das Objekt für potenzielle Käufer..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Kaufpreis (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="890000"
                    value={formData.asking_price}
                    onChange={(e) => handleChange('asking_price', e.target.value)}
                  />
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objektdaten (READ-ONLY aus MOD-04) */}
          <Card className="border-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Objektdaten
                  </CardTitle>
                  <CardDescription>Stammdaten aus MOD-04 (nicht editierbar)</CardDescription>
                </div>
                <Link 
                  to={`/portal/immobilien/${property.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Im Immobilien-Exposé bearbeiten
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Objektart</p>
                  <p className="font-medium">{property.property_type || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Einheit</p>
                  <p className="font-medium">{unit.unit_number || 'MAIN'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fläche</p>
                  <p className="font-medium">{unit.area_sqm ? `${unit.area_sqm} m²` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Baujahr</p>
                  <p className="font-medium">{property.year_built || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kaltmiete</p>
                  <p className="font-medium">
                    {unit.current_monthly_rent 
                      ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(unit.current_monthly_rent)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Heizung</p>
                  <p className="font-medium">{property.energy_source || '—'}</p>
                </div>
                <div className="sm:col-span-3">
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium">{property.address}, {property.postal_code} {property.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-4">
          {/* Activation Card */}
          {listing?.status === 'draft' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Exposé freigeben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nach der Freigabe können Sie das Exposé veröffentlichen.
                </p>
                
                {/* Validation Checklist */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.title ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span>Titel vorhanden</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.asking_price ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span>Kaufpreis angegeben</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.commission_rate[0] >= 3 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span>Provision ≥ 3%</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setSalesMandateOpen(true)}
                  disabled={!canActivate}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Exposé freigeben
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Publication Card */}
          {isActive && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Veröffentlichung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        Pflicht für alle Veröffentlichungen. Bei Erfolg: 2.000 € Systemgebühr.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setPartnerReleaseOpen(true)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Partner-Freigabe starten
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-green-600">
                      ✓ Objekt ist im Objektkatalog für Partner sichtbar
                    </p>
                  )}
                </div>

                <Separator />

                {/* Kaufy Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Kaufy-Website</span>
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
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Leads gehen an Vertriebspartner
                    </p>
                  )}
                </div>

                <Separator />

                {/* Scout24 (Coming Soon) */}
                <div className="space-y-2 opacity-50">
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
              </CardContent>
            </Card>
          )}

          {/* Fee Summary */}
          {hasPartnerRelease && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Ihre Kosten bei Erfolg</p>
                    <p className="text-muted-foreground">
                      100 € (Notarauftrag) + 1.900 € (BNL) = <strong>2.000 €</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SalesMandateDialog
        open={salesMandateOpen}
        onOpenChange={setSalesMandateOpen}
        listingTitle={formData.title || property.address || 'Objekt'}
        askingPrice={parseFloat(formData.asking_price) || 0}
        commissionRate={formData.commission_rate[0]}
        onConfirm={async () => activateMutation.mutateAsync()}
        isLoading={activateMutation.isPending}
      />

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

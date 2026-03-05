/**
 * ExposeDetail - Orchestrator (R-2 Refactored)
 * 
 * SSOT-Prinzip:
 * - Alle Objektdaten werden READ-ONLY aus MOD-04 (properties, units) geladen
 * - Nur Verkaufsdaten (Titel, Beschreibung, Preis) sind editierbar (listings)
 * - Bilder kommen aus DMS (document_links)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Zap } from 'lucide-react';
import { PartnerReleaseDialog, ExposeImageGallery, ExposeLocationMap } from '@/components/verkauf';
import { useViewTracking } from '@/hooks/useViewTracking';
import { ExposeKeyFacts } from '@/components/verkauf/ExposeKeyFacts';
import { ExposeVerkaufTab } from '@/components/verkauf/ExposeVerkaufTab';
import { ExposeObjektdatenTab } from '@/components/verkauf/ExposeObjektdatenTab';
import { ExposeRenditeTab } from '@/components/verkauf/ExposeRenditeTab';
import { ExposePublishSidebar } from '@/components/verkauf/ExposePublishSidebar';
import type { UnitData, PropertyData, PropertyAccountingData, ListingData, PublicationData, ExposeFormData } from '@/components/verkauf/exposeTypes';

const ExposeDetail = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ExposeFormData>({
    title: '', description: '', asking_price: '', commission_rate: [7]
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [partnerReleaseOpen, setPartnerReleaseOpen] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // === Data Queries ===
  const { data: unit, isLoading: unitLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const { data, error } = await supabase.from('units')
        .select('id, unit_number, area_sqm, current_monthly_rent, property_id')
        .eq('id', unitId!).single();
      if (error) throw error;
      return data as UnitData;
    },
    enabled: !!unitId
  });

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', unit?.property_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties')
        .select('id, code, address, city, postal_code, property_type, total_area_sqm, year_built, renovation_year, energy_source, heating_type, market_value, purchase_price, tenant_id')
        .eq('id', unit!.property_id).single();
      if (error) throw error;
      return data as unknown as PropertyData;
    },
    enabled: !!unit?.property_id
  });

  const { data: accounting } = useQuery({
    queryKey: ['property-accounting', unit?.property_id],
    queryFn: async () => {
      const { data } = await supabase.from('property_accounting')
        .select('afa_rate_percent, afa_method, book_value_eur, land_share_percent, building_share_percent')
        .eq('property_id', unit!.property_id).maybeSingle();
      return data as unknown as PropertyAccountingData | null;
    },
    enabled: !!unit?.property_id
  });

  const { data: listing, isLoading: listingLoading, refetch: refetchListing } = useQuery({
    queryKey: ['listing-for-unit', unitId],
    queryFn: async () => {
      if (!unit || !property) return null;
      const { data: existing } = await supabase.from('listings').select('*')
        .eq('unit_id', unitId!).in('status', ['draft', 'active', 'reserved']).maybeSingle();
      if (existing) return existing as unknown as ListingData;

      const { data: propListing } = await supabase.from('listings').select('*')
        .eq('property_id', property.id).is('unit_id', null)
        .in('status', ['draft', 'active', 'reserved']).maybeSingle();
      if (propListing) return propListing as unknown as ListingData;

      const { data: newListing, error } = await supabase.from('listings').insert({
        property_id: property.id, unit_id: unitId, tenant_id: property.tenant_id,
        title: `${property.address || 'Immobilie'}, ${property.city || ''} ${unit.unit_number ? `- ${unit.unit_number}` : ''}`.trim(),
        status: 'draft', commission_rate: 7
      }).select().single();
      if (error) throw error;
      return newListing as unknown as ListingData;
    },
    enabled: !!unit && !!property
  });

  const { data: publications = [] } = useQuery({
    queryKey: ['listing-publications', listing?.id],
    queryFn: async () => {
      if (!listing?.id) return [];
      const { data } = await supabase.from('listing_publications').select('channel, status').eq('listing_id', listing.id);
      return (data || []) as PublicationData[];
    },
    enabled: !!listing?.id
  });

  // === Effects ===
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '', description: listing.description || '',
        asking_price: listing.asking_price?.toString() || '', commission_rate: [listing.commission_rate || 7]
      });
    }
  }, [listing]);

  // === Mutations ===
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('listings').update({
        title: formData.title, description: formData.description,
        asking_price: parseFloat(formData.asking_price) || null, commission_rate: formData.commission_rate[0]
      }).eq('id', listing!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['listing-for-unit', unitId] }); setHasChanges(false); toast.success('Änderungen gespeichert'); },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

  const partnerReleaseMutation = useMutation({
    mutationFn: async (commissionRate: number) => {
      const { error: listingError } = await supabase.from('listings').update({ partner_visibility: 'network', commission_rate: commissionRate }).eq('id', listing!.id);
      if (listingError) throw listingError;
      const { error: pubError } = await supabase.from('listing_publications').upsert({
        listing_id: listing!.id, tenant_id: listing!.tenant_id, channel: 'partner_network', status: 'active', published_at: new Date().toISOString()
      }, { onConflict: 'listing_id,channel' });
      if (pubError) throw pubError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['listing-publications', listing?.id] }); refetchListing(); setPartnerReleaseOpen(false); toast.success('Partner-Freigabe aktiviert'); },
    onError: (err: Error) => toast.error(`Fehler: ${err.message}`)
  });

  const kaufyToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        const { error } = await supabase.from('listing_publications').upsert({
          listing_id: listing!.id, tenant_id: listing!.tenant_id, channel: 'kaufy', status: 'active', published_at: new Date().toISOString()
        }, { onConflict: 'listing_id,channel' });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('listing_publications').update({ status: 'paused' as const, removed_at: new Date().toISOString() }).eq('listing_id', listing!.id).eq('channel', 'kaufy');
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['listing-publications', listing?.id] }); toast.success('Kaufy-Veröffentlichung aktualisiert'); }
  });

  // === Handlers ===
  const generateDescription = async () => {
    if (!property || !unit) return;
    setIsGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-expose-description', {
        body: { property_id: property.id, style: 'verkauf', include_investment: true }
      });
      if (error) throw error;
      if (data?.description) { setFormData(prev => ({ ...prev, description: data.description })); setHasChanges(true); toast.success('Beschreibung generiert – bitte prüfen und anpassen'); }
    } catch (err) { console.error('AI generation error:', err); toast.error('Beschreibung konnte nicht generiert werden'); }
    finally { setIsGeneratingDescription(false); }
  };

  const handleChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // === Derived State ===
  const isLoading = unitLoading || propertyLoading || listingLoading;
  const isActive = listing?.status === 'active';
  const hasPartnerRelease = publications.some(p => p.channel === 'partner_network' && p.status === 'active');
  const isKaufyActive = publications.some(p => p.channel === 'kaufy' && p.status === 'active');
  const annualRent = (unit?.current_monthly_rent || 0) * 12;
  const askingPrice = parseFloat(formData.asking_price) || 0;
  const grossYield = askingPrice > 0 ? (annualRent / askingPrice) * 100 : 0;
  const pricePerSqm = unit?.area_sqm && askingPrice > 0 ? askingPrice / unit.area_sqm : 0;

  useViewTracking({ listingId: listing?.id || null, tenantId: listing?.tenant_id || null, source: 'portal', enabled: !!listing?.id && listing?.status !== 'draft' });

  // === Render ===
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4"><Skeleton className="h-80" /><Skeleton className="h-48" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Einheit nicht gefunden</p>
        <Button variant="outline" onClick={() => navigate('/portal/verkauf/objekte')} className="mt-4">Zurück zur Übersicht</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/verkauf/objekte')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Verkaufsexposé</h1>
            <p className="text-muted-foreground">{property.code && `[${property.code}] `}{property.address}, {property.postal_code} {property.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-sm">
            {listing?.status === 'draft' ? 'Entwurf' : listing?.status === 'active' ? 'Aktiv' : listing?.status === 'reserved' ? 'Reserviert' : listing?.status}
          </Badge>
          <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ExposeImageGallery propertyId={property.id} unitId={unitId} />
          <ExposeKeyFacts askingPrice={askingPrice} marketValue={property.market_value} areaSqm={unit.area_sqm} grossYield={grossYield} />

          <Tabs defaultValue="verkauf" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verkauf">Verkaufsdaten</TabsTrigger>
              <TabsTrigger value="objekt">Objektdaten</TabsTrigger>
              <TabsTrigger value="rendite">Rendite & AfA</TabsTrigger>
              <TabsTrigger value="energie">Energie</TabsTrigger>
            </TabsList>
            <TabsContent value="verkauf" className="mt-4">
              <ExposeVerkaufTab formData={formData} onChange={handleChange} onGenerateDescription={generateDescription} isGeneratingDescription={isGeneratingDescription} pricePerSqm={pricePerSqm} />
            </TabsContent>
            <TabsContent value="objekt" className="mt-4">
              <ExposeObjektdatenTab property={property} unit={unit} />
            </TabsContent>
            <TabsContent value="rendite" className="mt-4">
              <ExposeRenditeTab monthlyRent={unit.current_monthly_rent} annualRent={annualRent} grossYield={grossYield} accounting={accounting ?? null} />
            </TabsContent>
            <TabsContent value="energie" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Energieausweis</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Ausweistyp</span><span className="font-medium">—</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Effizienzklasse</span><Badge variant="outline" className="font-bold">—</Badge></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Heizungsart</span><span className="font-medium">{property.heating_type || '—'}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Energieträger</span><span className="font-medium">{property.energy_source || '—'}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <ExposeLocationMap address={property.address || ''} city={property.city || ''} postalCode={property.postal_code || ''} showExactLocation={isActive} />
        </div>

        <ExposePublishSidebar
          listing={listing ?? null} property={property} unit={unit} formData={formData}
          publications={publications} hasPartnerRelease={hasPartnerRelease} isKaufyActive={isKaufyActive}
          canEnableKaufy={hasPartnerRelease} onPartnerReleaseOpen={() => setPartnerReleaseOpen(true)}
          onKaufyToggle={(checked) => kaufyToggleMutation.mutate(checked)} kaufyTogglePending={kaufyToggleMutation.isPending}
          grossYield={grossYield} annualRent={annualRent} pricePerSqm={pricePerSqm}
        />
      </div>

      <PartnerReleaseDialog
        open={partnerReleaseOpen} onOpenChange={setPartnerReleaseOpen}
        listingTitle={formData.title || property.address || 'Objekt'}
        askingPrice={parseFloat(formData.asking_price) || 0}
        onConfirm={async (rate) => partnerReleaseMutation.mutateAsync(rate)}
        isLoading={partnerReleaseMutation.isPending}
      />
    </div>
  );
};

export default ExposeDetail;

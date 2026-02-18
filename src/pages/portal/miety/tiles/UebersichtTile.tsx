import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MietyHomeDossierInline from '../MietyHomeDossierInline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MietyCreateHomeForm } from '../components/MietyCreateHomeForm';
import { useHomesQuery } from '../shared/useHomesQuery';

import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DEMO_WIDGET } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { cn } from '@/lib/utils';
import {
  Home, Plus, Building2, ArrowRight, Camera, Globe, ImageOff, Navigation, Trash2, Loader2,
} from 'lucide-react';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { toast } from 'sonner';
import { MietyServiceCards } from '../components/MietyServiceCards';

export default function UebersichtTile() {
  const { activeTenantId, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-ZUHAUSE');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [editingHome, setEditingHome] = useState<any>(null);
  
  const autoCreatedRef = useRef(false);

  const { data: homes = [], isLoading } = useHomesQuery();

  // Fetch Google Maps API key from edge function
  const { data: mapsApiKey } = useQuery({
    queryKey: ['google-maps-api-key'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-google-maps-key');
      if (error) throw error;
      return data?.key as string || '';
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile-for-miety-auto', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, street, house_number, postal_code, city')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [deletingHomeId, setDeletingHomeId] = useState<string | null>(null);
  const deleteHomeMutation = useMutation({
    mutationFn: async (homeId: string) => {
      setDeletingHomeId(homeId);
      // Delete related contracts first
      await supabase.from('miety_contracts').delete().eq('home_id', homeId);
      await supabase.from('miety_meter_readings').delete().eq('home_id', homeId);
      await supabase.from('miety_loans').delete().eq('home_id', homeId);
      const { error } = await supabase.from('miety_homes').delete().eq('id', homeId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeletingHomeId(null);
      if (openCardId === deletingHomeId) setOpenCardId(null);
      toast.success('Zuhause gelöscht');
      queryClient.invalidateQueries({ queryKey: ['miety-homes'] });
    },
    onError: (err: Error) => {
      setDeletingHomeId(null);
      toast.error(`Fehler: ${err.message}`);
    },
  });

  const autoCreateMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !user?.id || !profile?.city) throw new Error('skip');
      const { error } = await supabase.from('miety_homes').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        name: 'Mein Zuhause',
        address: profile.street || null,
        address_house_no: profile.house_number || null,
        zip: profile.postal_code || null,
        city: profile.city,
        ownership_type: 'miete',
        property_type: 'wohnung',
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['miety-homes'] }); },
  });

  useEffect(() => {
    if (!isLoading && homes.length === 0 && profile?.city && !autoCreatedRef.current && !autoCreateMutation.isPending) {
      autoCreatedRef.current = true;
      autoCreateMutation.mutate();
    }
  }, [isLoading, homes.length, profile?.city]);

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-overview', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts')
        .select('category, provider_name, monthly_cost')
        .eq('tenant_id', activeTenantId)
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (showCreateForm) return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  if (editingHome) return (
    <div className="p-4">
      <MietyCreateHomeForm
        onCancel={() => setEditingHome(null)}
        homeId={editingHome.id}
        initialData={{
          name: editingHome.name || '', address: editingHome.address || '',
          houseNo: editingHome.address_house_no || '', zip: editingHome.zip || '',
          city: editingHome.city || '', ownershipType: editingHome.ownership_type || 'miete',
          propertyType: editingHome.property_type || 'wohnung',
          areaSqm: editingHome.area_sqm?.toString() || '', roomsCount: editingHome.rooms_count?.toString() || '',
          constructionYear: editingHome.construction_year?.toString() || '',
          marketValue: editingHome.market_value?.toString() || '',
          floorCount: editingHome.floor_count?.toString() || '',
          bathroomsCount: editingHome.bathrooms_count?.toString() || '',
          heatingType: editingHome.heating_type || '',
          hasGarage: editingHome.has_garage || false,
          hasGarden: editingHome.has_garden || false,
          hasBasement: editingHome.has_basement || false,
          lastRenovationYear: editingHome.last_renovation_year?.toString() || '',
          plotAreaSqm: editingHome.plot_area_sqm?.toString() || '',
        }}
      />
    </div>
  );

  const buildMapQuery = (home: any) =>
    encodeURIComponent([`${home.address || ''} ${home.address_house_no || ''}`.trim(), `${home.zip || ''} ${home.city || ''}`.trim()].filter(Boolean).join(', '));

  return (
    <PageShell>
      <ModulePageHeader
        title="Miety"
        description="Ihr Zuhause auf einen Blick"
        actions={homes.length > 0 ? (
          <Button variant="glass" size="icon-round" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        ) : undefined}
      />

      {/* Home tiles row 1 */}
      {homes.length === 0 ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ihr Zuhause einrichten</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {profile?.city ? 'Wird automatisch aus Ihren Stammdaten erstellt...' : 'Bitte hinterlegen Sie zuerst Ihre Adresse in den Stammdaten.'}
            </p>
            {!profile?.city && (
              <Button onClick={() => setShowCreateForm(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />Manuell anlegen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        homes.filter(h => demoEnabled || !isDemoId(h.id)).map((home) => {
          const mapQuery = buildMapQuery(home);
          const isDemo = isDemoId(home.id);
          return (
            <div key={home.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
                {/* Kachel 1: Adresse */}
                <Card className={cn("glass-card h-[240px] sm:aspect-square sm:h-auto flex flex-col relative group", isDemo && DEMO_WIDGET.CARD)}>
                  {!isDemo && (
                    <WidgetDeleteOverlay
                      title={home.name || 'Zuhause'}
                      onConfirmDelete={() => deleteHomeMutation.mutate(home.id)}
                      isDeleting={deletingHomeId === home.id}
                    />
                  )}
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
                        <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Mein Zuhause</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{profile?.first_name || ''} {profile?.last_name || ''}</p>
                        <p className="text-base text-muted-foreground">{[home.address, home.address_house_no].filter(Boolean).join(' ')}</p>
                        <p className="text-base text-muted-foreground">{[home.zip, home.city].filter(Boolean).join(' ')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <Badge variant="secondary" className="text-xs">{home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}</Badge>
                        {home.property_type && <Badge variant="outline" className="text-xs capitalize">{home.property_type}</Badge>}
                        {home.area_sqm && <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>}
                        {home.rooms_count && <Badge variant="outline" className="text-xs">{home.rooms_count} Zimmer</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => setEditingHome(home)}>Bearbeiten</Button>
                      <Button size="sm" onClick={() => setOpenCardId(prev => prev === home.id ? null : home.id)}>
                        <ArrowRight className="h-4 w-4 mr-1" />{openCardId === home.id ? 'Schließen' : 'Öffnen'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Kachel 2: Street View (interactive toggle) */}
                <Card className="glass-card overflow-hidden h-[240px] sm:aspect-square sm:h-auto">
                  <CardContent className="p-0 h-full relative">
                    {(home.city || home.address) && mapsApiKey ? (
                      <div
                        className="w-full h-full cursor-pointer group"
                        onClick={() => window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${decodeURIComponent(mapQuery)}`, '_blank')}
                      >
                        <img
                          src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${mapQuery}&source=outdoor&key=${mapsApiKey}`}
                          alt="Street View"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.nextElementSibling) target.nextElementSibling.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex-col items-center justify-center bg-muted/30 absolute inset-0">
                          <ImageOff className="h-12 w-12 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">Street View nicht verfügbar</p>
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <Navigation className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Street View öffnen</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                        <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">{!mapsApiKey ? 'API-Key wird geladen...' : 'Adresse fehlt'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Kachel 3: Satellite */}
                <Card className="glass-card h-[240px] sm:aspect-square sm:h-auto overflow-hidden">
                  <CardContent className="p-0 h-full">
                    {(home.city || home.address) && mapsApiKey ? (
                      <iframe title="Satellitenansicht" className="w-full h-full" style={{ border: 0 }} loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${mapQuery}&maptype=satellite&zoom=18`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                        <Globe className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">{!mapsApiKey ? 'API-Key wird geladen...' : 'Satellitenansicht'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Service Cards (MyHammer + Betreut.de) */}
              <MietyServiceCards plz={home.zip} />

              {/* Row 3: Camera placeholder */}
              <Card className="glass-card border-dashed">
                <CardContent className="p-6 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Kameras einrichten</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verbinden Sie eine kompatible IP-Kamera unter Smart Home, um hier Live-Snapshots zu sehen.
                  </p>
                </CardContent>
              </Card>

              {/* Inline Dossier */}
              {openCardId === home.id && (
                <MietyHomeDossierInline homeId={home.id} />
              )}
            </div>
          );
        })
      )}
    </PageShell>
  );
}

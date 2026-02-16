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
import { demoCameras } from '../shared/demoCameras';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import {
  Home, Plus, Building2, ArrowRight, Camera, Globe, Eye, Video, ImageOff,
} from 'lucide-react';

export default function UebersichtTile() {
  const { activeTenantId, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    encodeURIComponent([home.address, home.address_house_no, home.zip, home.city].filter(Boolean).join(' '));

  return (
    <PageShell>
      <ModulePageHeader
        title="Miety"
        description="Ihr Zuhause auf einen Blick"
        actions={homes.length > 0 ? (
          <Button onClick={() => setShowCreateForm(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1.5" />Weiteres Zuhause
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
        homes.map((home) => {
          const mapQuery = buildMapQuery(home);
          return (
            <div key={home.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
                {/* Kachel 1: Adresse */}
                <Card className="glass-card h-[240px] sm:aspect-square sm:h-auto flex flex-col">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
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

                {/* Kachel 2: Street View */}
                <Card className="glass-card h-[240px] sm:aspect-square sm:h-auto overflow-hidden">
                  <CardContent className="p-0 h-full relative">
                    {(home.city || home.address) && mapsApiKey ? (
                      <>
                        <img
                          src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${mapQuery}&key=${mapsApiKey}`}
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
                      </>
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

              {/* Row 2: Camera Widgets */}
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
                {demoCameras.map((cam) => (
                  <Card key={cam.id} className="glass-card overflow-hidden group cursor-pointer">
                    <CardContent className="p-0 relative h-[220px] sm:aspect-square sm:h-auto">
                      <img src={cam.image} alt={cam.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Badge className={`absolute top-2 left-2 text-[10px] ${cam.status === 'online' ? 'bg-green-500/90 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {cam.status === 'online' ? '● Online' : '○ Offline'}
                      </Badge>
                      {cam.status === 'online' && (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{cam.name}</p>
                          <p className="text-white/70 text-[10px]">Gerade eben</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-white hover:bg-white/20 text-xs">
                            <Eye className="h-3 w-3 mr-1" />Live
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-white hover:bg-white/20 text-xs">
                            <Video className="h-3 w-3 mr-1" />Events
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />Kamera hinzufügen
              </Button>

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

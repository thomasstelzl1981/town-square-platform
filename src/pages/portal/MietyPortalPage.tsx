/**
 * Miety Portal Page (MOD-20) — Zuhause-Akte Dossier System
 * Exception: 6 tiles instead of 4 (renter portal)
 * All tiles show permanent placeholder cards — no empty blockers
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DictationButton } from '@/components/shared/DictationButton';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MietyCreateHomeForm } from './miety/components/MietyCreateHomeForm';
import { ContractDrawer } from './miety/components/ContractDrawer';
import {
  Home, FileText, MessageCircle, Gauge, Zap, Shield, Plus, Building2,
  ArrowRight, Flame, Droplets, Wifi, Thermometer, FolderOpen, Upload,
  Users, AlertTriangle, Mail, CheckCircle2, Camera, Globe, Copy, Send,
  Languages, Phone, Settings, ShoppingCart, TrendingDown, ExternalLink,
  Eye, Video, Link2,
} from 'lucide-react';
import React from 'react';

// Camera snapshot images
import camEntrance from '@/assets/miety/cam-entrance.jpg';
import camGarden from '@/assets/miety/cam-garden.jpg';
import camIndoor from '@/assets/miety/cam-indoor.jpg';
// Eufy product images
import eufySolocamS340 from '@/assets/miety/eufy-solocam-s340.jpg';
import eufyFloodlightE340 from '@/assets/miety/eufy-floodlight-e340.jpg';
import eufyIndoorS350 from '@/assets/miety/eufy-indoor-s350.jpg';
import eufyHomebaseS380 from '@/assets/miety/eufy-homebase-s380.jpg';

const MietyHomeDossier = React.lazy(() => import('./miety/MietyHomeDossier'));

// =============================================================================
// Shared helpers
// =============================================================================
function TileShell({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

function useHomesQuery() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['miety-homes', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_homes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

function NoHomeBanner({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Home className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Zuhause anlegen</p>
          <p className="text-xs text-muted-foreground">Legen Sie zuerst Ihr Zuhause an, um Verträge zu speichern.</p>
        </div>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-1" />Anlegen
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Demo camera data
// =============================================================================
const demoCameras = [
  { id: 'cam-1', name: 'Eingang', status: 'online' as const, image: camEntrance },
  { id: 'cam-2', name: 'Garten', status: 'online' as const, image: camGarden },
  { id: 'cam-3', name: 'Innen', status: 'offline' as const, image: camIndoor },
];

// =============================================================================
// Tab 1: Übersicht
// =============================================================================
function UebersichtTile() {
  const { activeTenantId, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHome, setEditingHome] = useState<any>(null);
  const autoCreatedRef = useRef(false);

  const { data: homes = [], isLoading } = useHomesQuery();

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
        }}
      />
    </div>
  );


  const buildMapQuery = (home: any) =>
    encodeURIComponent([home.address, home.address_house_no, home.zip, home.city].filter(Boolean).join(' '));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Miety</h1>
          <p className="text-muted-foreground mt-1">Ihr Zuhause auf einen Blick</p>
        </div>
        {homes.length > 0 && (
          <Button onClick={() => setShowCreateForm(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1.5" />Weiteres Zuhause
          </Button>
        )}
      </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Kachel 1: Adresse */}
                <Card className="glass-card aspect-square flex flex-col">
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
                      <Button size="sm" onClick={() => navigate(`/portal/miety/zuhause/${home.id}`)}>
                        <ArrowRight className="h-4 w-4 mr-1" />Öffnen
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Kachel 2: Street View */}
                <Card className="glass-card aspect-square overflow-hidden">
                  <CardContent className="p-0 h-full relative">
                    {(home.city || home.address) ? (
                      <iframe title="Street View" className="w-full h-full" style={{ border: 0 }} loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${mapQuery}&layer=c&output=embed`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                        <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Foto hochladen</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Kachel 3: Satellite */}
                <Card className="glass-card aspect-square overflow-hidden">
                  <CardContent className="p-0 h-full">
                    {(home.city || home.address) ? (
                      <iframe title="Satellitenansicht" className="w-full h-full" style={{ border: 0 }} loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${mapQuery}&t=k&z=18&output=embed`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                        <Globe className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Satellitenansicht</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Camera Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {demoCameras.map((cam) => (
                  <Card key={cam.id} className="glass-card overflow-hidden group cursor-pointer">
                    <CardContent className="p-0 relative aspect-square">
                      <img src={cam.image} alt={cam.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Status badge top left */}
                      <Badge className={`absolute top-2 left-2 text-[10px] ${cam.status === 'online' ? 'bg-green-500/90 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {cam.status === 'online' ? '● Online' : '○ Offline'}
                      </Badge>
                      {/* LIVE badge top right */}
                      {cam.status === 'online' && (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      {/* Name + timestamp bottom */}
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
            </div>
          );
        })
      )}

    </div>
  );
}

// =============================================================================
// Tab 2: Versorgung — IST/SOLL Kachel-Paare + Zählerstand integriert
// =============================================================================
function VersorgungTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>('strom');

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versorgung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts').select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['strom', 'gas', 'wasser', 'internet'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings-all', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_meter_readings').select('*')
        .eq('tenant_id', activeTenantId)
        .order('reading_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;

  const openDrawer = (cat: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  const supplyCategories = [
    { category: 'strom', label: 'Stromvertrag', icon: Zap, meterType: 'strom', meterUnit: 'kWh', hasSoll: true },
    { category: 'gas', label: 'Gasvertrag', icon: Flame, meterType: 'gas', meterUnit: 'm³', hasSoll: false },
    { category: 'wasser', label: 'Wasservertrag', icon: Droplets, meterType: 'wasser', meterUnit: 'm³', hasSoll: false },
    { category: 'internet', label: 'Internet & Telefon', icon: Wifi, meterType: null, meterUnit: null, hasSoll: false },
  ];

  return (
    <TileShell icon={Zap} title="Versorgung" description="Strom, Gas, Wasser & Internet — Verträge und Zählerstände">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      {supplyCategories.map(({ category, label, icon: SIcon, meterType, meterUnit, hasSoll }) => {
        const contract = contracts.find(c => c.category === category);
        const reading = meterType ? readings.find(r => r.meter_type === meterType) : null;

        return (
          <div key={category} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* IST Card */}
            <Card className={`${contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'} aspect-square`}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                    <SIcon className={`h-5 w-5 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ihr Vertrag</p>
                    <p className="font-medium text-sm">{label}</p>
                    {contract ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-0.5">{contract.provider_name || 'Anbieter'}</p>
                        {contract.monthly_cost && (
                          <p className="text-sm font-medium mt-1">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2"
                          onClick={() => navigate(`/portal/miety/zuhause/${contract.home_id}`)}>Details →</Button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">Kein Vertrag hinterlegt</p>
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2 text-primary" onClick={() => openDrawer(category)}>
                          <Plus className="h-3 w-3 mr-1" />Vertrag anlegen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Integrated meter reading */}
                {meterType && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Zählerstand</span>
                    </div>
                    {reading ? (
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-lg font-semibold">{Number(reading.reading_value).toLocaleString('de-DE')}</p>
                        <span className="text-xs text-muted-foreground">{meterUnit} · {new Date(reading.reading_date).toLocaleDateString('de-DE')}</span>
                        <TrendingDown className="h-3 w-3 text-green-500 ml-auto" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Noch kein Stand erfasst</p>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs mt-1 -ml-2 text-primary"
                      onClick={() => homes.length > 0 ? navigate(`/portal/miety/zuhause/${homes[0].id}`) : setShowCreateForm(true)}>
                      <Plus className="h-3 w-3 mr-1" />Neuen Stand erfassen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOLL Card */}
            {hasSoll ? (
              <Card className="glass-card border-green-500/20 overflow-hidden aspect-square">
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Unser Angebot</p>
                      <p className="font-medium text-sm">Rabot Charge — Strom zum Börsenpreis</p>
                      <p className="text-sm text-muted-foreground mt-1">ca. 28,5 ct/kWh (dynamisch)</p>
                      {contract?.monthly_cost && (
                        <div className="mt-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                          <p className="text-xs text-muted-foreground">Sie zahlen aktuell <strong>{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</strong></p>
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">
                            → mit Rabot ca. {(Number(contract.monthly_cost) * 0.85).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat
                          </p>
                        </div>
                      )}
                      <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs">
                        bis zu 15% sparen
                      </Badge>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">Jetzt wechseln</Button>
                        <Button size="sm" variant="ghost" className="text-xs">Mehr erfahren</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed opacity-60 aspect-square">
                <CardContent className="p-5 flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center">
                    {category === 'gas' ? 'Gasanbieter-Vergleich — demnächst verfügbar' : 'Vergleich nicht verfügbar'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weiteren Vertrag hinzufügen
      </Button>

      {homes.length > 0 && (
        <ContractDrawer open={drawerOpen} onOpenChange={setDrawerOpen} homeId={homes[0].id} defaultCategory={drawerCategory} />
      )}
    </TileShell>
  );
}

// =============================================================================
// Tab 3: Versicherungen — IST/SOLL Kachel-Paare + Neo Digital
// =============================================================================
function VersicherungenTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>('hausrat');

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versicherung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts').select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['hausrat', 'haftpflicht'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;

  const openDrawer = (cat: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  const home = homes[0];
  const insuranceTypes = [
    { category: 'hausrat', label: 'Hausratversicherung', sollPrice: 'ab 4,90 EUR/Monat (Grundschutz)', sollPriceComfort: 'ab 8,50 EUR/Monat (Komfort)' },
    { category: 'haftpflicht', label: 'Haftpflichtversicherung', sollPrice: 'ab 3,50 EUR/Monat', sollPriceComfort: null },
  ];

  return (
    <TileShell icon={Shield} title="Versicherungen" description="Hausrat, Haftpflicht & Vergleichsangebote">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      {insuranceTypes.map(({ category, label, sollPrice, sollPriceComfort }) => {
        const contract = contracts.find(c => c.category === category);
        return (
          <div key={category} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* IST Card */}
            <Card className={`${contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'} aspect-square`}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Shield className={`h-5 w-5 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ihr Vertrag</p>
                    <p className="font-medium text-sm">{label}</p>
                    {contract ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-0.5">{contract.provider_name || 'Versicherer'}</p>
                        {contract.monthly_cost && (
                          <p className="text-sm font-medium mt-1">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2"
                          onClick={() => navigate(`/portal/miety/zuhause/${contract.home_id}`)}>Details →</Button>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Button size="sm" variant="ghost" className="text-xs -ml-2 text-muted-foreground">
                            <FolderOpen className="h-3 w-3 mr-1" />Unterlagen herunterladen
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">Nicht hinterlegt</p>
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2 text-primary" onClick={() => openDrawer(category)}>
                          <Plus className="h-3 w-3 mr-1" />Hinzufügen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SOLL Card — Neo Digital */}
            <Card className="glass-card border-blue-500/20 overflow-hidden aspect-square">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600" />
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Vergleichsangebot</p>
                    <p className="font-medium text-sm">Neo Digital — {label}</p>
                    {home && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {home.area_sqm && <Badge variant="outline" className="text-[10px]">{home.area_sqm} m²</Badge>}
                        {home.property_type && <Badge variant="outline" className="text-[10px] capitalize">{home.property_type}</Badge>}
                        {home.zip && <Badge variant="outline" className="text-[10px]">PLZ {home.zip}</Badge>}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">{sollPrice}</p>
                    {sollPriceComfort && <p className="text-xs text-muted-foreground">{sollPriceComfort}</p>}
                    {contract?.monthly_cost && (
                      <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-xs">
                        Einsparung möglich
                      </Badge>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Angebot anfordern</Button>
                      <Button size="sm" variant="ghost" className="text-xs">Mehr erfahren</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weitere Versicherung
      </Button>

      {homes.length > 0 && (
        <ContractDrawer open={drawerOpen} onOpenChange={setDrawerOpen} homeId={homes[0].id} defaultCategory={drawerCategory} />
      )}
    </TileShell>
  );
}

// EufyConnectCard — functional eufy account connection
// =============================================================================
function EufyConnectCard() {
  const { activeTenantId, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Check existing connection
  useEffect(() => {
    if (!user?.id || !activeTenantId) return;
    supabase
      .from('miety_eufy_accounts')
      .select('email')
      .eq('user_id', user.id)
      .eq('tenant_id', activeTenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setConnected(true); setEmail(data.email); }
      });
  }, [user?.id, activeTenantId]);

  const handleConnect = async () => {
    if (!email || !password || !activeTenantId) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eufy-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: 'login', email, password, tenant_id: activeTenantId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.detail || result.error || 'Verbindung fehlgeschlagen');
      } else {
        setConnected(true);
        setDevices(result.devices || []);
        setPassword('');
      }
    } catch (e: any) {
      setError(e.message || 'Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eufy-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action: 'disconnect', tenant_id: activeTenantId }),
    });
    setConnected(false);
    setDevices([]);
    setEmail('');
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">eufy Konto verbinden</h3>
            <p className="text-xs text-muted-foreground">
              {connected ? `Verbunden als ${email}` : 'Melden Sie sich mit Ihrem eufy-Konto an, um Ihre Kameras zu verwalten.'}
            </p>
          </div>
          {connected && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />Verbunden
            </Badge>
          )}
        </div>

        {connected ? (
          <div className="space-y-3">
            {devices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Erkannte Geräte:</p>
                {devices.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.model}</p>
                    </div>
                    <Badge variant={d.status === 'online' ? 'default' : 'secondary'} className="text-[10px]">
                      {d.status === 'online' ? '● Online' : '○ Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" className="text-xs" onClick={handleDisconnect}>
              Verbindung trennen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">E-Mail-Adresse</Label>
              <Input type="email" placeholder="ihre@email.de" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Passwort</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full mt-1" onClick={handleConnect} disabled={loading || !email || !password}>
              <Link2 className="h-4 w-4 mr-2" />
              {loading ? 'Verbinde...' : 'Verbindung herstellen'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Ihre Zugangsdaten werden verschlüsselt gespeichert und nur für die API-Verbindung verwendet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Tab 4: Smart Home — Kamera-Verwaltung + eufy Shop
// =============================================================================
function SmartHomeTile() {
  const [cameraToggles, setCameraToggles] = useState<Record<string, boolean>>({
    'cam-1': true, 'cam-2': true, 'cam-3': false,
  });

  const eufyProducts = [
    { id: 'solocam-s340', name: 'eufy SoloCam S340', price: 'ab 159,99 EUR', image: eufySolocamS340, badges: ['3K', 'Solar', 'WLAN', '360°'], url: 'https://www.eufy.com/de/products/solocam-s340' },
    { id: 'floodlight-e340', name: 'eufy Floodlight Cam E340', price: 'ab 179,99 EUR', image: eufyFloodlightE340, badges: ['3K', 'Flutlicht', 'WLAN', '360°'], url: 'https://www.eufy.com/de/products/floodlight-cam-e340' },
    { id: 'indoor-s350', name: 'eufy Indoor Cam S350', price: 'ab 59,99 EUR', image: eufyIndoorS350, badges: ['4K', 'Pan&Tilt', 'WLAN', 'Dual-Cam'], url: 'https://www.eufy.com/de/products/indoor-cam-s350' },
    { id: 'homebase-s380', name: 'eufy HomeBase S380', price: 'ab 149,99 EUR', image: eufyHomebaseS380, badges: ['WiFi', '16TB', 'Lokal-KI'], url: 'https://www.eufy.com/de/products/homebase-s380' },
  ];

  return (
    <TileShell icon={Camera} title="Smart Home" description="Kamera-Verwaltung und eufy Smart Home">
      {/* Camera Management */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium text-sm mb-3">Meine Kameras</h3>
          <p className="text-xs text-muted-foreground mb-4">Aktivierte Kameras erscheinen auf Ihrer Übersicht.</p>
          <div className="space-y-3">
            {demoCameras.map((cam) => (
              <div key={cam.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <img src={cam.image} alt={cam.name} className="h-10 w-10 rounded object-cover" />
                  <div>
                    <p className="text-sm font-medium">{cam.name}</p>
                    <p className={`text-xs ${cam.status === 'online' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {cam.status === 'online' ? '● Online' : '○ Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Dashboard</span>
                  <Switch
                    checked={cameraToggles[cam.id] ?? false}
                    onCheckedChange={(v) => setCameraToggles(p => ({ ...p, [cam.id]: v }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Starter Set Banner */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Starter Set — eufy Security</p>
              <p className="text-xs text-muted-foreground">2 Kameras + HomeBase — alles was Sie brauchen</p>
              <p className="text-lg font-bold mt-1">Komplett ab 469,97 EUR</p>
            </div>
            <Button size="sm">Starter Set kaufen</Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {eufyProducts.map((product) => (
          <Card key={product.id} className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted/20 flex items-center justify-center p-6">
                <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="p-4">
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-sm font-semibold mt-1">{product.price}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.badges.map(b => (
                    <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => window.open(product.url, '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1" />Bei eufy kaufen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* eufy Konto verbinden */}
      <EufyConnectCard />
    </TileShell>
  );
}

// (Einstellungen entfernt — APIs werden in Zone 1 Integration Registry verwaltet)

// =============================================================================
// Tab 5: Kommunikation — Vermieter-Kontakt, WhatsApp, E-Mail, KI-Übersetzer
// =============================================================================
function KommunikationTile() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [translateInput, setTranslateInput] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [copied, setCopied] = useState(false);

  const handleWhatsAppSend = () => {
    if (!whatsappNumber) return;
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''}`;
    window.open(url, '_blank');
  };

  const handleEmailSend = () => {
    if (!emailAddress) return;
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translateResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    { code: 'en', label: 'Englisch' }, { code: 'tr', label: 'Türkisch' },
    { code: 'ar', label: 'Arabisch' }, { code: 'uk', label: 'Ukrainisch' },
    { code: 'ru', label: 'Russisch' }, { code: 'pl', label: 'Polnisch' },
    { code: 'fr', label: 'Französisch' },
  ];

  return (
    <TileShell icon={MessageCircle} title="Kommunikation" description="Kontakt zu Ihrem Vermieter">
      {/* Vermieter-Kontaktdaten */}
      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ihr Vermieter</h3>
              <p className="text-xs text-muted-foreground">Kontaktdaten Ihrer Hausverwaltung</p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] text-green-600 border-green-300">Verbunden</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</p>
              <p className="text-sm font-medium">Müller Hausverwaltung GmbH</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">E-Mail</p>
              <p className="text-sm font-medium">info@mueller-hv.de</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Telefon</p>
              <p className="text-sm font-medium">+49 30 1234567</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kommunikationskanäle — 3 Kacheln */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp */}
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-green-500/10"><Phone className="h-5 w-5 text-green-500" /></div>
              <div>
                <h3 className="font-medium text-sm">WhatsApp Business</h3>
                <p className="text-xs text-muted-foreground">Direktnachricht an Vermieter</p>
              </div>
            </div>
            <Input placeholder="Telefonnummer Vermieter" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="text-sm" />
            <div className="relative">
              <textarea placeholder="Nachricht eingeben..." value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setWhatsappMessage(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsAppSend}>
              <Send className="h-4 w-4 mr-1.5" />Nachricht senden
            </Button>
          </CardContent>
        </Card>

        {/* E-Mail */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="font-medium text-sm">E-Mail</h3>
                <p className="text-xs text-muted-foreground">E-Mail an Vermieter senden</p>
              </div>
            </div>
            <Input placeholder="E-Mail-Adresse Vermieter" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className="text-sm" />
            <Input placeholder="Betreff" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="text-sm" />
            <div className="relative">
              <textarea placeholder="Nachricht..." value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setEmailBody(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={handleEmailSend}>
              <Mail className="h-4 w-4 mr-1.5" />E-Mail senden
            </Button>
          </CardContent>
        </Card>

        {/* KI-Übersetzer */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-accent/30"><Languages className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="font-medium text-sm">KI-Übersetzer</h3>
                <p className="text-xs text-muted-foreground">Text übersetzen & einfügen</p>
              </div>
            </div>
            <div className="relative">
              <textarea placeholder="Text eingeben (Deutsch)..." value={translateInput} onChange={(e) => setTranslateInput(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setTranslateInput(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
              className="flex h-10 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Languages className="h-4 w-4 mr-1.5" />Übersetzen
            </Button>
            {translateResult && (
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <p>{translateResult}</p>
                <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-1" />{copied ? 'Kopiert!' : 'Kopieren'}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">KI-Übersetzung demnächst verfügbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Vermieter verbinden — unten */}
      <Card className="glass-card border-dashed border-muted-foreground/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Users className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Vermieter verbinden</p>
              <p className="text-xs text-muted-foreground">Einladungscode eingeben für gemeinsamen Datenraum</p>
            </div>
            <div className="flex gap-2 items-center">
              <Input placeholder="VM-ABC123" className="text-sm w-36" />
              <Button size="sm" variant="outline">Verbinden</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TileShell>
  );
}

// =============================================================================
// Main Router
// =============================================================================
export default function MietyPortalPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={<UebersichtTile />} />
      <Route path="versorgung" element={<VersorgungTile />} />
      <Route path="versicherungen" element={<VersicherungenTile />} />
      <Route path="smarthome" element={<SmartHomeTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
      <Route path="zuhause/:homeId" element={
        <React.Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
          <MietyHomeDossier />
        </React.Suspense>
      } />
      {/* Legacy redirect */}
      <Route path="zaehlerstaende" element={<Navigate to="/portal/miety/versorgung" replace />} />
    </Routes>
  );
}

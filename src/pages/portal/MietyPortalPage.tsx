/**
 * Miety Portal Page (MOD-20) — Zuhause-Akte Dossier System
 * Exception: 6 tiles instead of 4 (renter portal)
 * All tiles show permanent placeholder cards — no empty blockers
 */

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MietyCreateHomeForm } from './miety/components/MietyCreateHomeForm';
import { ContractDrawer } from './miety/components/ContractDrawer';
import {
  Home,
  FileText,
  MessageCircle,
  Gauge,
  Zap,
  Shield,
  Plus,
  Building2,
  ArrowRight,
  Flame,
  Droplets,
  Wifi,
  Thermometer,
  FolderOpen,
  Upload,
  Users,
  AlertTriangle,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import React from 'react';

const MietyHomeDossier = React.lazy(() => import('./miety/MietyHomeDossier'));

// =============================================================================
// Shared helpers
// =============================================================================
function TileShell({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
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

/** Inline banner when no home exists yet */
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
          <Plus className="h-4 w-4 mr-1" />
          Anlegen
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Tab 1: Übersicht — Home List + Quick Access Cards
// =============================================================================
function UebersichtTile() {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: homes = [], isLoading } = useHomesQuery();

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

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  const quickCards = [
    { key: 'strom', label: 'Strom', icon: Zap, tab: 'versorgung' },
    { key: 'internet', label: 'Internet', icon: Wifi, tab: 'versorgung' },
    { key: 'hausrat', label: 'Hausrat', icon: Shield, tab: 'versicherungen' },
    { key: 'zaehler', label: 'Zähler', icon: Gauge, tab: 'zaehlerstaende' },
  ];

  const getContractStatus = (cat: string) => {
    const c = contracts.find(cc => cc.category === cat);
    if (!c) return null;
    return c.provider_name || 'Eingerichtet';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Willkommen bei Miety</h2>
          <p className="text-sm text-muted-foreground">Ihr Zuhause auf einen Blick</p>
        </div>
        {homes.length > 0 && (
          <Button onClick={() => setShowCreateForm(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1.5" />Weiteres Zuhause
          </Button>
        )}
      </div>

      {/* Home cards or create CTA */}
      {homes.length === 0 ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ihr Zuhause einrichten</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">Adresse wird automatisch aus Ihren Stammdaten übernommen.</p>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />Zuhause anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homes.map((home) => (
            <Card key={home.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => navigate(`/portal/miety/zuhause/${home.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{home.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {[home.address, home.address_house_no].filter(Boolean).join(' ')}{home.city ? `, ${home.city}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-xs">{home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}</Badge>
                      {home.area_sqm && <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick access cards — always visible */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Schnellzugriff</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickCards.map(({ key, label, icon: QIcon, tab }) => {
            const status = key !== 'zaehler' ? getContractStatus(key) : null;
            return (
              <Card key={key} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/portal/miety/${tab}`)}>
                <CardContent className="p-4 text-center">
                  <QIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{label}</p>
                  {status ? (
                    <p className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />{status}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Einrichten →</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab 2: Kommunikation — Vermieter-Verlinkung + Schadensmeldung
// =============================================================================
function KommunikationTile() {
  return (
    <TileShell icon={MessageCircle} title="Kommunikation" description="Vermieter, Nachrichten und Schadensmeldungen">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vermieter-Verlinkung */}
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="font-medium">Vermieter verbinden</h3>
                <p className="text-xs text-muted-foreground">Verbinden Sie sich mit Ihrem Vermieter</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Einladungscode eingeben</p>
                <div className="flex gap-2">
                  <Input placeholder="z.B. VM-ABC123" className="text-sm" />
                  <Button size="sm" variant="outline">Verbinden</Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Oder bitten Sie Ihren Vermieter um eine Einladung.</p>
            </div>
          </CardContent>
        </Card>

        {/* Schadensmeldung */}
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <h3 className="font-medium">Schadensmeldung</h3>
                <p className="text-xs text-muted-foreground">Schäden melden und dokumentieren</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Schaden melden
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">Verfügbar nach Vermieter-Verlinkung</p>
          </CardContent>
        </Card>

        {/* Nachrichten */}
        <Card className="border-dashed">
          <CardContent className="p-5 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nachrichten</p>
            <p className="text-xs text-muted-foreground mt-1">Noch keine Nachrichten vorhanden</p>
          </CardContent>
        </Card>

        {/* Korrespondenz-Dokumente */}
        <Card className="border-dashed">
          <CardContent className="p-5 text-center">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Korrespondenz</p>
            <p className="text-xs text-muted-foreground mt-1">Dokumente werden hier abgelegt</p>
          </CardContent>
        </Card>
      </div>
    </TileShell>
  );
}

// =============================================================================
// Tab 3: Zählerstände — Always 4 meter cards
// =============================================================================
function ZaehlerstaendeTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings-all', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_meter_readings')
        .select('*, miety_homes!inner(name)')
        .eq('tenant_id', activeTenantId)
        .order('reading_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  const meterTypes = [
    { type: 'strom', label: 'Strom', unit: 'kWh', icon: Zap },
    { type: 'gas', label: 'Gas', unit: 'm³', icon: Flame },
    { type: 'wasser', label: 'Wasser', unit: 'm³', icon: Droplets },
    { type: 'heizung', label: 'Heizung', unit: 'kWh', icon: Thermometer },
  ];

  return (
    <TileShell icon={Gauge} title="Zählerstände" description="Verbrauchswerte erfassen und überblicken">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {meterTypes.map(({ type, label, unit, icon: MIcon }) => {
          const reading = readings.find((r) => r.meter_type === type);
          return (
            <Card key={type} className={reading ? 'glass-card' : 'border-dashed'}>
              <CardContent className="p-4 text-center">
                <MIcon className={`h-6 w-6 mx-auto mb-2 ${reading ? 'text-primary' : 'text-muted-foreground/40'}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                {reading ? (
                  <>
                    <p className="text-xl font-semibold">{Number(reading.reading_value).toLocaleString('de-DE')}</p>
                    <p className="text-xs text-muted-foreground">{unit} · {new Date(reading.reading_date).toLocaleDateString('de-DE')}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground py-1">Noch kein Stand</p>
                    <Button size="sm" variant="ghost" className="text-xs mt-1"
                      onClick={() => homes.length > 0 ? navigate(`/portal/miety/zuhause/${homes[0].id}`) : setShowCreateForm(true)}>
                      <Plus className="h-3 w-3 mr-1" />Erfassen
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {homes.length > 0 && (
        <Button variant="outline" onClick={() => navigate(`/portal/miety/zuhause/${homes[0].id}`)}>
          <Gauge className="h-4 w-4 mr-1.5" />Alle Zählerstände verwalten
        </Button>
      )}
    </TileShell>
  );
}

// =============================================================================
// Tab 4: Versorgung — Always 4 contract cards + add more
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
        .from('miety_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['strom', 'gas', 'wasser', 'internet'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  const supplyCards = [
    { category: 'strom', label: 'Stromvertrag', icon: Zap },
    { category: 'gas', label: 'Gasvertrag', icon: Flame },
    { category: 'wasser', label: 'Wasservertrag', icon: Droplets },
    { category: 'internet', label: 'Internet & Telefon', icon: Wifi },
  ];

  const openDrawer = (cat: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  return (
    <TileShell icon={Zap} title="Versorgung" description="Strom, Gas, Wasser & Internet">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {supplyCards.map(({ category, label, icon: SIcon }) => {
          const contract = contracts.find(c => c.category === category);
          return (
            <Card key={category} className={contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                    <SIcon className={`h-5 w-5 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    {contract ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-0.5">{contract.provider_name || 'Anbieter'}</p>
                        {contract.monthly_cost && (
                          <p className="text-sm font-medium mt-1">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2"
                          onClick={() => navigate(`/portal/miety/zuhause/${contract.home_id}`)}>
                          Details →
                        </Button>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weiteren Vertrag hinzufügen
      </Button>

      {homes.length > 0 && (
        <ContractDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          homeId={homes[0].id}
          defaultCategory={drawerCategory}
        />
      )}
    </TileShell>
  );
}

// =============================================================================
// Tab 5: Versicherungen — Always 2 insurance cards + add more
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
        .from('miety_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['hausrat', 'haftpflicht'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  const insuranceCards = [
    { category: 'hausrat', label: 'Hausratversicherung' },
    { category: 'haftpflicht', label: 'Haftpflichtversicherung' },
  ];

  const openDrawer = (cat: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  return (
    <TileShell icon={Shield} title="Versicherungen" description="Hausrat, Haftpflicht & mehr">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insuranceCards.map(({ category, label }) => {
          const contract = contracts.find(c => c.category === category);
          return (
            <Card key={category} className={contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Shield className={`h-5 w-5 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    {contract ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-0.5">{contract.provider_name || 'Versicherer'}</p>
                        {contract.monthly_cost && (
                          <p className="text-sm font-medium mt-1">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs mt-2 -ml-2"
                          onClick={() => navigate(`/portal/miety/zuhause/${contract.home_id}`)}>
                          Details →
                        </Button>
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
          );
        })}
      </div>

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weitere Versicherung
      </Button>

      {homes.length > 0 && (
        <ContractDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          homeId={homes[0].id}
          defaultCategory={drawerCategory}
        />
      )}
    </TileShell>
  );
}

// =============================================================================
// Tab 6: Dokumente — Folder-based overview
// =============================================================================
function DokumenteTile() {
  const navigate = useNavigate();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  const folders = [
    { key: 'vertraege', label: 'Verträge', icon: FileText },
    { key: 'zaehler', label: 'Zählerstände', icon: Gauge },
    { key: 'versicherungen', label: 'Versicherungen', icon: Shield },
    { key: 'versorgung', label: 'Versorgung', icon: Zap },
    { key: 'kommunikation', label: 'Kommunikation', icon: Mail },
    { key: 'sonstiges', label: 'Sonstiges', icon: FolderOpen },
  ];

  return (
    <TileShell icon={FileText} title="Dokumente" description="Verträge, Belege und wichtige Unterlagen">
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {folders.map(({ key, label, icon: FIcon }) => (
          <Card key={key} className="border-dashed hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => homes.length > 0 ? navigate(`/portal/miety/zuhause/${homes[0].id}`) : setShowCreateForm(true)}>
            <CardContent className="p-5 text-center">
              <FIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">0 Dokumente</p>
              <Button size="sm" variant="ghost" className="text-xs mt-2">
                <Upload className="h-3 w-3 mr-1" />Hochladen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </TileShell>
  );
}

// =============================================================================
// Main Router
// =============================================================================
export default function MietyPortalPage() {
  const content = moduleContents['MOD-20'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<UebersichtTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
      <Route path="zaehlerstaende" element={<ZaehlerstaendeTile />} />
      <Route path="versorgung" element={<VersorgungTile />} />
      <Route path="versicherungen" element={<VersicherungenTile />} />
      <Route path="dokumente" element={<DokumenteTile />} />
      <Route path="zuhause/:homeId" element={
        <React.Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }>
          <MietyHomeDossier />
        </React.Suspense>
      } />
      <Route path="*" element={<Navigate to="/portal/miety" replace />} />
    </Routes>
  );
}

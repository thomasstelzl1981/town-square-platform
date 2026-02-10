/**
 * Miety Portal Page (MOD-20) — Zuhause-Akte Dossier System
 * Exception: 6 tiles instead of 4 (renter portal)
 */

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
// ModuleTilePage removed — tiles now use real data queries
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MietyCreateHomeForm } from './miety/components/MietyCreateHomeForm';
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
} from 'lucide-react';
import React from 'react';

const MietyHomeDossier = React.lazy(() => import('./miety/MietyHomeDossier'));

// =============================================================================
// Übersicht: Home List + Create
// =============================================================================
function UebersichtTile() {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: homes = [], isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show create form
  if (showCreateForm) {
    return (
      <div className="p-4">
        <MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} />
      </div>
    );
  }

  // Empty state
  if (homes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Willkommen bei Miety</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Legen Sie Ihr Zuhause an und verwalten Sie Verträge, Zählerstände, Versicherungen und Dokumente an einem Ort.
        </p>
        <Button onClick={() => setShowCreateForm(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Zuhause anlegen
        </Button>
      </div>
    );
  }

  // Home cards grid
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meine Zuhause</h2>
        <Button onClick={() => setShowCreateForm(true)} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1.5" />
          Weiteres Zuhause
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {homes.map((home) => (
          <Card 
            key={home.id} 
            className="glass-card hover:border-primary/30 transition-colors cursor-pointer group"
            onClick={() => navigate(`/portal/miety/zuhause/${home.id}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{home.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {[home.address, home.address_house_no].filter(Boolean).join(' ')}
                    {home.city ? `, ${home.city}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}
                    </Badge>
                    {home.area_sqm && (
                      <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Other tiles — redirect to dossier or show summary
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

function NoHomesState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Home className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">Legen Sie zuerst ein Zuhause an, um diese Funktion zu nutzen.</p>
      <Button onClick={onNavigate} variant="outline">
        <Plus className="h-4 w-4 mr-1.5" />
        Zuhause anlegen
      </Button>
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

function DokumenteTile() {
  const navigate = useNavigate();
  const { data: homes = [], isLoading } = useHomesQuery();

  if (isLoading) return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <TileShell icon={FileText} title="Dokumente" description="Verträge, Belege und wichtige Unterlagen">
      {homes.length === 0 ? (
        <NoHomesState onNavigate={() => navigate('/portal/miety/uebersicht')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homes.map((home) => (
            <Card key={home.id} className="hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => navigate(`/portal/miety/zuhause/${home.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{home.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {[home.address, home.address_house_no].filter(Boolean).join(' ')}{home.city ? `, ${home.city}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Dokumente verwalten →</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TileShell>
  );
}

function KommunikationTile() {
  return (
    <TileShell icon={MessageCircle} title="Kommunikation" description="Nachrichten und Korrespondenz">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 rounded-full bg-accent mb-3">
          <MessageCircle className="h-8 w-8 text-accent-foreground" />
        </div>
        <h3 className="font-medium mb-1">Kommt bald</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Kommunizieren Sie direkt mit Ihrem Vermieter, Hausverwaltung oder Dienstleistern — alles an einem Ort.
        </p>
      </div>
    </TileShell>
  );
}

function ZaehlerstaendeTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [], isLoading: homesLoading } = useHomesQuery();

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

  if (homesLoading) return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const meterTypes = ['strom', 'gas', 'wasser', 'heizung'] as const;
  const meterLabels: Record<string, string> = { strom: 'Strom', gas: 'Gas', wasser: 'Wasser', heizung: 'Heizung' };
  const meterUnits: Record<string, string> = { strom: 'kWh', gas: 'm³', wasser: 'm³', heizung: 'kWh' };

  // Get latest reading per type
  const latestByType = meterTypes.map((type) => {
    const r = readings.find((rd) => rd.meter_type === type);
    return { type, label: meterLabels[type], unit: meterUnits[type], reading: r };
  });

  return (
    <TileShell icon={Gauge} title="Zählerstände" description="Aktuelle Zählerstände aller Zuhause">
      {homes.length === 0 ? (
        <NoHomesState onNavigate={() => navigate('/portal/miety/uebersicht')} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {latestByType.map(({ type, label, unit, reading }) => (
              <Card key={type} className={reading ? '' : 'border-dashed'}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  {reading ? (
                    <>
                      <p className="text-xl font-semibold">{Number(reading.reading_value).toLocaleString('de-DE')}</p>
                      <p className="text-xs text-muted-foreground">{unit} · {new Date(reading.reading_date).toLocaleDateString('de-DE')}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Noch kein Stand</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {homes.length > 0 && (
            <Button variant="outline" onClick={() => navigate(`/portal/miety/zuhause/${homes[0].id}`)}>
              <Gauge className="h-4 w-4 mr-1.5" />
              Zählerstand erfassen
            </Button>
          )}
        </>
      )}
    </TileShell>
  );
}

function VersorgungTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [], isLoading: homesLoading } = useHomesQuery();

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versorgung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts')
        .select('*, miety_homes!inner(name)')
        .eq('tenant_id', activeTenantId)
        .in('category', ['strom', 'gas', 'wasser', 'internet'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (homesLoading) return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const categoryLabels: Record<string, string> = { strom: 'Strom', gas: 'Gas', wasser: 'Wasser', internet: 'Internet' };

  return (
    <TileShell icon={Zap} title="Versorgung" description="Strom, Gas, Wasser & Internet">
      {homes.length === 0 ? (
        <NoHomesState onNavigate={() => navigate('/portal/miety/uebersicht')} />
      ) : contracts.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['strom', 'gas', 'wasser', 'internet'].map((cat) => (
            <Card key={cat} className="border-dashed cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/portal/miety/zuhause/${homes[0].id}`)}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{categoryLabels[cat]}</p>
                <p className="text-sm text-muted-foreground py-2">Kein Vertrag</p>
                <p className="text-xs text-primary">+ Anlegen</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contracts.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/portal/miety/zuhause/${c.home_id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="text-xs">{categoryLabels[c.category] || c.category}</Badge>
                  {c.monthly_cost && <span className="text-sm font-medium">{Number(c.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</span>}
                </div>
                <p className="font-medium">{c.provider_name || 'Unbekannter Anbieter'}</p>
                <p className="text-xs text-muted-foreground">{(c as any).miety_homes?.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TileShell>
  );
}

function VersicherungenTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [], isLoading: homesLoading } = useHomesQuery();

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versicherung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts')
        .select('*, miety_homes!inner(name)')
        .eq('tenant_id', activeTenantId)
        .in('category', ['hausrat', 'haftpflicht'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (homesLoading) return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const diff = new Date(endDate).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  return (
    <TileShell icon={Shield} title="Versicherungen" description="Hausrat, Haftpflicht & mehr">
      {homes.length === 0 ? (
        <NoHomesState onNavigate={() => navigate('/portal/miety/uebersicht')} />
      ) : contracts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['hausrat', 'haftpflicht'].map((cat) => (
            <Card key={cat} className="border-dashed cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/portal/miety/zuhause/${homes[0].id}`)}>
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium capitalize">{cat === 'hausrat' ? 'Hausratversicherung' : 'Haftpflichtversicherung'}</p>
                <p className="text-xs text-primary mt-1">+ Hinzufügen</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contracts.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/portal/miety/zuhause/${c.home_id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{c.provider_name || 'Unbekannter Anbieter'}</p>
                  {isExpiringSoon(c.end_date) ? (
                    <Badge variant="destructive" className="text-xs">Läuft ab</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Aktiv</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{c.category === 'hausrat' ? 'Hausrat' : 'Haftpflicht'}</p>
                {c.monthly_cost && <p className="text-sm mt-1">{Number(c.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
      <Route path="dokumente" element={<DokumenteTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
      <Route path="zaehlerstaende" element={<ZaehlerstaendeTile />} />
      <Route path="versorgung" element={<VersorgungTile />} />
      <Route path="versicherungen" element={<VersicherungenTile />} />
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

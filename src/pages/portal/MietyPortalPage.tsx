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
  Camera,
  Globe,
  Copy,
  Send,
  Languages,
  Phone,
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
  const { activeTenantId, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHome, setEditingHome] = useState<any>(null);
  const autoCreatedRef = useRef(false);

  const { data: homes = [], isLoading } = useHomesQuery();

  // Fetch profile for auto-create
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

  // Auto-create home from profile when none exists
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-homes'] });
    },
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

  if (showCreateForm) {
    return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;
  }

  if (editingHome) {
    return (
      <div className="p-4">
        <MietyCreateHomeForm
          onCancel={() => setEditingHome(null)}
          homeId={editingHome.id}
          initialData={{
            name: editingHome.name || '',
            address: editingHome.address || '',
            houseNo: editingHome.address_house_no || '',
            zip: editingHome.zip || '',
            city: editingHome.city || '',
            ownershipType: editingHome.ownership_type || 'miete',
            propertyType: editingHome.property_type || 'wohnung',
            areaSqm: editingHome.area_sqm?.toString() || '',
            roomsCount: editingHome.rooms_count?.toString() || '',
          }}
        />
      </div>
    );
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

  const buildMapQuery = (home: any) => {
    return encodeURIComponent([home.address, home.address_house_no, home.zip, home.city].filter(Boolean).join(' '));
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

      {/* Home: 3 square tiles or empty state */}
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
            <div key={home.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Kachel 1: Adresse + Name */}
              <Card className="glass-card aspect-square flex flex-col">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Mein Zuhause</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        {profile?.first_name || ''} {profile?.last_name || ''}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {[home.address, home.address_house_no].filter(Boolean).join(' ')}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {[home.zip, home.city].filter(Boolean).join(' ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <Badge variant="secondary" className="text-xs">{home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}</Badge>
                      {home.area_sqm && <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>}
                      {home.rooms_count && <Badge variant="outline" className="text-xs">{home.rooms_count} Zimmer</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setEditingHome(home)}>
                      Bearbeiten
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/portal/miety/zuhause/${home.id}`)}>
                      <ArrowRight className="h-4 w-4 mr-1" />Öffnen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Kachel 2: Foto / Google Street View */}
              <Card className="glass-card aspect-square overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  {(home.city || home.address) ? (
                    <iframe
                      title="Street View"
                      className="w-full h-full"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${mapQuery}&layer=c&output=embed`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                      <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Foto hochladen</p>
                      <p className="text-xs text-muted-foreground mt-1">oder Adresse für Street View eingeben</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kachel 3: Google Earth / Satellite */}
              <Card className="glass-card aspect-square overflow-hidden">
                <CardContent className="p-0 h-full">
                  {(home.city || home.address) ? (
                    <iframe
                      title="Satellitenansicht"
                      className="w-full h-full"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${mapQuery}&t=k&z=18&output=embed`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                      <Globe className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Satellitenansicht</p>
                      <p className="text-xs text-muted-foreground mt-1">Verfügbar nach Adresseingabe</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })
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
// Tab 5: Kommunikation — WhatsApp, E-Mail, KI-Übersetzer
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
    const mailto = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailto;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translateResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    { code: 'en', label: 'Englisch' },
    { code: 'tr', label: 'Türkisch' },
    { code: 'ar', label: 'Arabisch' },
    { code: 'uk', label: 'Ukrainisch' },
    { code: 'ru', label: 'Russisch' },
    { code: 'pl', label: 'Polnisch' },
    { code: 'fr', label: 'Französisch' },
  ];

  return (
    <TileShell icon={MessageCircle} title="Kommunikation" description="WhatsApp, E-Mail und KI-Übersetzer">
      {/* Vermieter-Verlinkung compact */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-4 w-4 text-primary" /></div>
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

      {/* 3 Kommunikations-Kacheln */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kachel 1: WhatsApp Business */}
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">WhatsApp Business</h3>
                <p className="text-xs text-muted-foreground">Direktnachricht an Vermieter</p>
              </div>
            </div>
            <Input
              placeholder="Telefonnummer Vermieter"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="text-sm"
            />
            <textarea
              placeholder="Nachricht eingeben..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="flex min-h-[60px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
            />
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsAppSend}>
              <Send className="h-4 w-4 mr-1.5" />Nachricht senden
            </Button>
            <p className="text-xs text-muted-foreground text-center">Verfügbar wenn Ihr Vermieter WhatsApp Business nutzt</p>
          </CardContent>
        </Card>

        {/* Kachel 2: E-Mail */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">E-Mail</h3>
                <p className="text-xs text-muted-foreground">E-Mail an Vermieter senden</p>
              </div>
            </div>
            <Input
              placeholder="E-Mail-Adresse Vermieter"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Betreff"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="text-sm"
            />
            <textarea
              placeholder="Nachricht..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="flex min-h-[60px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
            />
            <Button size="sm" variant="outline" className="w-full" onClick={handleEmailSend}>
              <Mail className="h-4 w-4 mr-1.5" />E-Mail senden
            </Button>
          </CardContent>
        </Card>

        {/* Kachel 3: KI-Übersetzer */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/30">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">KI-Übersetzer</h3>
                <p className="text-xs text-muted-foreground">Text übersetzen & einfügen</p>
              </div>
            </div>
            <textarea
              placeholder="Text eingeben (Deutsch)..."
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              className="flex min-h-[60px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
            />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="flex h-10 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
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
// Main Router
// =============================================================================
export default function MietyPortalPage() {
  const content = moduleContents['MOD-20'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<UebersichtTile />} />
      <Route path="zaehlerstaende" element={<ZaehlerstaendeTile />} />
      <Route path="versorgung" element={<VersorgungTile />} />
      <Route path="versicherungen" element={<VersicherungenTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
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

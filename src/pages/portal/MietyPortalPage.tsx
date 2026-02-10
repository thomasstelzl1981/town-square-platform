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
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
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
function DokumenteTile() {
  return (
    <ModuleTilePage
      title="Dokumente"
      description="Mietvertrag und wichtige Dokumente"
      icon={FileText}
      moduleBase="miety"
      status="empty"
      emptyTitle="Dokumente verwalten"
      emptyDescription="Öffnen Sie Ihre Zuhause-Akte, um Dokumente hochzuladen und zu verwalten."
      emptyIcon={FileText}
      secondaryAction={{ label: 'Zur Übersicht', href: '/portal/miety/uebersicht' }}
    />
  );
}

function KommunikationTile() {
  return (
    <ModuleTilePage
      title="Kommunikation"
      description="Nachrichten mit Ihrem Vermieter"
      icon={MessageCircle}
      moduleBase="miety"
      status="empty"
      emptyTitle="Kommunikation"
      emptyDescription="Kommunikationsfunktionen werden bald verfügbar sein."
      emptyIcon={MessageCircle}
    />
  );
}

function ZaehlerstaendeTile() {
  return (
    <ModuleTilePage
      title="Zählerstände"
      description="Zählerstände erfassen und einsehen"
      icon={Gauge}
      moduleBase="miety"
      status="empty"
      emptyTitle="Zählerstände verwalten"
      emptyDescription="Öffnen Sie Ihre Zuhause-Akte, um Zählerstände zu erfassen."
      emptyIcon={Gauge}
      secondaryAction={{ label: 'Zur Übersicht', href: '/portal/miety/uebersicht' }}
    />
  );
}

function VersorgungTile() {
  return (
    <ModuleTilePage
      title="Versorgung"
      description="Strom, Gas, Wasser verwalten"
      icon={Zap}
      moduleBase="miety"
      status="empty"
      emptyTitle="Versorger verwalten"
      emptyDescription="Öffnen Sie Ihre Zuhause-Akte, um Versorger-Verträge zu verwalten."
      emptyIcon={Zap}
      secondaryAction={{ label: 'Zur Übersicht', href: '/portal/miety/uebersicht' }}
    />
  );
}

function VersicherungenTile() {
  return (
    <ModuleTilePage
      title="Versicherungen"
      description="Ihre Versicherungen im Überblick"
      icon={Shield}
      moduleBase="miety"
      status="empty"
      emptyTitle="Versicherungen verwalten"
      emptyDescription="Öffnen Sie Ihre Zuhause-Akte, um Versicherungen zu verwalten."
      emptyIcon={Shield}
      secondaryAction={{ label: 'Zur Übersicht', href: '/portal/miety/uebersicht' }}
    />
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

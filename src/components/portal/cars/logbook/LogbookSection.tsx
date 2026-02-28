/**
 * LogbookSection — Fahrtenbuch-Sektion auf der Fahrzeuge-Seite
 * 
 * Zeigt alle Fahrtenbücher als Widget-Grid mit Collapsed/Expanded View.
 * Eigenständiges System — kein Teil der Fahrzeugakte.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Wifi, WifiOff,
  MapPin, Clock, Car, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Logbook {
  id: string;
  vehicle_id: string;
  device_id: string | null;
  start_date: string;
  status: string;
  policy_config: any;
  created_at: string;
  vehicle?: {
    brand: string | null;
    model: string | null;
    license_plate: string | null;
  };
}

export function LogbookSection() {
  const { activeTenantId } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logbooks = [], isLoading } = useQuery({
    queryKey: ['cars-logbooks', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_logbooks')
        .select('*, cars_vehicles(brand, model, license_plate)')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((lb: any) => ({
        ...lb,
        vehicle: lb.cars_vehicles,
      }));
    },
    enabled: !!activeTenantId,
  });

  const { data: openTripsCount = {} } = useQuery({
    queryKey: ['cars-logbook-open-trips', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return {};
      const { data, error } = await supabase
        .from('cars_trips')
        .select('logbook_id')
        .eq('tenant_id', activeTenantId)
        .eq('classification', 'unclassified')
        .not('logbook_id', 'is', null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((t: any) => {
        counts[t.logbook_id] = (counts[t.logbook_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!activeTenantId,
  });

  return (
    <div className="space-y-4">
      <Separator className="my-6" />
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Fahrtenbuch</h2>
            <p className="text-sm text-muted-foreground">
              Fahrtenbücher für Ihre Fahrzeuge verwalten
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Fahrtenbuch anlegen
        </Button>
      </div>

      {/* Logbook Widgets */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Fahrtenbücher werden geladen…
        </div>
      ) : logbooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              Noch keine Fahrtenbücher angelegt
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Erstellen Sie ein Fahrtenbuch und verbinden Sie einen GPS-Tracker für automatisches Tracking
            </p>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Erstes Fahrtenbuch anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {logbooks.map((lb: Logbook) => (
            <LogbookWidget
              key={lb.id}
              logbook={lb}
              openTrips={openTripsCount[lb.id] || 0}
              isExpanded={expandedId === lb.id}
              onToggle={() => setExpandedId(expandedId === lb.id ? null : lb.id)}
            />
          ))}
        </div>
      )}

      {/* Expanded Detail (inline below grid) */}
      {expandedId && (
        <LogbookExpandedView
          logbookId={expandedId}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

// ── Collapsed Widget ─────────────────────────────────────────────

function LogbookWidget({ logbook, openTrips, isExpanded, onToggle }: {
  logbook: Logbook;
  openTrips: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const vehicleName = [logbook.vehicle?.brand, logbook.vehicle?.model]
    .filter(Boolean).join(' ') || 'Fahrzeug';

  return (
    <Card className={`transition-all cursor-pointer hover:shadow-md ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}>
      <CardContent className="p-4 space-y-3" onClick={onToggle}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{vehicleName}</span>
          </div>
          <Badge
            variant="outline"
            className={logbook.status === 'active'
              ? 'bg-status-success/10 text-status-success border-status-success/20 text-[10px]'
              : 'bg-muted text-muted-foreground text-[10px]'
            }
          >
            {logbook.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
          </Badge>
        </div>

        {/* Kennzeichen */}
        {logbook.vehicle?.license_plate && (
          <div className="text-xs text-muted-foreground font-mono">
            {logbook.vehicle.license_plate}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {logbook.device_id ? (
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-status-success" /> Tracker verbunden
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Kein Tracker
            </span>
          )}
          {openTrips > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" /> {openTrips} offen
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground/60">
            Seit {format(new Date(logbook.start_date), 'dd.MM.yyyy', { locale: de })}
          </span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {isExpanded ? 'Schließen' : 'Öffnen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Expanded View (Placeholder — wird in Phase 3 ausgebaut) ──────

function LogbookExpandedView({ logbookId, onClose }: {
  logbookId: string;
  onClose: () => void;
}) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Fahrtenbuch-Details
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2 text-xs">
            Schließen
          </Button>
        </div>

        <Separator />

        {/* Section Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { icon: Wifi, label: 'Gerät' },
            { icon: AlertCircle, label: 'Offene Fahrten' },
            { icon: MapPin, label: 'Übersicht' },
            { icon: Clock, label: 'Monatsabschluss' },
            { icon: BookOpen, label: 'Export' },
            { icon: BookOpen, label: 'Protokoll' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground text-center py-4">
          Fahrtenbuch-Detailansicht wird in Phase 3 implementiert
        </div>
      </CardContent>
    </Card>
  );
}

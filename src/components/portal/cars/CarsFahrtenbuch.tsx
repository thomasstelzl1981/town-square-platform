/**
 * CarsFahrtenbuch — Widget-based with provider offers
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, RefreshCw, Download, Plug, Car, 
  MapPin, ArrowRight, Clock, Sparkles, ExternalLink,
  Route
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type TripClassification = 'business' | 'private' | 'commute' | 'unclassified';
type LogbookStatus = 'not_connected' | 'pending' | 'connected' | 'error';

interface Vehicle {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
}

interface LogbookConnection {
  id: string;
  provider: string;
  status: LogbookStatus;
  last_sync_at: string | null;
}

interface Trip {
  id: string;
  start_at: string;
  end_at: string | null;
  start_address: string | null;
  end_address: string | null;
  distance_km: number;
  classification: TripClassification;
  purpose: string | null;
}

const classificationLabels: Record<TripClassification, string> = {
  business: 'Geschäftlich',
  private: 'Privat',
  commute: 'Arbeitsweg',
  unclassified: 'Nicht klassifiziert',
};

const classificationColors: Record<TripClassification, string> = {
  business: 'bg-primary/10 text-primary border-primary/20',
  private: 'bg-muted text-muted-foreground border-muted-foreground/20',
  commute: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  unclassified: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

// Demo logbook provider offers
const LOGBOOK_OFFERS = [
  {
    id: 'v1',
    provider: 'Vimcar',
    description: 'GPS-Tracker + App, finanzamtkonform',
    monthly: 1990,
    highlight: 'Empfohlen',
    url: 'https://www.vimcar.de',
  },
  {
    id: 'v2',
    provider: 'Bimmer Connected',
    description: 'BMW Connected Drive Integration',
    monthly: 0,
    highlight: 'Kostenlos für BMW',
    url: 'https://www.bmw.de/connected-drive',
  },
  {
    id: 'v3',
    provider: 'AutoLogg',
    description: 'OBD2-Dongle + automatische Klassifizierung',
    monthly: 1490,
    highlight: null,
    url: 'https://www.autologg.com',
  },
];

export function CarsFahrtenbuch() {
  const { activeTenantId } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const { data: vehicles } = useQuery({
    queryKey: ['cars_vehicles_select', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('id, license_plate, make, model')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('license_plate');
      if (error) throw error;
      return (data || []) as Vehicle[];
    },
    enabled: !!activeTenantId,
  });

  const { data: connection } = useQuery({
    queryKey: ['cars_logbook_connection', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return null;
      const { data, error } = await supabase
        .from('cars_logbook_connections')
        .select('id, provider, status, last_sync_at')
        .eq('vehicle_id', selectedVehicleId)
        .maybeSingle();
      if (error) throw error;
      return data as LogbookConnection | null;
    },
    enabled: !!selectedVehicleId,
  });

  const { data: trips } = useQuery({
    queryKey: ['cars_trips', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return [];
      const { data, error } = await supabase
        .from('cars_trips')
        .select('id, start_at, end_at, start_address, end_address, distance_km, classification, purpose')
        .eq('vehicle_id', selectedVehicleId)
        .order('start_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Trip[];
    },
    enabled: !!selectedVehicleId,
  });

  const formatDistance = (km: number) =>
    km.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';

  const formatTime = (dateStr: string) =>
    format(new Date(dateStr), 'dd.MM. HH:mm', { locale: de });

  const formatCurrency = (cents: number) =>
    cents === 0 ? 'Kostenlos' : (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) + '/Mo.';

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="glass-card border-dashed border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Fahrzeuge vorhanden</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Legen Sie zuerst ein Fahrzeug an, um das Fahrtenbuch zu nutzen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Vehicle Selector Widget */}
      <Card className="glass-card border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-primary" />
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="flex-1 sm:w-[300px]">
                <SelectValue placeholder="Fahrzeug wählen..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.license_plate} {v.make && `(${v.make} ${v.model || ''})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedVehicleId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Trips Widget */}
          <Card className="glass-card border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  Letzte Fahrten
                </CardTitle>
                <div className="flex gap-1">
                  {connection?.status === 'connected' && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Sync
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {!connection || connection.status === 'not_connected' ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-xs text-muted-foreground mb-1">Kein Provider verbunden</p>
                  <p className="text-[10px] text-muted-foreground/70">Verbinde einen Fahrtenbuch-Provider rechts</p>
                </div>
              ) : trips && trips.length > 0 ? (
                <div className="space-y-1.5 max-h-[350px] overflow-auto">
                  {trips.map((trip) => (
                    <div key={trip.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-[11px] truncate">{trip.start_address || '—'}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-[11px] truncate">{trip.end_address || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{formatTime(trip.start_at)}</span>
                          <Badge variant="outline" className={cn("text-[7px] h-3.5", classificationColors[trip.classification])}>
                            {classificationLabels[trip.classification]}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs font-medium flex-shrink-0">{formatDistance(trip.distance_km)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Noch keine Fahrten erfasst
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Provider Offers */}
          <Card className="glass-card border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Fahrtenbuch-Angebote
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {LOGBOOK_OFFERS.map((offer) => (
                <div
                  key={offer.id}
                  className="p-3 rounded-lg border border-border/30 hover:border-primary/20 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{offer.provider}</span>
                      {offer.highlight && (
                        <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/20">
                          {offer.highlight}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-bold">{formatCurrency(offer.monthly)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{offer.description}</p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 w-full" asChild>
                    <a href={offer.url} target="_blank" rel="noopener noreferrer">
                      <Plug className="h-3 w-3" />
                      Verbinden
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

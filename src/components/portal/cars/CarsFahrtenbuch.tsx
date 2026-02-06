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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, RefreshCw, Download, Plug, Car } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

const classificationVariants: Record<TripClassification, 'default' | 'secondary' | 'outline'> = {
  business: 'default',
  private: 'secondary',
  commute: 'outline',
  unclassified: 'outline',
};

const statusLabels: Record<LogbookStatus, string> = {
  not_connected: 'Nicht verbunden',
  pending: 'Verbindung wird hergestellt...',
  connected: 'Verbunden',
  error: 'Fehler',
};

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

  const formatDistance = (km: number) => {
    return km.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Fahrzeuge vorhanden</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Legen Sie zuerst ein Fahrzeug an, um das Fahrtenbuch zu nutzen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fahrzeug auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="w-full sm:w-[300px]">
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
        </CardContent>
      </Card>

      {selectedVehicleId && (
        <>
          {/* Provider Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Provider-Verbindung</span>
                {connection?.provider && connection.provider !== 'none' && (
                  <Badge variant="outline">{connection.provider}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!connection || connection.status === 'not_connected' ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">Kein Fahrtenbuch verbunden</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Verbinden Sie einen Fahrtenbuch-Provider (z.B. Vimcar), um Ihre Fahrten
                    automatisch zu erfassen.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Plug className="h-4 w-4 mr-2" />
                      Vimcar verbinden
                    </Button>
                    <Button variant="ghost">Manuell erfassen</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'}>
                        {statusLabels[connection.status]}
                      </Badge>
                    </div>
                    {connection.last_sync_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Letzte Synchronisation: {formatTime(connection.last_sync_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Jetzt synchronisieren
                    </Button>
                    <Button variant="ghost" size="sm">
                      Verbindung trennen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trips Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Fahrten</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trips && trips.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Strecke</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">KM</TableHead>
                      <TableHead>Zweck</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{formatTime(trip.start_at)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{trip.start_address || '—'}</div>
                            <div className="text-muted-foreground">→ {trip.end_address || '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={classificationVariants[trip.classification]}>
                            {classificationLabels[trip.classification]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatDistance(trip.distance_km)}</TableCell>
                        <TableCell className="text-muted-foreground">{trip.purpose || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Noch keine Fahrten erfasst
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

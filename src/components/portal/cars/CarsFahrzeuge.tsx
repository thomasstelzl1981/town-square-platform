/**
 * CarsFahrzeuge — Widget-based vehicle cards with photo upload
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Car, AlertTriangle, Camera, Upload, 
  Gauge, Calendar, User, MapPin, Shield, BookOpen 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { VehicleCreateDialog } from './VehicleCreateDialog';
import { cn } from '@/lib/utils';

type VehicleStatus = 'active' | 'inactive' | 'sold' | 'returned';

interface Vehicle {
  id: string;
  public_id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  holder_name: string | null;
  current_mileage_km: number | null;
  hu_valid_until: string | null;
  status: VehicleStatus;
  year_built?: number | null;
  color?: string | null;
  vin?: string | null;
}

const statusLabels: Record<VehicleStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  sold: 'Verkauft',
  returned: 'Zurückgegeben',
};

const statusColors: Record<VehicleStatus, string> = {
  active: 'bg-status-success/10 text-status-success border-status-success/20',
  inactive: 'bg-muted text-muted-foreground border-muted-foreground/20',
  sold: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  returned: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

// Example vehicle images by make
const VEHICLE_IMAGES: Record<string, string> = {
  'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop',
  'Mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=250&fit=crop',
  'Mercedes-Benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=250&fit=crop',
  'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop',
  'VW': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop',
  'Volkswagen': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop',
  'Porsche': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=250&fit=crop',
  'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop';

function getVehicleImage(make: string | null): string {
  if (!make) return DEFAULT_IMAGE;
  return VEHICLE_IMAGES[make] || DEFAULT_IMAGE;
}

export function CarsFahrzeuge() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: vehicles, isLoading, refetch } = useQuery({
    queryKey: ['cars_vehicles', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('id, public_id, license_plate, make, model, holder_name, current_mileage_km, hu_valid_until, status')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Vehicle[];
    },
    enabled: !!activeTenantId,
  });

  const filteredVehicles = vehicles?.filter((v) => {
    const searchLower = search.toLowerCase();
    return (
      v.license_plate.toLowerCase().includes(searchLower) ||
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.holder_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatMileage = (km: number | null) => {
    if (km === null) return '—';
    return km.toLocaleString('de-DE') + ' km';
  };

  const getHuStatus = (dateStr: string | null) => {
    if (!dateStr) return { text: '—', urgency: 'none' as const };
    const date = new Date(dateStr);
    const daysUntil = differenceInDays(date, new Date());
    const formatted = format(date, 'MM/yyyy', { locale: de });
    
    if (daysUntil < 0) return { text: formatted, urgency: 'expired' as const };
    if (daysUntil < 30) return { text: formatted, urgency: 'warning' as const };
    return { text: formatted, urgency: 'ok' as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <>
        <Card className="glass-card border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Fahrzeuge</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Fügen Sie Ihr erstes Fahrzeug hinzu. Optional können Sie den Fahrzeugschein hochladen — die Daten werden automatisch ausgelesen.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Fahrzeug hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
        <VehicleCreateDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => { refetch(); setCreateDialogOpen(false); }}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Kennzeichen, Hersteller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Fahrzeug hinzufügen
        </Button>
      </div>

      {/* Vehicle Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVehicles?.map((vehicle) => {
          const huStatus = getHuStatus(vehicle.hu_valid_until);
          return (
            <Card
              key={vehicle.id}
              className="glass-card border-primary/10 hover:border-primary/30 transition-all cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/portal/cars/${vehicle.id}`)}
            >
              {/* Photo Area */}
              <div className="relative h-40 bg-muted/30 overflow-hidden">
                <img
                  src={getVehicleImage(vehicle.make)}
                  alt={`${vehicle.make || ''} ${vehicle.model || ''}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                
                {/* Upload overlay */}
                <button
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); /* TODO: photo upload */ }}
                  title="Foto hochladen"
                >
                  <Camera className="h-4 w-4 text-foreground" />
                </button>

                {/* License plate badge */}
                <div className="absolute bottom-2 left-3">
                  <div className="bg-background/90 backdrop-blur-sm rounded-md px-3 py-1 border border-border/50">
                    <span className="font-mono font-bold text-sm tracking-wider">{vehicle.license_plate}</span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-2 left-3">
                  <Badge variant="outline" className={cn("text-[9px]", statusColors[vehicle.status])}>
                    {statusLabels[vehicle.status]}
                  </Badge>
                </div>
              </div>

              {/* Info Area */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-base">
                    {vehicle.make && vehicle.model
                      ? `${vehicle.make} ${vehicle.model}`
                      : vehicle.make || vehicle.model || 'Unbekannt'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <InfoItem icon={User} label="Halter" value={vehicle.holder_name || '—'} />
                  <InfoItem icon={Gauge} label="KM-Stand" value={formatMileage(vehicle.current_mileage_km)} />
                  <InfoItem 
                    icon={Calendar} 
                    label="HU bis" 
                    value={huStatus.text}
                    urgent={huStatus.urgency === 'expired'}
                    warning={huStatus.urgency === 'warning'}
                  />
                  <InfoItem icon={Shield} label="Versicherung" value="Aktiv" />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-[10px] gap-1"
                    onClick={(e) => { e.stopPropagation(); navigate(`/portal/cars/${vehicle.id}`); }}
                  >
                    <Car className="h-3 w-3" />
                    Fahrzeugakte
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-[10px] gap-1"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <BookOpen className="h-3 w-3" />
                    Fahrtenbuch
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <VehicleCreateDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => { refetch(); setCreateDialogOpen(false); }}
      />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, urgent, warning }: { 
  icon: typeof Car; label: string; value: string; urgent?: boolean; warning?: boolean 
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className={cn(
        "h-3 w-3 mt-0.5 flex-shrink-0",
        urgent ? "text-destructive" : warning ? "text-amber-500" : "text-muted-foreground"
      )} />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-xs truncate",
          urgent && "text-destructive font-medium",
          warning && "text-amber-500 font-medium"
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

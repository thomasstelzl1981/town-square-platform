import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Car, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { VehicleCreateDialog } from './VehicleCreateDialog';

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
}

const statusLabels: Record<VehicleStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  sold: 'Verkauft',
  returned: 'Zurückgegeben',
};

const statusVariants: Record<VehicleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  sold: 'outline',
  returned: 'outline',
};

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

  const formatHuDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const daysUntil = differenceInDays(date, new Date());
    const formatted = format(date, 'MM/yyyy', { locale: de });
    
    if (daysUntil < 0) {
      return (
        <span className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {formatted}
        </span>
      );
    }
    if (daysUntil < 30) {
      return (
        <span className="flex items-center gap-1 text-warning">
          <AlertTriangle className="h-3 w-3" />
          {formatted}
        </span>
      );
    }
    return formatted;
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Fahrzeuge</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Fügen Sie Ihr erstes Fahrzeug hinzu, um den Fuhrpark zu verwalten.
              Optional können Sie den Fahrzeugschein hochladen — die Daten werden automatisch ausgelesen.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Fahrzeug hinzufügen
              </Button>
              <Button variant="outline" onClick={() => navigate('/portal/cars')}>
                Wie funktioniert's?
              </Button>
            </div>
          </CardContent>
        </Card>
        <VehicleCreateDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            refetch();
            setCreateDialogOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
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

      <Card>
        <CardHeader>
          <CardTitle>Fahrzeuge ({filteredVehicles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kennzeichen</TableHead>
                <TableHead>Fahrzeug</TableHead>
                <TableHead>Halter</TableHead>
                <TableHead className="text-right">KM-Stand</TableHead>
                <TableHead>HU bis</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles?.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/portal/cars/${vehicle.id}`)}
                >
                  <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                  <TableCell>
                    {vehicle.make && vehicle.model
                      ? `${vehicle.make} ${vehicle.model}`
                      : vehicle.make || vehicle.model || '—'}
                  </TableCell>
                  <TableCell>{vehicle.holder_name || '—'}</TableCell>
                  <TableCell className="text-right">{formatMileage(vehicle.current_mileage_km)}</TableCell>
                  <TableCell>{formatHuDate(vehicle.hu_valid_until)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[vehicle.status]}>
                      {statusLabels[vehicle.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VehicleCreateDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}

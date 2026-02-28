/**
 * LogbookCreateFlow — Inline flow to create a new logbook.
 * Steps: 1) Select vehicle  2) Optional: connect tracker  3) Create
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Car, Wifi, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

export function LogbookCreateFlow({ onClose }: Props) {
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [vehicleId, setVehicleId] = useState('');
  const [withTracker, setWithTracker] = useState(false);
  const [imei, setImei] = useState('');
  const [manufacturer, setManufacturer] = useState('generic');

  // Derive integration_level and protocol from manufacturer
  const getDeviceConfig = (mfr: string) => {
    switch (mfr) {
      case 'teltonika_fmm003':
        return { protocol_type: 'teltonika', integration_level: 'B', device_name_prefix: 'FMM003' };
      case 'seeworld_r58l':
        return { protocol_type: 'seeworld', integration_level: 'A', device_name_prefix: 'R58L' };
      default:
        return { protocol_type: 'generic', integration_level: 'A', device_name_prefix: 'Tracker' };
    }
  };

  const { data: vehicles = [] } = useQuery({
    queryKey: ['cars-vehicles-select', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('id, make, model, license_plate')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('license_plate');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || !vehicleId) throw new Error('Pflichtfelder fehlen');

      let deviceId: string | null = null;

      // Create device + external ref if tracker requested
      if (withTracker && imei.trim()) {
        const config = getDeviceConfig(manufacturer);
        const { data: device, error: devErr } = await supabase
          .from('cars_devices')
          .insert({
            tenant_id: activeTenantId,
            imei: imei.trim(),
            manufacturer,
            protocol_type: config.protocol_type,
            integration_level: config.integration_level,
            source_type: 'traccar',
          })
          .select('id')
          .single();
        if (devErr) throw new Error(`Gerät erstellen: ${devErr.message}`);
        deviceId = device.id;

        // Insert external ref (to be mapped in Traccar later)
        await supabase.from('cars_device_external_refs').insert({
          tenant_id: activeTenantId,
          device_id: deviceId,
          source_type: 'traccar',
          external_device_id: imei.trim(), // will be updated to actual Traccar deviceId
        });

        // Initialize device status
        await supabase.from('cars_device_status').insert({
          device_id: deviceId,
          tenant_id: activeTenantId,
          is_online: false,
        });

        // Try to register device in Traccar (graceful — skips if secrets not configured)
        try {
          const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
          const deviceName = `${config.device_name_prefix} – ${selectedVehicle?.license_plate || imei.trim()}`;
          await supabase.functions.invoke('sot-telematics-sync', {
            body: {
              action: 'register_device',
              device_id: deviceId,
              imei: imei.trim(),
              device_name: deviceName,
              tenant_id: activeTenantId,
            },
          });
        } catch {
          // Traccar registration will be retried when secrets are available
          console.log('Traccar registration skipped (secrets not configured yet)');
        }
      }

      // Create logbook
      const { error: lbErr } = await supabase
        .from('cars_logbooks')
        .insert({
          tenant_id: activeTenantId,
          vehicle_id: vehicleId,
          device_id: deviceId,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
        });
      if (lbErr) throw new Error(`Fahrtenbuch erstellen: ${lbErr.message}`);
    },
    onSuccess: () => {
      toast.success('Fahrtenbuch erstellt');
      qc.invalidateQueries({ queryKey: ['cars-logbooks'] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Neues Fahrtenbuch
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Step 1: Vehicle */}
        <div className="space-y-1.5">
          <Label className="text-xs">Fahrzeug auswählen</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Fahrzeug wählen…" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    {v.license_plate || `${v.make} ${v.model}`}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Optional Tracker */}
        <div className="flex items-center gap-2">
          <Switch checked={withTracker} onCheckedChange={setWithTracker} />
          <Label className="text-xs flex items-center gap-1.5 cursor-pointer">
            <Wifi className="h-3 w-3" />
            GPS-Tracker verbinden
          </Label>
        </div>

        {withTracker && (
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">IMEI</Label>
              <Input
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="123456789012345"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Hersteller</Label>
              <Select value={manufacturer} onValueChange={setManufacturer}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teltonika_fmm003">Teltonika FMM003 (OBD2)</SelectItem>
                  <SelectItem value="seeworld_r58l">Seeworld R58L 4G</SelectItem>
                  <SelectItem value="generic">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full gap-2"
          size="sm"
          disabled={!vehicleId || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Fahrtenbuch erstellen
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * LogbookDeviceInfo — Device status section (Tab A)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, Cpu, Radio, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props { deviceId: string | null; }

export function LogbookDeviceInfo({ deviceId }: Props) {
  const { data: device } = useQuery({
    queryKey: ['cars-device', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const { data, error } = await supabase
        .from('cars_devices')
        .select('*')
        .eq('id', deviceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId,
  });

  const { data: status } = useQuery({
    queryKey: ['cars-device-status', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const { data, error } = await supabase
        .from('cars_device_status')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId,
  });

  if (!deviceId) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <WifiOff className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Kein Tracker verbunden</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Verbinden Sie einen GPS-Tracker, um automatisch Fahrten zu erfassen
        </p>
      </div>
    );
  }

  const isOnline = status?.is_online ?? false;
  const level = device?.integration_level || 'A';

  return (
    <div className="space-y-3">
      {/* Status Banner */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${isOnline ? 'bg-status-success/5 border-status-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
        {isOnline ? <Wifi className="h-4 w-4 text-status-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
        <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
        {status?.last_signal_at && (
          <span className="text-xs text-muted-foreground ml-auto">
            Letztes Signal: {format(new Date(status.last_signal_at), 'dd.MM.yy HH:mm', { locale: de })}
          </span>
        )}
      </div>

      {/* Device Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <InfoItem icon={Cpu} label="IMEI" value={device?.imei || '—'} />
        <InfoItem icon={Radio} label="Protokoll" value={device?.protocol_type || '—'} />
        <InfoItem icon={Activity} label="Hersteller" value={device?.manufacturer || '—'} />
        <InfoItem icon={Clock} label="Intervall" value={`${device?.upload_interval_sec || 30}s`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Activity className="h-2.5 w-2.5" /> Integration Level
          </span>
          <Badge variant="outline" className={`w-fit text-[10px] ${level === 'B' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted'}`}>
            Standard {level} — {level === 'B' ? 'Erweitert (Ignition/Odometer)' : 'Basis (GPS)'}
          </Badge>
        </div>
        <InfoItem icon={Radio} label="Datenquelle" value="Telematics Gateway" />
      </div>

      {/* Last Position */}
      {status?.last_lat && status?.last_lon && (
        <div className="text-xs text-muted-foreground">
          Letzte Position: {status.last_lat.toFixed(5)}, {status.last_lon.toFixed(5)}
          {status.last_speed ? ` · ${Math.round(status.last_speed)} km/h` : ''}
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-2.5 w-2.5" /> {label}
      </span>
      <span className="text-xs font-medium font-mono">{value}</span>
    </div>
  );
}

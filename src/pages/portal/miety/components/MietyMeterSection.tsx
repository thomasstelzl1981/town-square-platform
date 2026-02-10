/**
 * MietyMeterSection — Meter reading tiles with last reading + placeholder
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Droplets, Flame, Thermometer, Plus } from 'lucide-react';
import { format } from 'date-fns';

const METER_CONFIG: Record<string, { label: string; icon: any; unit: string }> = {
  strom: { label: 'Strom', icon: Zap, unit: 'kWh' },
  gas: { label: 'Gas', icon: Flame, unit: 'm³' },
  wasser: { label: 'Wasser', icon: Droplets, unit: 'm³' },
  heizung: { label: 'Heizung', icon: Thermometer, unit: 'kWh' },
};

interface MietyMeterSectionProps {
  homeId: string;
  onOpenDrawer: () => void;
}

export function MietyMeterSection({ homeId, onOpenDrawer }: MietyMeterSectionProps) {
  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings', homeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('miety_meter_readings')
        .select('*')
        .eq('home_id', homeId)
        .order('reading_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get latest reading per type
  const latestByType: Record<string, any> = {};
  readings.forEach(r => {
    if (!latestByType[r.meter_type]) latestByType[r.meter_type] = r;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Zählerstände</span>
        <Button size="sm" variant="ghost" onClick={onOpenDrawer}>
          <Plus className="h-3.5 w-3.5 mr-1" />Erfassen
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(METER_CONFIG).map(([type, cfg]) => {
          const latest = latestByType[type];
          const Icon = cfg.icon;
          return (
            <Card key={type} className={latest ? 'glass-card' : 'border-dashed border-muted-foreground/20'}>
              <CardContent className="p-4 text-center space-y-1.5">
                <Icon className={`h-6 w-6 mx-auto ${latest ? 'text-primary' : 'text-muted-foreground/30'}`} />
                <p className="text-xs font-medium">{cfg.label}</p>
                {latest ? (
                  <>
                    <p className="text-lg font-semibold">{Number(latest.reading_value).toLocaleString('de-DE')}</p>
                    <p className="text-xs text-muted-foreground">{cfg.unit} · {format(new Date(latest.reading_date), 'dd.MM.yy')}</p>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={onOpenDrawer} className="text-xs mt-1">
                    <Plus className="h-3 w-3 mr-1" />Erfassen
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

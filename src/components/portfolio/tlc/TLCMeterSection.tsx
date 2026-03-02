/**
 * TLC Meter Readings Section — Zählerstände for a unit
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';
import { Gauge, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { MeterReading } from '@/hooks/useMeterReadings';

interface Props {
  readings: MeterReading[];
  loading: boolean;
  onFetch: () => void;
}

const meterLabels: Record<string, string> = {
  electricity: 'Strom',
  gas: 'Gas',
  water_cold: 'Kaltwasser',
  water_hot: 'Warmwasser',
  heating: 'Heizung',
  district_heating: 'Fernwärme',
};

export function TLCMeterSection({ readings, loading, onFetch }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && readings.length === 0 && !loading) {
      onFetch();
    }
  }, [open, readings.length, loading, onFetch]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5" />
            Zählerstände ({readings.length})
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {loading ? (
          <p className="text-xs text-muted-foreground p-2">Lädt…</p>
        ) : readings.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">Keine Zählerstände erfasst</p>
        ) : (
          readings.slice(0, 20).map(reading => (
            <div
              key={reading.id}
              className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] px-1 py-0">
                  {meterLabels[reading.meter_type] || reading.meter_type}
                </Badge>
                {reading.meter_number && (
                  <span className="text-muted-foreground">#{reading.meter_number}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium">{reading.reading_value.toLocaleString('de-DE')}</span>
                <span className="text-muted-foreground">
                  {format(new Date(reading.reading_date), 'dd.MM.yyyy', { locale: de })}
                </span>
              </div>
            </div>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * LogbookTripList — Full trip overview with month filter (Tab C)
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MapPin, ArrowRight, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props { logbookId: string; }

const classColors: Record<string, string> = {
  business: 'bg-primary/10 text-primary border-primary/20',
  private: 'bg-muted text-muted-foreground border-muted-foreground/20',
  commute: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  unclassified: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};
const classLabels: Record<string, string> = {
  business: 'Geschäftlich', private: 'Privat', commute: 'Arbeitsweg', unclassified: 'Offen',
};

export function LogbookTripList({ logbookId }: Props) {
  const now = new Date();
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, i);
      return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: de }) };
    });
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);

  const monthStart = startOfMonth(new Date(selectedMonth + '-01')).toISOString();
  const monthEnd = endOfMonth(new Date(selectedMonth + '-01')).toISOString();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['cars-trip-list', logbookId, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_trips')
        .select('id, start_at, end_at, start_address, end_address, distance_km, classification, is_locked, purpose')
        .eq('logbook_id', logbookId)
        .gte('start_at', monthStart)
        .lte('start_at', monthEnd)
        .order('start_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalKm = trips.reduce((s: number, t: any) => s + (t.distance_km || 0), 0);
  const businessKm = trips.filter((t: any) => t.classification === 'business').reduce((s: number, t: any) => s + (t.distance_km || 0), 0);

  return (
    <div className="space-y-3">
      {/* Filter + Summary */}
      <div className="flex items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{trips.length} Fahrten</span>
          <span>{totalKm.toFixed(1)} km gesamt</span>
          <span>{businessKm.toFixed(1)} km geschäftlich</span>
        </div>
      </div>

      {/* Trip Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">Laden…</div>
      ) : trips.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Keine Fahrten im gewählten Monat</div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-auto">
          {trips.map((trip: any) => (
            <div key={trip.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 text-xs">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {trip.is_locked ? (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                ) : trip.classification !== 'unclassified' ? (
                  <CheckCircle className="h-3 w-3 text-status-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
              </div>
              {/* Time */}
              <span className="w-[85px] flex-shrink-0 text-muted-foreground font-mono text-[10px]">
                {format(new Date(trip.start_at), 'dd.MM. HH:mm', { locale: de })}
              </span>
              {/* Route */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <MapPin className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{trip.start_address || '—'}</span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{trip.end_address || '—'}</span>
              </div>
              {/* Distance */}
              <span className="w-[60px] text-right flex-shrink-0 font-medium">{trip.distance_km?.toFixed(1)} km</span>
              {/* Classification */}
              <Badge variant="outline" className={`text-[8px] h-4 flex-shrink-0 ${classColors[trip.classification] || ''}`}>
                {classLabels[trip.classification] || trip.classification}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LogbookOpenTrips — Quick classification of unclassified trips (Tab B)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Home, Route, MapPin, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

interface Props { logbookId: string; }

type Classification = 'business' | 'private' | 'commute';

const classLabels: Record<Classification, { label: string; icon: any; className: string }> = {
  business: { label: 'Geschäftlich', icon: Briefcase, className: 'bg-primary/10 text-primary hover:bg-primary/20' },
  private: { label: 'Privat', icon: Home, className: 'bg-muted hover:bg-muted/80' },
  commute: { label: 'Arbeitsweg', icon: Route, className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
};

export function LogbookOpenTrips({ logbookId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['cars-open-trips', logbookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_trips')
        .select('id, start_at, end_at, start_address, end_address, start_lat, start_lon, end_lat, end_lon, distance_km')
        .eq('logbook_id', logbookId)
        .eq('classification', 'unclassified')
        .eq('is_locked', false)
        .order('start_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const classifyMut = useMutation({
    mutationFn: async ({ tripId, classification, purpose, businessPartner }: {
      tripId: string; classification: Classification; purpose?: string; businessPartner?: string;
    }) => {
      // Update trip
      const updates: any = { classification };
      if (purpose) updates.purpose = purpose;
      if (businessPartner) updates.business_partner = businessPartner;

      const { error } = await supabase.from('cars_trips').update(updates).eq('id', tripId);
      if (error) throw error;

      // Audit log
      const { data: tripData } = await supabase.from('cars_trips').select('tenant_id').eq('id', tripId).single();
      await supabase.from('cars_trip_audit').insert({
        trip_id: tripId,
        field_changed: 'classification',
        old_value: 'unclassified',
        new_value: classification,
        changed_by: user?.id || '',
        tenant_id: tripData?.tenant_id || '',
        reason: 'Schnellklassifizierung',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars-open-trips', logbookId] });
      qc.invalidateQueries({ queryKey: ['cars-logbook-open-trips'] });
      toast.success('Fahrt klassifiziert');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Laden…</div>;

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle className="h-8 w-8 text-status-success/50 mb-3" />
        <p className="text-sm text-muted-foreground">Keine offenen Fahrten</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Alle Fahrten sind klassifiziert</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{trips.length} offene Fahrt(en) — bitte klassifizieren</p>
      {trips.map((trip: any) => (
        <OpenTripCard
          key={trip.id}
          trip={trip}
          onClassify={(c, purpose, bp) => classifyMut.mutate({ tripId: trip.id, classification: c, purpose, businessPartner: bp })}
          isPending={classifyMut.isPending}
        />
      ))}
    </div>
  );
}

function OpenTripCard({ trip, onClassify, isPending }: {
  trip: any;
  onClassify: (c: Classification, purpose?: string, bp?: string) => void;
  isPending: boolean;
}) {
  const [purpose, setPurpose] = useState('');
  const [bp, setBp] = useState('');

  const startLabel = trip.start_address || (trip.start_lat ? `${trip.start_lat.toFixed(3)}, ${trip.start_lon.toFixed(3)}` : '—');
  const endLabel = trip.end_address || (trip.end_lat ? `${trip.end_lat.toFixed(3)}, ${trip.end_lon.toFixed(3)}` : '—');

  return (
    <div className="p-3 rounded-lg border border-border/50 space-y-2">
      {/* Route */}
      <div className="flex items-center gap-1.5 text-xs">
        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{startLabel}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{endLabel}</span>
      </div>
      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {format(new Date(trip.start_at), 'dd.MM. HH:mm', { locale: de })}
        </span>
        <Badge variant="outline" className="text-[8px] h-4">{trip.distance_km?.toFixed(1)} km</Badge>
      </div>
      {/* Inline fields */}
      <div className="grid grid-cols-2 gap-2">
        <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Zweck (optional)" className="h-7 text-[10px]" />
        <Input value={bp} onChange={e => setBp(e.target.value)} placeholder="Geschäftspartner" className="h-7 text-[10px]" />
      </div>
      {/* Classification Buttons */}
      <div className="flex gap-1.5">
        {(Object.entries(classLabels) as [Classification, typeof classLabels.business][]).map(([key, { label, icon: Icon, className }]) => (
          <Button
            key={key}
            size="sm"
            variant="outline"
            className={`h-7 text-[10px] gap-1 flex-1 ${className}`}
            disabled={isPending}
            onClick={() => onClassify(key, purpose || undefined, bp || undefined)}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

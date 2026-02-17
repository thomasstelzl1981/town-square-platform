/**
 * PMBuchungen — Kalender & Buchungsverwaltung (Pet Manager)
 * Phase 2: Mit Belegungsprüfung vor Buchungsannahme
 */
import { useState } from 'react';
import { Calendar, Check, X, Clock, PawPrint, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyProvider, useBookings, useUpdateBookingStatus, type PetBooking } from '@/hooks/usePetBookings';
import { usePetCapacity } from '@/hooks/usePetCapacity';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Angefragt', confirmed: 'Bestätigt', in_progress: 'Laufend',
  completed: 'Abgeschlossen', cancelled: 'Storniert', no_show: 'Nicht erschienen',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'outline', confirmed: 'default', in_progress: 'default',
  completed: 'secondary', cancelled: 'destructive', no_show: 'destructive',
};

function BookingRow({ booking, onUpdateStatus, capacityWarning }: {
  booking: PetBooking;
  onUpdateStatus: (id: string, status: string) => void;
  capacityWarning?: 'full' | 'almost' | null;
}) {
  const handleConfirm = () => {
    if (capacityWarning === 'full') {
      toast.error('Kapazität erschöpft — Buchung kann nicht angenommen werden.');
      return;
    }
    if (capacityWarning === 'almost') {
      toast.warning('Achtung: Fast ausgebucht an diesem Tag.');
    }
    onUpdateStatus(booking.id, 'confirmed');
  };

  return (
    <div className={cn(DESIGN.LIST.ROW, 'flex-col sm:flex-row items-start')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{booking.service?.title}</p>
          <Badge variant={STATUS_COLORS[booking.status] || 'secondary'} className="text-[10px]">
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(booking.scheduled_date), 'dd.MM.yyyy', { locale: de })}</span>
          {booking.scheduled_time_start && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.scheduled_time_start.slice(0, 5)}</span>}
          <span className="flex items-center gap-1"><PawPrint className="h-3 w-3" />{booking.pet?.name}</span>
        </div>
        {booking.client_notes && <p className="text-xs text-muted-foreground mt-1 italic">„{booking.client_notes}"</p>}
      </div>
      <div className="flex gap-1 shrink-0 mt-2 sm:mt-0">
        {booking.status === 'requested' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className={cn('h-7 gap-1 text-xs', capacityWarning === 'full' && 'opacity-50')}
              onClick={handleConfirm}
              disabled={capacityWarning === 'full'}
            >
              <Check className="h-3 w-3" /> Annehmen
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onUpdateStatus(booking.id, 'cancelled')}>
              <X className="h-3 w-3" /> Ablehnen
            </Button>
            {capacityWarning === 'full' && (
              <span className="flex items-center gap-1 text-[10px] text-destructive">
                <AlertTriangle className="h-3 w-3" /> Voll
              </span>
            )}
          </>
        )}
        {booking.status === 'confirmed' && (
          <>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onUpdateStatus(booking.id, 'in_progress')}>
              <LogIn className="h-3 w-3" /> Check-In
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onUpdateStatus(booking.id, 'cancelled')}>
              <X className="h-3 w-3" /> Stornieren
            </Button>
          </>
        )}
        {booking.status === 'in_progress' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onUpdateStatus(booking.id, 'completed')}>
            <LogOut className="h-3 w-3" /> Check-Out
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PMBuchungen() {
  const { data: provider } = useMyProvider();
  const { data: allBookings = [], isLoading } = useBookings(provider ? { providerId: provider.id } : undefined);
  const { data: capacity } = usePetCapacity(provider?.id);
  const updateStatus = useUpdateBookingStatus();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PET');
  const bookings = demoEnabled ? allBookings : allBookings.filter(b => !isDemoId(b.id));

  const handleUpdate = (id: string, status: string) => updateStatus.mutate({ id, status });

  const pending = bookings.filter(b => b.status === 'requested');
  const active = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status));

  const getCapacityWarning = (booking: PetBooking): 'full' | 'almost' | null => {
    if (!capacity) return null;
    // Check capacity for the booking's specific date (simplified: uses today's capacity)
    if (capacity.isFullyBooked) return 'full';
    if (capacity.availableSlots <= 2) return 'almost';
    return null;
  };

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender & Buchungen</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Kalender & Buchungen</h1>
      </div>

      {/* Capacity banner */}
      {capacity?.isFullyBooked && (
        <div className={cn(DESIGN.INFO_BANNER.BASE, DESIGN.INFO_BANNER.WARNING, 'flex items-center gap-2')}>
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm">Heute ausgebucht — {capacity.bookedToday}/{capacity.totalCapacity} Plätze belegt. Neue Anfragen können nicht angenommen werden.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-accent-foreground">{pending.length}</p><p className="text-xs text-muted-foreground">Offene Anfragen</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{active.length}</p><p className="text-xs text-muted-foreground">Aktive Buchungen</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{past.length}</p><p className="text-xs text-muted-foreground">Abgeschlossen</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Anfragen ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Aktiv ({active.length})</TabsTrigger>
          <TabsTrigger value="past">Historie ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2 mt-4">
          {pending.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Keine offenen Anfragen</p> :
            pending.map(b => <BookingRow key={b.id} booking={b} onUpdateStatus={handleUpdate} capacityWarning={getCapacityWarning(b)} />)}
        </TabsContent>

        <TabsContent value="active" className="space-y-2 mt-4">
          {active.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Keine aktiven Buchungen</p> :
            active.map(b => <BookingRow key={b.id} booking={b} onUpdateStatus={handleUpdate} />)}
        </TabsContent>

        <TabsContent value="past" className="space-y-2 mt-4">
          {past.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Noch keine Buchungshistorie</p> :
            past.map(b => <BookingRow key={b.id} booking={b} onUpdateStatus={handleUpdate} />)}
        </TabsContent>
      </Tabs>
    </div>
    </PageShell>
  );
}

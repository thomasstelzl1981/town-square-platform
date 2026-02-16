/**
 * PMBuchungen — Kalender & Buchungsverwaltung (Pet Manager)
 */
import { useState } from 'react';
import { Calendar, Check, X, Clock, User, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyProvider, useBookings, useUpdateBookingStatus, type PetBooking } from '@/hooks/usePetBookings';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Angefragt', confirmed: 'Bestätigt', in_progress: 'Laufend',
  completed: 'Abgeschlossen', cancelled: 'Storniert', no_show: 'Nicht erschienen',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'outline', confirmed: 'default', in_progress: 'default',
  completed: 'secondary', cancelled: 'destructive', no_show: 'destructive',
};

function BookingRow({ booking, onUpdateStatus }: { booking: PetBooking; onUpdateStatus: (id: string, status: string) => void }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{booking.service?.title}</p>
          <Badge variant={STATUS_COLORS[booking.status] || 'secondary'} className="text-[10px]">
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(booking.scheduled_date), 'dd.MM.yyyy', { locale: de })}</span>
          {booking.scheduled_time_start && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.scheduled_time_start.slice(0, 5)}</span>}
          <span className="flex items-center gap-1"><PawPrint className="h-3 w-3" />{booking.pet?.name}</span>
        </div>
        {booking.client_notes && <p className="text-xs text-muted-foreground mt-1 italic">„{booking.client_notes}"</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        {booking.status === 'requested' && (
          <>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onUpdateStatus(booking.id, 'confirmed')}>
              <Check className="h-3 w-3" /> Annehmen
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onUpdateStatus(booking.id, 'cancelled')}>
              <X className="h-3 w-3" /> Ablehnen
            </Button>
          </>
        )}
        {booking.status === 'confirmed' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onUpdateStatus(booking.id, 'completed')}>
            <Check className="h-3 w-3" /> Erledigt
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PMBuchungen() {
  const { data: provider } = useMyProvider();
  const { data: bookings = [], isLoading } = useBookings(provider ? { providerId: provider.id } : undefined);
  const updateStatus = useUpdateBookingStatus();

  const handleUpdate = (id: string, status: string) => updateStatus.mutate({ id, status });

  const pending = bookings.filter(b => b.status === 'requested');
  const active = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status));

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Kalender & Buchungen</h1>
      </div>

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
            pending.map(b => <BookingRow key={b.id} booking={b} onUpdateStatus={handleUpdate} />)}
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
  );
}

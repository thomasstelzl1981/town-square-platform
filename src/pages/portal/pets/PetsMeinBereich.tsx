/**
 * PetsMeinBereich — Buchungshistorie und aktive Buchungen
 */
import { Calendar, Clock, PawPrint, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings, useUpdateBookingStatus, type PetBooking } from '@/hooks/usePetBookings';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  requested: { label: 'Angefragt', variant: 'outline', icon: AlertCircle },
  confirmed: { label: 'Bestätigt', variant: 'default', icon: CheckCircle2 },
  in_progress: { label: 'Laufend', variant: 'default', icon: Clock },
  completed: { label: 'Abgeschlossen', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Storniert', variant: 'destructive', icon: XCircle },
  no_show: { label: 'Nicht erschienen', variant: 'destructive', icon: XCircle },
};

function BookingCard({ booking, onCancel }: { booking: PetBooking; onCancel?: (id: string) => void }) {
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.requested;
  const StatusIcon = cfg.icon;
  const canCancel = ['requested', 'confirmed'].includes(booking.status);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${booking.status === 'completed' ? 'text-emerald-500' : booking.status === 'cancelled' ? 'text-destructive' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{booking.service?.title}</p>
          <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{booking.provider?.company_name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(booking.scheduled_date), 'dd.MM.yyyy', { locale: de })}</span>
          {booking.scheduled_time_start && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.scheduled_time_start.slice(0, 5)}</span>}
          <span className="flex items-center gap-1"><PawPrint className="h-3 w-3" />{booking.pet?.name}</span>
          {booking.price_cents > 0 && <span className="font-medium">{(booking.price_cents / 100).toFixed(2)} €</span>}
        </div>
      </div>
      {canCancel && onCancel && (
        <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => onCancel(booking.id)}>
          Stornieren
        </Button>
      )}
    </div>
  );
}

export default function PetsMeinBereich() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useBookings(user ? { clientUserId: user.id } : undefined);
  const updateStatus = useUpdateBookingStatus();

  const handleCancel = (id: string) => updateStatus.mutate({ id, status: 'cancelled' });

  const active = bookings.filter(b => ['requested', 'confirmed', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status));

  return (
    <PageShell>
      <ModulePageHeader title="MEIN BEREICH" description="Ihre Buchungen und Service-Übersicht" />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{active.length}</p><p className="text-xs text-muted-foreground">Aktive Buchungen</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{past.length}</p><p className="text-xs text-muted-foreground">Abgeschlossen</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{bookings.reduce((sum, b) => b.status === 'completed' ? sum + b.price_cents : sum, 0) / 100 > 0 ? `${(bookings.reduce((sum, b) => b.status === 'completed' ? sum + b.price_cents : sum, 0) / 100).toFixed(0)} €` : '0 €'}</p><p className="text-xs text-muted-foreground">Gesamtausgaben</p></CardContent></Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Aktiv ({active.length})</TabsTrigger>
          <TabsTrigger value="past">Historie ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2 mt-4">
          {isLoading ? <p className="text-sm text-muted-foreground text-center py-6">Laden…</p> :
           active.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Keine aktiven Buchungen</p> :
           active.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
        </TabsContent>

        <TabsContent value="past" className="space-y-2 mt-4">
          {past.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Noch keine Buchungshistorie</p> :
           past.map(b => <BookingCard key={b.id} booking={b} />)}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

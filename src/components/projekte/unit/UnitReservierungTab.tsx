/**
 * UnitReservierungTab — Reservation status display
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { DevProjectReservation } from '@/types/projekte';

interface UnitReservierungTabProps {
  reservation: DevProjectReservation | null;
  formatCurrency: (value: number | null) => string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof Clock; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { icon: Clock, label: 'Ausstehend', variant: 'secondary' },
    confirmed: { icon: CheckCircle, label: 'Bestätigt', variant: 'default' },
    notary_scheduled: { icon: Clock, label: 'Notar geplant', variant: 'default' },
    completed: { icon: CheckCircle, label: 'Abgeschlossen', variant: 'default' },
    cancelled: { icon: XCircle, label: 'Storniert', variant: 'destructive' },
    expired: { icon: XCircle, label: 'Abgelaufen', variant: 'destructive' },
  };
  const { icon: Icon, label, variant } = config[status] || config.pending;
  return <Badge variant={variant} className="gap-1"><Icon className="h-3 w-3" />{label}</Badge>;
}

export function UnitReservierungTab({ reservation, formatCurrency }: UnitReservierungTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservierungsstatus</CardTitle>
        <CardDescription>{reservation ? 'Aktive Reservierung vorhanden' : 'Keine aktive Reservierung'}</CardDescription>
      </CardHeader>
      <CardContent>
        {reservation ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <StatusBadge status={reservation.status} />
              <span className="text-sm text-muted-foreground">seit {new Date(reservation.reservation_date).toLocaleDateString('de-DE')}</span>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Käufer</Label>
                <p className="font-medium">{reservation.buyer_contact ? `${reservation.buyer_contact.first_name} ${reservation.buyer_contact.last_name}` : '–'}</p>
                {reservation.buyer_contact?.email && <p className="text-sm text-muted-foreground">{reservation.buyer_contact.email}</p>}
              </div>
              <div><Label className="text-muted-foreground">Partner</Label><p className="font-medium">{reservation.partner_org?.name ?? '–'}</p></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label className="text-muted-foreground">Reservierungspreis</Label><p className="font-medium">{formatCurrency(reservation.reserved_price)}</p></div>
              <div><Label className="text-muted-foreground">Ablaufdatum</Label><p className="font-medium">{reservation.expiry_date ? new Date(reservation.expiry_date).toLocaleDateString('de-DE') : '–'}</p></div>
            </div>
            {reservation.notary_date && <div><Label className="text-muted-foreground">Notartermin</Label><p className="font-medium">{new Date(reservation.notary_date).toLocaleDateString('de-DE')}</p></div>}
            {reservation.notes && <div><Label className="text-muted-foreground">Notizen</Label><p className="text-sm">{reservation.notes}</p></div>}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Diese Einheit ist aktuell frei verfügbar.</p>
            <p className="text-sm mt-2">Eine Reservierung kann über die Projektakte erstellt werden.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

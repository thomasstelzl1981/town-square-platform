/**
 * PMKunden — Kunden & Tiere (Pet Manager)
 * Zeigt alle Kunden mit deren Tieren basierend auf Buchungsdaten
 */
import { Users, PawPrint, Calendar, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMemo } from 'react';

interface ClientSummary {
  clientUserId: string;
  petNames: Set<string>;
  petSpecies: Set<string>;
  bookingCount: number;
  lastBookingDate: string;
}

export default function PMKunden() {
  const { data: provider } = useMyProvider();
  const { data: bookings = [], isLoading } = useBookings(provider ? { providerId: provider.id } : undefined);

  const clients = useMemo(() => {
    const map = new Map<string, ClientSummary>();
    for (const b of bookings) {
      const cid = b.client_user_id || 'unknown';
      const existing = map.get(cid);
      if (existing) {
        existing.bookingCount++;
        if (b.pet?.name) existing.petNames.add(b.pet.name);
        if (b.pet?.species) existing.petSpecies.add(b.pet.species);
        if (b.scheduled_date > existing.lastBookingDate) existing.lastBookingDate = b.scheduled_date;
      } else {
        map.set(cid, {
          clientUserId: cid,
          petNames: new Set(b.pet?.name ? [b.pet.name] : []),
          petSpecies: new Set(b.pet?.species ? [b.pet.species] : []),
          bookingCount: 1,
          lastBookingDate: b.scheduled_date,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastBookingDate.localeCompare(a.lastBookingDate));
  }, [bookings]);

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Kunden & Tiere</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Kunden & Tiere</h1>
        </div>
        <Badge variant="outline" className="text-xs">{clients.length} Kunden</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Noch keine Kunden. Kunden werden automatisch erfasst, sobald Buchungen eingehen.</p>
        </div>
      ) : (
        <div className={DESIGN.LIST.GAP}>
          {clients.map(c => (
            <Card key={c.clientUserId} className={DESIGN.CARD.SECTION}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Kunde {c.clientUserId.slice(0, 8)}…
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {Array.from(c.petNames).map(name => (
                          <Badge key={name} variant="secondary" className="text-[10px] gap-1">
                            <PawPrint className="h-2.5 w-2.5" /> {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Hash className="h-3 w-3" /> {c.bookingCount} Buchungen
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Calendar className="h-3 w-3" /> {format(parseISO(c.lastBookingDate), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

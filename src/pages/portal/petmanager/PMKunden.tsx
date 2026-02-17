/**
 * PMKunden — Kunden & Tiere (Pet Manager)
 * Shows clients with real names from profiles, plus expandable dossier
 */
import { Users, PawPrint, Calendar, Hash, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { DESIGN } from '@/config/designManifest';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientSummary {
  clientUserId: string;
  displayName: string;
  email: string | null;
  // phone removed — not on profiles table
  avatarUrl: string | null;
  petNames: Set<string>;
  petSpecies: Set<string>;
  bookingCount: number;
  lastBookingDate: string;
  bookings: { id: string; date: string; status: string; petName: string; serviceName: string; priceCents: number }[];
}

function useClientProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['client_profiles', userIds],
    queryFn: async () => {
      if (!userIds.length) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds);
      const map: Record<string, { first_name: string | null; last_name: string | null; email: string | null; avatar_url: string | null }> = {};
      for (const p of data || []) {
        map[p.id] = p;
      }
      return map;
    },
    enabled: userIds.length > 0,
  });
}

export default function PMKunden() {
  const { data: provider } = useMyProvider();
  const { data: bookings = [], isLoading } = useBookings(provider ? { providerId: provider.id } : undefined);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Collect unique client user IDs
  const clientUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const b of bookings) {
      if (b.client_user_id) ids.add(b.client_user_id);
    }
    return Array.from(ids);
  }, [bookings]);

  const { data: profileMap = {} } = useClientProfiles(clientUserIds);

  const clients = useMemo(() => {
    const map = new Map<string, ClientSummary>();
    for (const b of bookings) {
      const cid = b.client_user_id || 'unknown';
      const profile = profileMap[cid];
      const displayName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || `Kunde ${cid.slice(0, 8)}…`
        : `Kunde ${cid.slice(0, 8)}…`;

      const bookingEntry = {
        id: b.id,
        date: b.scheduled_date,
        status: b.status,
        petName: b.pet?.name || '–',
        serviceName: b.service?.title || '–',
        priceCents: b.price_cents,
      };

      const existing = map.get(cid);
      if (existing) {
        existing.bookingCount++;
        if (b.pet?.name) existing.petNames.add(b.pet.name);
        if (b.pet?.species) existing.petSpecies.add(b.pet.species);
        if (b.scheduled_date > existing.lastBookingDate) existing.lastBookingDate = b.scheduled_date;
        existing.bookings.push(bookingEntry);
      } else {
        map.set(cid, {
          clientUserId: cid,
          displayName,
          email: profile?.email || null,
          avatarUrl: profile?.avatar_url || null,
          petNames: new Set(b.pet?.name ? [b.pet.name] : []),
          petSpecies: new Set(b.pet?.species ? [b.pet.species] : []),
          bookingCount: 1,
          lastBookingDate: b.scheduled_date,
          bookings: [bookingEntry],
        });
      }
    }
    // Sort bookings within each client
    for (const c of map.values()) {
      c.bookings.sort((a, b) => b.date.localeCompare(a.date));
    }
    return Array.from(map.values()).sort((a, b) => b.lastBookingDate.localeCompare(a.lastBookingDate));
  }, [bookings, profileMap]);

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

  const statusLabel: Record<string, string> = {
    requested: 'Angefragt',
    confirmed: 'Bestätigt',
    in_progress: 'Laufend',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
  };

  const statusVariant = (s: string) => {
    if (s === 'completed') return 'secondary' as const;
    if (s === 'cancelled') return 'destructive' as const;
    if (s === 'in_progress') return 'default' as const;
    return 'outline' as const;
  };

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
          {clients.map(c => {
            const isExpanded = expandedClient === c.clientUserId;
            return (
              <Card key={c.clientUserId} className={DESIGN.CARD.SECTION}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.displayName}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {c.email && (
                            <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{c.email}</span>
                          )}
                        </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setExpandedClient(isExpanded ? null : c.clientUserId)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <span className="ml-1">Akte</span>
                      </Button>
                    </div>
                  </div>

                  {/* Expanded dossier */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Buchungshistorie</p>
                      <div className="space-y-1.5">
                        {c.bookings.slice(0, 10).map(bk => (
                          <div key={bk.id} className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-muted-foreground w-[70px] shrink-0">
                                {format(parseISO(bk.date), 'dd.MM.yy', { locale: de })}
                              </span>
                              <span className="truncate">{bk.serviceName}</span>
                              <span className="text-muted-foreground">· {bk.petName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-medium">{(bk.priceCents / 100).toFixed(2)} €</span>
                              <Badge variant={statusVariant(bk.status)} className="text-[10px]">
                                {statusLabel[bk.status] || bk.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {c.bookings.length > 10 && (
                          <p className="text-[10px] text-muted-foreground">+ {c.bookings.length - 10} weitere</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * SLC Monitor Tab — Sales Lifecycle overview for Zone 1
 * Includes: Cases table, Channel Drift, Active Reservations
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Radio, CalendarCheck } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesCases } from '@/hooks/useSalesCases';
import { useChannelDrift } from '@/hooks/useChannelDrift';
import { SLC_PHASE_LABELS } from '@/engines/slc/spec';
import type { SLCPhase } from '@/engines/slc/spec';
import { isStuck } from '@/engines/slc/engine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PHASE_COLORS: Partial<Record<SLCPhase, string>> = {
  mandate_active: 'bg-muted text-muted-foreground',
  published: 'bg-primary/15 text-primary',
  inquiry: 'bg-accent text-accent-foreground',
  reserved: 'bg-orange-500/15 text-orange-600',
  contract_draft: 'bg-blue-500/15 text-blue-600',
  notary_scheduled: 'bg-violet-500/15 text-violet-600',
  notary_completed: 'bg-emerald-500/15 text-emerald-600',
  handover: 'bg-emerald-500/15 text-emerald-600',
  settlement: 'bg-amber-500/15 text-amber-700',
  closed_won: 'bg-primary/15 text-primary',
  closed_lost: 'bg-destructive/15 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  notary_scheduled: 'Notar geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  expired: 'Abgelaufen',
};

export default function SLCMonitorTab() {
  const { data: cases, isLoading } = useSalesCases();
  const { driftedItems, driftedCount } = useChannelDrift();

  // Active reservations (non-terminal)
  const { data: reservations } = useQuery({
    queryKey: ['sales-desk-monitor-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_reservations')
        .select(`
          id, status, reserved_price, reservation_date, expiry_date, notary_date,
          buyer_contact:contacts!sales_reservations_buyer_contact_id_fkey(first_name, last_name),
          partner_org:organizations!sales_reservations_partner_org_id_fkey(name),
          tenant:organizations!sales_reservations_tenant_id_fkey(name)
        `)
        .in('status', ['pending', 'confirmed', 'notary_scheduled'])
        .order('reservation_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const now = new Date();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const formatCurrency = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase">SLC Monitor</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">{cases?.length || 0} Fälle</Badge>
          {driftedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Radio className="h-3 w-3" /> {driftedCount} Drift
            </Badge>
          )}
        </div>
      </div>

      {/* ── Cases Table ── */}
      {!cases?.length ? (
        <EmptyState
          icon={Activity}
          title="Keine aktiven Verkaufsfälle"
          description="Verkaufsfälle aus MOD-06 und MOD-13 werden hier im Lifecycle dargestellt"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktive Verkaufsfälle</CardTitle>
            <CardDescription>Sales Lifecycle Controller — Phasen-Übersicht</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Eigentümer</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Käufer</TableHead>
                  <TableHead>Eröffnet</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map(c => {
                  const stuck = isStuck(c.current_phase, c.updated_at, now);
                  return (
                    <TableRow key={c.id} className={stuck ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div className="font-medium">{c.property?.address || c.asset_id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{c.property?.city || '–'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {c.asset_type === 'property_unit' ? 'Immobilie' : 'Projekteinheit'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.tenant?.name || '–'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${PHASE_COLORS[c.current_phase] || ''}`}>
                          {SLC_PHASE_LABELS[c.current_phase] || c.current_phase}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.contact ? `${c.contact.first_name || ''} ${c.contact.last_name || ''}`.trim() || '–' : '–'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.opened_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-center">
                        {stuck ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" /> Stuck
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Channel Drift ── */}
      {driftedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-destructive" />
              Channel Drift
            </CardTitle>
            <CardDescription>{driftedItems.length} Publikationen mit Synchronisierungsabweichung</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Expected Hash</TableHead>
                  <TableHead>Synced Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driftedItems.map((d, i) => (
                  <TableRow key={`${d.listing_id}-${d.channel}-${i}`}>
                    <TableCell className="font-mono text-xs">{d.listing_id.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{d.channel}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.expected_hash?.slice(0, 12) || '–'}</TableCell>
                    <TableCell className="font-mono text-xs text-destructive">{d.last_synced_hash?.slice(0, 12) || '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Active Reservations ── */}
      {reservations && reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              Aktive Reservierungen
            </CardTitle>
            <CardDescription>{reservations.length} laufende Reservierungen</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Käufer</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead>Reserviert am</TableHead>
                  <TableHead>Ablauf</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r: any) => {
                  const isExpiring = r.expiry_date && new Date(r.expiry_date) < new Date(Date.now() + 7 * 86400000);
                  return (
                    <TableRow key={r.id} className={isExpiring ? 'bg-amber-500/5' : ''}>
                      <TableCell className="font-medium">
                        {r.buyer_contact ? `${r.buyer_contact.first_name || ''} ${r.buyer_contact.last_name || ''}`.trim() : '–'}
                      </TableCell>
                      <TableCell className="text-sm">{r.partner_org?.name || '–'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(r.reserved_price)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.reservation_date ? new Date(r.reservation_date).toLocaleDateString('de-DE') : '–'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.expiry_date ? (
                          <span className={isExpiring ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {new Date(r.expiry_date).toLocaleDateString('de-DE')}
                          </span>
                        ) : '–'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {STATUS_LABELS[r.status] || r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

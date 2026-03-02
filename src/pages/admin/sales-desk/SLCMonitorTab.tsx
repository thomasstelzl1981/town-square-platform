/**
 * SLC Monitor Tab — Sales Lifecycle overview for Zone 1
 * Includes: Cases table with ACTION BUTTONS, Channel Drift, Active Reservations
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Activity, AlertTriangle, Radio, CalendarCheck, Play, XCircle, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesCases, type SalesCaseRow } from '@/hooks/useSalesCases';
import { useChannelDrift } from '@/hooks/useChannelDrift';
import { SLC_PHASE_LABELS } from '@/engines/slc/spec';
import type { SLCPhase, SLCEventType } from '@/engines/slc/spec';
import { isStuck, isValidTransition } from '@/engines/slc/engine';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSLCEventRecorder } from '@/hooks/useSLCEventRecorder';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PHASE_COLORS: Partial<Record<SLCPhase, string>> = {
  captured: 'bg-slate-500/15 text-slate-600',
  readiness_check: 'bg-yellow-500/15 text-yellow-600',
  mandate_active: 'bg-muted text-muted-foreground',
  published: 'bg-primary/15 text-primary',
  inquiry: 'bg-accent text-accent-foreground',
  reserved: 'bg-orange-500/15 text-orange-600',
  finance_submitted: 'bg-cyan-500/15 text-cyan-600',
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

/** Phase advance actions available per phase — must match SLC_EVENT_PHASE_MAP */
const PHASE_ACTIONS: Partial<Record<SLCPhase, { label: string; eventType: SLCEventType }[]>> = {
  captured: [{ label: 'Verkaufsbereitschaft prüfen', eventType: 'asset.readiness_approved' }],
  readiness_check: [{ label: 'Mandat aktivieren', eventType: 'mandate.activated' }],
  mandate_active: [{ label: 'Veröffentlichen', eventType: 'channel.published' }],
  published: [{ label: 'Anfrage eingegangen', eventType: 'deal.inquiry_received' }],
  inquiry: [{ label: 'Reservieren', eventType: 'deal.reserved' }],
  reserved: [
    { label: 'Finanzierung eingereicht', eventType: 'deal.finance_submitted' },
    { label: 'Kaufvertrag erstellt', eventType: 'deal.contract_drafted' },
  ],
  finance_submitted: [{ label: 'Kaufvertrag erstellt', eventType: 'deal.contract_drafted' }],
  contract_draft: [{ label: 'Notartermin vereinbart', eventType: 'deal.notary_scheduled' }],
  notary_scheduled: [{ label: 'Beurkundung erfolgt', eventType: 'deal.notary_completed' }],
  notary_completed: [{ label: 'Übergabe durchgeführt', eventType: 'deal.handover_completed' }],
  handover: [{ label: 'Settlement abgeschlossen', eventType: 'deal.platform_share_settled' }],
  settlement: [{ label: 'Abgeschlossen (Verkauf)', eventType: 'case.closed_won' }],
};

export default function SLCMonitorTab() {
  const { data: cases, isLoading } = useSalesCases();
  const { driftedItems, driftedCount } = useChannelDrift();
  const { recordEvent, isRecording } = useSLCEventRecorder();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [actionDialog, setActionDialog] = useState<{ open: boolean; caseRow: SalesCaseRow | null; action: 'advance' | 'close' }>({
    open: false, caseRow: null, action: 'advance',
  });
  const [closeReason, setCloseReason] = useState<'won' | 'lost'>('lost');
  const [closeNotes, setCloseNotes] = useState('');

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

  const handleAdvancePhase = async (caseRow: SalesCaseRow, eventType: SLCEventType) => {
    try {
      await recordEvent({
        caseId: caseRow.id,
        eventType,
        currentPhase: caseRow.current_phase,
        tenantId: caseRow.tenant_id,
        payload: { triggered_by: 'sales_desk_monitor' },
      });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-recent-events'] });
      toast.success('Phase aktualisiert');
    } catch (e) {
      toast.error('Fehler beim Phasen-Advance');
    }
  };

  const handleCloseCase = async () => {
    if (!actionDialog.caseRow) return;
    const c = actionDialog.caseRow;
    const eventType: SLCEventType = closeReason === 'won' ? 'case.closed_won' : 'case.closed_lost';
    try {
      await recordEvent({
        caseId: c.id,
        eventType,
        currentPhase: c.current_phase,
        tenantId: c.tenant_id,
        payload: { reason: closeReason, notes: closeNotes },
      });
      // Also update closed_at and close_reason on sales_cases
      await supabase.from('sales_cases').update({
        closed_at: new Date().toISOString(),
        close_reason: closeReason,
      }).eq('id', c.id);

      queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-recent-events'] });
      toast.success(closeReason === 'won' ? 'Fall als Verkauf abgeschlossen' : 'Fall als verloren markiert');
      setActionDialog({ open: false, caseRow: null, action: 'advance' });
      setCloseNotes('');
    } catch (e) {
      toast.error('Fehler beim Schließen des Falls');
    }
  };

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
            <CardDescription>Sales Lifecycle Controller — Phasen-Übersicht mit Aktionen</CardDescription>
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
                  <TableHead className="text-center">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map(c => {
                  const stuck = isStuck(c.current_phase, c.updated_at, now);
                  const stuckDays = stuck ? Math.round((now.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const actions = PHASE_ACTIONS[c.current_phase] || [];
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
                            <AlertTriangle className="h-3 w-3" /> STUCK {stuckDays}d
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {actions.map(a => (
                            <Button
                              key={a.eventType}
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              disabled={isRecording}
                              onClick={() => handleAdvancePhase(c, a.eventType)}
                            >
                              <Play className="h-3 w-3" /> {a.label}
                            </Button>
                          ))}
                          {c.current_phase !== 'closed_won' && c.current_phase !== 'closed_lost' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs h-7 text-destructive hover:text-destructive"
                              onClick={() => setActionDialog({ open: true, caseRow: c, action: 'close' })}
                            >
                              <XCircle className="h-3 w-3" /> Schließen
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Close Case Dialog ── */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, caseRow: null, action: 'advance' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verkaufsfall schließen</DialogTitle>
            <DialogDescription>
              {actionDialog.caseRow?.property?.address || 'Fall'} — Aktuell: {actionDialog.caseRow ? SLC_PHASE_LABELS[actionDialog.caseRow.current_phase] : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ergebnis</label>
              <Select value={closeReason} onValueChange={(v) => setCloseReason(v as 'won' | 'lost')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">Verkauf erfolgreich</SelectItem>
                  <SelectItem value="lost">Kein Verkauf (verloren)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notizen (optional)</label>
              <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Grund für den Abschluss..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, caseRow: null, action: 'advance' })}>Abbrechen</Button>
            <Button onClick={handleCloseCase} disabled={isRecording} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Fall schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

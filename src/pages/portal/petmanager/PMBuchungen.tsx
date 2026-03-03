/**
 * PMBuchungen — Buchungsverwaltung via PLC-Engine (pet_service_cases SSOT)
 */
import { Calendar, Check, X, Clock, PawPrint, AlertTriangle, LogIn, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyProvider } from '@/hooks/usePetBookings';
import { usePetCapacity } from '@/hooks/usePetCapacity';
import { useCasesForProvider, useTransitionCase, type CaseWithComputed } from '@/hooks/usePetServiceCases';
import { PLC_PHASE_LABELS, type PLCPhase } from '@/engines/plc/spec';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { Progress } from '@/components/ui/progress';

const PHASE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  provider_selected: 'outline',
  provider_confirmed: 'default',
  checked_in: 'default',
  checked_out: 'secondary',
  settlement: 'secondary',
  closed_completed: 'secondary',
  closed_cancelled: 'destructive',
  provider_declined: 'destructive',
};

function CaseRow({ c, onTransition, isPending }: {
  c: CaseWithComputed;
  onTransition: (caseId: string, eventType: string) => void;
  isPending: boolean;
}) {
  const phase = c.current_phase;

  return (
    <div className={cn(DESIGN.LIST.ROW, 'flex-col sm:flex-row items-start')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{c.customer_name || c.customer_email || 'Unbekannt'}</p>
          <Badge variant={PHASE_BADGE_VARIANT[phase] || 'secondary'} className="text-[10px]">
            {PLC_PHASE_LABELS[phase]}
          </Badge>
          {c.computed.isStuck && (
            <Badge variant="destructive" className="text-[10px]">
              <AlertTriangle className="h-3 w-3 mr-0.5" /> Überfällig
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {c.scheduled_start && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(c.scheduled_start), 'dd.MM.yyyy', { locale: de })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <PawPrint className="h-3 w-3" />{c.service_type}
          </span>
          {c.total_price_cents > 0 && (
            <span className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />{(c.total_price_cents / 100).toFixed(2)} €
            </span>
          )}
        </div>
        {c.customer_notes && <p className="text-xs text-muted-foreground mt-1 italic">„{c.customer_notes}"</p>}
        {/* PLC Progress */}
        <div className="mt-2 flex items-center gap-2">
          <Progress value={c.computed.progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground">{c.computed.progressPercent}%</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0 mt-2 sm:mt-0 flex-wrap">
        {phase === 'provider_selected' && (
          <>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onTransition(c.id, 'provider.confirmed')} disabled={isPending}>
              <Check className="h-3 w-3" /> Annehmen
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onTransition(c.id, 'provider.declined')} disabled={isPending}>
              <X className="h-3 w-3" /> Ablehnen
            </Button>
          </>
        )}
        {phase === 'provider_confirmed' && (
          <>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onTransition(c.id, 'service.checked_in')} disabled={isPending}>
              <LogIn className="h-3 w-3" /> Check-In
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onTransition(c.id, 'case.cancelled_by_provider')} disabled={isPending}>
              <X className="h-3 w-3" /> Stornieren
            </Button>
          </>
        )}
        {phase === 'checked_in' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onTransition(c.id, 'service.checked_out')} disabled={isPending}>
            <LogOut className="h-3 w-3" /> Check-Out
          </Button>
        )}
        {phase === 'checked_out' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onTransition(c.id, 'settlement.completed')} disabled={isPending}>
            <CreditCard className="h-3 w-3" /> Abrechnen
          </Button>
        )}
        {phase === 'settlement' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onTransition(c.id, 'case.closed_completed')} disabled={isPending}>
            <Check className="h-3 w-3" /> Abschließen
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PMBuchungen() {
  const { data: provider } = useMyProvider();
  const { data: cases = [], isLoading } = useCasesForProvider(provider?.id);
  const { data: capacity } = usePetCapacity(provider?.id);
  const transitionCase = useTransitionCase();

  const handleTransition = (caseId: string, eventType: string) => {
    transitionCase.mutate({
      case_id: caseId,
      event_type: eventType as any,
      actor_type: 'provider',
    });
  };

  const pending = cases.filter(c => c.current_phase === 'provider_selected');
  const active = cases.filter(c => ['provider_confirmed', 'checked_in', 'checked_out', 'settlement'].includes(c.current_phase));
  const past = cases.filter(c => ['closed_completed', 'closed_cancelled', 'provider_declined'].includes(c.current_phase));

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

      {capacity?.isFullyBooked && (
        <div className={cn(DESIGN.INFO_BANNER.BASE, DESIGN.INFO_BANNER.WARNING, 'flex items-center gap-2')}>
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm">Heute ausgebucht — {capacity.bookedToday}/{capacity.totalCapacity} Plätze belegt.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-accent-foreground">{pending.length}</p><p className="text-xs text-muted-foreground">Offene Anfragen</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{active.length}</p><p className="text-xs text-muted-foreground">Aktive Cases</p></CardContent></Card>
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
            pending.map(c => <CaseRow key={c.id} c={c} onTransition={handleTransition} isPending={transitionCase.isPending} />)}
        </TabsContent>

        <TabsContent value="active" className="space-y-2 mt-4">
          {active.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Keine aktiven Cases</p> :
            active.map(c => <CaseRow key={c.id} c={c} onTransition={handleTransition} isPending={transitionCase.isPending} />)}
        </TabsContent>

        <TabsContent value="past" className="space-y-2 mt-4">
          {past.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Noch keine Buchungshistorie</p> :
            past.map(c => <CaseRow key={c.id} c={c} onTransition={handleTransition} isPending={transitionCase.isPending} />)}
        </TabsContent>
      </Tabs>
    </div>
    </PageShell>
  );
}

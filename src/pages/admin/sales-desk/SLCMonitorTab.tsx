/**
 * SLC Monitor Tab — Sales Lifecycle overview for Zone 1
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesCases } from '@/hooks/useSalesCases';
import { SLC_PHASE_LABELS, SLC_STUCK_THRESHOLDS } from '@/engines/slc/spec';
import type { SLCPhase } from '@/engines/slc/spec';
import { isStuck } from '@/engines/slc/engine';

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

export default function SLCMonitorTab() {
  const { data: cases, isLoading } = useSalesCases();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cases?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase">SLC Monitor</h2>
        <EmptyState
          icon={Activity}
          title="Keine aktiven Verkaufsfälle"
          description="Verkaufsfälle aus MOD-06 und MOD-13 werden hier im Lifecycle dargestellt"
        />
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase">SLC Monitor</h2>
        <Badge variant="secondary">{cases.length} Fälle</Badge>
      </div>

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
    </div>
  );
}

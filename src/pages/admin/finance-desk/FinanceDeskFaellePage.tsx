/**
 * FinanceDeskFaellePage — FLC-powered case list with computed state + timeline
 */
import { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useFLCMonitorCases, type FLCMonitorCase } from '@/hooks/useFLCMonitorCases';
import { Briefcase } from 'lucide-react';

export default function FinanceDeskFaellePage() {
  const { cases, loading, error } = useFLCMonitorCases();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          <p>Fehler beim Laden: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">Keine aktiven Finanzierungsfälle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-primary" />
            Finanzierungsfälle ({cases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Vorgang</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Fortschritt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <CaseRow
                  key={c.requestId}
                  caseData={c}
                  isExpanded={expandedId === c.requestId}
                  onToggle={() => setExpandedId(expandedId === c.requestId ? null : c.requestId)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CaseRow({ caseData, isExpanded, onToggle }: {
  caseData: FLCMonitorCase;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { computed } = caseData;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell className="w-8">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm">{caseData.publicId || caseData.requestId.slice(0, 8)}</div>
          <div className="text-xs text-muted-foreground">{caseData.source || '—'}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{caseData.contactName}</div>
          <div className="text-xs text-muted-foreground">{caseData.contactEmail || '—'}</div>
        </TableCell>
        <TableCell className="text-sm">{caseData.managerName || '—'}</TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {computed.phaseLabel}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={computed.progressPercent} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-8">{computed.progressPercent}%</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {computed.isSLABreach && (
              <Badge variant="destructive" className="text-xs">SLA</Badge>
            )}
            {computed.isStuck && !computed.isSLABreach && (
              <Badge className="text-xs bg-amber-500/15 text-amber-700 border-amber-300">
                Stuck {computed.stuckDays}d
              </Badge>
            )}
            {computed.blockingGates.length > 0 && (
              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                {computed.blockingGates.length} Gate{computed.blockingGates.length > 1 ? 's' : ''}
              </Badge>
            )}
            {!computed.isStuck && computed.blockingGates.length === 0 && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 p-0">
            <CaseDetail caseData={caseData} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function CaseDetail({ caseData }: { caseData: FLCMonitorCase }) {
  const { computed, events } = caseData;

  return (
    <div className="p-4 space-y-4">
      {/* Gates */}
      {computed.blockingGates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Blockierende Gates
          </p>
          <div className="flex flex-wrap gap-2">
            {computed.blockingGates.map(g => (
              <Badge key={g.code} variant="outline" className="text-xs border-destructive/30 text-destructive">
                {g.message}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Next Actions */}
      {computed.nextActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> Nächste Schritte
          </p>
          <div className="flex flex-wrap gap-2">
            {computed.nextActions.map(a => (
              <Badge key={a.code} variant="secondary" className="text-xs">
                {a.label} ({a.owner})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Timeline
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground">Keine Events vorhanden.</p>
          )}
          {events.slice(0, 20).map(evt => (
            <div key={evt.id} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground whitespace-nowrap min-w-[100px]">
                {format(new Date(evt.created_at), 'dd.MM.yy HH:mm', { locale: de })}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {evt.event_type}
              </Badge>
              <span className="text-muted-foreground truncate">
                {evt.event_source || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

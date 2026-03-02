/**
 * MOD-18 Kontrolle Tab — FDC Control Plane
 * 
 * Shows Coverage Score, open Findings, Repair Actions, and Audit Trail.
 * No external views, no exports, no share links.
 */

import { useFinanceDataControl } from '@/hooks/useFinanceDataControl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck, AlertTriangle, Info, CheckCircle2, XCircle,
  RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { FDC_ENTITY_TYPE_LABELS, FDC_ACTION_DEFINITIONS } from '@/engines/fdc/spec';
import type { FDCRepairAction, FDCCategoryScore } from '@/engines/fdc/spec';

// ─── Coverage Ring ────────────────────────────────────────────
function CoverageRing({ score }: { score: number }) {
  const colorClass = score >= 80 ? 'text-primary' : score >= 50 ? 'text-accent-foreground' : 'text-destructive';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor"
            className="text-muted/20" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor"
            className={colorClass} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${score * 3.14} ${314 - score * 3.14}`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>{score}%</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground font-medium">Coverage Score</span>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────
function CategoryBar({ cat }: { cat: FDCCategoryScore }) {
  const barColor = cat.score >= 80 ? 'bg-green-500' : cat.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-36 truncate">{cat.label}</span>
      <div className="flex-1">
        <Progress value={cat.score} className="h-2" />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{cat.score}%</span>
      {cat.issueCount > 0 && (
        <Badge variant="outline" className="text-xs">{cat.issueCount} ⚠</Badge>
      )}
    </div>
  );
}

// ─── Severity Icon ────────────────────────────────────────────
function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'block': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'warn': return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    default: return <Info className="h-4 w-4 text-primary" />;
  }
}

// ─── Action Card ──────────────────────────────────────────────
function ActionCard({
  action,
  onResolve,
  onSuppress,
}: {
  action: FDCRepairAction;
  onResolve: (id: string) => void;
  onSuppress: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const def = FDC_ACTION_DEFINITIONS[action.code as keyof typeof FDC_ACTION_DEFINITIONS];
  const entityLabel = FDC_ENTITY_TYPE_LABELS[action.entity_type as keyof typeof FDC_ENTITY_TYPE_LABELS] || action.entity_type;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-2">
        <SeverityIcon severity={action.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{def?.label || action.code}</span>
            <Badge variant="secondary" className="text-xs">{entityLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{action.message}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onResolve(action.id!)}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Lösen
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onSuppress(action.id!)}>
            Ignorieren
          </Button>
        </div>
      </div>
      {action.entity_id !== '00000000-0000-0000-0000-000000000000' && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Details
        </button>
      )}
      {expanded && (
        <div className="text-xs text-muted-foreground pl-5 space-y-0.5">
          <div>Entity ID: <code className="text-[10px]">{action.entity_id}</code></div>
          <div>Code: <code className="text-[10px]">{action.code}</code></div>
          {action.scope_key && <div>Scope: {action.scope_key}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function KontrolleTab() {
  const {
    groupedActions,
    integrityResult,
    loading,
    error,
    resolveAction,
    suppressAction,
    refresh,
  } = useFinanceDataControl();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
            <RefreshCw className="h-3 w-3 mr-1" /> Erneut laden
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalOpen = (groupedActions.block.length + groupedActions.warn.length + groupedActions.info.length);

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Finanzdaten-Kontrolle
              </CardTitle>
              <CardDescription>
                Vollständigkeit und Zuordnung aller Finanzobjekte
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-3 w-3 mr-1" /> Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 items-start">
            <CoverageRing score={integrityResult?.coverageScore || 0} />
            <div className="flex-1 space-y-2">
              {integrityResult?.categoryScores.map(cat => (
                <CategoryBar key={cat.category} cat={cat} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Findings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Offene Befunde
            {totalOpen > 0 && (
              <Badge variant="destructive" className="ml-1">{totalOpen}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Fehlende Zuordnungen, Konflikte und Handlungsbedarf
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalOpen === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm">Alle Finanzdaten sind vollständig und korrekt zugeordnet.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                {groupedActions.block.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Blockierend ({groupedActions.block.length})
                    </h4>
                    {groupedActions.block.map(a => (
                      <ActionCard key={a.id} action={a} onResolve={resolveAction} onSuppress={suppressAction} />
                    ))}
                  </div>
                )}
                {groupedActions.warn.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-accent-foreground flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Warnungen ({groupedActions.warn.length})
                    </h4>
                    {groupedActions.warn.map(a => (
                      <ActionCard key={a.id} action={a} onResolve={resolveAction} onSuppress={suppressAction} />
                    ))}
                  </div>
                )}
                {groupedActions.info.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-1">
                      <Info className="h-4 w-4" /> Hinweise ({groupedActions.info.length})
                    </h4>
                    {groupedActions.info.map(a => (
                      <ActionCard key={a.id} action={a} onResolve={resolveAction} onSuppress={suppressAction} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

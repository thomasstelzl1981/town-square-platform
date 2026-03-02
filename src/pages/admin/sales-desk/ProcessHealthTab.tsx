/**
 * ProcessHealthTab — Unified Process Health Monitor (Zone 1)
 * Shows TLC + SLC cron run results side-by-side with AI summaries
 */
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Activity, AlertTriangle, CheckCircle, Clock, XCircle,
  Brain, RefreshCw, FileText, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProcessHealth, useLatestHealthBySystem, ProcessHealthLog } from "@/hooks/useProcessHealth";

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function SystemBadge({ system }: { system: string }) {
  return (
    <Badge variant={system === "tlc" ? "default" : "secondary"} className="text-xs">
      {system.toUpperCase()}
    </Badge>
  );
}

function HealthCard({ log }: { log: ProcessHealthLog | null; }) {
  if (!log) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Noch kein Lauf registriert</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon status={log.status} />
            <CardTitle className="text-base">{log.system.toUpperCase()} — Letzter Lauf</CardTitle>
          </div>
          <Badge variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}>
            {log.status === "success" ? "Erfolgreich" : log.status === "error" ? "Fehler" : "Übersprungen"}
          </Badge>
        </div>
        <CardDescription>
          {format(new Date(log.created_at), "dd. MMMM yyyy, HH:mm", { locale: de })} Uhr
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold tabular-nums">{log.cases_checked}</p>
            <p className="text-xs text-muted-foreground">Geprüft</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={`text-2xl font-bold tabular-nums ${log.issues_found > 0 ? "text-amber-600" : ""}`}>
              {log.issues_found}
            </p>
            <p className="text-xs text-muted-foreground">Probleme</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold tabular-nums">{log.events_created}</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
        </div>

        {log.ai_summary && (
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">KI-Zusammenfassung</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {log.ai_summary}
            </p>
          </div>
        )}

        {log.error_message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{log.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RunHistoryRow({ log }: { log: ProcessHealthLog }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <StatusIcon status={log.status} />
        <SystemBadge system={log.system} />
        <span className="text-sm">
          {format(new Date(log.created_at), "dd.MM.yy HH:mm")}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground tabular-nums">
        <span>{log.cases_checked} geprüft</span>
        <span className={log.issues_found > 0 ? "text-amber-600 font-medium" : ""}>
          {log.issues_found} Probleme
        </span>
        <span>{log.events_created} Events</span>
      </div>
    </div>
  );
}

export default function ProcessHealthTab() {
  const { data: latest } = useLatestHealthBySystem();
  const { data: history, isLoading } = useProcessHealth(30);

  const totalIssues = history?.reduce((sum, h) => sum + h.issues_found, 0) || 0;
  const totalRuns = history?.length || 0;
  const errorRuns = history?.filter(h => h.status === "error").length || 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Gesamte Läufe" value={totalRuns} icon={RefreshCw} variant="compact" />
        <StatCard title="Probleme gefunden" value={totalIssues} icon={AlertTriangle} variant="compact" />
        <StatCard
          title="Erfolgsquote"
          value={totalRuns > 0 ? `${Math.round(((totalRuns - errorRuns) / totalRuns) * 100)}%` : "–"}
          icon={TrendingUp}
          variant="compact"
        />
        <StatCard title="Fehlgeschlagen" value={errorRuns} icon={XCircle} variant="compact" />
      </div>

      {/* Side-by-side latest runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> Tenancy Lifecycle (TLC)
          </h3>
          <HealthCard log={latest?.tlc || null} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Sales Lifecycle (SLC)
          </h3>
          <HealthCard log={latest?.slc || null} />
        </div>
      </div>

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lauf-Historie</CardTitle>
          <CardDescription>Letzte {totalRuns} Cron-Läufe beider Systeme</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Lade...</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y">
                {(history || []).map((log) => (
                  <RunHistoryRow key={log.id} log={log} />
                ))}
                {(!history || history.length === 0) && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Läufe vorhanden</p>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

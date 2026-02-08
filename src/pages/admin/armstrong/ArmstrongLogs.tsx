/**
 * Armstrong Action Logs — Zone 1
 * 
 * Viewer for armstrong_action_runs table.
 * Shows execution history with filtering and details.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useArmstrongLogs, ActionRun, ActionRunStatus } from "@/hooks/useArmstrongLogs";

const statusConfig: Record<ActionRunStatus, { icon: React.ElementType; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-status-success', label: 'Erfolgreich' },
  failed: { icon: XCircle, color: 'text-status-error', label: 'Fehlgeschlagen' },
  pending: { icon: Clock, color: 'text-status-warning', label: 'Ausstehend' },
  cancelled: { icon: AlertCircle, color: 'text-muted-foreground', label: 'Abgebrochen' },
};

const ArmstrongLogs: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ActionRun | null>(null);

  const { logs, stats, isLoading, refetch } = useArmstrongLogs({
    status: statusFilter !== 'all' ? statusFilter as ActionRunStatus : undefined,
    search: search || undefined,
  });

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Action Logs</h1>
            <p className="text-muted-foreground">Ausführungsprotokolle aller Armstrong-Aktionen</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Aktualisieren
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-success">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Erfolgreich</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-error">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tokens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatDuration(stats.avgDurationMs)}</div>
            <p className="text-xs text-muted-foreground">Ø Dauer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen nach Action, Session..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="completed">Erfolgreich</SelectItem>
                <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="cancelled">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ausführungen</CardTitle>
          <CardDescription>
            {logs.length} Einträge
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Keine Logs vorhanden</h3>
              <p className="text-muted-foreground mt-1">
                Sobald Armstrong-Aktionen ausgeführt werden, erscheinen hier die Protokolle.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                    <TableHead className="w-[250px]">Action</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px] text-right">Tokens</TableHead>
                    <TableHead className="w-[80px] text-right">Kosten</TableHead>
                    <TableHead className="w-[80px] text-right">Dauer</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const StatusIcon = statusConfig[log.status].icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd.MM.yy HH:mm", { locale: de })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.action_code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.zone}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={`h-4 w-4 ${statusConfig[log.status].color}`} />
                            <span className={`text-sm ${statusConfig[log.status].color}`}>
                              {statusConfig[log.status].label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {log.tokens_used.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {log.cost_cents > 0 ? `${(log.cost_cents / 100).toFixed(2)} €` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDuration(log.duration_ms)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm">{selectedLog.action_code}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Zeitpunkt</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedLog.created_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Status</h4>
                    <div className="flex items-center gap-1">
                      {React.createElement(statusConfig[selectedLog.status].icon, {
                        className: `h-4 w-4 ${statusConfig[selectedLog.status].color}`
                      })}
                      <span className={statusConfig[selectedLog.status].color}>
                        {statusConfig[selectedLog.status].label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Zone</h4>
                    <Badge variant="outline">{selectedLog.zone}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Correlation ID</h4>
                    <p className="text-sm font-mono text-muted-foreground">
                      {selectedLog.correlation_id || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tokens</h4>
                    <p className="text-lg font-semibold">{selectedLog.tokens_used.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Kosten</h4>
                    <p className="text-lg font-semibold">
                      {selectedLog.cost_cents > 0 ? `${(selectedLog.cost_cents / 100).toFixed(2)} €` : 'Kostenlos'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Dauer</h4>
                    <p className="text-lg font-semibold">{formatDuration(selectedLog.duration_ms)}</p>
                  </div>
                </div>

                {selectedLog.pii_present && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-status-warning/10 border border-status-warning/20">
                    <AlertCircle className="h-4 w-4 text-status-warning" />
                    <span className="text-sm text-status-warning">Enthält personenbezogene Daten (PII)</span>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-status-error">Fehlermeldung</h4>
                    <div className="rounded-md bg-status-error/10 border border-status-error/20 p-3">
                      <p className="text-sm text-status-error font-mono">
                        {selectedLog.error_message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArmstrongLogs;

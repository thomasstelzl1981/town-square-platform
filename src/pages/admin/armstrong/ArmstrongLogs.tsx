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
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Mock data for logs
interface ActionLog {
  id: string;
  action_code: string;
  tenant_name: string;
  user_email: string;
  status: 'completed' | 'failed' | 'pending' | 'cancelled';
  cost_cents: number;
  tokens_used: number;
  duration_ms: number;
  created_at: Date;
  error_message?: string;
}

const mockLogs: ActionLog[] = [
  {
    id: '1',
    action_code: 'ARM.MOD04.CALCULATE_KPI',
    tenant_name: 'Demo GmbH',
    user_email: 'max@demo.de',
    status: 'completed',
    cost_cents: 2,
    tokens_used: 450,
    duration_ms: 1234,
    created_at: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    action_code: 'ARM.MOD03.EXTRACT_DOC',
    tenant_name: 'Test AG',
    user_email: 'anna@test.de',
    status: 'failed',
    cost_cents: 0,
    tokens_used: 120,
    duration_ms: 5678,
    created_at: new Date(Date.now() - 12 * 60 * 1000),
    error_message: 'Document parsing failed: Invalid PDF format',
  },
  {
    id: '3',
    action_code: 'ARM.GLOBAL.EXPLAIN_TERM',
    tenant_name: 'Demo GmbH',
    user_email: 'lisa@demo.de',
    status: 'completed',
    cost_cents: 0,
    tokens_used: 280,
    duration_ms: 890,
    created_at: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '4',
    action_code: 'ARM.MOD07.DOC_CHECKLIST',
    tenant_name: 'Invest KG',
    user_email: 'tom@invest.de',
    status: 'completed',
    cost_cents: 1,
    tokens_used: 320,
    duration_ms: 1100,
    created_at: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: '5',
    action_code: 'ARM.PUBLIC.RENDITE_RECHNER',
    tenant_name: '(Zone 3)',
    user_email: 'anonym',
    status: 'completed',
    cost_cents: 0,
    tokens_used: 180,
    duration_ms: 650,
    created_at: new Date(Date.now() - 60 * 60 * 1000),
  },
];

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-status-success', label: 'Erfolgreich' },
  failed: { icon: XCircle, color: 'text-status-error', label: 'Fehlgeschlagen' },
  pending: { icon: Clock, color: 'text-status-warning', label: 'Ausstehend' },
  cancelled: { icon: AlertCircle, color: 'text-muted-foreground', label: 'Abgebrochen' },
};

const ArmstrongLogs: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);

  // Filter logs
  const filteredLogs = mockLogs.filter(log => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !log.action_code.toLowerCase().includes(searchLower) &&
        !log.tenant_name.toLowerCase().includes(searchLower) &&
        !log.user_email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'all' && log.status !== statusFilter) {
      return false;
    }
    return true;
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
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen nach Action, Tenant, User..."
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
            {filteredLogs.length} Einträge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                  <TableHead className="w-[250px]">Action</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Tokens</TableHead>
                  <TableHead className="w-[80px] text-right">Kosten</TableHead>
                  <TableHead className="w-[80px] text-right">Dauer</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const StatusIcon = statusConfig[log.status].icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(log.created_at, "dd.MM.yy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.action_code}
                      </TableCell>
                      <TableCell>{log.tenant_name}</TableCell>
                      <TableCell className="text-sm">{log.user_email}</TableCell>
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
                      {format(selectedLog.created_at, "dd.MM.yyyy HH:mm:ss", { locale: de })}
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
                    <h4 className="text-sm font-medium mb-1">Tenant</h4>
                    <p className="text-sm">{selectedLog.tenant_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">User</h4>
                    <p className="text-sm">{selectedLog.user_email}</p>
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

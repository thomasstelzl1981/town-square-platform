/**
 * Armstrong Console Dashboard — Zone 1
 * 
 * Admin overview for Armstrong KI-Assistent:
 * - KPIs (Actions/Tag, Kosten/Monat, Error-Rate)
 * - Top-Actions Chart
 * - Alert-Panel
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Activity,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Zap,
  FileText,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Loader2,
  Puzzle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useArmstrongDashboard } from "@/hooks/useArmstrongDashboard";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const ArmstrongDashboard: React.FC = () => {
  const { kpis, topActions, alerts, isLoading, refetch } = useArmstrongDashboard();

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Armstrong Console</h1>
            <p className="text-muted-foreground">KI-Assistent Governance & Monitoring</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Aktualisieren
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : kpis.actions_24h.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ausgeführte Aktionen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kosten (30 Tage)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : formatCurrency(kpis.costs_30d_cents)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aggregierte API-Kosten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error-Rate (7d)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.error_rate_7d > 5 ? 'text-status-error' : ''}`}>
              {isLoading ? '—' : `${kpis.error_rate_7d}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Fehlgeschlagene Aktionen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ø Antwortzeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : kpis.avg_response_ms_24h > 0 ? `${(kpis.avg_response_ms_24h / 1000).toFixed(2)}s` : '—'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {kpis.knowledge_items_count} KB-Einträge
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Actions</CardTitle>
                <CardDescription>Meistgenutzte Armstrong-Aktionen (24h)</CardDescription>
              </div>
              <Link to="/admin/armstrong/actions">
                <Button variant="ghost" size="sm">
                  Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : topActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Noch keine Daten</h3>
                <p className="text-muted-foreground mt-1">
                  Sobald Armstrong-Aktionen ausgeführt werden, erscheinen hier Statistiken.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topActions.map((action, index) => (
                  <div 
                    key={action.action_code}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium font-mono">{action.action_code}</p>
                        <p className="text-xs text-muted-foreground">
                          Ø {action.avg_duration_ms}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{action.run_count}</p>
                      <p className="text-xs text-muted-foreground">Aufrufe</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Aktuelle Warnungen</CardDescription>
              </div>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Keine Alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'error' 
                        ? 'bg-status-error/5 border-status-error/20' 
                        : alert.type === 'warning'
                        ? 'bg-status-warning/5 border-status-warning/20'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        alert.type === 'error' ? 'text-status-error' :
                        alert.type === 'warning' ? 'text-status-warning' :
                        'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/armstrong/actions">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Actions-Katalog</h3>
                  <p className="text-sm text-muted-foreground">Alle verfügbaren Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/armstrong/logs">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Action Logs</h3>
                  <p className="text-sm text-muted-foreground">Ausführungsprotokolle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/armstrong/billing">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Billing</h3>
                  <p className="text-sm text-muted-foreground">Plan-Features & Limits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/armstrong/knowledge">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground">{kpis.knowledge_items_count} Einträge</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/armstrong/integrations">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Puzzle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Widget-Integrationen</h3>
                  <p className="text-sm text-muted-foreground">Systemwidgets Registry</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default ArmstrongDashboard;

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for dashboard
const mockKPIs = {
  actionsToday: 1247,
  actionsTrend: +12.5,
  costThisMonth: 89.50,
  costTrend: -3.2,
  errorRate: 0.8,
  errorTrend: -0.3,
  activeUsers: 156,
  avgResponseTime: 1.2,
};

const mockTopActions = [
  { code: 'ARM.GLOBAL.EXPLAIN_TERM', count: 456, zone: 'Z2/Z3' },
  { code: 'ARM.MOD04.CALCULATE_KPI', count: 234, zone: 'Z2' },
  { code: 'ARM.MOD03.SEARCH_DOC', count: 189, zone: 'Z2' },
  { code: 'ARM.PUBLIC.RENDITE_RECHNER', count: 145, zone: 'Z3' },
  { code: 'ARM.MOD07.DOC_CHECKLIST', count: 98, zone: 'Z2' },
];

const mockAlerts = [
  { id: '1', type: 'warning', message: 'Rate-Limit fast erreicht für Tenant "Demo GmbH"', time: '5 Min.' },
  { id: '2', type: 'error', message: 'Action ARM.MOD03.EXTRACT_DOC fehlgeschlagen (3x)', time: '12 Min.' },
  { id: '3', type: 'info', message: 'Neues Knowledge-Update verfügbar', time: '1 Std.' },
];

const ArmstrongDashboard: React.FC = () => {
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
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions heute</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIs.actionsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-status-success" />
              <span className="text-status-success">+{mockKPIs.actionsTrend}%</span> vs. gestern
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kosten (Monat)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIs.costThisMonth.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-status-success rotate-180" />
              <span className="text-status-success">{mockKPIs.costTrend}%</span> vs. Vormonat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error-Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIs.errorRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-status-success rotate-180" />
              <span className="text-status-success">{mockKPIs.errorTrend}%</span> vs. letzte Woche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ø Antwortzeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIs.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {mockKPIs.activeUsers} aktive Nutzer
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
            <div className="space-y-3">
              {mockTopActions.map((action, index) => (
                <div 
                  key={action.code}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">{action.code}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {action.zone}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{action.count}</p>
                    <p className="text-xs text-muted-foreground">Aufrufe</p>
                  </div>
                </div>
              ))}
            </div>
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
              <Badge variant="secondary">{mockAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
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
                      <p className="text-xs text-muted-foreground mt-1">vor {alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                <Bot className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground">Wissensbasis verwalten</p>
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

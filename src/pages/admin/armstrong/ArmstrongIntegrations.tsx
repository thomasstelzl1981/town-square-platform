/**
 * ArmstrongIntegrations — Zone 1 Registry Viewer
 * 
 * Read-only overview of all system widget integrations.
 * Shows: Code, Name, Data Source, Status, Cost Model
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Puzzle,
  ArrowLeft,
  Globe,
  Cloud,
  TrendingUp,
  Newspaper,
  Rocket,
  Quote,
  Radio,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SYSTEM_WIDGETS } from '@/config/systemWidgets';

// Icon mapping
const ICON_MAP: Record<string, typeof Globe> = {
  Globe,
  Cloud,
  TrendingUp,
  Newspaper,
  Rocket,
  Quote,
  Radio,
};

const ArmstrongIntegrations: React.FC = () => {
  const liveCount = SYSTEM_WIDGETS.filter(w => w.status === 'live').length;
  const stubCount = SYSTEM_WIDGETS.filter(w => w.status === 'stub').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Puzzle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Widget-Integrationen</h1>
            <p className="text-muted-foreground">Systemwidget Registry & Datenquellen</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SYSTEM_WIDGETS.length}</div>
            <p className="text-xs text-muted-foreground">Registrierte Widgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500">Live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{liveCount}</div>
            <p className="text-xs text-muted-foreground">Produktiv aktiv</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-500">In Entwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stubCount}</div>
            <p className="text-xs text-muted-foreground">Stub / Coming Soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Governance Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Governance-Regeln</CardTitle>
          </div>
          <CardDescription>Verbindliche Regeln für alle Systemwidgets</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Keine Write-Aktionen in SSOT durch Systemwidgets</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Kein Autoplay bei Audio/Video-Widgets — nur auf Nutzerinteraktion</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Externe API-Calls nur über Edge Functions (keine Client-Side API-Keys)</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
              <span>Cache-Intervalle beachten (Rate Limits der APIs)</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Widget Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle>Widget-Registry</CardTitle>
          <CardDescription>Alle registrierten Systemwidgets mit Details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Datenquelle</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead>Kosten</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SYSTEM_WIDGETS.map((widget) => {
                const Icon = ICON_MAP[widget.icon] || Globe;
                
                return (
                  <TableRow key={widget.code}>
                    <TableCell>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${widget.gradient}`}>
                        <Icon className="h-4 w-4 text-foreground/70" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {widget.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {widget.name_de}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {widget.data_source}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {widget.cache_interval_min > 0 
                        ? `${widget.cache_interval_min} min`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={widget.cost_model === 'free' ? 'secondary' : 'default'}>
                        {widget.cost_model === 'free' ? 'Free' : 'Metered'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={widget.status === 'live' ? 'default' : 'outline'}>
                        {widget.status === 'live' ? 'Live' : 'Stub'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Adapter Blueprint */}
      <Card>
        <CardHeader>
          <CardTitle>API-Adapter Blueprint (Phase 2)</CardTitle>
          <CardDescription>Geplante Edge Functions für externe APIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <pre className="text-muted-foreground">
{`supabase/functions/
├── widget-finance/      # Finnhub/Alpha Vantage Proxy
├── widget-news/         # RSS/NewsAPI Aggregator
├── widget-space/        # NASA APOD / ISS Location
├── widget-quote/        # ZenQuotes Proxy
└── widget-radio/        # Radio Browser API Proxy`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Alle externen API-Requests werden über Edge Functions geleitet. 
            Keine API-Keys im Client.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArmstrongIntegrations;

/**
 * Agents — Zone-1 Admin Desk for AI Agent Management
 */
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, List, Play, Shield, ArrowRight, Activity, Cpu, Zap } from 'lucide-react';
import { EmptyState } from '@/components/shared';

function AgentsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">
          Zentrale Verwaltung für KI-Agenten und Automatisierungen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Agenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Konfiguriert</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Laufende Instanzen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Runs heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">Ausführungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.2%</div>
            <p className="text-xs text-muted-foreground">Letzte 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Katalog
            </CardTitle>
            <CardDescription>Verfügbare Agent-Templates und Blueprints</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/agents/catalog">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Instanzen
            </CardTitle>
            <CardDescription>Laufende Agent-Instanzen überwachen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/agents/instances">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Runs
            </CardTitle>
            <CardDescription>Ausführungsprotokolle und Logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/agents/runs">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Policies
            </CardTitle>
            <CardDescription>Sicherheitsrichtlinien und Berechtigungen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/agents/policies">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CatalogTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agent-Katalog</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: 'Document Classifier', desc: 'Automatische Dokumentenklassifizierung', status: 'active' },
          { name: 'Lead Scorer', desc: 'KI-basierte Lead-Bewertung', status: 'active' },
          { name: 'Exposé Writer', desc: 'Automatische Exposé-Texterstellung', status: 'active' },
          { name: 'Email Responder', desc: 'Automatische E-Mail-Antworten', status: 'beta' },
          { name: 'Price Estimator', desc: 'Immobilienbewertung via ML', status: 'planned' },
          { name: 'Tenant Matcher', desc: 'Mieter-Objekt-Matching', status: 'planned' },
        ].map((agent) => (
          <Card key={agent.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'beta' ? 'secondary' : 'outline'}>
                  {agent.status}
                </Badge>
              </div>
              <CardDescription>{agent.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InstancesTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agent-Instanzen</h2>
      <EmptyState icon={Cpu} title="Keine aktiven Instanzen" description="Agent-Instanzen werden hier angezeigt" />
    </div>
  );
}

function RunsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agent Runs</h2>
      <EmptyState icon={Play} title="Keine Runs aufgezeichnet" description="Ausführungsprotokolle erscheinen hier" />
    </div>
  );
}

function PoliciesTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agent Policies</h2>
      <EmptyState icon={Shield} title="Keine Policies konfiguriert" description="Sicherheitsrichtlinien für Agenten definieren" />
    </div>
  );
}

export default function Agents() {
  return (
    <Routes>
      <Route index element={<AgentsDashboard />} />
      <Route path="catalog" element={<CatalogTab />} />
      <Route path="instances" element={<InstancesTab />} />
      <Route path="runs" element={<RunsTab />} />
      <Route path="policies" element={<PoliciesTab />} />
    </Routes>
  );
}

/**
 * ArmstrongEngines — Zone 1 Engine Registry
 * 
 * Documents ALL platform engines: calculation engines, data engines, AI engines.
 * Provides governance view of capabilities, status, and billing.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DESIGN } from '@/config/designManifest';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Cpu, Calculator, Brain, Database, Shield,
  FileSearch, Zap, TrendingUp, Home, Car, Sun,
  Receipt, BarChart3, Users, Briefcase, Clock, CheckCircle,
  AlertTriangle, CloudCog, Plug,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type EngineStatus = 'live' | 'partial' | 'planned';
type EngineCategory = 'calculation' | 'data' | 'ai' | 'infrastructure';

interface EngineEntry {
  code: string;
  name: string;
  category: EngineCategory;
  module: string;
  description: string;
  status: EngineStatus;
  capabilities: string[];
  billing: string;
  icon: typeof Cpu;
  files: string[];
}

const ENGINE_REGISTRY: EngineEntry[] = [
  // ── Calculation Engines ──
  {
    code: 'ENG-AKQUISE',
    name: 'Akquise-Kalkulation',
    category: 'calculation',
    module: 'MOD-04/12',
    description: 'Bestand- und Aufteiler-Kalkulation für Immobilienangebote',
    status: 'live',
    capabilities: ['Brutto-/Netto-Rendite', 'Mietpotenzial', 'Aufteiler-Gewinn', 'Sanierungskosten'],
    billing: 'Free (Client-side)',
    icon: Calculator,
    files: ['src/engines/akquiseCalc/engine.ts', 'src/engines/akquiseCalc/spec.ts'],
  },
  {
    code: 'ENG-FINANCE',
    name: 'Finanzierungs-Engine',
    category: 'calculation',
    module: 'MOD-07/11',
    description: 'Haushaltsüberschuss, Annuität, Kreditwürdigkeitsprüfung',
    status: 'live',
    capabilities: ['Haushaltsrechnung', 'Annuitätenrechner', 'Beleihungsauslauf', 'Tilgungsplan'],
    billing: 'Free (Client-side)',
    icon: TrendingUp,
    files: ['src/engines/finanzierung/engine.ts', 'src/engines/finanzierung/spec.ts'],
  },
  {
    code: 'ENG-PROVISION',
    name: 'Provisions-Engine',
    category: 'calculation',
    module: 'MOD-09',
    description: 'Provisionsberechnung und Splits für Vertriebspartner',
    status: 'live',
    capabilities: ['Provisionssplits', 'Abrechnungsübersicht', 'Systemgebühr (30%)'],
    billing: 'Free (Client-side)',
    icon: Users,
    files: ['src/engines/provision/engine.ts', 'src/engines/provision/spec.ts'],
  },
  {
    code: 'ENG-BWA',
    name: 'Bewirtschaftungs-Engine',
    category: 'calculation',
    module: 'MOD-04',
    description: 'BWA, NOI, Instandhaltungsrücklagen',
    status: 'live',
    capabilities: ['NOI-Berechnung', 'Kostenquoten', 'Rücklagen-Tracking'],
    billing: 'Free (Client-side)',
    icon: BarChart3,
    files: ['src/engines/bewirtschaftung/engine.ts', 'src/engines/bewirtschaftung/spec.ts'],
  },
  {
    code: 'ENG-PROJEKT',
    name: 'Projekt-Kalkulation',
    category: 'calculation',
    module: 'MOD-13',
    description: 'Bauträger-Margen, Einheitspreise, Gesamtrentabilität',
    status: 'live',
    capabilities: ['Einheitspreise', 'Baukosten/m²', 'Gewinnmarge', 'Cashflow-Planung'],
    billing: 'Free (Client-side)',
    icon: Briefcase,
    files: ['src/engines/projektCalc/engine.ts', 'src/engines/projektCalc/spec.ts'],
  },
  {
    code: 'ENG-NK',
    name: 'NK-Abrechnungs-Engine',
    category: 'calculation',
    module: 'MOD-04',
    description: 'Nebenkostenabrechnung und Verteilerschlüssel',
    status: 'live',
    capabilities: ['Kostenverteilung', 'Abrechnungserstellung', 'Nachzahlung/Guthaben'],
    billing: 'Free (Client-side)',
    icon: Receipt,
    files: ['src/engines/nkAbrechnung/'],
  },
  {
    code: 'ENG-FINUEB',
    name: 'Finanzübersicht-Engine',
    category: 'calculation',
    module: 'MOD-18',
    description: 'Portfolio-Analyse und Vermögensübersicht',
    status: 'live',
    capabilities: ['Vermögensaggregation', 'Cashflow-Analyse', 'Kategorisierung'],
    billing: 'Free (Client-side)',
    icon: TrendingUp,
    files: ['src/engines/finanzuebersicht/engine.ts', 'src/engines/finanzuebersicht/spec.ts'],
  },
  {
    code: 'ENG-VORSORGE',
    name: 'Vorsorgelücke-Rechner',
    category: 'calculation',
    module: 'MOD-08',
    description: 'Rentenlücken-Berechnung und Vorsorge-Simulation',
    status: 'live',
    capabilities: ['Rentenlücke', 'Sparplan-Simulation', 'Inflation'],
    billing: 'Free (Client-side)',
    icon: Shield,
    files: ['src/engines/vorsorgeluecke/engine.ts', 'src/engines/vorsorgeluecke/spec.ts'],
  },
  {
    code: 'ENG-VVSTEUER',
    name: 'V+V Steuer-Engine',
    category: 'calculation',
    module: 'MOD-04',
    description: 'Anlage V Steuerberechnung (Vermietung & Verpachtung)',
    status: 'live',
    capabilities: ['AfA-Berechnung', 'Werbungskosten', 'Überschussermittlung'],
    billing: 'Free (Client-side)',
    icon: Receipt,
    files: ['src/engines/vvSteuer/engine.ts', 'src/engines/vvSteuer/spec.ts'],
  },
  {
    code: 'ENG-DEMO',
    name: 'Demo-Daten Engine',
    category: 'infrastructure',
    module: 'System',
    description: 'Generierung und Verwaltung von Demo-Daten für alle Module',
    status: 'live',
    capabilities: ['Seed-Daten', 'Demo-UUIDs', 'Golden-Path-Reset'],
    billing: 'Free (System)',
    icon: Database,
    files: ['src/engines/demoData/'],
  },

  // ── Data Engines ──
  {
    code: 'ENG-DOCINT',
    name: 'Document Intelligence Engine',
    category: 'data',
    module: 'MOD-03',
    description: 'Dokumenten-Extraktion, OCR, Indexierung und KI-Analyse',
    status: 'partial',
    capabilities: [
      'Phase 1 ✅ Posteingangs-PDF-Extraktion (Gemini Vision)',
      'Phase 1 ✅ Volltextsuche (document_chunks, TSVector)',
      'Phase 1 ✅ Auto-Sortierung (Keyword-Rules)',
      'Phase 2 🔜 Storage-Extraktion (eigene Dateien)',
      'Phase 2 🔜 Cloud-Sync (Google Drive, Dropbox)',
      'Phase 2 🔜 RAG-Index (Embedding/pgvector)',
    ],
    billing: '1 Credit / PDF (Posteingang)',
    icon: FileSearch,
    files: ['supabase/functions/sot-document-parser/', 'supabase/functions/sot-inbound-receive/'],
  },
  {
    code: 'ENG-RESEARCH',
    name: 'Research Engine (SOAT)',
    category: 'data',
    module: 'MOD-14/Z1',
    description: 'Kontaktrecherche via Google Places, Apify, Firecrawl',
    status: 'partial',
    capabilities: [
      'Google Places Search',
      'Firmen-Kontaktdaten',
      'Email-Extraktion (Firecrawl)',
      'Portal-Scraping (Apify)',
    ],
    billing: '2-4 Credits / Recherche-Run',
    icon: CloudCog,
    files: ['supabase/functions/sot-research-engine/'],
  },

  // ── AI Engines ──
  {
    code: 'ENG-ARMSTRONG',
    name: 'Armstrong KI-Copilot',
    category: 'ai',
    module: 'Global',
    description: 'KI-Assistent mit 133+ Actions über alle Module',
    status: 'live',
    capabilities: [
      '133 registrierte Actions',
      'Plan → Confirm → Execute Policy',
      '5-Tier Credit-System',
      'Coach Mode (MOD-08/09)',
      'Sprachsteuerung (ElevenLabs)',
    ],
    billing: '0-12 Credits / Action',
    icon: Brain,
    files: ['src/manifests/armstrongManifest.ts'],
  },
  {
    code: 'ENG-FILEINTEL',
    name: 'File Intelligence',
    category: 'ai',
    module: 'MOD-17/19',
    description: 'Automatische Web-Recherche bei Entity-Erstellung',
    status: 'partial',
    capabilities: [
      'Auto-Research bei Fahrzeug/PV-Anlage',
      'Perplexity Sonar Integration',
      'JSON Knowledge-File im DMS',
    ],
    billing: '1 Credit / Research',
    icon: Zap,
    files: [],
  },

  // ── Infrastructure ──
  {
    code: 'ENG-GOLDEN',
    name: 'Golden Path Engine',
    category: 'infrastructure',
    module: 'System',
    description: 'Workflow-Engine für modulübergreifende Geschäftsprozesse',
    status: 'partial',
    capabilities: [
      'Phase/Step Orchestration',
      'Context Resolvers',
      'Fail-States & Recovery',
      'Camunda-ready Modeling',
    ],
    billing: 'Free (System)',
    icon: Zap,
    files: [],
  },
];

const STATUS_CONFIG: Record<EngineStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
  live: { label: 'Live', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
  partial: { label: 'Teilweise', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  planned: { label: 'Geplant', cls: 'bg-muted text-muted-foreground border-border', icon: Clock },
};

const CATEGORY_CONFIG: Record<EngineCategory, { label: string; cls: string }> = {
  calculation: { label: 'Kalkulation', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  data: { label: 'Daten', cls: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  ai: { label: 'KI', cls: 'bg-primary/10 text-primary border-primary/20' },
  infrastructure: { label: 'Infrastruktur', cls: 'bg-muted text-muted-foreground border-border' },
};

const ArmstrongEngines: React.FC = () => {
  const liveCount = ENGINE_REGISTRY.filter(e => e.status === 'live').length;
  const partialCount = ENGINE_REGISTRY.filter(e => e.status === 'partial').length;
  const plannedCount = ENGINE_REGISTRY.filter(e => e.status === 'planned').length;

  const categories: EngineCategory[] = ['calculation', 'data', 'ai', 'infrastructure'];

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
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Engine Registry</h1>
            <p className="text-muted-foreground">Alle Plattform-Engines — Kalkulation, Daten, KI, Infrastruktur</p>
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
            <div className="text-2xl font-bold">{ENGINE_REGISTRY.length}</div>
            <p className="text-xs text-muted-foreground">Registrierte Engines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-500">Live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{liveCount}</div>
            <p className="text-xs text-muted-foreground">Voll produktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-500">Teilweise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{partialCount}</div>
            <p className="text-xs text-muted-foreground">Phase 1 aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geplant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{plannedCount}</div>
            <p className="text-xs text-muted-foreground">In Roadmap</p>
          </CardContent>
        </Card>
      </div>

      {/* Governance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Engine-Governance</CardTitle>
          </div>
          <CardDescription>Verbindliche Regeln für alle Engines</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Calculation Engines sind pure Funktionen — kein DB-Zugriff, keine Side Effects</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Data Engines verarbeiten nur Daten innerhalb des Tenant-Scopes (RLS)</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Metered Engines erfordern Credit-Preflight vor Ausführung</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
              <span>Alle Engines sind in spec/current/ dokumentiert und versioniert</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Engine Tables by Category */}
      {categories.map((cat) => {
        const engines = ENGINE_REGISTRY.filter(e => e.category === cat);
        if (engines.length === 0) return null;
        const catConfig = CATEGORY_CONFIG[cat];

        return (
          <Card key={cat}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={catConfig.cls}>{catConfig.label}</Badge>
                <CardTitle>{engines.length} Engine{engines.length > 1 ? 's' : ''}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engines.map((eng) => {
                    const statusCfg = STATUS_CONFIG[eng.status];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <TableRow key={eng.code}>
                        <TableCell>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
                            <eng.icon className="h-4 w-4 text-primary" />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{eng.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{eng.name}</p>
                            <p className="text-xs text-muted-foreground">{eng.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{eng.module}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{eng.billing}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusCfg.cls}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Capabilities detail for data/ai engines */}
              {(cat === 'data' || cat === 'ai') && (
                <div className="mt-4 space-y-3">
                  {engines.map((eng) => (
                    <div key={eng.code + '-caps'} className="p-4 rounded-xl border border-border/50 bg-muted/20">
                      <p className="text-sm font-medium mb-2">{eng.name} — Capabilities</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {eng.capabilities.map((cap, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={cap.includes('✅') ? 'text-emerald-500' : cap.includes('🔜') ? 'text-amber-500' : 'text-foreground'}>
                              {cap.includes('✅') || cap.includes('🔜') ? '' : '•'} {cap}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* File Map */}
      <Card>
        <CardHeader>
          <CardTitle>Engine-Dateien (src/engines/)</CardTitle>
          <CardDescription>Verzeichnisstruktur der Calculation Engines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <pre className="text-muted-foreground">
{`src/engines/
├── akquiseCalc/     # ENG-AKQUISE  — Bestand/Aufteiler
├── bewirtschaftung/ # ENG-BWA      — NOI, Kostenquoten
├── demoData/        # ENG-DEMO     — Seed-Daten
├── finanzierung/    # ENG-FINANCE  — Annuität, Haushalt
├── finanzuebersicht/# ENG-FINUEB   — Portfolio-Analyse
├── nkAbrechnung/    # ENG-NK       — Nebenkosten
├── projektCalc/     # ENG-PROJEKT  — Bauträger-Margen
├── provision/       # ENG-PROVISION— Splits
├── vorsorgeluecke/  # ENG-VORSORGE — Rentenlücke
├── vvSteuer/        # ENG-VVSTEUER — Anlage V
└── index.ts         # Zentraler Re-Export`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArmstrongEngines;

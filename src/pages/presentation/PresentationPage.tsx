import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  FileText, 
  Mail, 
  Key, 
  Tag, 
  Wallet, 
  Target, 
  UserCircle,
  Layers,
  Globe,
  Shield,
  CheckCircle2,
  Circle,
  AlertCircle
} from "lucide-react";

// Module data with readiness status
const modules = [
  { 
    id: "MOD-01", 
    name: "Stammdaten", 
    icon: UserCircle, 
    status: "spec_ready",
    db: "complete", ui: "partial", logic: "pending", 
    description: "Profil, Firma, Abrechnung, Sicherheit"
  },
  { 
    id: "MOD-02", 
    name: "KI Office", 
    icon: Mail, 
    status: "spec_ready",
    db: "complete", ui: "partial", logic: "pending", 
    description: "Email, Brief, Kontakte, Kalender + Armstrong"
  },
  { 
    id: "MOD-03", 
    name: "DMS", 
    icon: FileText, 
    status: "spec_ready",
    db: "complete", ui: "partial", logic: "pending", 
    description: "Posteingang, Zuordnung, Archiv, Storage"
  },
  { 
    id: "MOD-04", 
    name: "Immobilien", 
    icon: Building2, 
    status: "spec_ready",
    db: "complete", ui: "partial", logic: "pending", 
    description: "Portfolio, Exposé-Hub, Sanierung"
  },
  { 
    id: "MOD-05", 
    name: "MSV", 
    icon: Key, 
    status: "concept",
    db: "partial", ui: "pending", logic: "pending", 
    description: "Miet-Sonderverwaltung"
  },
  { 
    id: "MOD-06", 
    name: "Verkauf", 
    icon: Tag, 
    status: "concept",
    db: "partial", ui: "pending", logic: "pending", 
    description: "Objekte verkaufen, Reservierung"
  },
  { 
    id: "MOD-07", 
    name: "Vertriebspartner", 
    icon: Users, 
    status: "concept",
    db: "partial", ui: "pending", logic: "pending", 
    description: "Pipeline, Investment Engine"
  },
  { 
    id: "MOD-08", 
    name: "Finanzierung", 
    icon: Wallet, 
    status: "concept",
    db: "complete", ui: "pending", logic: "pending", 
    description: "Pakete, Future Room Handoff"
  },
  { 
    id: "MOD-09", 
    name: "Leadgenerierung", 
    icon: Target, 
    status: "concept",
    db: "pending", ui: "pending", logic: "pending", 
    description: "Managed Ads, Lead-Pool"
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-status-success" />;
    case "partial":
      return <AlertCircle className="h-4 w-4 text-status-warn" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    spec_ready: { label: "Spec Ready", className: "bg-primary/20 text-primary border-primary/30" },
    concept: { label: "Concept", className: "bg-status-warn/20 text-status-warn border-status-warn/30" },
    pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  };
  const { label, className } = variants[status] || variants.pending;
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

export default function PresentationPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <header className="border-b border-border bg-surface-2 py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Layers className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">System of a Town</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Die modulare Plattform für Immobilien-Ökosysteme
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="text-sm">v1.0.0</Badge>
            <Badge variant="outline" className="text-sm">2026-01-25</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm">
              9 Module | 45 Routes
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="architecture">Architektur</TabsTrigger>
            <TabsTrigger value="modules">Module</TabsTrigger>
            <TabsTrigger value="matrix">Readiness</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* 3 Zones */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Zone 1: Admin
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Organizations & Tenants</li>
                    <li>• User Management</li>
                    <li>• Tile Catalog</li>
                    <li>• Integration Registry</li>
                    <li>• Billing & Oversight</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-status-success/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-status-success" />
                    Zone 2: Portals
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• 9 Module (MOD-01 bis MOD-09)</li>
                    <li>• Tile-basierte Aktivierung</li>
                    <li>• Armstrong Chatbot</li>
                    <li>• Multi-Tenant Isolation</li>
                    <li>• 45 Routes gesamt</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-status-info/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-status-info" />
                    Zone 3: Websites
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Public Landingpages</li>
                    <li>• Lead Capture Forms</li>
                    <li>• Property Listings</li>
                    <li>• AI Sales Agents</li>
                    <li>• Meta Ads Integration</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">37</div>
                  <div className="text-sm text-muted-foreground">Frozen Decisions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">9</div>
                  <div className="text-sm text-muted-foreground">Zone 2 Module</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">45</div>
                  <div className="text-sm text-muted-foreground">Portal Routes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">28</div>
                  <div className="text-sm text-muted-foreground">DB Tables</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>System Overview (A1 - FROZEN)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface-2 rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-muted-foreground whitespace-pre-wrap">{`
┌─────────────────────────────────────────────────────────────────┐
│                    ZONE 1 — ADMIN / GOVERNANCE                   │
├─────────────────────────────────────────────────────────────────┤
│  Organizations    Users & Memberships    Delegations            │
│  Tile Catalog     Integrations Registry  Oversight              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ZONE 2 — USER PORTALS                        │
├─────────────────────────────────────────────────────────────────┤
│  MOD-01 Stammdaten  │  MOD-02 KI Office  │  MOD-03 DMS          │
│  MOD-04 Immobilien  │  MOD-05 MSV        │  MOD-06 Verkauf      │
│  MOD-07 Partner     │  MOD-08 Finanz     │  MOD-09 Leads        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ZONE 3 — WEBSITES                            │
├─────────────────────────────────────────────────────────────────┤
│  Public Landingpages    Lead Capture    Property Listings       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KERNOBJEKTE                                  │
├─────────────────────────────────────────────────────────────────┤
│  Organization  │  User  │  Property  │  Lead  │  Document       │
└─────────────────────────────────────────────────────────────────┘
                  `}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Flow (Zone 3 → Zone 2)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface-2 rounded-lg p-6 font-mono text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Badge variant="outline">Zone 3 Website</Badge>
                    <span>→</span>
                    <Badge variant="outline">Lead Capture</Badge>
                    <span>→</span>
                    <Badge variant="outline">Zone 1 Pool</Badge>
                    <span>→</span>
                    <Badge variant="outline">MOD-09</Badge>
                    <span>→</span>
                    <Badge variant="outline">MOD-07</Badge>
                    <span>→</span>
                    <Badge variant="outline">MOD-08</Badge>
                    <span>→</span>
                    <Badge variant="outline">MOD-06</Badge>
                    <span>→</span>
                    <Badge className="bg-status-success/20 text-status-success">✓ Transaction</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card key={module.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{module.id}</p>
                          </div>
                        </div>
                        <StatusBadge status={module.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <StatusIcon status={module.db} />
                          <span>DB</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon status={module.ui} />
                          <span>UI</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon status={module.logic} />
                          <span>Logic</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Readiness Matrix Tab */}
          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Module Readiness Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Modul</th>
                        <th className="text-center py-3 px-4 font-semibold">Database</th>
                        <th className="text-center py-3 px-4 font-semibold">UI/Screens</th>
                        <th className="text-center py-3 px-4 font-semibold">Business Logic</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((module) => (
                        <tr key={module.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{module.id}</span>
                              <span className="font-medium">{module.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusIcon status={module.db} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusIcon status={module.ui} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusIcon status={module.logic} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={module.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                    <span>Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-status-warn" />
                    <span>Partial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <span>Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-2 py-8 mt-16">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>System of a Town — MASTER SNAPSHOT v1.0.0</p>
          <p className="mt-1">KAUFY / Acquiary / FutureRoom</p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  GitBranch, 
  Code2, 
  LayoutGrid,
  ExternalLink,
  Building2,
  ShoppingCart,
  Users,
  FolderOpen,
  Mail,
  Wrench,
  Settings
} from 'lucide-react';
import { MermaidDiagram } from '@/components/presentation/MermaidDiagram';
import type { Tables } from '@/integrations/supabase/types';

type TileCatalog = Tables<'tile_catalog'>;

interface SubTile {
  title: string;
  route: string;
  icon_key?: string;
}

// Module-specific data
const MODULE_SPECS: Record<string, {
  docPath: string;
  flowDiagram: string;
  apis: { code: string; name: string; method: string; description: string; tier: string }[];
}> = {
  'MOD-01': {
    docPath: 'docs/modules/MOD-01_STAMMDATEN.md',
    flowDiagram: `flowchart TD
    A[User Login] --> B{Hat Profile?}
    B -->|Ja| C[Dashboard]
    B -->|Nein| D[Profile erstellen]
    D --> C
    C --> E[Profil bearbeiten]
    C --> F[Firma verwalten]
    C --> G[Abrechnung]
    C --> H[Sicherheit]
    F --> I[Team einladen]
    G --> J[Subscription]
    G --> K[Rechnungen]
    H --> L[Passwort ändern]`,
    apis: [
      { code: 'API-0101', name: 'profiles.update', method: 'PATCH', description: 'Profildaten aktualisieren', tier: 'Base' },
      { code: 'API-0102', name: 'organizations.update', method: 'PATCH', description: 'Firmendaten aktualisieren', tier: 'Base' },
      { code: 'API-0103', name: 'memberships.create', method: 'POST', description: 'Team-Mitglied einladen', tier: 'Base' },
      { code: 'API-0104', name: 'invoices.list', method: 'GET', description: 'Rechnungen abrufen', tier: 'Base' },
    ]
  },
  'MOD-02': {
    docPath: 'docs/modules/MOD-02_KI_OFFICE.md',
    flowDiagram: `flowchart TD
    A[KI Office] --> B[E-Mail]
    A --> C[Brief]
    A --> D[Kontakte]
    A --> E[Kalender]
    B --> B1[Posteingang]
    B --> B2[Entwürfe]
    B --> B3[Gesendet]
    C --> C1[Brief erstellen]
    C --> C2[Vorlagen]
    C --> C3[Versand via SimpleFax/Briefdienst]
    D --> D1[Kontaktliste]
    D --> D2[Import/Export]
    E --> E1[Termine]
    E --> E2[Erinnerungen]`,
    apis: [
      { code: 'API-0201', name: 'letter_drafts.create', method: 'POST', description: 'Brief erstellen', tier: 'Base' },
      { code: 'API-0202', name: 'contacts.list', method: 'GET', description: 'Kontakte abrufen', tier: 'Base' },
      { code: 'API-0203', name: 'calendar_events.create', method: 'POST', description: 'Termin erstellen', tier: 'Base' },
      { code: 'API-0204', name: 'sot-letter-generate', method: 'POST', description: 'Brief via KI generieren', tier: 'Premium' },
    ]
  },
  'MOD-03': {
    docPath: 'docs/modules/MOD-03_DMS.md',
    flowDiagram: `flowchart TD
    A[DMS] --> B[Storage]
    A --> C[Posteingang]
    A --> D[Sortieren]
    A --> E[Einstellungen]
    B --> B1[Ordnerstruktur]
    B --> B2[Upload]
    B --> B3[Download]
    C --> C1[Caya-Import]
    C --> C2[E-Mail-Import]
    D --> D1[Auto-Kategorisierung]
    D --> D2[Manuelle Zuordnung]
    D --> D3[document_links]
    E --> E1[Speicherlimits]
    E --> E2[Berechtigungen]`,
    apis: [
      { code: 'API-0301', name: 'documents.upload', method: 'POST', description: 'Dokument hochladen', tier: 'Base' },
      { code: 'API-0302', name: 'storage_nodes.list', method: 'GET', description: 'Ordnerstruktur abrufen', tier: 'Base' },
      { code: 'API-0303', name: 'document_links.create', method: 'POST', description: 'Dokument verknüpfen', tier: 'Base' },
      { code: 'API-0304', name: 'sot-dms-upload-url', method: 'POST', description: 'Signed Upload URL', tier: 'Base' },
      { code: 'API-0305', name: 'sot-dms-download-url', method: 'POST', description: 'Signed Download URL', tier: 'Base' },
    ]
  },
  'MOD-04': {
    docPath: 'docs/modules/MOD-04_IMMOBILIEN.md',
    flowDiagram: `flowchart TD
    A[Immobilien] --> B[Kontexte]
    A --> C[Portfolio]
    A --> D[Sanierung]
    A --> E[Bewertung]
    B --> B1[Vermieterkontext erstellen]
    B --> B2[Properties zuordnen]
    C --> C1[Properties verwalten]
    C --> C2[Units verwalten]
    C --> C3[Leases anzeigen]
    D --> D1[Sanierungsmaßnahmen]
    D --> D2[Kostenplanung]
    E --> E1[Marktbewertung]
    E --> E2[Renditeberechnung]
    C1 --> F[Auto-Ordnerstruktur DMS]
    C2 --> G[Auto-Unit-Ordner]`,
    apis: [
      { code: 'API-0401', name: 'properties.create', method: 'POST', description: 'Immobilie anlegen', tier: 'Base' },
      { code: 'API-0402', name: 'units.list', method: 'GET', description: 'Einheiten abrufen', tier: 'Base' },
      { code: 'API-0403', name: 'landlord_contexts.create', method: 'POST', description: 'Vermieterkontext anlegen', tier: 'Base' },
      { code: 'API-0404', name: 'sot-property-crud', method: 'POST', description: 'Property CRUD Edge Function', tier: 'Base' },
    ]
  },
  'MOD-05': {
    docPath: 'docs/modules/MOD-05_MSV.md',
    flowDiagram: `flowchart TD
    A[MSV - Mietsonderverwaltung] --> B[Objekte]
    A --> C[Mieteingang]
    A --> D[Vermietung]
    A --> E[Einstellungen]
    
    B --> B1[Unit-Liste aus MOD-04]
    B --> B2{Lease vorhanden?}
    B2 -->|Ja| B3[Briefe erstellen]
    B2 -->|Nein| B4[Mietvertrag anlegen]
    B3 --> B5[Kündigung]
    B3 --> B6[Mieterhöhung]
    B3 --> B7[Mahnung]
    
    C --> C1{Premium?}
    C1 -->|Nein| C2[Paywall]
    C1 -->|Ja| C3[Zahlungsübersicht]
    C3 --> C4[Accordion: Letzte 10]
    C3 --> C5[Manuell buchen]
    C3 --> C6[Mietbericht senden]
    
    D --> D1[Vermietungsexposé]
    D --> D2[Scout24 Publishing]
    D --> D3[Kleinanzeigen Export]
    
    E --> E1[Mahntag konfigurieren]
    E --> E2[Mietbericht-Tag]
    E --> E3[FinAPI Konten]`,
    apis: [
      { code: 'API-0501', name: 'leases.create', method: 'POST', description: 'Mietvertrag anlegen', tier: 'Base' },
      { code: 'API-0502', name: 'rent_payments.list', method: 'GET', description: 'Zahlungen abrufen', tier: 'Premium' },
      { code: 'API-0503', name: 'rent_reminders.create', method: 'POST', description: 'Mahnung erstellen', tier: 'Premium' },
      { code: 'API-0504', name: 'rental_listings.create', method: 'POST', description: 'Vermietungsinserat anlegen', tier: 'Base' },
      { code: 'API-0505', name: 'sot-msv-reminder-check', method: 'POST', description: 'Auto-Mahnung Cron', tier: 'Premium' },
      { code: 'API-0506', name: 'sot-msv-rent-report', method: 'POST', description: 'Mietbericht senden', tier: 'Premium' },
      { code: 'API-0507', name: 'sot-listing-publish', method: 'POST', description: 'Scout24/Kleinanzeigen Publishing', tier: 'Base' },
      { code: 'API-0508', name: 'msv_bank_accounts.list', method: 'GET', description: 'FinAPI Konten abrufen', tier: 'Premium' },
    ]
  },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'building-2': Building2,
  'shopping-cart': ShoppingCart,
  'users': Users,
  'folder-open': FolderOpen,
  'mail': Mail,
  'wrench': Wrench,
  'settings': Settings,
  'layout-grid': LayoutGrid,
};

function getIcon(iconKey: string) {
  const Icon = ICON_MAP[iconKey] || LayoutGrid;
  return <Icon className="h-5 w-5" />;
}

export default function TileDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [tile, setTile] = useState<TileCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [docContent, setDocContent] = useState<string>('');

  useEffect(() => {
    if (code) {
      fetchTile(code);
    }
  }, [code]);

  async function fetchTile(tileCode: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tile_catalog')
        .select('*')
        .eq('tile_code', tileCode)
        .single();

      if (error) throw error;
      setTile(data);

      // Load module documentation placeholder
      const spec = MODULE_SPECS[tileCode];
      if (spec) {
        setDocContent(`# ${data.title} (${tileCode})\n\n${data.description}\n\n## Dokumentation\n\nSiehe: \`${spec.docPath}\`\n\n## Sub-Tiles\n\n${
          ((data.sub_tiles as unknown as SubTile[]) || []).map(st => `- **${st.title}**: \`${st.route}\``).join('\n')
        }`);
      }
    } catch (error) {
      console.error('Error fetching tile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (!tile || !code) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Modul nicht gefunden</p>
      </div>
    );
  }

  const spec = MODULE_SPECS[code];
  const subTiles = (tile.sub_tiles as unknown as SubTile[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tiles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            {getIcon(tile.icon_key)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tile.title}</h1>
            <p className="text-muted-foreground">{tile.tile_code} · {tile.description}</p>
          </div>
        </div>
        <Badge variant={tile.is_active ? 'default' : 'secondary'} className="ml-auto">
          {tile.is_active ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Hauptroute</p>
            <code className="text-sm font-mono">{tile.main_tile_route}</code>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Sub-Tiles</p>
            <p className="font-semibold">{subTiles.length} Tabs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">APIs</p>
            <p className="font-semibold">{spec?.apis.length || 0} Endpoints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Dokumentation</p>
            <p className="font-semibold">{spec?.docPath ? '✓' : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="spec" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spec" className="gap-2">
            <FileText className="h-4 w-4" />
            Spezifikation
          </TabsTrigger>
          <TabsTrigger value="flow" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Flow-Diagramm
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Code2 className="h-4 w-4" />
            API-Registry
          </TabsTrigger>
          <TabsTrigger value="markdown" className="gap-2">
            <FileText className="h-4 w-4" />
            Vollansicht
          </TabsTrigger>
        </TabsList>

        {/* Spezifikation Tab */}
        <TabsContent value="spec">
          <Card>
            <CardHeader>
              <CardTitle>Modul-Spezifikation</CardTitle>
              <CardDescription>Übersicht der Sub-Tiles und Funktionen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {subTiles.map((st, idx) => (
                  <Card key={idx} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{st.title}</p>
                          <code className="text-xs text-muted-foreground">{st.route}</code>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={st.route} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {spec && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Dokumentationsdatei:</p>
                  <code className="text-sm bg-muted px-3 py-2 rounded block">
                    {spec.docPath}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow-Diagramm Tab */}
        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <CardTitle>Prozess-Flow</CardTitle>
              <CardDescription>Visualisierung der Modul-Logik</CardDescription>
            </CardHeader>
            <CardContent>
              {spec?.flowDiagram ? (
                <div className="bg-muted/30 rounded-lg p-4">
                  <MermaidDiagram chart={spec.flowDiagram} />
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Kein Flow-Diagramm für dieses Modul definiert
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API-Registry Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API-Registry</CardTitle>
              <CardDescription>Alle Endpoints und Edge Functions</CardDescription>
            </CardHeader>
            <CardContent>
              {spec?.apis && spec.apis.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spec.apis.map((api) => (
                      <TableRow key={api.code}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{api.code}</code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{api.name}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{api.method}</Badge>
                        </TableCell>
                        <TableCell>{api.description}</TableCell>
                        <TableCell>
                          <Badge variant={api.tier === 'Premium' ? 'default' : 'secondary'}>
                            {api.tier}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine APIs für dieses Modul registriert
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markdown Vollansicht Tab */}
        <TabsContent value="markdown">
          <Card>
            <CardHeader>
              <CardTitle>Dokumentation (Vollansicht)</CardTitle>
              <CardDescription>Komplette Modul-Spezifikation</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                    {docContent || 'Keine Dokumentation verfügbar'}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

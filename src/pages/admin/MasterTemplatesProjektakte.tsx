/**
 * Master Templates - Projektakte
 * Zone 1 Admin - Template Documentation for MOD-13
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, MapPin, LayoutGrid, Calculator, Euro, 
  FileText, BookOpen, Users, FileSignature, Globe,
  CheckCircle, AlertCircle
} from 'lucide-react';

// ============================================================================
// Block Definitions
// ============================================================================

interface FieldDefinition {
  name: string;
  db_column: string;
  type: string;
  required: boolean;
  description: string;
  source?: string;
}

interface BlockDefinition {
  id: string;
  letter: string;
  title: string;
  entity: 'dev_projects' | 'dev_project_units' | 'dev_project_reservations' | 'dev_project_calculations' | 'dev_project_documents';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fields: FieldDefinition[];
}

const blocks: BlockDefinition[] = [
  {
    id: 'identity',
    letter: 'A',
    title: 'Identität & Status',
    entity: 'dev_projects',
    icon: Building2,
    description: 'Grundlegende Projektdaten und Zuordnung zur Verkäufer-Gesellschaft',
    fields: [
      { name: 'Projekt-ID', db_column: 'id', type: 'UUID', required: true, description: 'Eindeutige Kennung' },
      { name: 'Tenant-ID', db_column: 'tenant_id', type: 'UUID', required: true, description: 'Mandanten-Zuordnung' },
      { name: 'Kontext-ID', db_column: 'developer_context_id', type: 'UUID', required: true, description: 'Verkäufer-Gesellschaft' },
      { name: 'Projekt-Code', db_column: 'project_code', type: 'VARCHAR(20)', required: true, description: 'Eindeutiger Code (BT-2024-001)' },
      { name: 'Name', db_column: 'name', type: 'VARCHAR(255)', required: true, description: 'Projektname' },
      { name: 'Beschreibung', db_column: 'description', type: 'TEXT', required: false, description: 'Projektbeschreibung' },
      { name: 'Status', db_column: 'status', type: 'ENUM', required: true, description: 'draft, active, paused, completed, archived' },
      { name: 'Einheiten gesamt', db_column: 'total_units_count', type: 'INTEGER', required: true, description: 'Automatisch berechnet' },
      { name: 'Erstellt am', db_column: 'created_at', type: 'TIMESTAMPTZ', required: true, description: 'Erstellungsdatum' },
      { name: 'Aktualisiert am', db_column: 'updated_at', type: 'TIMESTAMPTZ', required: true, description: 'Letztes Update' },
      { name: 'Erstellt von', db_column: 'created_by', type: 'UUID', required: false, description: 'User-Referenz' },
    ],
  },
  {
    id: 'location',
    letter: 'B',
    title: 'Standort & Story',
    entity: 'dev_projects',
    icon: MapPin,
    description: 'Adresse und Lagebeschreibung des Projekts',
    fields: [
      { name: 'Adresse', db_column: 'address', type: 'VARCHAR(255)', required: false, description: 'Straße + Hausnummer' },
      { name: 'PLZ', db_column: 'postal_code', type: 'VARCHAR(10)', required: false, description: 'Postleitzahl' },
      { name: 'Stadt', db_column: 'city', type: 'VARCHAR(100)', required: false, description: 'Ort' },
      { name: 'Bundesland', db_column: 'state', type: 'VARCHAR(50)', required: false, description: 'Bundesland' },
      { name: 'Land', db_column: 'country', type: 'VARCHAR(2)', required: true, description: 'ISO-Code (DE)' },
      { name: 'Projektstart', db_column: 'project_start_date', type: 'DATE', required: false, description: 'Geplanter Beginn' },
      { name: 'Ziel-Ende', db_column: 'target_end_date', type: 'DATE', required: false, description: 'Geplanter Abschluss' },
    ],
  },
  {
    id: 'units',
    letter: 'C',
    title: 'Einheiten',
    entity: 'dev_project_units',
    icon: LayoutGrid,
    description: 'Wohneinheiten mit Stammdaten und Status',
    fields: [
      { name: 'Unit-ID', db_column: 'id', type: 'UUID', required: true, description: 'Eindeutige Kennung' },
      { name: 'Projekt-ID', db_column: 'project_id', type: 'UUID', required: true, description: 'Projekt-Referenz' },
      { name: 'Wohnungsnummer', db_column: 'unit_number', type: 'VARCHAR(20)', required: true, description: 'z.B. "001" oder "1.OG links"' },
      { name: 'Etage', db_column: 'floor', type: 'INTEGER', required: false, description: 'Stockwerk' },
      { name: 'Fläche m²', db_column: 'area_sqm', type: 'NUMERIC(8,2)', required: false, description: 'Wohnfläche' },
      { name: 'Zimmeranzahl', db_column: 'rooms_count', type: 'NUMERIC(3,1)', required: false, description: 'z.B. 2.5' },
      { name: 'Status', db_column: 'status', type: 'ENUM', required: true, description: 'available, reserved, sold, blocked' },
      { name: 'Grundbuchblatt', db_column: 'grundbuchblatt', type: 'VARCHAR(50)', required: false, description: 'Grundbuch-Referenz' },
      { name: 'TE-Nummer', db_column: 'te_number', type: 'VARCHAR(50)', required: false, description: 'Teilungserklärung-Nr.' },
      { name: 'Mieter', db_column: 'tenant_name', type: 'VARCHAR(255)', required: false, description: 'Aktueller Mieter' },
      { name: 'Nettokaltmiete', db_column: 'rent_net', type: 'NUMERIC(10,2)', required: false, description: 'Kaltmiete' },
      { name: 'Nebenkosten', db_column: 'rent_nk', type: 'NUMERIC(10,2)', required: false, description: 'Nebenkosten-Vorauszahlung' },
      { name: 'Balkon', db_column: 'balcony', type: 'BOOLEAN', required: true, description: 'Hat Balkon' },
      { name: 'Garten', db_column: 'garden', type: 'BOOLEAN', required: true, description: 'Hat Garten' },
      { name: 'Stellplatz', db_column: 'parking', type: 'BOOLEAN', required: true, description: 'Hat Stellplatz' },
      { name: 'Stellplatz-Typ', db_column: 'parking_type', type: 'VARCHAR(50)', required: false, description: 'TG, Außen, Carport' },
      { name: 'Notizen', db_column: 'notes', type: 'TEXT', required: false, description: 'Interne Notizen' },
    ],
  },
  {
    id: 'calculation',
    letter: 'D',
    title: 'Aufteilerkalkulation',
    entity: 'dev_project_calculations',
    icon: Calculator,
    description: 'Wirtschaftlichkeitsberechnung für Bauträger/Aufteiler',
    fields: [
      { name: 'Kaufpreis', db_column: 'purchase_price', type: 'NUMERIC(14,2)', required: false, description: 'Gesamt-Einkaufspreis' },
      { name: 'Erwerbsnebenkosten %', db_column: 'ancillary_cost_percent', type: 'NUMERIC(5,2)', required: true, description: 'Grunderwerbsteuer + Notar + Makler' },
      { name: 'Sanierung gesamt', db_column: 'renovation_total', type: 'NUMERIC(14,2)', required: false, description: 'Gesamte Modernisierungskosten' },
      { name: 'Sanierung €/m²', db_column: 'renovation_per_sqm', type: 'NUMERIC(8,2)', required: false, description: 'Alternativ: pro m²' },
      { name: 'Provision %', db_column: 'sales_commission_percent', type: 'NUMERIC(5,2)', required: true, description: 'Vertriebsprovision' },
      { name: 'Haltedauer Monate', db_column: 'holding_period_months', type: 'INTEGER', required: true, description: 'Projektlaufzeit' },
      { name: 'Finanzierungszins %', db_column: 'financing_rate_percent', type: 'NUMERIC(5,2)', required: true, description: 'Kreditzins' },
      { name: 'Fremdkapitalquote %', db_column: 'financing_ltv_percent', type: 'NUMERIC(5,2)', required: true, description: 'Beleihungsauslauf' },
      { name: 'Gesamtinvestition', db_column: 'total_investment', type: 'NUMERIC(14,2)', required: false, description: 'Berechnet', source: 'calculated' },
      { name: 'Verkaufserlös', db_column: 'total_sale_proceeds', type: 'NUMERIC(14,2)', required: false, description: 'Berechnet', source: 'calculated' },
      { name: 'Bruttogewinn', db_column: 'gross_profit', type: 'NUMERIC(14,2)', required: false, description: 'Berechnet', source: 'calculated' },
      { name: 'Marge %', db_column: 'profit_margin_percent', type: 'NUMERIC(6,2)', required: false, description: 'Berechnet', source: 'calculated' },
      { name: 'Annualisierte Rendite', db_column: 'annualized_return', type: 'NUMERIC(6,2)', required: false, description: 'Berechnet', source: 'calculated' },
      { name: 'Break-Even Einheiten', db_column: 'break_even_units', type: 'INTEGER', required: false, description: 'Berechnet', source: 'calculated' },
    ],
  },
  {
    id: 'pricing',
    letter: 'E',
    title: 'Preisliste & Provision',
    entity: 'dev_project_units',
    icon: Euro,
    description: 'Verkaufspreise und Provisionen pro Einheit',
    fields: [
      { name: 'Listenpreis', db_column: 'list_price', type: 'NUMERIC(12,2)', required: false, description: 'Offizieller Verkaufspreis' },
      { name: 'Mindestpreis', db_column: 'min_price', type: 'NUMERIC(12,2)', required: false, description: 'Untergrenze für Verhandlung' },
      { name: 'Preis/m²', db_column: 'price_per_sqm', type: 'NUMERIC(10,2)', required: false, description: 'Automatisch berechnet', source: 'calculated' },
      { name: 'Provision €', db_column: 'commission_amount', type: 'NUMERIC(12,2)', required: false, description: 'Aus Projekt-% berechnet' },
    ],
  },
  {
    id: 'documents',
    letter: 'F',
    title: 'Dokumente',
    entity: 'dev_project_documents',
    icon: FileText,
    description: 'DMS-Struktur für globale und Einheiten-Dokumente',
    fields: [
      { name: 'Dokument-ID', db_column: 'id', type: 'UUID', required: true, description: 'Eindeutige Kennung' },
      { name: 'Projekt-ID', db_column: 'project_id', type: 'UUID', required: true, description: 'Projekt-Referenz' },
      { name: 'Einheit-ID', db_column: 'unit_id', type: 'UUID', required: false, description: 'Optional: Einheit-Referenz' },
      { name: 'Storage-Node-ID', db_column: 'storage_node_id', type: 'UUID', required: false, description: 'DMS-Verknüpfung' },
      { name: 'Dokumenttyp', db_column: 'doc_type', type: 'ENUM', required: true, description: 'expose, floor_plan, grundbuch, ...' },
      { name: 'Anzeigename', db_column: 'display_name', type: 'VARCHAR(255)', required: false, description: 'Benutzerfreundlicher Name' },
      { name: 'Notizen', db_column: 'notes', type: 'TEXT', required: false, description: 'Dokumenten-Notizen' },
      { name: 'Erstellt am', db_column: 'created_at', type: 'TIMESTAMPTZ', required: true, description: 'Upload-Datum' },
    ],
  },
  {
    id: 'reservations',
    letter: 'G',
    title: 'Reservierungen',
    entity: 'dev_project_reservations',
    icon: BookOpen,
    description: 'Reservierungs-Workflow pro Einheit',
    fields: [
      { name: 'Reservierung-ID', db_column: 'id', type: 'UUID', required: true, description: 'Eindeutige Kennung' },
      { name: 'Einheit-ID', db_column: 'unit_id', type: 'UUID', required: true, description: 'Reservierte Einheit' },
      { name: 'Käufer-Kontakt', db_column: 'buyer_contact_id', type: 'UUID', required: false, description: 'Referenz auf contacts' },
      { name: 'Partner-Org', db_column: 'partner_org_id', type: 'UUID', required: false, description: 'Vermittelnde Organisation' },
      { name: 'Status', db_column: 'status', type: 'ENUM', required: true, description: 'pending, confirmed, notary_scheduled, completed, cancelled, expired' },
      { name: 'Reservierungspreis', db_column: 'reserved_price', type: 'NUMERIC(12,2)', required: false, description: 'Vereinbarter Preis' },
      { name: 'Provision €', db_column: 'commission_amount', type: 'NUMERIC(12,2)', required: false, description: 'Partner-Provision' },
      { name: 'Reservierungsdatum', db_column: 'reservation_date', type: 'DATE', required: true, description: 'Beginn der Reservierung' },
      { name: 'Ablaufdatum', db_column: 'expiry_date', type: 'DATE', required: false, description: 'Ende der Reservierung' },
      { name: 'Bestätigungsdatum', db_column: 'confirmation_date', type: 'DATE', required: false, description: 'Bestätigung durch Käufer' },
      { name: 'Notartermin', db_column: 'notary_date', type: 'DATE', required: false, description: 'Beurkundung' },
      { name: 'Abschlussdatum', db_column: 'completion_date', type: 'DATE', required: false, description: 'Vollständiger Abschluss' },
    ],
  },
  {
    id: 'sales',
    letter: 'H',
    title: 'Vertrieb',
    entity: 'dev_project_reservations',
    icon: Users,
    description: 'Partner-Performance und Provisions-Tracking',
    fields: [
      { name: 'Partner-User', db_column: 'partner_user_id', type: 'UUID', required: false, description: 'Konkreter Berater' },
      { name: 'Stornierungsdatum', db_column: 'cancellation_date', type: 'DATE', required: false, description: 'Bei Abbruch' },
      { name: 'Stornierungsgrund', db_column: 'cancellation_reason', type: 'TEXT', required: false, description: 'Grund für Abbruch' },
      { name: 'Notizen', db_column: 'notes', type: 'TEXT', required: false, description: 'Interne Anmerkungen' },
      { name: 'Erstellt von', db_column: 'created_by', type: 'UUID', required: false, description: 'Erfassender User' },
      { name: 'Erstellt am', db_column: 'created_at', type: 'TIMESTAMPTZ', required: true, description: 'Erfassungsdatum' },
    ],
  },
  {
    id: 'contracts',
    letter: 'I',
    title: 'Verträge',
    entity: 'dev_project_documents',
    icon: FileSignature,
    description: 'Kaufvertrags-Status und Drafts',
    fields: [
      { name: 'Vertragstyp', db_column: 'doc_type', type: 'ENUM', required: true, description: 'purchase_contract, reservation' },
      { name: 'Verknüpftes Dokument', db_column: 'document_id', type: 'UUID', required: false, description: 'DMS-Dokument' },
      { name: 'Erstellt von', db_column: 'created_by', type: 'UUID', required: false, description: 'User-Referenz' },
      { name: 'Erstellt am', db_column: 'created_at', type: 'TIMESTAMPTZ', required: true, description: 'Upload-Datum' },
    ],
  },
  {
    id: 'publication',
    letter: 'J',
    title: 'Veröffentlichung',
    entity: 'dev_projects',
    icon: Globe,
    description: 'Kaufy-Integration und Projekt-Landingpage',
    fields: [
      { name: 'Kaufy gelistet', db_column: 'kaufy_listed', type: 'BOOLEAN', required: true, description: 'Auf Marktplatz sichtbar' },
      { name: 'Kaufy Featured', db_column: 'kaufy_featured', type: 'BOOLEAN', required: true, description: 'Premium-Platzierung (200€/Monat)' },
      { name: 'Landingpage aktiviert', db_column: 'landingpage_enabled', type: 'BOOLEAN', required: true, description: 'Eigene Projekt-URL (200€/Monat)' },
      { name: 'Landingpage-Slug', db_column: 'landingpage_slug', type: 'VARCHAR(100)', required: false, description: 'z.B. "musterhaus-berlin"' },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

function FieldsTable({ fields }: { fields: FieldDefinition[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Feld</TableHead>
          <TableHead className="w-[150px]">DB-Spalte</TableHead>
          <TableHead className="w-[120px]">Typ</TableHead>
          <TableHead className="w-[80px] text-center">Pflicht</TableHead>
          <TableHead>Beschreibung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.db_column}>
            <TableCell className="font-medium">{field.name}</TableCell>
            <TableCell className="font-mono text-xs">{field.db_column}</TableCell>
            <TableCell className="text-xs">{field.type}</TableCell>
            <TableCell className="text-center">
              {field.required ? (
                <CheckCircle className="h-4 w-4 text-green-600 inline" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground inline" />
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {field.description}
              {field.source === 'calculated' && (
                <Badge variant="outline" className="ml-2 text-xs">berechnet</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MasterTemplatesProjektakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const globalBlocks = blocks.filter(b => b.entity === 'dev_projects' || b.entity === 'dev_project_calculations');
  const unitBlocks = blocks.filter(b => b.entity === 'dev_project_units');
  const reservationBlocks = blocks.filter(b => b.entity === 'dev_project_reservations');
  const docBlocks = blocks.filter(b => b.entity === 'dev_project_documents');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mastervorlage: Projektakte</h1>
          <p className="text-muted-foreground">
            MOD-13 PROJEKTE — Bauträger/Aufteiler-Projekte
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{blocks.length} Blöcke</Badge>
          <Badge variant="secondary">{totalFields} Felder</Badge>
        </div>
      </div>

      {/* Entity Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Globalobjekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalBlocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Blöcke: {globalBlocks.map(b => b.letter).join(', ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-blue-600" />
              Einheiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitBlocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Blöcke: {unitBlocks.map(b => b.letter).join(', ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-yellow-600" />
              Reservierungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationBlocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Blöcke: {reservationBlocks.map(b => b.letter).join(', ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docBlocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Blöcke: {docBlocks.map(b => b.letter).join(', ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blocks Detail */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle Blöcke</TabsTrigger>
          <TabsTrigger value="global">Globalobjekt</TabsTrigger>
          <TabsTrigger value="units">Einheiten</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-6">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {block.letter}. {block.title}
                          <Badge variant="outline" className="font-mono text-xs">
                            {block.entity}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{block.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-auto max-h-[400px]">
                      <FieldsTable fields={block.fields} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="global">
          <div className="space-y-6">
            {globalBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>{block.letter}. {block.title}</CardTitle>
                        <CardDescription>{block.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldsTable fields={block.fields} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="units">
          <div className="space-y-6">
            {unitBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle>{block.letter}. {block.title}</CardTitle>
                        <CardDescription>{block.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldsTable fields={block.fields} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <div className="space-y-6">
            {[...reservationBlocks, ...docBlocks].map((block) => {
              const Icon = block.icon;
              return (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-yellow-600" />
                      <div>
                        <CardTitle>{block.letter}. {block.title}</CardTitle>
                        <CardDescription>{block.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldsTable fields={block.fields} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* DMS Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            DMS-Ordnerstruktur (Automatisch erstellt)
          </CardTitle>
          <CardDescription>
            Bei Projektanlage wird automatisch diese Struktur in storage_nodes erstellt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono">
{`/Projekte/
└── {project_code}/                    ← Projekt-Root (dev_project_id)
    ├── Allgemein/                     ← Globalobjekt-Dokumente
    │   ├── Exposé/
    │   ├── Grundbuch/
    │   ├── Teilungserklärung/
    │   ├── Energieausweis/
    │   └── Fotos/
    └── Einheiten/                     ← Einheiten-Dokumente
        ├── WE-001/                    ← (dev_project_unit_id)
        │   ├── Grundriss/
        │   ├── Mietvertrag/
        │   └── Kaufvertrag/
        ├── WE-002/
        └── WE-003/`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

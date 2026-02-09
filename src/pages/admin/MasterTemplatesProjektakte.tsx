/**
 * Zone 1 — Projektakte Mastervorlage (v2)
 * READ-ONLY viewer — unified Accordion layout matching Immobilienakte standard
 * MOD-13 PROJEKTE
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Building2, MapPin, LayoutGrid, Calculator, Euro,
  FileText, BookOpen, Users, FileSignature, Globe,
  ArrowLeft, Info,
} from 'lucide-react';

// =============================================================================
// FIELD DEFINITIONS — Unified 5-column standard
// =============================================================================

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'dev_projects' | 'dev_project_units' | 'dev_project_reservations' | 'dev_project_calculations' | 'dev_project_documents';
  type: string;
  notes?: string;
}

interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
}

const blocks: BlockDefinition[] = [
  {
    id: 'A',
    title: 'Identität & Status',
    description: 'Grundlegende Projektdaten und Zuordnung zur Verkäufer-Gesellschaft',
    fields: [
      { fieldKey: 'id', labelDe: 'Projekt-ID', entity: 'dev_projects', type: 'UUID' },
      { fieldKey: 'tenant_id', labelDe: 'Mandanten-ID', entity: 'dev_projects', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'dev_projects', type: 'string', notes: 'SOT-BT-XXXXXXXX' },
      { fieldKey: 'developer_context_id', labelDe: 'Kontext-ID', entity: 'dev_projects', type: 'UUID', notes: 'Verkäufer-Gesellschaft' },
      { fieldKey: 'project_code', labelDe: 'Projekt-Code', entity: 'dev_projects', type: 'string', notes: 'BT-2024-001' },
      { fieldKey: 'name', labelDe: 'Name', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'description', labelDe: 'Beschreibung', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'dev_projects', type: 'enum', notes: 'draft | active | paused | completed | archived' },
      { fieldKey: 'total_units_count', labelDe: 'Einheiten gesamt', entity: 'dev_projects', type: 'number', notes: 'Automatisch berechnet' },
      { fieldKey: 'created_at', labelDe: 'Erstellt am', entity: 'dev_projects', type: 'date' },
      { fieldKey: 'created_by', labelDe: 'Erstellt von', entity: 'dev_projects', type: 'UUID' },
    ],
  },
  {
    id: 'B',
    title: 'Standort & Story',
    description: 'Adresse und Lagebeschreibung des Projekts',
    fields: [
      { fieldKey: 'address', labelDe: 'Adresse', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'postal_code', labelDe: 'PLZ', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'city', labelDe: 'Stadt', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'state', labelDe: 'Bundesland', entity: 'dev_projects', type: 'string' },
      { fieldKey: 'country', labelDe: 'Land', entity: 'dev_projects', type: 'string', notes: 'ISO-Code (DE)' },
      { fieldKey: 'project_start_date', labelDe: 'Projektstart', entity: 'dev_projects', type: 'date' },
      { fieldKey: 'target_end_date', labelDe: 'Ziel-Ende', entity: 'dev_projects', type: 'date' },
    ],
  },
  {
    id: 'C',
    title: 'Einheiten',
    description: 'Wohneinheiten mit Stammdaten und Status',
    fields: [
      { fieldKey: 'id', labelDe: 'Unit-ID', entity: 'dev_project_units', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'dev_project_units', type: 'string', notes: 'SOT-BE-XXXXXXXX' },
      { fieldKey: 'unit_number', labelDe: 'Wohnungsnummer', entity: 'dev_project_units', type: 'string' },
      { fieldKey: 'floor', labelDe: 'Etage', entity: 'dev_project_units', type: 'number' },
      { fieldKey: 'area_sqm', labelDe: 'Fläche m²', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'rooms_count', labelDe: 'Zimmeranzahl', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'dev_project_units', type: 'enum', notes: 'available | reserved | sold | blocked' },
      { fieldKey: 'grundbuchblatt', labelDe: 'Grundbuchblatt', entity: 'dev_project_units', type: 'string' },
      { fieldKey: 'te_number', labelDe: 'TE-Nummer', entity: 'dev_project_units', type: 'string' },
      { fieldKey: 'tenant_name', labelDe: 'Mieter', entity: 'dev_project_units', type: 'string' },
      { fieldKey: 'rent_net', labelDe: 'Nettokaltmiete', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'rent_nk', labelDe: 'Nebenkosten', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'balcony', labelDe: 'Balkon', entity: 'dev_project_units', type: 'boolean' },
      { fieldKey: 'garden', labelDe: 'Garten', entity: 'dev_project_units', type: 'boolean' },
      { fieldKey: 'parking', labelDe: 'Stellplatz', entity: 'dev_project_units', type: 'boolean' },
      { fieldKey: 'parking_type', labelDe: 'Stellplatz-Typ', entity: 'dev_project_units', type: 'string' },
      { fieldKey: 'notes', labelDe: 'Notizen', entity: 'dev_project_units', type: 'string' },
    ],
  },
  {
    id: 'D',
    title: 'Aufteilerkalkulation',
    description: 'Wirtschaftlichkeitsberechnung für Bauträger/Aufteiler',
    fields: [
      { fieldKey: 'purchase_price', labelDe: 'Kaufpreis', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'ancillary_cost_percent', labelDe: 'Erwerbsnebenkosten %', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'renovation_total', labelDe: 'Sanierung gesamt', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'renovation_per_sqm', labelDe: 'Sanierung €/m²', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'sales_commission_percent', labelDe: 'Provision %', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'holding_period_months', labelDe: 'Haltedauer Monate', entity: 'dev_project_calculations', type: 'number' },
      { fieldKey: 'financing_rate_percent', labelDe: 'Finanzierungszins %', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'financing_ltv_percent', labelDe: 'Fremdkapitalquote %', entity: 'dev_project_calculations', type: 'decimal' },
      { fieldKey: 'total_investment', labelDe: 'Gesamtinvestition', entity: 'dev_project_calculations', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'total_sale_proceeds', labelDe: 'Verkaufserlös', entity: 'dev_project_calculations', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'gross_profit', labelDe: 'Bruttogewinn', entity: 'dev_project_calculations', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'profit_margin_percent', labelDe: 'Marge %', entity: 'dev_project_calculations', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'annualized_return', labelDe: 'Annualisierte Rendite', entity: 'dev_project_calculations', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'break_even_units', labelDe: 'Break-Even Einheiten', entity: 'dev_project_calculations', type: 'number', notes: 'Berechnet' },
    ],
  },
  {
    id: 'E',
    title: 'Preisliste & Provision',
    description: 'Verkaufspreise und Provisionen pro Einheit',
    fields: [
      { fieldKey: 'list_price', labelDe: 'Listenpreis', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'min_price', labelDe: 'Mindestpreis', entity: 'dev_project_units', type: 'decimal' },
      { fieldKey: 'price_per_sqm', labelDe: 'Preis/m²', entity: 'dev_project_units', type: 'decimal', notes: 'Berechnet' },
      { fieldKey: 'commission_amount', labelDe: 'Provision €', entity: 'dev_project_units', type: 'decimal' },
    ],
  },
  {
    id: 'F',
    title: 'Dokumente',
    description: 'DMS-Struktur für globale und Einheiten-Dokumente',
    fields: [
      { fieldKey: 'id', labelDe: 'Dokument-ID', entity: 'dev_project_documents', type: 'UUID' },
      { fieldKey: 'project_id', labelDe: 'Projekt-ID', entity: 'dev_project_documents', type: 'UUID' },
      { fieldKey: 'unit_id', labelDe: 'Einheit-ID', entity: 'dev_project_documents', type: 'UUID', notes: 'Optional' },
      { fieldKey: 'storage_node_id', labelDe: 'Storage-Node-ID', entity: 'dev_project_documents', type: 'UUID' },
      { fieldKey: 'doc_type', labelDe: 'Dokumenttyp', entity: 'dev_project_documents', type: 'enum', notes: 'expose | floor_plan | grundbuch | ...' },
      { fieldKey: 'display_name', labelDe: 'Anzeigename', entity: 'dev_project_documents', type: 'string' },
      { fieldKey: 'notes', labelDe: 'Notizen', entity: 'dev_project_documents', type: 'string' },
      { fieldKey: 'created_at', labelDe: 'Erstellt am', entity: 'dev_project_documents', type: 'date' },
    ],
  },
  {
    id: 'G',
    title: 'Reservierungen',
    description: 'Reservierungs-Workflow pro Einheit',
    fields: [
      { fieldKey: 'id', labelDe: 'Reservierung-ID', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'unit_id', labelDe: 'Einheit-ID', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'buyer_contact_id', labelDe: 'Käufer-Kontakt', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'partner_org_id', labelDe: 'Partner-Org', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'dev_project_reservations', type: 'enum', notes: 'pending | confirmed | notary_scheduled | completed | cancelled' },
      { fieldKey: 'reserved_price', labelDe: 'Reservierungspreis', entity: 'dev_project_reservations', type: 'decimal' },
      { fieldKey: 'commission_amount', labelDe: 'Provision €', entity: 'dev_project_reservations', type: 'decimal' },
      { fieldKey: 'reservation_date', labelDe: 'Reservierungsdatum', entity: 'dev_project_reservations', type: 'date' },
      { fieldKey: 'expiry_date', labelDe: 'Ablaufdatum', entity: 'dev_project_reservations', type: 'date' },
      { fieldKey: 'notary_date', labelDe: 'Notartermin', entity: 'dev_project_reservations', type: 'date' },
      { fieldKey: 'completion_date', labelDe: 'Abschlussdatum', entity: 'dev_project_reservations', type: 'date' },
    ],
  },
  {
    id: 'H',
    title: 'Vertrieb',
    description: 'Partner-Performance und Provisions-Tracking',
    fields: [
      { fieldKey: 'partner_user_id', labelDe: 'Partner-User', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'cancellation_date', labelDe: 'Stornierungsdatum', entity: 'dev_project_reservations', type: 'date' },
      { fieldKey: 'cancellation_reason', labelDe: 'Stornierungsgrund', entity: 'dev_project_reservations', type: 'string' },
      { fieldKey: 'notes', labelDe: 'Notizen', entity: 'dev_project_reservations', type: 'string' },
      { fieldKey: 'created_by', labelDe: 'Erstellt von', entity: 'dev_project_reservations', type: 'UUID' },
      { fieldKey: 'created_at', labelDe: 'Erstellt am', entity: 'dev_project_reservations', type: 'date' },
    ],
  },
  {
    id: 'I',
    title: 'Verträge',
    description: 'Kaufvertrags-Status und Drafts',
    fields: [
      { fieldKey: 'doc_type', labelDe: 'Vertragstyp', entity: 'dev_project_documents', type: 'enum', notes: 'purchase_contract | reservation' },
      { fieldKey: 'document_id', labelDe: 'Verknüpftes Dokument', entity: 'dev_project_documents', type: 'UUID' },
      { fieldKey: 'created_by', labelDe: 'Erstellt von', entity: 'dev_project_documents', type: 'UUID' },
      { fieldKey: 'created_at', labelDe: 'Erstellt am', entity: 'dev_project_documents', type: 'date' },
    ],
  },
  {
    id: 'J',
    title: 'Veröffentlichung',
    description: 'Kaufy-Integration und Projekt-Landingpage',
    fields: [
      { fieldKey: 'kaufy_listed', labelDe: 'Kaufy gelistet', entity: 'dev_projects', type: 'boolean' },
      { fieldKey: 'kaufy_featured', labelDe: 'Kaufy Featured', entity: 'dev_projects', type: 'boolean', notes: 'Premium-Platzierung' },
      { fieldKey: 'landingpage_enabled', labelDe: 'Landingpage aktiviert', entity: 'dev_projects', type: 'boolean' },
      { fieldKey: 'landingpage_slug', labelDe: 'Landingpage-Slug', entity: 'dev_projects', type: 'string' },
    ],
  },
];

// =============================================================================
// SHARED COMPONENTS (matching Immobilienakte standard)
// =============================================================================

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    dev_projects: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dev_project_units: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dev_project_reservations: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    dev_project_calculations: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dev_project_documents: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  const labels: Record<EntityType, string> = {
    dev_projects: 'project',
    dev_project_units: 'unit',
    dev_project_reservations: 'reservation',
    dev_project_calculations: 'calculation',
    dev_project_documents: 'document',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {labels[entity]}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className="text-xs font-mono">
      {type}
    </Badge>
  );
}

function BlockAccordion({ block }: { block: BlockDefinition }) {
  return (
    <AccordionItem value={block.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {block.id}
          </Badge>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{block.title}</span>
              <span className="text-muted-foreground text-sm">({block.fields.length} Felder)</span>
            </div>
            <p className="text-sm text-muted-foreground">{block.description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="border rounded-lg overflow-hidden mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-48">field_key</TableHead>
                <TableHead className="w-48">label_de</TableHead>
                <TableHead className="w-28">entity</TableHead>
                <TableHead className="w-24">type</TableHead>
                <TableHead>notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.fields.map((field) => (
                <TableRow key={`${block.id}-${field.fieldKey}`}>
                  <TableCell className="font-mono text-sm">{field.fieldKey}</TableCell>
                  <TableCell>{field.labelDe}</TableCell>
                  <TableCell><EntityBadge entity={field.entity} /></TableCell>
                  <TableCell><TypeBadge type={field.type} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{field.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function MasterTemplatesProjektakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Projektakte — Mastervorlage (v2)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-13 PROJEKTE • {blocks.length} Blöcke (A–J) • {totalFields} Felder
            </p>
          </div>
        </div>
        <Link to="/admin/master-templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Datenquelle</p>
            <p className="text-muted-foreground mt-1">
              Feldstruktur abgeleitet aus den Tabellen <code className="bg-muted px-1 rounded">dev_projects</code>,{' '}
              <code className="bg-muted px-1 rounded">dev_project_units</code>,{' '}
              <code className="bg-muted px-1 rounded">dev_project_calculations</code>,{' '}
              <code className="bg-muted px-1 rounded">dev_project_reservations</code> und{' '}
              <code className="bg-muted px-1 rounded">dev_project_documents</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{blocks.length}</CardTitle>
            <CardDescription>Blöcke (A–J)</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{totalFields}</CardTitle>
            <CardDescription>Felder gesamt</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{entities.size}</CardTitle>
            <CardDescription>Entitäten</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{blocks.flatMap(b => b.fields).filter(f => f.notes?.includes('Berechnet')).length}</CardTitle>
            <CardDescription>Berechnete Felder</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Blocks Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Block-Struktur (A–J)
          </CardTitle>
          <CardDescription>Klicken Sie auf einen Block, um die Feldliste anzuzeigen</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['A']}>
            {blocks.map((block) => (
              <BlockAccordion key={block.id} block={block} />
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legende: Entitäten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <EntityBadge entity="dev_projects" />
            <EntityBadge entity="dev_project_units" />
            <EntityBadge entity="dev_project_reservations" />
            <EntityBadge entity="dev_project_calculations" />
            <EntityBadge entity="dev_project_documents" />
          </div>
        </CardContent>
      </Card>

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
{`/MOD_13/
└── {project_id}/                    ← Projekt-Root
    ├── Allgemein/                   ← Globalobjekt-Dokumente
    │   ├── Exposé/
    │   ├── Grundbuch/
    │   ├── Teilungserklärung/
    │   ├── Energieausweis/
    │   └── Fotos/
    └── Einheiten/                   ← Einheiten-Dokumente
        ├── WE-001/
        │   ├── Grundriss/
        │   ├── Mietvertrag/
        │   └── Kaufvertrag/
        └── WE-002/`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

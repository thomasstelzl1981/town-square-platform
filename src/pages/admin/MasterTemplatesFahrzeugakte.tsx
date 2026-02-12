/**
 * Zone 1 — Fahrzeugakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-17 CAR MANAGEMENT
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'cars_vehicles' | 'cars_insurances' | 'cars_financing' | 'cars_trips' | 'cars_claims' | 'cars_offers' | 'storage_nodes';
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
    id: 'A', title: 'Identität / Zulassung', description: 'Kennzeichen, FIN und Zulassungsdaten',
    fields: [
      { fieldKey: 'id', labelDe: 'Fahrzeug-ID', entity: 'cars_vehicles', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'cars_vehicles', type: 'string', notes: 'SOT-V-XXXXXXXX' },
      { fieldKey: 'license_plate', labelDe: 'Kennzeichen', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'vin', labelDe: 'FIN (Fahrgestellnummer)', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'registration_date', labelDe: 'Zulassungsdatum', entity: 'cars_vehicles', type: 'date' },
      { fieldKey: 'first_registration', labelDe: 'Erstzulassung', entity: 'cars_vehicles', type: 'date' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'cars_vehicles', type: 'enum', notes: 'active | inactive | sold | scrapped' },
    ],
  },
  {
    id: 'B', title: 'Technische Daten', description: 'Marke, Modell, Motor und Ausstattung',
    fields: [
      { fieldKey: 'make', labelDe: 'Marke', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'model', labelDe: 'Modell', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'variant', labelDe: 'Variante', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'fuel_type', labelDe: 'Kraftstoff', entity: 'cars_vehicles', type: 'enum', notes: 'benzin | diesel | elektro | hybrid | gas' },
      { fieldKey: 'power_kw', labelDe: 'Leistung (kW)', entity: 'cars_vehicles', type: 'number' },
      { fieldKey: 'displacement_cc', labelDe: 'Hubraum (ccm)', entity: 'cars_vehicles', type: 'number' },
      { fieldKey: 'color', labelDe: 'Farbe', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'transmission', labelDe: 'Getriebe', entity: 'cars_vehicles', type: 'enum', notes: 'manual | automatic' },
    ],
  },
  {
    id: 'C', title: 'Halter / Fahrer', description: 'Zuordnung zu Personen und Kontakten',
    fields: [
      { fieldKey: 'driver_name', labelDe: 'Fahrer', entity: 'cars_vehicles', type: 'string' },
      { fieldKey: 'driver_contact_id', labelDe: 'Fahrer-Kontakt', entity: 'cars_vehicles', type: 'UUID' },
      { fieldKey: 'owner_org_id', labelDe: 'Halter-Organisation', entity: 'cars_vehicles', type: 'UUID' },
    ],
  },
  {
    id: 'D', title: 'Finanzierung / Leasing', description: 'Finanzierungs- und Leasingdaten',
    fields: [
      { fieldKey: 'financing_type', labelDe: 'Finanzierungsart', entity: 'cars_financing', type: 'enum', notes: 'leasing | kredit | bar' },
      { fieldKey: 'monthly_rate', labelDe: 'Monatsrate', entity: 'cars_financing', type: 'decimal' },
      { fieldKey: 'contract_start', labelDe: 'Vertragsbeginn', entity: 'cars_financing', type: 'date' },
      { fieldKey: 'contract_end', labelDe: 'Vertragsende', entity: 'cars_financing', type: 'date' },
      { fieldKey: 'residual_value', labelDe: 'Restwert', entity: 'cars_financing', type: 'decimal' },
      { fieldKey: 'total_km_allowed', labelDe: 'Gesamt-km-Limit', entity: 'cars_financing', type: 'number' },
    ],
  },
  {
    id: 'E', title: 'Versicherung', description: 'Policen und Deckungsschutz',
    fields: [
      { fieldKey: 'coverage_type', labelDe: 'Deckungsart', entity: 'cars_insurances', type: 'enum', notes: 'haftpflicht | teilkasko | vollkasko' },
      { fieldKey: 'provider', labelDe: 'Versicherer', entity: 'cars_insurances', type: 'string' },
      { fieldKey: 'policy_number', labelDe: 'Policen-Nr.', entity: 'cars_insurances', type: 'string' },
      { fieldKey: 'annual_premium', labelDe: 'Jahresprämie', entity: 'cars_insurances', type: 'decimal' },
      { fieldKey: 'valid_until', labelDe: 'Gültig bis', entity: 'cars_insurances', type: 'date' },
    ],
  },
  {
    id: 'F', title: 'Schäden / Claims', description: 'Schadensfälle und Reparaturen',
    fields: [
      { fieldKey: 'claim_date', labelDe: 'Schadensdatum', entity: 'cars_claims', type: 'date' },
      { fieldKey: 'description', labelDe: 'Beschreibung', entity: 'cars_claims', type: 'string' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'cars_claims', type: 'enum', notes: 'open | in_progress | settled | rejected' },
      { fieldKey: 'repair_cost', labelDe: 'Reparaturkosten', entity: 'cars_claims', type: 'decimal' },
    ],
  },
  {
    id: 'G', title: 'Fahrtenbuch', description: 'Fahrten-Tracking und Kilometerstand',
    fields: [
      { fieldKey: 'trip_date', labelDe: 'Fahrtdatum', entity: 'cars_trips', type: 'date' },
      { fieldKey: 'start_km', labelDe: 'Start-km', entity: 'cars_trips', type: 'number' },
      { fieldKey: 'end_km', labelDe: 'End-km', entity: 'cars_trips', type: 'number' },
      { fieldKey: 'purpose', labelDe: 'Zweck', entity: 'cars_trips', type: 'enum', notes: 'geschäftlich | privat' },
    ],
  },
  {
    id: 'H', title: 'Angebote / Markt', description: 'Leasing-Deals und Vergleiche',
    fields: [
      { fieldKey: 'offer_type', labelDe: 'Angebotstyp', entity: 'cars_offers', type: 'enum', notes: 'leasing | kauf | miete' },
      { fieldKey: 'provider', labelDe: 'Anbieter', entity: 'cars_offers', type: 'string' },
      { fieldKey: 'monthly_rate', labelDe: 'Monatsrate', entity: 'cars_offers', type: 'decimal' },
      { fieldKey: 'highlights', labelDe: 'Highlights', entity: 'cars_offers', type: 'string' },
    ],
  },
  {
    id: 'I', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_17',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_17/{vehicle_id}/' },
      { fieldKey: 'folder_stammdaten', labelDe: '01_Stammdaten', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_versicherung', labelDe: '02_Versicherung', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_finanzierung', labelDe: '03_Finanzierung', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_schaeden', labelDe: '04_Schaeden', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_fahrtenbuch', labelDe: '05_Fahrtenbuch', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    cars_vehicles: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    cars_insurances: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cars_financing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    cars_trips: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    cars_claims: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cars_offers: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity.replace('cars_', '')}
    </span>
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
                  <TableCell><Badge variant="outline" className="text-xs font-mono">{field.type}</Badge></TableCell>
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

export default function MasterTemplatesFahrzeugakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Fahrzeugakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-17 CAR MANAGEMENT • {blocks.length} Blöcke (A–I) • {totalFields} Felder
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

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Datenquelle</p>
            <p className="text-muted-foreground mt-1">
              Feldstruktur aus <code className="bg-muted px-1 rounded">cars_vehicles</code>,{' '}
              <code className="bg-muted px-1 rounded">cars_insurances</code>,{' '}
              <code className="bg-muted px-1 rounded">cars_financing</code>,{' '}
              <code className="bg-muted px-1 rounded">cars_trips</code>,{' '}
              <code className="bg-muted px-1 rounded">cars_claims</code> und{' '}
              <code className="bg-muted px-1 rounded">cars_offers</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–I)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">6</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–I)</CardTitle>
          <CardDescription>Klicken Sie auf einen Block, um die Feldliste anzuzeigen</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['A']}>
            {blocks.map((block) => <BlockAccordion key={block.id} block={block} />)}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Legende: Entitäten</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from(entities).map(e => <EntityBadge key={e} entity={e} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

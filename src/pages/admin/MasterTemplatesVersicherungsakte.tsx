/**
 * Zone 1 — Versicherungsakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-11 FINANZMANAGER (insurance_contracts)
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
import { Shield, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'insurance_contracts' | 'storage_nodes';
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
    id: 'A', title: 'Identität', description: 'Kategorie, Status und Referenz',
    fields: [
      { fieldKey: 'id', labelDe: 'Vertrags-ID', entity: 'insurance_contracts', type: 'UUID' },
      { fieldKey: 'category', labelDe: 'Kategorie', entity: 'insurance_contracts', type: 'enum', notes: 'hausrat | haftpflicht | kfz | wohngebaeude | rechtsschutz | unfall | leben | reise | tier | sonstige' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'insurance_contracts', type: 'enum', notes: 'aktiv | gekuendigt | ruhend | auslaufend' },
    ],
  },
  {
    id: 'B', title: 'Vertragsdaten', description: 'Versicherer, Laufzeit und Kündigungsfristen',
    fields: [
      { fieldKey: 'provider_name', labelDe: 'Versicherer', entity: 'insurance_contracts', type: 'string' },
      { fieldKey: 'policy_number', labelDe: 'Policen-Nr.', entity: 'insurance_contracts', type: 'string' },
      { fieldKey: 'policyholder_name', labelDe: 'Versicherungsnehmer', entity: 'insurance_contracts', type: 'string' },
      { fieldKey: 'start_date', labelDe: 'Vertragsbeginn', entity: 'insurance_contracts', type: 'date' },
      { fieldKey: 'end_date', labelDe: 'Vertragsende', entity: 'insurance_contracts', type: 'date' },
      { fieldKey: 'cancellation_period', labelDe: 'Kündigungsfrist', entity: 'insurance_contracts', type: 'string', notes: 'z.B. 3 Monate zum Vertragsende' },
    ],
  },
  {
    id: 'C', title: 'Prämie / Kosten', description: 'Zahlungsdetails und Selbstbeteiligung',
    fields: [
      { fieldKey: 'premium_amount', labelDe: 'Prämie (€)', entity: 'insurance_contracts', type: 'decimal' },
      { fieldKey: 'payment_interval', labelDe: 'Zahlungsintervall', entity: 'insurance_contracts', type: 'enum', notes: 'monatlich | vierteljaehrlich | halbjaehrlich | jaehrlich' },
      { fieldKey: 'deductible', labelDe: 'Selbstbeteiligung (€)', entity: 'insurance_contracts', type: 'decimal' },
    ],
  },
  {
    id: 'D', title: 'Deckung', description: 'Versicherungssumme und Leistungsumfang',
    fields: [
      { fieldKey: 'coverage_amount', labelDe: 'Versicherungssumme (€)', entity: 'insurance_contracts', type: 'decimal' },
      { fieldKey: 'details', labelDe: 'Deckungsumfang', entity: 'insurance_contracts', type: 'jsonb', notes: 'Kategoriespezifische Details (z.B. Glasbruch, Elementar, Neuwertentschädigung)' },
    ],
  },
  {
    id: 'E', title: 'Schäden / Claims', description: 'Schadensmeldungen und Regulierung',
    fields: [
      { fieldKey: 'claim_number', labelDe: 'Schadensnummer', entity: 'insurance_contracts', type: 'string' },
      { fieldKey: 'claim_date', labelDe: 'Schadensdatum', entity: 'insurance_contracts', type: 'date' },
      { fieldKey: 'claim_status', labelDe: 'Schaden-Status', entity: 'insurance_contracts', type: 'enum', notes: 'gemeldet | in_bearbeitung | reguliert | abgelehnt' },
      { fieldKey: 'claim_amount', labelDe: 'Regulierungsbetrag (€)', entity: 'insurance_contracts', type: 'decimal' },
    ],
  },
  {
    id: 'F', title: 'Zuordnung', description: 'Verknüpfung zu Immobilien, Fahrzeugen und Personen',
    fields: [
      { fieldKey: 'linked_property_id', labelDe: 'Verknüpfte Immobilie', entity: 'insurance_contracts', type: 'UUID', notes: 'FK → units' },
      { fieldKey: 'linked_vehicle_id', labelDe: 'Verknüpftes Fahrzeug', entity: 'insurance_contracts', type: 'UUID', notes: 'FK → cars_vehicles' },
      { fieldKey: 'linked_person_id', labelDe: 'Verknüpfte Person', entity: 'insurance_contracts', type: 'UUID', notes: 'FK → household_persons' },
    ],
  },
  {
    id: 'G', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_11 (5 Ordner)',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_11/{insurance_id}/' },
      { fieldKey: 'folder_01', labelDe: '01_Police', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_02', labelDe: '02_Nachtraege', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_03', labelDe: '03_Schaeden', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_04', labelDe: '04_Korrespondenz', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_05', labelDe: '05_Sonstiges', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    insurance_contracts: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'insurance_contracts' ? 'insurance' : 'dms'}
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

export default function MasterTemplatesVersicherungsakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Versicherungsakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-11 FINANZMANAGER • {blocks.length} Blöcke (A–G) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">insurance_contracts</code>.
              DMS-Ordnerstruktur gemäß Phase-2-Spezifikation (noch nicht implementiert).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–G)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">5</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–G)</CardTitle>
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

/**
 * Zone 1 — Vorsorgeakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-11 FINANZMANAGER (vorsorge_contracts)
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
import { Heart, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'vorsorge_contracts' | 'household_persons' | 'storage_nodes';
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
    id: 'A', title: 'Identität', description: 'Vertragstyp, Kategorie und Status',
    fields: [
      { fieldKey: 'id', labelDe: 'Vertrags-ID', entity: 'vorsorge_contracts', type: 'UUID' },
      { fieldKey: 'contract_type', labelDe: 'Vertragstyp', entity: 'vorsorge_contracts', type: 'enum', notes: 'riester | ruerup | bav | privat | kapital_lv | fondsgebunden | direktversicherung' },
      { fieldKey: 'category', labelDe: 'Kategorie', entity: 'vorsorge_contracts', type: 'string' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'vorsorge_contracts', type: 'enum', notes: 'aktiv | beitragsfrei | gekuendigt | ausgezahlt' },
    ],
  },
  {
    id: 'B', title: 'Vertragsdaten', description: 'Anbieter und Laufzeit',
    fields: [
      { fieldKey: 'provider_name', labelDe: 'Anbieter', entity: 'vorsorge_contracts', type: 'string' },
      { fieldKey: 'contract_number', labelDe: 'Vertragsnummer', entity: 'vorsorge_contracts', type: 'string' },
      { fieldKey: 'start_date', labelDe: 'Vertragsbeginn', entity: 'vorsorge_contracts', type: 'date' },
      { fieldKey: 'end_date', labelDe: 'Vertragsende', entity: 'vorsorge_contracts', type: 'date' },
    ],
  },
  {
    id: 'C', title: 'Beiträge', description: 'Zahlungsdetails und Dynamik',
    fields: [
      { fieldKey: 'contribution_amount', labelDe: 'Beitrag (€)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'payment_interval', labelDe: 'Zahlungsintervall', entity: 'vorsorge_contracts', type: 'enum', notes: 'monatlich | vierteljaehrlich | halbjaehrlich | jaehrlich' },
      { fieldKey: 'dynamic_percent', labelDe: 'Dynamik (%)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'bu_monthly', labelDe: 'BU-Zusatzbeitrag (€/Monat)', entity: 'vorsorge_contracts', type: 'decimal' },
    ],
  },
  {
    id: 'D', title: 'Leistungen', description: 'Vertragswert und Prognosen',
    fields: [
      { fieldKey: 'current_value', labelDe: 'Aktueller Vertragswert (€)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'value_date', labelDe: 'Stichtag', entity: 'vorsorge_contracts', type: 'date' },
      { fieldKey: 'projected_end_value', labelDe: 'Prognostizierter Endwert (€)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'monthly_pension', labelDe: 'Monatliche Rente (€)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'insured_amount', labelDe: 'Versicherte Summe (€)', entity: 'vorsorge_contracts', type: 'decimal' },
      { fieldKey: 'growth_rate_override', labelDe: 'Wachstumsrate-Override (%)', entity: 'vorsorge_contracts', type: 'decimal' },
    ],
  },
  {
    id: 'E', title: 'Zuordnung', description: 'Verknüpfung zu Personen',
    fields: [
      { fieldKey: 'person_id', labelDe: 'Person', entity: 'household_persons', type: 'UUID', notes: 'FK → household_persons' },
      { fieldKey: 'beneficiary', labelDe: 'Bezugsberechtigter', entity: 'vorsorge_contracts', type: 'string' },
    ],
  },
  {
    id: 'F', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_11 (4 Ordner)',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_11/{vorsorge_id}/' },
      { fieldKey: 'folder_01', labelDe: '01_Vertrag', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_02', labelDe: '02_Standmitteilungen', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_03', labelDe: '03_Renteninformation', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_04', labelDe: '04_Korrespondenz', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    vorsorge_contracts: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    household_persons: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'vorsorge_contracts' ? 'vorsorge' : entity === 'household_persons' ? 'person' : 'dms'}
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

export default function MasterTemplatesVorsorgeakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Vorsorgeakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-11 FINANZMANAGER • {blocks.length} Blöcke (A–F) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">vorsorge_contracts</code> und{' '}
              <code className="bg-muted px-1 rounded">household_persons</code>.
              DMS-Ordnerstruktur gemäß Phase-2-Spezifikation (noch nicht implementiert).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–F)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">4</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–F)</CardTitle>
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

/**
 * Zone 1 — Haustierakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-05 PETS (pets)
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
import { PawPrint, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'pets' | 'storage_nodes';
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
    id: 'A', title: 'Stammdaten', description: 'Name, Art, Rasse und Grunddaten',
    fields: [
      { fieldKey: 'id', labelDe: 'Tier-ID', entity: 'pets', type: 'UUID' },
      { fieldKey: 'name', labelDe: 'Name', entity: 'pets', type: 'string' },
      { fieldKey: 'species', labelDe: 'Tierart', entity: 'pets', type: 'enum', notes: 'hund | katze | vogel | nager | reptil | fisch | sonstige' },
      { fieldKey: 'breed', labelDe: 'Rasse', entity: 'pets', type: 'string' },
      { fieldKey: 'gender', labelDe: 'Geschlecht', entity: 'pets', type: 'enum', notes: 'maennlich | weiblich' },
      { fieldKey: 'birth_date', labelDe: 'Geburtsdatum', entity: 'pets', type: 'date' },
      { fieldKey: 'weight_kg', labelDe: 'Gewicht (kg)', entity: 'pets', type: 'decimal' },
    ],
  },
  {
    id: 'B', title: 'Identifikation', description: 'Chipnummer und Foto',
    fields: [
      { fieldKey: 'chip_number', labelDe: 'Chipnummer', entity: 'pets', type: 'string' },
      { fieldKey: 'photo_url', labelDe: 'Foto', entity: 'pets', type: 'string', notes: 'URL zum Tierbild' },
    ],
  },
  {
    id: 'C', title: 'Gesundheit', description: 'Allergien, Kastration und Tierarzt',
    fields: [
      { fieldKey: 'allergies', labelDe: 'Allergien', entity: 'pets', type: 'string[]', notes: 'Array von Allergie-Einträgen' },
      { fieldKey: 'is_neutered', labelDe: 'Kastriert', entity: 'pets', type: 'boolean' },
      { fieldKey: 'vet_name', labelDe: 'Tierarzt-Name', entity: 'pets', type: 'string' },
    ],
  },
  {
    id: 'D', title: 'Versicherung', description: 'Tierkrankenversicherung',
    fields: [
      { fieldKey: 'insurance_provider', labelDe: 'Versicherungsanbieter', entity: 'pets', type: 'string' },
      { fieldKey: 'insurance_policy_number', labelDe: 'Policennummer', entity: 'pets', type: 'string' },
    ],
  },
  {
    id: 'E', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_05 (4 Ordner)',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_05/{pet_id}/' },
      { fieldKey: 'folder_01', labelDe: '01_Impfpass', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_02', labelDe: '02_Tierarzt', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_03', labelDe: '03_Versicherung', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_04', labelDe: '04_Sonstiges', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    pets: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'pets' ? 'pet' : 'dms'}
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

export default function MasterTemplatesHaustierakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Haustierakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-05 PETS • {blocks.length} Blöcke (A–E) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">pets</code>.
              DMS-Ordnerstruktur via EntityStorageTree (bereits integriert).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–E)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">4</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–E)</CardTitle>
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

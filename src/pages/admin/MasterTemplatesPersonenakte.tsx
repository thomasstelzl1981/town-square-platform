/**
 * Zone 1 — Personenakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-01 STAMMDATEN (household_persons)
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
import { User, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'household_persons' | 'storage_nodes';
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
    id: 'A', title: 'Stammdaten', description: 'Name, Geburtsdatum und Avatar',
    fields: [
      { fieldKey: 'id', labelDe: 'Person-ID', entity: 'household_persons', type: 'UUID' },
      { fieldKey: 'salutation', labelDe: 'Anrede', entity: 'household_persons', type: 'enum', notes: 'Herr | Frau | Divers' },
      { fieldKey: 'first_name', labelDe: 'Vorname', entity: 'household_persons', type: 'string' },
      { fieldKey: 'last_name', labelDe: 'Nachname', entity: 'household_persons', type: 'string' },
      { fieldKey: 'birth_date', labelDe: 'Geburtsdatum', entity: 'household_persons', type: 'date' },
      { fieldKey: 'avatar_url', labelDe: 'Avatar', entity: 'household_persons', type: 'string', notes: 'URL zum Profilbild' },
    ],
  },
  {
    id: 'B', title: 'Kontakt', description: 'E-Mail und Telefonnummern',
    fields: [
      { fieldKey: 'email', labelDe: 'E-Mail', entity: 'household_persons', type: 'string' },
      { fieldKey: 'phone_mobile', labelDe: 'Telefon mobil', entity: 'household_persons', type: 'string' },
      { fieldKey: 'phone_landline', labelDe: 'Telefon Festnetz', entity: 'household_persons', type: 'string' },
    ],
  },
  {
    id: 'C', title: 'Adresse', description: 'Wohnadresse',
    fields: [
      { fieldKey: 'street', labelDe: 'Straße', entity: 'household_persons', type: 'string' },
      { fieldKey: 'house_number', labelDe: 'Hausnummer', entity: 'household_persons', type: 'string' },
      { fieldKey: 'postal_code', labelDe: 'PLZ', entity: 'household_persons', type: 'string' },
      { fieldKey: 'city', labelDe: 'Ort', entity: 'household_persons', type: 'string' },
    ],
  },
  {
    id: 'D', title: 'Beschäftigung', description: 'Arbeitgeber und Einkommen',
    fields: [
      { fieldKey: 'employment_status', labelDe: 'Beschäftigungsstatus', entity: 'household_persons', type: 'enum', notes: 'angestellt | selbststaendig | beamtet | rentner | student | arbeitslos' },
      { fieldKey: 'employer', labelDe: 'Arbeitgeber', entity: 'household_persons', type: 'string' },
      { fieldKey: 'gross_income', labelDe: 'Bruttoeinkommen (€/Monat)', entity: 'household_persons', type: 'decimal' },
      { fieldKey: 'net_income', labelDe: 'Nettoeinkommen (€/Monat)', entity: 'household_persons', type: 'decimal' },
      { fieldKey: 'tax_class', labelDe: 'Steuerklasse', entity: 'household_persons', type: 'enum', notes: '1–6' },
    ],
  },
  {
    id: 'E', title: 'Beamten-Felder', description: 'Spezialfelder für Beamte',
    fields: [
      { fieldKey: 'salary_grade', labelDe: 'Besoldungsgruppe', entity: 'household_persons', type: 'string', notes: 'z.B. A13, A14' },
      { fieldKey: 'experience_level', labelDe: 'Erfahrungsstufe', entity: 'household_persons', type: 'number' },
      { fieldKey: 'employer_authority', labelDe: 'Dienstherr', entity: 'household_persons', type: 'string' },
      { fieldKey: 'civil_service_date', labelDe: 'Verbeamtungsdatum', entity: 'household_persons', type: 'date' },
      { fieldKey: 'years_of_service', labelDe: 'Dienstjahre', entity: 'household_persons', type: 'number' },
      { fieldKey: 'pension_base_salary', labelDe: 'Ruhegehaltfähiges Grundgehalt', entity: 'household_persons', type: 'decimal' },
    ],
  },
  {
    id: 'F', title: 'Vorsorge-Referenz', description: 'Rentenplanung und Kindergeld',
    fields: [
      { fieldKey: 'planned_retirement_date', labelDe: 'Geplantes Renteneintrittsdatum', entity: 'household_persons', type: 'date' },
      { fieldKey: 'child_benefit_allowance', labelDe: 'Kindergeld-Freibetrag', entity: 'household_persons', type: 'decimal' },
    ],
  },
  {
    id: 'G', title: 'Familienstand', description: 'Status und Rolle im Haushalt',
    fields: [
      { fieldKey: 'marital_status', labelDe: 'Familienstand', entity: 'household_persons', type: 'enum', notes: 'ledig | verheiratet | geschieden | verwitwet' },
      { fieldKey: 'household_role', labelDe: 'Rolle', entity: 'household_persons', type: 'enum', notes: 'hauptperson | partner | kind | sonstige' },
    ],
  },
  {
    id: 'H', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_01 (8 Ordner)',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_01/{person_id}/' },
      { fieldKey: 'folder_01', labelDe: '01_Personalausweis', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_02', labelDe: '02_Meldebescheinigung', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_03', labelDe: '03_Einkommensnachweise', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_04', labelDe: '04_Steuerbescheide', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_05', labelDe: '05_Renteninfo', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_06', labelDe: '06_Arbeitsvertrag', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_07', labelDe: '07_Gesundheit', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_08', labelDe: '08_Sonstiges', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    household_persons: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'household_persons' ? 'person' : 'dms'}
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

export default function MasterTemplatesPersonenakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Personenakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-01 STAMMDATEN • {blocks.length} Blöcke (A–H) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">household_persons</code>.
              DMS-Ordnerstruktur via <code className="bg-muted px-1 rounded">usePersonDMS</code> Hook (bereits implementiert).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–H)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">8</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–H)</CardTitle>
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

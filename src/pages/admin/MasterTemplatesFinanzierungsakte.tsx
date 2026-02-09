/**
 * Zone 1 — Finanzierungsakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-11 FINANZIERUNGSMANAGER
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Landmark, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'finance_mandates' | 'finance_requests' | 'applicant_profiles' | 'finance_packages' | 'finance_bank_contacts' | 'properties' | 'storage_nodes';
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
    id: 'A', title: 'Mandatsinfo', description: 'Mandat-Status und Manager-Zuordnung',
    fields: [
      { fieldKey: 'id', labelDe: 'Mandat-ID', entity: 'finance_mandates', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'finance_mandates', type: 'string', notes: 'SOT-FM-XXXXXXXX' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'finance_mandates', type: 'enum', notes: 'pending | accepted | in_progress | submitted | completed' },
      { fieldKey: 'delegated_at', labelDe: 'Delegiert am', entity: 'finance_mandates', type: 'date' },
      { fieldKey: 'accepted_at', labelDe: 'Akzeptiert am', entity: 'finance_mandates', type: 'date' },
      { fieldKey: 'assigned_manager_id', labelDe: 'Zugewiesener Manager', entity: 'finance_mandates', type: 'UUID' },
      { fieldKey: 'commission_confirmed', labelDe: 'Provision bestätigt', entity: 'finance_mandates', type: 'boolean', notes: '0.5% Systemgebühr' },
      { fieldKey: 'notes', labelDe: 'Notizen', entity: 'finance_mandates', type: 'string' },
    ],
  },
  {
    id: 'B', title: 'Finanzierungsanfrage', description: 'Eckdaten der Anfrage',
    fields: [
      { fieldKey: 'id', labelDe: 'Anfrage-ID', entity: 'finance_requests', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'finance_requests', type: 'string', notes: 'SOT-FR-XXXXXXXX' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'finance_requests', type: 'enum', notes: 'draft | submitted | in_review | approved | rejected' },
      { fieldKey: 'purpose', labelDe: 'Verwendungszweck', entity: 'finance_requests', type: 'enum', notes: 'kauf | umschuldung | modernisierung' },
      { fieldKey: 'loan_amount', labelDe: 'Darlehensbetrag', entity: 'finance_requests', type: 'decimal' },
      { fieldKey: 'property_value', labelDe: 'Objektwert', entity: 'finance_requests', type: 'decimal' },
      { fieldKey: 'equity_amount', labelDe: 'Eigenkapital', entity: 'finance_requests', type: 'decimal' },
      { fieldKey: 'ltv', labelDe: 'LTV (%)', entity: 'finance_requests', type: 'decimal', notes: 'Berechnet' },
    ],
  },
  {
    id: 'C', title: 'Antragsteller (Primary)', description: 'Hauptantragsteller aus applicant_profiles',
    fields: [
      { fieldKey: 'public_id', labelDe: 'Profil-ID', entity: 'applicant_profiles', type: 'string', notes: 'SOT-AP-XXXXXXXX' },
      { fieldKey: 'party_role', labelDe: 'Rolle', entity: 'applicant_profiles', type: 'enum', notes: 'primary' },
      { fieldKey: 'first_name', labelDe: 'Vorname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'last_name', labelDe: 'Nachname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'employment_type', labelDe: 'Beschäftigungsart', entity: 'applicant_profiles', type: 'enum' },
      { fieldKey: 'net_income_monthly', labelDe: 'Nettoeinkommen', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'completion_score', labelDe: 'Vollständigkeit (%)', entity: 'applicant_profiles', type: 'number', notes: 'Berechnet' },
    ],
  },
  {
    id: 'D', title: 'Antragsteller (Co-Applicant)', description: 'Mitantragsteller (optional, gleiche Felder)',
    fields: [
      { fieldKey: 'linked_primary_profile_id', labelDe: 'Verknüpfung Primary', entity: 'applicant_profiles', type: 'UUID', notes: 'Referenz auf Hauptprofil' },
      { fieldKey: 'party_role', labelDe: 'Rolle', entity: 'applicant_profiles', type: 'enum', notes: 'co_applicant' },
      { fieldKey: 'first_name', labelDe: 'Vorname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'last_name', labelDe: 'Nachname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'employment_type', labelDe: 'Beschäftigungsart', entity: 'applicant_profiles', type: 'enum' },
      { fieldKey: 'net_income_monthly', labelDe: 'Nettoeinkommen', entity: 'applicant_profiles', type: 'decimal' },
    ],
  },
  {
    id: 'E', title: 'Objektdaten (Referenz)', description: 'Verknüpfung zur Immobilien-/Projektakte',
    fields: [
      { fieldKey: 'property_id', labelDe: 'Immobilien-Referenz', entity: 'properties', type: 'UUID', notes: 'MOD-04 Verknüpfung' },
      { fieldKey: 'address', labelDe: 'Adresse', entity: 'properties', type: 'string', notes: 'Read-only aus MOD-04' },
      { fieldKey: 'purchase_price', labelDe: 'Kaufpreis', entity: 'properties', type: 'decimal', notes: 'Read-only aus MOD-04' },
      { fieldKey: 'market_value', labelDe: 'Verkehrswert', entity: 'properties', type: 'decimal', notes: 'Read-only aus MOD-04' },
    ],
  },
  {
    id: 'F', title: 'Finanzierungspakete', description: 'Bankkonditionen und Angebote',
    fields: [
      { fieldKey: 'id', labelDe: 'Paket-ID', entity: 'finance_packages', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'finance_packages', type: 'string', notes: 'SOT-F-XXXXXXXX' },
      { fieldKey: 'bank_name', labelDe: 'Bank', entity: 'finance_packages', type: 'string' },
      { fieldKey: 'interest_rate', labelDe: 'Zinssatz (%)', entity: 'finance_packages', type: 'decimal' },
      { fieldKey: 'monthly_rate', labelDe: 'Monatsrate', entity: 'finance_packages', type: 'decimal' },
      { fieldKey: 'term_years', labelDe: 'Zinsbindung (Jahre)', entity: 'finance_packages', type: 'number' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'finance_packages', type: 'enum', notes: 'draft | submitted | approved | rejected' },
    ],
  },
  {
    id: 'G', title: 'Bank-Kontakte', description: 'Ansprechpartner bei Banken',
    fields: [
      { fieldKey: 'id', labelDe: 'Kontakt-ID', entity: 'finance_bank_contacts', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'finance_bank_contacts', type: 'string', notes: 'SOT-FB-XXXXXXXX' },
      { fieldKey: 'bank_name', labelDe: 'Bank', entity: 'finance_bank_contacts', type: 'string' },
      { fieldKey: 'contact_person', labelDe: 'Ansprechpartner', entity: 'finance_bank_contacts', type: 'string' },
      { fieldKey: 'email', labelDe: 'E-Mail', entity: 'finance_bank_contacts', type: 'string' },
      { fieldKey: 'phone', labelDe: 'Telefon', entity: 'finance_bank_contacts', type: 'string' },
    ],
  },
  {
    id: 'H', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_11',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_11/{finance_request_id}/' },
      { fieldKey: 'folder_selbstauskunft', labelDe: 'Selbstauskunft', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_einkommensnachweise', labelDe: 'Einkommensnachweise', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_objektunterlagen', labelDe: 'Objektunterlagen', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_bankpakete', labelDe: 'Bankpakete', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    finance_mandates: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    finance_requests: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    applicant_profiles: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    finance_packages: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    finance_bank_contacts: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    properties: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  const labels: Record<EntityType, string> = {
    finance_mandates: 'mandate',
    finance_requests: 'request',
    applicant_profiles: 'profile',
    finance_packages: 'package',
    finance_bank_contacts: 'bank_contact',
    properties: 'property',
    storage_nodes: 'dms',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {labels[entity]}
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

export default function MasterTemplatesFinanzierungsakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Finanzierungsakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-11 FINANZIERUNGSMANAGER • {blocks.length} Blöcke (A–H) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">finance_mandates</code>,{' '}
              <code className="bg-muted px-1 rounded">finance_requests</code>,{' '}
              <code className="bg-muted px-1 rounded">applicant_profiles</code>,{' '}
              <code className="bg-muted px-1 rounded">finance_packages</code> und{' '}
              <code className="bg-muted px-1 rounded">finance_bank_contacts</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–H)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">4</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
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

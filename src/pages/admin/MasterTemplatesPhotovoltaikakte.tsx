/**
 * Zone 1 — Photovoltaikakte Mastervorlage (v1)
 * READ-ONLY viewer — unified Accordion layout
 * MOD-19 PHOTOVOLTAIK
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sun, ArrowLeft, Info, FileText } from 'lucide-react';

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'pv_plants' | 'pv_monitoring_data' | 'storage_nodes';
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
    id: 'A', title: 'Identität / Status', description: 'Grunddaten der PV-Anlage',
    fields: [
      { fieldKey: 'id', labelDe: 'Anlage-ID', entity: 'pv_plants', type: 'UUID' },
      { fieldKey: 'public_id', labelDe: 'Öffentliche ID', entity: 'pv_plants', type: 'string', notes: 'SOT-PV-XXXXXXXX' },
      { fieldKey: 'name', labelDe: 'Anlagenname', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'status', labelDe: 'Status', entity: 'pv_plants', type: 'enum', notes: 'active | inactive | planned | decommissioned' },
      { fieldKey: 'plant_type', labelDe: 'Anlagentyp', entity: 'pv_plants', type: 'enum', notes: 'rooftop | ground | carport | facade' },
      { fieldKey: 'commissioned_at', labelDe: 'Inbetriebnahme', entity: 'pv_plants', type: 'date' },
    ],
  },
  {
    id: 'B', title: 'Standort', description: 'Adresse und Dach-/Ausrichtungsdaten',
    fields: [
      { fieldKey: 'property_id', labelDe: 'Verknüpfte Immobilie', entity: 'pv_plants', type: 'UUID', notes: 'Referenz zu MOD-04' },
      { fieldKey: 'address', labelDe: 'Adresse', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'postal_code', labelDe: 'PLZ', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'city', labelDe: 'Stadt', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'roof_type', labelDe: 'Dachtyp', entity: 'pv_plants', type: 'enum', notes: 'Satteldach | Flachdach | Pultdach' },
      { fieldKey: 'orientation', labelDe: 'Ausrichtung', entity: 'pv_plants', type: 'enum', notes: 'Süd | Ost-West | Süd-West' },
      { fieldKey: 'tilt_angle', labelDe: 'Neigungswinkel (°)', entity: 'pv_plants', type: 'number' },
    ],
  },
  {
    id: 'C', title: 'Anlagentechnik', description: 'Module, Wechselrichter und Speicher',
    fields: [
      { fieldKey: 'peak_power_kwp', labelDe: 'Nennleistung (kWp)', entity: 'pv_plants', type: 'decimal' },
      { fieldKey: 'module_count', labelDe: 'Modulanzahl', entity: 'pv_plants', type: 'number' },
      { fieldKey: 'module_type', labelDe: 'Modultyp', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'module_manufacturer', labelDe: 'Modul-Hersteller', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'inverter_type', labelDe: 'Wechselrichter-Typ', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'inverter_manufacturer', labelDe: 'WR-Hersteller', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'battery_kwh', labelDe: 'Speicherkapazität (kWh)', entity: 'pv_plants', type: 'decimal' },
      { fieldKey: 'battery_manufacturer', labelDe: 'Speicher-Hersteller', entity: 'pv_plants', type: 'string' },
    ],
  },
  {
    id: 'D', title: 'Marktstammdatenregister', description: 'MaStR-Registrierung und Netzbetreiber',
    fields: [
      { fieldKey: 'mastr_number', labelDe: 'MaStR-Nummer', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'mastr_registration_date', labelDe: 'Registrierungsdatum', entity: 'pv_plants', type: 'date' },
      { fieldKey: 'grid_operator', labelDe: 'Netzbetreiber', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'grid_connection_date', labelDe: 'Netzanschlussdatum', entity: 'pv_plants', type: 'date' },
    ],
  },
  {
    id: 'E', title: 'Zähler / Netz / Vergütung', description: 'Einspeisevergütung und Vertragsdaten',
    fields: [
      { fieldKey: 'meter_number', labelDe: 'Zähler-Nr.', entity: 'pv_plants', type: 'string' },
      { fieldKey: 'feed_in_tariff_ct', labelDe: 'Einspeisevergütung (ct/kWh)', entity: 'pv_plants', type: 'decimal' },
      { fieldKey: 'contract_duration_years', labelDe: 'Vertragslaufzeit (Jahre)', entity: 'pv_plants', type: 'number', notes: 'Standard: 20 Jahre EEG' },
      { fieldKey: 'self_consumption_rate', labelDe: 'Eigenverbrauchsquote (%)', entity: 'pv_plants', type: 'decimal' },
    ],
  },
  {
    id: 'F', title: 'Monitoring / Ertrag', description: 'Leistungsdaten und Ertragswerte',
    fields: [
      { fieldKey: 'timestamp', labelDe: 'Zeitstempel', entity: 'pv_monitoring_data', type: 'date' },
      { fieldKey: 'power_w', labelDe: 'Aktuelle Leistung (W)', entity: 'pv_monitoring_data', type: 'number' },
      { fieldKey: 'energy_kwh', labelDe: 'Energie (kWh)', entity: 'pv_monitoring_data', type: 'decimal' },
      { fieldKey: 'yield_daily_kwh', labelDe: 'Tagesertrag (kWh)', entity: 'pv_monitoring_data', type: 'decimal' },
      { fieldKey: 'yield_monthly_kwh', labelDe: 'Monatsertrag (kWh)', entity: 'pv_monitoring_data', type: 'decimal' },
      { fieldKey: 'yield_yearly_kwh', labelDe: 'Jahresertrag (kWh)', entity: 'pv_monitoring_data', type: 'decimal' },
      { fieldKey: 'specific_yield', labelDe: 'Spezifischer Ertrag (kWh/kWp)', entity: 'pv_monitoring_data', type: 'decimal', notes: 'Berechnet' },
    ],
  },
  {
    id: 'G', title: 'Dokumente', description: 'DMS-Ordnerstruktur MOD_19 (8 Ordner)',
    fields: [
      { fieldKey: 'dms_root', labelDe: 'DMS-Root', entity: 'storage_nodes', type: 'UUID', notes: 'MOD_19/{pv_plant_id}/' },
      { fieldKey: 'folder_01', labelDe: '01_Stammdaten', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_02', labelDe: '02_MaStR_BNetzA', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_03', labelDe: '03_Netzbetreiber', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_04', labelDe: '04_Zaehler', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_05', labelDe: '05_Wechselrichter_und_Speicher', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_06', labelDe: '06_Versicherung', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_07', labelDe: '07_Steuer_USt_BWA', entity: 'storage_nodes', type: 'folder' },
      { fieldKey: 'folder_08', labelDe: '08_Wartung_Service', entity: 'storage_nodes', type: 'folder' },
    ],
  },
];

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    pv_plants: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pv_monitoring_data: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    storage_nodes: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'pv_plants' ? 'plant' : entity === 'pv_monitoring_data' ? 'monitoring' : 'dms'}
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

export default function MasterTemplatesPhotovoltaikakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  const entities = new Set(blocks.flatMap(b => b.fields.map(f => f.entity)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Photovoltaikakte — Mastervorlage (v1)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-19 PHOTOVOLTAIK • {blocks.length} Blöcke (A–G) • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">pv_plants</code> und{' '}
              <code className="bg-muted px-1 rounded">pv_monitoring_data</code>.
              DMS-Ordnerstruktur gemäß <code className="bg-muted px-1 rounded">usePvDMS</code> Hook.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{blocks.length}</CardTitle><CardDescription>Blöcke (A–G)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{entities.size}</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">8</CardTitle><CardDescription>DMS-Ordner</CardDescription></CardHeader></Card>
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

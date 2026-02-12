/**
 * Zone 1 — Immobilienakte Mastervorlage (v1)
 * READ-ONLY viewer showing the A-J block structure with fields derived from src/types/immobilienakte.ts
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Building2, FileText, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// =============================================================================
// FIELD DEFINITIONS — Derived from src/types/immobilienakte.ts
// =============================================================================

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'property' | 'unit' | 'lease' | 'loan' | 'nk_period' | 'accounting' | 'document' | 'derived';
  type: 'string' | 'number' | 'decimal' | 'boolean' | 'date' | 'enum' | 'object' | 'string[]' | 'derived';
  notes?: string;
}

interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
}

// Block A: Identität/Zuordnung (from IdentityData + UnitDossierData)
const blockA: BlockDefinition = {
  id: 'A',
  title: 'Identität / Zuordnung',
  description: 'Stammdaten zur Objektidentifikation und Steuerungsflags',
  fields: [
    { fieldKey: 'propertyId', labelDe: 'Objekt-ID', entity: 'property', type: 'string' },
    { fieldKey: 'unitId', labelDe: 'Einheit-ID', entity: 'unit', type: 'string' },
    { fieldKey: 'tenantId', labelDe: 'Mandanten-ID', entity: 'property', type: 'string' },
    { fieldKey: 'publicId', labelDe: 'Öffentliche ID', entity: 'property', type: 'string' },
    { fieldKey: 'unitCode', labelDe: 'Objekt-Code', entity: 'unit', type: 'string' },
    { fieldKey: 'propertyType', labelDe: 'Objektart', entity: 'property', type: 'string' },
    { fieldKey: 'category', labelDe: 'Kategorie', entity: 'property', type: 'enum', notes: 'einzelobjekt | globalobjekt' },
    { fieldKey: 'status', labelDe: 'Status', entity: 'property', type: 'enum', notes: 'aktiv | in_pruefung | archiviert | verkauft' },
    { fieldKey: 'saleEnabled', labelDe: 'Verkauf aktiviert', entity: 'property', type: 'boolean' },
    { fieldKey: 'rentalManaged', labelDe: 'Vermietung verwaltet', entity: 'property', type: 'boolean' },
    { fieldKey: 'vermieterKontextId', labelDe: 'Vermieter-Kontext', entity: 'property', type: 'string' },
    { fieldKey: 'reportingRegime', labelDe: 'Reporting-Schema', entity: 'property', type: 'enum', notes: 'VuV | SuSa_BWA' },
  ],
};

// Block B: Adresse (from AddressData)
const blockB: BlockDefinition = {
  id: 'B',
  title: 'Adresse',
  description: 'Standortdaten und Geokoordinaten',
  fields: [
    { fieldKey: 'street', labelDe: 'Straße', entity: 'property', type: 'string' },
    { fieldKey: 'houseNumber', labelDe: 'Hausnummer', entity: 'property', type: 'string' },
    { fieldKey: 'postalCode', labelDe: 'PLZ', entity: 'property', type: 'string' },
    { fieldKey: 'city', labelDe: 'Ort', entity: 'property', type: 'string' },
    { fieldKey: 'locationLabel', labelDe: 'Lage-Label', entity: 'property', type: 'string' },
    { fieldKey: 'locationNotes', labelDe: 'Lage-Notizen', entity: 'property', type: 'string' },
    { fieldKey: 'latitude', labelDe: 'Breitengrad', entity: 'property', type: 'decimal' },
    { fieldKey: 'longitude', labelDe: 'Längengrad', entity: 'property', type: 'decimal' },
  ],
};

// Block C: Gebäude/Technik (from BuildingData)
const blockC: BlockDefinition = {
  id: 'C',
  title: 'Gebäude / Technik',
  description: 'Bauliche Daten, Flächen und Energieinformationen',
  fields: [
    { fieldKey: 'buildYear', labelDe: 'Baujahr', entity: 'property', type: 'number' },
    { fieldKey: 'usageType', labelDe: 'Nutzungsart', entity: 'property', type: 'enum', notes: 'wohnen | gewerbe | mischnutzung' },
    { fieldKey: 'areaLivingSqm', labelDe: 'Wohnfläche (qm)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'areaUsableSqm', labelDe: 'Nutzfläche (qm)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'roomsCount', labelDe: 'Zimmeranzahl', entity: 'unit', type: 'number' },
    { fieldKey: 'bathroomsCount', labelDe: 'Bäder', entity: 'unit', type: 'number' },
    { fieldKey: 'floor', labelDe: 'Etage', entity: 'unit', type: 'number' },
    { fieldKey: 'unitNumber', labelDe: 'Einheitennummer', entity: 'unit', type: 'string' },
    { fieldKey: 'heatingType', labelDe: 'Heizart', entity: 'unit', type: 'enum', notes: 'zentralheizung | etagenheizung | fernwaerme | waermepumpe | sonstige' },
    { fieldKey: 'energySource', labelDe: 'Energieträger', entity: 'unit', type: 'enum', notes: 'gas | oel | strom | pellets | solar | fernwaerme | sonstige' },
    { fieldKey: 'energyCertType', labelDe: 'Energieausweis-Typ', entity: 'unit', type: 'string' },
    { fieldKey: 'energyCertValue', labelDe: 'Energiekennwert', entity: 'unit', type: 'decimal' },
    { fieldKey: 'energyCertValidUntil', labelDe: 'Energieausweis gültig bis', entity: 'unit', type: 'date' },
    { fieldKey: 'featuresTags', labelDe: 'Ausstattungsmerkmale', entity: 'unit', type: 'string[]' },
  ],
};

// Block D: Recht/Erwerb (from LegalData)
const blockD: BlockDefinition = {
  id: 'D',
  title: 'Recht / Erwerb',
  description: 'Grundbuchdaten und Erwerbsinformationen',
  fields: [
    { fieldKey: 'landRegisterCourt', labelDe: 'Amtsgericht', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterOf', labelDe: 'Grundbuch von', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterSheet', labelDe: 'Blatt', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterVolume', labelDe: 'Band', entity: 'property', type: 'string' },
    { fieldKey: 'parcelNumber', labelDe: 'Flurstück', entity: 'property', type: 'string' },
    { fieldKey: 'teNumber', labelDe: 'TE-Nr. (Teileigentum)', entity: 'property', type: 'string' },
    { fieldKey: 'purchaseDate', labelDe: 'Kaufdatum', entity: 'property', type: 'date' },
    { fieldKey: 'purchasePrice', labelDe: 'Kaufpreis (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'marketValue', labelDe: 'Verkehrswert (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'acquisitionCosts', labelDe: 'Erwerbsnebenkosten (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'wegFlag', labelDe: 'WEG-Objekt', entity: 'property', type: 'boolean' },
  ],
};

// Block E: Investment KPIs (derived)
const blockE: BlockDefinition = {
  id: 'E',
  title: 'Investment / KPIs',
  description: 'Berechnete Kennzahlen (Read-Only)',
  fields: [
    { fieldKey: 'annualIncome', labelDe: 'Jahreseinnahmen (EUR)', entity: 'derived', type: 'derived', notes: 'Berechnet aus Mieteinnahmen' },
    { fieldKey: 'grossYieldPercent', labelDe: 'Brutto-Rendite (%)', entity: 'derived', type: 'derived', notes: 'annualIncome / purchasePrice × 100' },
    { fieldKey: 'netYieldPercent', labelDe: 'Netto-Rendite (%)', entity: 'derived', type: 'derived', notes: 'Nach Abzug nicht-umlegbarer Kosten' },
    { fieldKey: 'cashflowMonthly', labelDe: 'Cashflow/Monat (EUR)', entity: 'derived', type: 'derived', notes: 'Einnahmen - Ausgaben - Rate' },
    { fieldKey: 'vacancyDays', labelDe: 'Leerstandstage', entity: 'unit', type: 'number' },
  ],
};

// Block F: Mietverhältnisse (from TenancyData)
const blockF: BlockDefinition = {
  id: 'F',
  title: 'Mietverhältnisse',
  description: 'Mietvertrags- und Mieteinnahmedaten',
  fields: [
    { fieldKey: 'leaseId', labelDe: 'Mietvertrags-ID', entity: 'lease', type: 'string' },
    { fieldKey: 'tenantContactId', labelDe: 'Mieter-Kontakt-ID', entity: 'lease', type: 'string' },
    { fieldKey: 'tenantName', labelDe: 'Mietername', entity: 'lease', type: 'string' },
    { fieldKey: 'tenancyStatus', labelDe: 'Status', entity: 'lease', type: 'enum', notes: 'ACTIVE | VACANT | TERMINATING | ENDED' },
    { fieldKey: 'leaseType', labelDe: 'Vertragstyp', entity: 'lease', type: 'enum', notes: 'unbefristet | befristet | staffel | index | gewerbe' },
    { fieldKey: 'startDate', labelDe: 'Mietbeginn', entity: 'lease', type: 'date' },
    { fieldKey: 'endDate', labelDe: 'Mietende', entity: 'lease', type: 'date' },
    { fieldKey: 'rentColdEur', labelDe: 'Kaltmiete (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'nkAdvanceEur', labelDe: 'NK-Vorauszahlung (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'heatingAdvanceEur', labelDe: 'HK-Vorauszahlung (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'rentWarmEur', labelDe: 'Warmmiete (EUR)', entity: 'lease', type: 'derived', notes: 'rentColdEur + nkAdvanceEur + heatingAdvanceEur' },
    { fieldKey: 'depositAmountEur', labelDe: 'Kaution (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'depositStatus', labelDe: 'Kautionsstatus', entity: 'lease', type: 'enum', notes: 'PAID | OPEN | PARTIAL' },
    { fieldKey: 'paymentDueDay', labelDe: 'Fälligkeitstag', entity: 'lease', type: 'number' },
    { fieldKey: 'rentModel', labelDe: 'Mietmodell', entity: 'lease', type: 'enum', notes: 'FIX | INDEX | STAFFEL' },
    { fieldKey: 'nextRentAdjustmentDate', labelDe: 'Nächste Mietanpassung', entity: 'lease', type: 'date' },
  ],
};

// Block G: WEG/NK (from WEGData)
const blockG: BlockDefinition = {
  id: 'G',
  title: 'WEG / Nebenkosten',
  description: 'Hausgeld, Miteigentumsanteile und Abrechnungen',
  fields: [
    { fieldKey: 'wegFlag', labelDe: 'WEG-Objekt', entity: 'property', type: 'boolean' },
    { fieldKey: 'meaShare', labelDe: 'MEA-Anteil', entity: 'unit', type: 'decimal' },
    { fieldKey: 'meaTotal', labelDe: 'MEA-Gesamt', entity: 'property', type: 'decimal' },
    { fieldKey: 'hausgeldMonthlyEur', labelDe: 'Hausgeld/Monat (EUR)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'allocationKeyDefault', labelDe: 'Verteilerschlüssel', entity: 'property', type: 'enum', notes: 'SQM | PERSONS | MEA | CONSUMPTION | UNITS' },
    { fieldKey: 'managerContactId', labelDe: 'Verwalter-Kontakt-ID', entity: 'property', type: 'string' },
    { fieldKey: 'managerContactName', labelDe: 'Verwalter-Name', entity: 'property', type: 'string' },
    { fieldKey: 'periodCurrent', labelDe: 'Aktuelle Abrechnungsperiode', entity: 'nk_period', type: 'string' },
    { fieldKey: 'lastSettlementDate', labelDe: 'Letzte Abrechnung', entity: 'nk_period', type: 'date' },
    { fieldKey: 'lastSettlementBalanceEur', labelDe: 'Abrechnungsergebnis (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'allocatablePaEur', labelDe: 'Umlegbar p.a. (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'nonAllocatablePaEur', labelDe: 'Nicht umlegbar p.a. (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'topCostBlocks', labelDe: 'Top-Kostenblöcke', entity: 'nk_period', type: 'object' },
  ],
};

// Block H: Finanzierung (from FinancingData)
const blockH: BlockDefinition = {
  id: 'H',
  title: 'Finanzierung',
  description: 'Darlehenskonditionen und Tilgungsinformationen',
  fields: [
    { fieldKey: 'loanId', labelDe: 'Darlehens-ID', entity: 'loan', type: 'string' },
    { fieldKey: 'bankName', labelDe: 'Bank', entity: 'loan', type: 'string' },
    { fieldKey: 'loanNumber', labelDe: 'Darlehensnummer', entity: 'loan', type: 'string' },
    { fieldKey: 'originalAmountEur', labelDe: 'Ursprungsbetrag (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'outstandingBalanceEur', labelDe: 'Restschuld (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'balanceAsofDate', labelDe: 'Stand per', entity: 'loan', type: 'date' },
    { fieldKey: 'interestRatePercent', labelDe: 'Zinssatz (%)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'fixedInterestEndDate', labelDe: 'Zinsbindung bis', entity: 'loan', type: 'date' },
    { fieldKey: 'annuityMonthlyEur', labelDe: 'Annuität/Monat (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'repaymentRatePercent', labelDe: 'Tilgungssatz (%)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'specialRepaymentRightEur', labelDe: 'Sondertilgungsrecht (EUR/Jahr)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'contactPerson', labelDe: 'Ansprechpartner', entity: 'loan', type: 'object', notes: 'name, phone, email' },
  ],
};

// Block I: Accounting (from AccountingData)
const blockI: BlockDefinition = {
  id: 'I',
  title: 'Accounting minimal',
  description: 'AfA- und Buchhaltungsdaten',
  fields: [
    { fieldKey: 'accountingId', labelDe: 'Accounting-ID', entity: 'accounting', type: 'string', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'landSharePercent', labelDe: 'Grundstücksanteil (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'buildingSharePercent', labelDe: 'Gebäudeanteil (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'bookValueEur', labelDe: 'Buchwert (EUR)', entity: 'accounting', type: 'decimal', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'afaRatePercent', labelDe: 'AfA-Satz (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'afaStartDate', labelDe: 'AfA-Beginn', entity: 'accounting', type: 'date', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'afaMethod', labelDe: 'AfA-Methode', entity: 'accounting', type: 'enum', notes: 'linear | degressiv — UI pending (no editable block in MOD-04)' },
    { fieldKey: 'remainingUsefulLifeYears', labelDe: 'Restnutzungsdauer (Jahre)', entity: 'accounting', type: 'number', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'modernizationCostsEur', labelDe: 'Modernisierungskosten (EUR)', entity: 'accounting', type: 'decimal', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'modernizationYear', labelDe: 'Modernisierungsjahr', entity: 'accounting', type: 'number', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'coaVersion', labelDe: 'Kontenrahmen-Version', entity: 'accounting', type: 'string', notes: 'UI pending (no editable block in MOD-04)' },
    { fieldKey: 'accountMappings', labelDe: 'Kontenzuordnung', entity: 'accounting', type: 'object', notes: 'UI pending (no editable block in MOD-04)' },
  ],
};

// Block J: Dokumente (from DocumentStatus + DocumentChecklist taxonomy)
const blockJ: BlockDefinition = {
  id: 'J',
  title: 'Dokumente / Datenraum',
  description: '18 Dokumentkategorien (11 Primär + 7 Erweiterung)',
  fields: [
    { fieldKey: 'DOC_PURCHASE_CONTRACT', labelDe: 'Kaufvertrag', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LEASE_CONTRACT', labelDe: 'Mietvertrag', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LAND_REGISTER', labelDe: 'Grundbuchauszug', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_ENERGY_CERT', labelDe: 'Energieausweis', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_FLOORPLAN', labelDe: 'Grundriss', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_DIVISION_DECLARATION', labelDe: 'Teilungserklärung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_INSURANCE_BUILDING', labelDe: 'Gebäudeversicherung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_WEG_ANNUAL_STATEMENT', labelDe: 'WEG-Abrechnung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_WEG_BUDGET_PLAN', labelDe: 'Wirtschaftsplan', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_NK_STATEMENT', labelDe: 'NK-Abrechnung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LOAN_BUCKET', labelDe: 'Darlehensunterlagen', entity: 'document', type: 'object', notes: 'docType + status + path' },
    // Extended (7 additional)
    { fieldKey: 'DOC_PROJECT', labelDe: 'Projektdokumentation', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_EXPOSE_BUY', labelDe: 'Exposé Ankauf', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_VALUATION_SHORT', labelDe: 'Kurzgutachten', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_INVOICE', labelDe: 'Rechnungen', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_PHOTOS', labelDe: 'Fotos', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_RENOVATION', labelDe: 'Sanierung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_PROPERTY_TAX', labelDe: 'Grundsteuer', entity: 'document', type: 'object', notes: 'docType + status + path' },
  ],
};

// All blocks A-J
const blocks: BlockDefinition[] = [blockA, blockB, blockC, blockD, blockE, blockF, blockG, blockH, blockI, blockJ];

// =============================================================================
// COMPONENT
// =============================================================================

function EntityBadge({ entity }: { entity: FieldDefinition['entity'] }) {
  const colors: Record<FieldDefinition['entity'], string> = {
    property: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    unit: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    lease: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    loan: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    nk_period: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    accounting: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    document: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    derived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity}
    </span>
  );
}

function TypeBadge({ type }: { type: FieldDefinition['type'] }) {
  return (
    <Badge variant="outline" className="text-xs font-mono">
      {type}
    </Badge>
  );
}

function BlockAccordion({ block }: { block: BlockDefinition }) {
  const hasUIPending = block.fields.some(f => f.notes?.includes('UI pending'));
  
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
              {hasUIPending && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  UI pending
                </Badge>
              )}
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
                <TableRow key={field.fieldKey}>
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

export default function MasterTemplatesImmobilienakte() {
  const totalFields = blocks.reduce((sum, b) => sum + b.fields.length, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Immobilienakte — Mastervorlage (v1)</h1>
              <p className="text-sm text-muted-foreground">Read-Only Referenz aus current Types</p>
            </div>
          </div>
        </div>
        <Link to="/admin/master-templates">
          <Button variant="outline" size="sm">
            ← Zurück zu Master-Vorlagen
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">Datenquelle</p>
            <p className="text-blue-700 dark:text-blue-300">
              Alle Felder werden aus <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">src/types/immobilienakte.ts</code> abgeleitet. 
              Diese Vorlage zeigt die verbindliche 9-Feld-Gruppenstruktur (R9) für MOD-04.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className={DESIGN.KPI_GRID.FULL}>
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
            <CardTitle className="text-2xl">{blockJ.fields.length}</CardTitle>
            <CardDescription>Dokument-Typen</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">8</CardTitle>
            <CardDescription>Entitäten</CardDescription>
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
          <CardDescription>
            Klicken Sie auf einen Block, um die Feldliste anzuzeigen
          </CardDescription>
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
            <EntityBadge entity="property" />
            <EntityBadge entity="unit" />
            <EntityBadge entity="lease" />
            <EntityBadge entity="loan" />
            <EntityBadge entity="nk_period" />
            <EntityBadge entity="accounting" />
            <EntityBadge entity="document" />
            <EntityBadge entity="derived" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

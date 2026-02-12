/**
 * Zone 1 — Selbstauskunft Mastervorlage (v3)
 * READ-ONLY viewer — unified Accordion layout matching Immobilienakte standard
 * MOD-07 Finanzierungs-Selbstauskunft
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
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  User, Home, Briefcase, Landmark, Wallet, CreditCard,
  PiggyBank, AlertCircle, FileText, ArrowLeft, Info, Users,
} from 'lucide-react';

// =============================================================================
// FIELD DEFINITIONS — Unified 5-column standard
// =============================================================================

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'applicant_profiles' | 'applicant_liabilities';
  type: string;
  notes?: string;
}

interface SectionDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldDefinition[];
}

const sections: SectionDefinition[] = [
  {
    id: '1',
    title: 'Angaben zur Person',
    icon: User,
    description: 'Identität, Adresse, Kontaktdaten, Ausweis, Steuer-ID',
    fields: [
      { fieldKey: 'salutation', labelDe: 'Anrede', entity: 'applicant_profiles', type: 'enum', notes: 'Herr | Frau | Divers' },
      { fieldKey: 'first_name', labelDe: 'Vorname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'last_name', labelDe: 'Nachname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'birth_name', labelDe: 'Geburtsname', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'birth_date', labelDe: 'Geburtsdatum', entity: 'applicant_profiles', type: 'date' },
      { fieldKey: 'birth_place', labelDe: 'Geburtsort', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'birth_country', labelDe: 'Geburtsland', entity: 'applicant_profiles', type: 'string', notes: 'default: DE' },
      { fieldKey: 'nationality', labelDe: 'Staatsangehörigkeit', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'address_street', labelDe: 'Straße, Nr.', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'address_postal_code', labelDe: 'PLZ', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'address_city', labelDe: 'Ort', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'address_since', labelDe: 'Wohnhaft seit', entity: 'applicant_profiles', type: 'date' },
      { fieldKey: 'previous_address_street', labelDe: 'Vorherige Adresse Straße', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'previous_address_postal_code', labelDe: 'Vorherige Adresse PLZ', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'previous_address_city', labelDe: 'Vorherige Adresse Ort', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'phone', labelDe: 'Telefon (Festnetz)', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'phone_mobile', labelDe: 'Telefon (Mobil)', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'email', labelDe: 'E-Mail', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'tax_id', labelDe: 'Steuer-IdNr.', entity: 'applicant_profiles', type: 'string', notes: '11-stellig' },
    ],
  },
  {
    id: '2',
    title: 'Haushalt',
    icon: Home,
    description: 'Familienstand, Gütertrennung, Kinder',
    fields: [
      { fieldKey: 'marital_status', labelDe: 'Familienstand', entity: 'applicant_profiles', type: 'enum', notes: 'ledig | verheiratet | geschieden | verwitwet' },
      { fieldKey: 'property_separation', labelDe: 'Gütertrennung vereinbart', entity: 'applicant_profiles', type: 'boolean' },
      { fieldKey: 'children_count', labelDe: 'Anzahl Kinder', entity: 'applicant_profiles', type: 'number' },
      { fieldKey: 'children_birth_dates', labelDe: 'Geburtsdaten Kinder', entity: 'applicant_profiles', type: 'string' },
    ],
  },
  {
    id: '3',
    title: 'Beschäftigung',
    icon: Briefcase,
    description: 'Angestellt ODER Selbstständig (Switch-basiert)',
    fields: [
      { fieldKey: 'employment_type', labelDe: 'Beschäftigungsart', entity: 'applicant_profiles', type: 'enum', notes: 'employed | self_employed' },
      { fieldKey: 'employer_name', labelDe: 'Arbeitgeber', entity: 'applicant_profiles', type: 'string', notes: 'nur bei employed' },
      { fieldKey: 'employer_location', labelDe: 'Standort Arbeitgeber', entity: 'applicant_profiles', type: 'string', notes: 'nur bei employed' },
      { fieldKey: 'employed_since', labelDe: 'Beschäftigt seit', entity: 'applicant_profiles', type: 'date' },
      { fieldKey: 'contract_type', labelDe: 'Vertragsart', entity: 'applicant_profiles', type: 'enum', notes: 'unbefristet | befristet' },
      { fieldKey: 'probation_until', labelDe: 'Probezeit bis', entity: 'applicant_profiles', type: 'date' },
      { fieldKey: 'salary_payments_per_year', labelDe: 'Gehaltszahlungen/Jahr', entity: 'applicant_profiles', type: 'number', notes: 'default: 12' },
      { fieldKey: 'company_name', labelDe: 'Firma', entity: 'applicant_profiles', type: 'string', notes: 'nur bei self_employed' },
      { fieldKey: 'company_industry', labelDe: 'Branche', entity: 'applicant_profiles', type: 'string', notes: 'nur bei self_employed' },
      { fieldKey: 'company_founded', labelDe: 'Selbstständig seit', entity: 'applicant_profiles', type: 'date', notes: 'nur bei self_employed' },
      { fieldKey: 'company_register_number', labelDe: 'Handelsregister-Nr.', entity: 'applicant_profiles', type: 'string', notes: 'nur bei self_employed' },
    ],
  },
  {
    id: '4',
    title: 'Bankverbindung',
    icon: Landmark,
    description: 'IBAN und BIC für Auszahlungen',
    fields: [
      { fieldKey: 'iban', labelDe: 'IBAN', entity: 'applicant_profiles', type: 'string' },
      { fieldKey: 'bic', labelDe: 'BIC', entity: 'applicant_profiles', type: 'string' },
    ],
  },
  {
    id: '5',
    title: 'Monatliche Einnahmen',
    icon: Wallet,
    description: 'Alle regelmäßigen Einkünfte pro Monat',
    fields: [
      { fieldKey: 'net_income_monthly', labelDe: 'Nettoeinkommen (Gehalt)', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'side_job_income_monthly', labelDe: 'Nebentätigkeit', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'rental_income_monthly', labelDe: 'Mieteinnahmen', entity: 'applicant_profiles', type: 'decimal', notes: 'Vorausfüllung aus MOD-04' },
      { fieldKey: 'child_benefit_monthly', labelDe: 'Kindergeld', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'alimony_income_monthly', labelDe: 'Unterhalt (erhalten)', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'pension_state_monthly', labelDe: 'Rente (gesetzlich)', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'pension_private_monthly', labelDe: 'Rente (privat)', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'other_regular_income_monthly', labelDe: 'Sonstiges', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'other_income_description', labelDe: 'Beschreibung Sonstiges', entity: 'applicant_profiles', type: 'string' },
    ],
  },
  {
    id: '6',
    title: 'Monatliche Ausgaben',
    icon: CreditCard,
    description: 'Fixkosten und regelmäßige Ausgaben',
    fields: [
      { fieldKey: 'current_rent_monthly', labelDe: 'Aktuelle Warmmiete', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'health_insurance_monthly', labelDe: 'Private Krankenversicherung', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'child_support_amount_monthly', labelDe: 'Unterhaltsverpflichtungen', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'car_leasing_monthly', labelDe: 'Leasing (Kfz)', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'other_fixed_costs_monthly', labelDe: 'Sonstige Fixkosten', entity: 'applicant_profiles', type: 'decimal' },
    ],
  },
  {
    id: '7',
    title: 'Vermögen',
    icon: PiggyBank,
    description: 'Liquide Mittel und Vermögenswerte',
    fields: [
      { fieldKey: 'bank_savings', labelDe: 'Bank-/Sparguthaben', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'securities_value', labelDe: 'Wertpapiere/Fonds', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'building_society_value', labelDe: 'Bausparguthaben', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'life_insurance_value', labelDe: 'Rückkaufswert Lebensversicherung', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'other_assets_value', labelDe: 'Sonstige Vermögenswerte', entity: 'applicant_profiles', type: 'decimal' },
      { fieldKey: 'other_assets_description', labelDe: 'Beschreibung Sonstige', entity: 'applicant_profiles', type: 'string' },
    ],
  },
  {
    id: '8',
    title: 'Verbindlichkeiten',
    icon: AlertCircle,
    description: 'Bestehende Kredite und Verpflichtungen (1:N via applicant_liabilities)',
    fields: [
      { fieldKey: 'liability_type', labelDe: 'Art', entity: 'applicant_liabilities', type: 'enum', notes: 'immobiliendarlehen | ratenkredit | leasing | sonstige' },
      { fieldKey: 'creditor_name', labelDe: 'Gläubiger/Bank', entity: 'applicant_liabilities', type: 'string' },
      { fieldKey: 'original_amount', labelDe: 'Ursprungsbetrag', entity: 'applicant_liabilities', type: 'decimal' },
      { fieldKey: 'remaining_balance', labelDe: 'Restschuld', entity: 'applicant_liabilities', type: 'decimal' },
      { fieldKey: 'monthly_rate', labelDe: 'Monatsrate', entity: 'applicant_liabilities', type: 'decimal' },
      { fieldKey: 'interest_rate_fixed_until', labelDe: 'Zinsbindung bis', entity: 'applicant_liabilities', type: 'date' },
      { fieldKey: 'end_date', labelDe: 'Laufzeitende', entity: 'applicant_liabilities', type: 'date' },
    ],
  },
  {
    id: '9',
    title: 'Erklärungen',
    icon: FileText,
    description: 'SCHUFA-Einwilligung und rechtliche Bestätigungen',
    fields: [
      { fieldKey: 'schufa_consent', labelDe: 'SCHUFA-Einwilligung', entity: 'applicant_profiles', type: 'boolean' },
      { fieldKey: 'no_insolvency', labelDe: 'Kein Insolvenzverfahren', entity: 'applicant_profiles', type: 'boolean' },
      { fieldKey: 'no_tax_arrears', labelDe: 'Keine Steuerrückstände', entity: 'applicant_profiles', type: 'boolean' },
      { fieldKey: 'data_correct_confirmed', labelDe: 'Richtigkeit bestätigt', entity: 'applicant_profiles', type: 'boolean' },
    ],
  },
];

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

type EntityType = FieldDefinition['entity'];

function EntityBadge({ entity }: { entity: EntityType }) {
  const colors: Record<EntityType, string> = {
    applicant_profiles: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    applicant_liabilities: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>
      {entity === 'applicant_profiles' ? 'profile' : 'liability'}
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

function SectionAccordion({ section }: { section: SectionDefinition }) {
  const Icon = section.icon;
  return (
    <AccordionItem value={section.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {section.id}
          </Badge>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{section.title}</span>
              <span className="text-muted-foreground text-sm">({section.fields.length} Felder)</span>
            </div>
            <p className="text-sm text-muted-foreground">{section.description}</p>
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
              {section.fields.map((field) => (
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

// =============================================================================
// COMPONENT
// =============================================================================

export default function MasterTemplatesSelbstauskunft() {
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Selbstauskunft — Mastervorlage (v3)</h1>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              MOD-07 Finanzierungs-Selbstauskunft • {sections.length} Sektionen • {totalFields} Felder
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
              Feldstruktur aus <code className="bg-muted px-1 rounded">applicant_profiles</code> und{' '}
              <code className="bg-muted px-1 rounded">applicant_liabilities</code>.
              Unterstützt 2 Antragsteller (primary + co_applicant via <code className="bg-muted px-1 rounded">linked_primary_profile_id</code>).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Co-Applicant Info */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <Users className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">2. Antragsteller</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Sektionen 1, 3–7 werden pro Antragsteller geführt. Sektion 2 (Haushalt) und 9 (Erklärungen) 
              gelten gemeinsam. Sektion 8 (Verbindlichkeiten) wird pro Person geführt.
              Verknüpfung über <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">party_role = 'co_applicant'</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{sections.length}</CardTitle>
            <CardDescription>Sektionen (1–9)</CardDescription>
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
            <CardTitle className="text-2xl">2</CardTitle>
            <CardDescription>Entitäten</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{sections.flatMap(s => s.fields).filter(f => f.type === 'boolean').length}</CardTitle>
            <CardDescription>Pflicht-Checks</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Sections Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sektionen-Struktur (1–9)
          </CardTitle>
          <CardDescription>Klicken Sie auf eine Sektion, um die Feldliste anzuzeigen</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['1']}>
            {sections.map((section) => (
              <SectionAccordion key={section.id} section={section} />
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
            <EntityBadge entity="applicant_profiles" />
            <EntityBadge entity="applicant_liabilities" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Zone 1 — Selbstauskunft Mastervorlage (v1)
 * READ-ONLY viewer showing the 8-section structure with fields derived from src/types/finance.ts
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  User, Home, Briefcase, Building2, CreditCard, PiggyBank, 
  Wallet, FileText, ArrowLeft, Info 
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =============================================================================
// FIELD DEFINITIONS — Derived from src/types/finance.ts (ApplicantProfile)
// =============================================================================

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  type: 'string' | 'number' | 'decimal' | 'boolean' | 'date' | 'enum';
  notes?: string;
}

interface SectionDefinition {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fields: FieldDefinition[];
  conditional?: string;
}

// Section 1: Identity / Persönliche Daten
const sectionIdentity: SectionDefinition = {
  id: 'identity',
  title: 'Identität',
  icon: User,
  description: 'Persönliche Daten, Anschrift, Kontakt, Ausweisdokument, Steuer & Bank',
  fields: [
    { fieldKey: 'first_name', labelDe: 'Vorname', type: 'string' },
    { fieldKey: 'last_name', labelDe: 'Nachname', type: 'string' },
    { fieldKey: 'birth_date', labelDe: 'Geburtsdatum', type: 'date' },
    { fieldKey: 'birth_place', labelDe: 'Geburtsort', type: 'string' },
    { fieldKey: 'nationality', labelDe: 'Staatsangehörigkeit', type: 'string', notes: 'default: DE' },
    { fieldKey: 'marital_status', labelDe: 'Familienstand', type: 'enum', notes: 'ledig | verheiratet | geschieden | verwitwet | getrennt' },
    { fieldKey: 'address_street', labelDe: 'Straße', type: 'string' },
    { fieldKey: 'address_postal_code', labelDe: 'PLZ', type: 'string' },
    { fieldKey: 'address_city', labelDe: 'Stadt', type: 'string' },
    { fieldKey: 'phone', labelDe: 'Telefon', type: 'string' },
    { fieldKey: 'email', labelDe: 'E-Mail', type: 'string' },
    { fieldKey: 'id_document_type', labelDe: 'Dokumenttyp', type: 'enum', notes: 'PA (Personalausweis) | RP (Reisepass)' },
    { fieldKey: 'id_document_number', labelDe: 'Ausweisnummer', type: 'string' },
    { fieldKey: 'id_document_valid_until', labelDe: 'Gültig bis', type: 'date' },
    { fieldKey: 'tax_id', labelDe: 'Steuer-ID', type: 'string', notes: '11-stellige Steuer-Identifikationsnummer' },
    { fieldKey: 'iban', labelDe: 'IBAN', type: 'string' },
  ],
};

// Section 2: Household / Haushalt
const sectionHousehold: SectionDefinition = {
  id: 'household',
  title: 'Haushalt',
  icon: Home,
  description: 'Haushaltsgröße, Kinder, Unterhaltspflichten, sonstige Einkünfte',
  fields: [
    { fieldKey: 'adults_count', labelDe: 'Anzahl Erwachsene', type: 'number' },
    { fieldKey: 'children_count', labelDe: 'Anzahl Kinder', type: 'number' },
    { fieldKey: 'children_ages', labelDe: 'Alter der Kinder', type: 'string', notes: 'Freitext' },
    { fieldKey: 'child_support_obligation', labelDe: 'Unterhaltspflicht', type: 'boolean' },
    { fieldKey: 'child_support_amount_monthly', labelDe: 'Unterhalt monatlich (EUR)', type: 'decimal' },
    { fieldKey: 'child_benefit_monthly', labelDe: 'Kindergeld monatlich (EUR)', type: 'decimal' },
    { fieldKey: 'other_regular_income_monthly', labelDe: 'Sonstiges regelmäßiges Einkommen (EUR)', type: 'decimal' },
    { fieldKey: 'other_income_description', labelDe: 'Beschreibung sonstiges Einkommen', type: 'string' },
  ],
};

// Section 3: Employment / Beschäftigung
const sectionEmployment: SectionDefinition = {
  id: 'employment',
  title: 'Einkommen',
  icon: Briefcase,
  description: 'Arbeitgeber, Beschäftigungsverhältnis, Einkommen',
  fields: [
    { fieldKey: 'employer_name', labelDe: 'Arbeitgeber', type: 'string' },
    { fieldKey: 'employer_location', labelDe: 'Standort Arbeitgeber', type: 'string' },
    { fieldKey: 'employer_industry', labelDe: 'Branche', type: 'string' },
    { fieldKey: 'employment_type', labelDe: 'Beschäftigungsart', type: 'enum', notes: 'unbefristet | befristet | beamter | selbststaendig | rentner' },
    { fieldKey: 'position', labelDe: 'Position', type: 'string' },
    { fieldKey: 'employed_since', labelDe: 'Beschäftigt seit', type: 'date' },
    { fieldKey: 'probation_until', labelDe: 'Probezeit bis', type: 'date' },
    { fieldKey: 'net_income_monthly', labelDe: 'Nettoeinkommen monatlich (EUR)', type: 'decimal' },
    { fieldKey: 'bonus_yearly', labelDe: 'Jahresbonus (EUR)', type: 'decimal' },
  ],
};

// Section 4: Company / Firma (conditional: entrepreneur)
const sectionCompany: SectionDefinition = {
  id: 'company',
  title: 'Firma',
  icon: Building2,
  description: 'Unternehmensdaten (nur für Unternehmer / Selbstständige)',
  conditional: 'profile_type === "entrepreneur"',
  fields: [
    { fieldKey: 'company_name', labelDe: 'Firmenname', type: 'string' },
    { fieldKey: 'company_legal_form', labelDe: 'Rechtsform', type: 'string', notes: 'GmbH, UG, GbR, etc.' },
    { fieldKey: 'company_address', labelDe: 'Firmenadresse', type: 'string' },
    { fieldKey: 'company_founded', labelDe: 'Gründungsdatum', type: 'date' },
    { fieldKey: 'company_register_number', labelDe: 'Handelsregisternummer', type: 'string' },
    { fieldKey: 'company_vat_id', labelDe: 'USt-IdNr.', type: 'string' },
    { fieldKey: 'company_industry', labelDe: 'Branche', type: 'string' },
    { fieldKey: 'company_employees', labelDe: 'Mitarbeiterzahl', type: 'number' },
    { fieldKey: 'company_ownership_percent', labelDe: 'Beteiligungsquote (%)', type: 'decimal' },
    { fieldKey: 'company_managing_director', labelDe: 'Geschäftsführer', type: 'boolean' },
  ],
};

// Section 5: Expenses / Ausgaben
const sectionExpenses: SectionDefinition = {
  id: 'expenses',
  title: 'Ausgaben',
  icon: CreditCard,
  description: 'Monatliche Fixkosten und Verbindlichkeiten',
  fields: [
    { fieldKey: 'current_rent_monthly', labelDe: 'Aktuelle Miete (EUR)', type: 'decimal' },
    { fieldKey: 'living_expenses_monthly', labelDe: 'Lebenshaltungskosten (EUR)', type: 'decimal' },
    { fieldKey: 'car_leasing_monthly', labelDe: 'Kfz-Leasing (EUR)', type: 'decimal' },
    { fieldKey: 'health_insurance_monthly', labelDe: 'Krankenversicherung (EUR)', type: 'decimal' },
    { fieldKey: 'other_fixed_costs_monthly', labelDe: 'Sonstige Fixkosten (EUR)', type: 'decimal' },
  ],
};

// Section 6: Assets / Vermögen
const sectionAssets: SectionDefinition = {
  id: 'assets',
  title: 'Vermögen',
  icon: PiggyBank,
  description: 'Liquide Mittel, Wertpapiere, Versicherungen, sonstige Vermögenswerte',
  fields: [
    { fieldKey: 'bank_savings', labelDe: 'Bankguthaben (EUR)', type: 'decimal' },
    { fieldKey: 'securities_value', labelDe: 'Wertpapiere (EUR)', type: 'decimal' },
    { fieldKey: 'building_society_value', labelDe: 'Bausparverträge (EUR)', type: 'decimal' },
    { fieldKey: 'life_insurance_value', labelDe: 'Lebensversicherung Rückkaufswert (EUR)', type: 'decimal' },
    { fieldKey: 'other_assets_value', labelDe: 'Sonstige Vermögenswerte (EUR)', type: 'decimal' },
    { fieldKey: 'other_assets_description', labelDe: 'Beschreibung sonstige Vermögenswerte', type: 'string' },
  ],
};

// Section 7: Financing / Finanzierungswunsch
const sectionFinancing: SectionDefinition = {
  id: 'financing',
  title: 'Finanzierung',
  icon: Wallet,
  description: 'Objekt, Kaufpreis, Eigenkapital, gewünschte Darlehenskonditionen',
  fields: [
    { fieldKey: 'purpose', labelDe: 'Verwendungszweck', type: 'enum', notes: 'eigennutzung | kapitalanlage | neubau | modernisierung | umschuldung' },
    { fieldKey: 'object_address', labelDe: 'Objektadresse', type: 'string' },
    { fieldKey: 'object_type', labelDe: 'Objekttyp', type: 'string' },
    { fieldKey: 'purchase_price', labelDe: 'Kaufpreis (EUR)', type: 'decimal' },
    { fieldKey: 'ancillary_costs', labelDe: 'Erwerbsnebenkosten (EUR)', type: 'decimal' },
    { fieldKey: 'modernization_costs', labelDe: 'Modernisierungskosten (EUR)', type: 'decimal' },
    { fieldKey: 'planned_rent_monthly', labelDe: 'Geplante Miete (EUR/Monat)', type: 'decimal', notes: 'Bei Kapitalanlage' },
    { fieldKey: 'rental_status', labelDe: 'Vermietungsstatus', type: 'enum', notes: 'vermietet | leer | teil' },
    { fieldKey: 'equity_amount', labelDe: 'Eigenkapital (EUR)', type: 'decimal' },
    { fieldKey: 'equity_source', labelDe: 'Herkunft Eigenkapital', type: 'string' },
    { fieldKey: 'loan_amount_requested', labelDe: 'Gewünschter Darlehensbetrag (EUR)', type: 'decimal' },
    { fieldKey: 'fixed_rate_period_years', labelDe: 'Zinsbindung (Jahre)', type: 'number', notes: 'default: 10' },
    { fieldKey: 'repayment_rate_percent', labelDe: 'Tilgungssatz (%)', type: 'decimal', notes: 'default: 2%' },
    { fieldKey: 'max_monthly_rate', labelDe: 'Maximale Monatsrate (EUR)', type: 'decimal' },
  ],
};

// Section 8: Declarations / Erklärungen
const sectionDeclarations: SectionDefinition = {
  id: 'declarations',
  title: 'Erklärungen',
  icon: FileText,
  description: 'SCHUFA-Einwilligung, Bestätigungen, Pflichtangaben',
  fields: [
    { fieldKey: 'schufa_consent', labelDe: 'SCHUFA-Einwilligung', type: 'boolean' },
    { fieldKey: 'no_insolvency', labelDe: 'Keine Insolvenz', type: 'boolean', notes: 'Bestätigung: kein laufendes Insolvenzverfahren' },
    { fieldKey: 'no_tax_arrears', labelDe: 'Keine Steuerrückstände', type: 'boolean', notes: 'Bestätigung: keine offenen Steuerschulden' },
    { fieldKey: 'data_correct_confirmed', labelDe: 'Richtigkeit bestätigt', type: 'boolean', notes: 'Bestätigung der Datenrichtigkeit' },
  ],
};

// All 8 sections
const sections: SectionDefinition[] = [
  sectionIdentity,
  sectionHousehold,
  sectionEmployment,
  sectionCompany,
  sectionExpenses,
  sectionAssets,
  sectionFinancing,
  sectionDeclarations,
];

// =============================================================================
// COMPONENT
// =============================================================================

function TypeBadge({ type }: { type: FieldDefinition['type'] }) {
  const colors: Record<FieldDefinition['type'], string> = {
    string: 'bg-muted text-muted-foreground',
    number: 'bg-primary/10 text-primary',
    decimal: 'bg-accent text-accent-foreground',
    boolean: 'bg-secondary text-secondary-foreground',
    date: 'bg-muted text-foreground',
    enum: 'bg-primary/20 text-primary',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type]}`}>
      {type}
    </span>
  );
}

function FieldTable({ fields }: { fields: FieldDefinition[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">field_key</TableHead>
          <TableHead className="w-[200px]">label_de</TableHead>
          <TableHead className="w-[100px]">type</TableHead>
          <TableHead>notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.fieldKey}>
            <TableCell className="font-mono text-sm">{field.fieldKey}</TableCell>
            <TableCell>{field.labelDe}</TableCell>
            <TableCell>
              <TypeBadge type={field.type} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">{field.notes || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

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
              <h1 className="text-2xl font-bold">Selbstauskunft — Mastervorlage (v1)</h1>
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
            Zurück zu Master-Vorlagen
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Referenz aus aktueller Implementierung
            </p>
            <p className="text-muted-foreground mt-1">
              Feldstruktur abgeleitet aus <code className="bg-muted px-1 rounded">src/types/finance.ts</code> (ApplicantProfile Interface) 
              und UI-Labels aus <code className="bg-muted px-1 rounded">SelbstauskunftForm.tsx</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Variant Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Profiltypen:</span>
            <Badge variant="outline">Private (Standard)</Badge>
            <Badge variant="secondary">Entrepreneur (Firma-Sektion aktiviert)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Sections */}
      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger 
                key={section.id} 
                value={section.id} 
                className="flex flex-col gap-1 py-2 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{section.title}</span>
                {section.conditional && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">cond.</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <TabsContent key={section.id} value={section.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {section.title}
                          <Badge variant="outline" className="font-normal">
                            {section.fields.length} Felder
                          </Badge>
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    {section.conditional && (
                      <Badge variant="secondary" className="text-xs">
                        Conditional: {section.conditional}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <FieldTable fields={section.fields} />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Summary Footer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div 
                  key={section.id} 
                  className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{section.title}</div>
                    <div className="text-xs text-muted-foreground">{section.fields.length} Felder</div>
                  </div>
                  {section.conditional && (
                    <Badge variant="outline" className="text-[10px]">cond.</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Consistency Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konsistenzprüfung (Must-Elemente)</CardTitle>
          <CardDescription>
            Diese Felder müssen in ApplicantProfile vorhanden sein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              'first_name',
              'last_name',
              'birth_date',
              'nationality',
              'marital_status',
              'email',
              'phone',
              'adults_count',
              'children_count',
              'net_income_monthly',
              'employer_name',
              'company_name',
              'bank_savings',
              'purchase_price',
              'equity_amount',
              'loan_amount_requested',
              'schufa_consent',
              'data_correct_confirmed',
            ].map((fieldKey) => (
              <div key={fieldKey} className="flex items-center gap-2 p-2 rounded bg-accent/50 text-accent-foreground">
                <span className="font-mono text-xs">{fieldKey}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">✓</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Zone 1 — Selbstauskunft Mastervorlage (v2)
 * READ-ONLY viewer showing the 9-section structure with fields derived from src/types/finance.ts
 * Updated: 2026-02-06 to match SelbstauskunftFormV2 implementation
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  User, Home, Briefcase, Building2, CreditCard, PiggyBank, 
  Wallet, FileText, ArrowLeft, Info, Landmark, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =============================================================================
// FIELD DEFINITIONS — Derived from src/types/finance.ts (ApplicantProfile)
// Updated to match SelbstauskunftFormV2.tsx 9-section structure
// =============================================================================

interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  type: 'string' | 'number' | 'decimal' | 'boolean' | 'date' | 'enum';
  notes?: string;
}

interface SectionDefinition {
  id: string;
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fields: FieldDefinition[];
  conditional?: string;
}

// Section 1: Angaben zur Person
const section1Person: SectionDefinition = {
  id: 'person',
  number: 1,
  title: 'Angaben zur Person',
  icon: User,
  description: 'Identität, Adresse, Kontaktdaten, Ausweis, Steuer-ID',
  fields: [
    { fieldKey: 'salutation', labelDe: 'Anrede', type: 'enum', notes: 'Herr | Frau | Divers' },
    { fieldKey: 'first_name', labelDe: 'Vorname', type: 'string' },
    { fieldKey: 'last_name', labelDe: 'Nachname', type: 'string' },
    { fieldKey: 'birth_name', labelDe: 'Geburtsname', type: 'string' },
    { fieldKey: 'birth_date', labelDe: 'Geburtsdatum', type: 'date' },
    { fieldKey: 'birth_place', labelDe: 'Geburtsort', type: 'string' },
    { fieldKey: 'birth_country', labelDe: 'Geburtsland', type: 'string', notes: 'default: DE' },
    { fieldKey: 'nationality', labelDe: 'Staatsangehörigkeit', type: 'string', notes: 'default: DE' },
    { fieldKey: 'address_street', labelDe: 'Straße, Nr.', type: 'string' },
    { fieldKey: 'address_postal_code', labelDe: 'PLZ', type: 'string' },
    { fieldKey: 'address_city', labelDe: 'Ort', type: 'string' },
    { fieldKey: 'address_since', labelDe: 'Wohnhaft seit', type: 'date' },
    { fieldKey: 'previous_address_street', labelDe: 'Vorherige Adresse Straße', type: 'string' },
    { fieldKey: 'previous_address_postal_code', labelDe: 'Vorherige Adresse PLZ', type: 'string' },
    { fieldKey: 'previous_address_city', labelDe: 'Vorherige Adresse Ort', type: 'string' },
    { fieldKey: 'phone', labelDe: 'Telefon (Festnetz)', type: 'string' },
    { fieldKey: 'phone_mobile', labelDe: 'Telefon (Mobil)', type: 'string' },
    { fieldKey: 'email', labelDe: 'E-Mail', type: 'string' },
    { fieldKey: 'tax_id', labelDe: 'Steuer-IdNr.', type: 'string', notes: '11-stellig' },
  ],
};

// Section 2: Haushalt
const section2Haushalt: SectionDefinition = {
  id: 'household',
  number: 2,
  title: 'Haushalt',
  icon: Home,
  description: 'Familienstand, Gütertrennung, Kinder',
  fields: [
    { fieldKey: 'marital_status', labelDe: 'Familienstand', type: 'enum', notes: 'ledig | verheiratet | geschieden | verwitwet | getrennt' },
    { fieldKey: 'property_separation', labelDe: 'Gütertrennung vereinbart', type: 'boolean' },
    { fieldKey: 'children_count', labelDe: 'Anzahl Kinder', type: 'number' },
    { fieldKey: 'children_birth_dates', labelDe: 'Geburtsdaten Kinder', type: 'string', notes: 'Freitext oder Array' },
  ],
};

// Section 3: Beschäftigung (Switch: Angestellt / Selbstständig)
const section3Beschaeftigung: SectionDefinition = {
  id: 'employment',
  number: 3,
  title: 'Beschäftigung',
  icon: Briefcase,
  description: 'Angestellt ODER Selbstständig (Switch-basiert)',
  fields: [
    // Gemeinsam
    { fieldKey: 'employment_type', labelDe: 'Beschäftigungsart', type: 'enum', notes: 'employed | self_employed (Switch)' },
    // Angestellt
    { fieldKey: 'employer_name', labelDe: 'Arbeitgeber', type: 'string', notes: 'nur bei employed' },
    { fieldKey: 'employer_location', labelDe: 'Standort Arbeitgeber', type: 'string', notes: 'nur bei employed' },
    { fieldKey: 'employed_since', labelDe: 'Beschäftigt seit', type: 'date', notes: 'nur bei employed' },
    { fieldKey: 'contract_type', labelDe: 'Vertragsart', type: 'enum', notes: 'unbefristet | befristet' },
    { fieldKey: 'probation_until', labelDe: 'Probezeit bis', type: 'date' },
    { fieldKey: 'salary_payments_per_year', labelDe: 'Gehaltszahlungen/Jahr', type: 'number', notes: 'default: 12' },
    // Selbstständig
    { fieldKey: 'company_name', labelDe: 'Firma', type: 'string', notes: 'nur bei self_employed' },
    { fieldKey: 'company_industry', labelDe: 'Branche', type: 'string', notes: 'nur bei self_employed' },
    { fieldKey: 'company_founded', labelDe: 'Selbstständig seit', type: 'date', notes: 'nur bei self_employed' },
    { fieldKey: 'company_register_number', labelDe: 'Handelsregister / Gesellschaftsvertrag', type: 'string', notes: 'nur bei self_employed' },
  ],
};

// Section 4: Bankverbindung
const section4Bank: SectionDefinition = {
  id: 'bank',
  number: 4,
  title: 'Bankverbindung',
  icon: Landmark,
  description: 'IBAN und BIC für Auszahlungen',
  fields: [
    { fieldKey: 'iban', labelDe: 'IBAN', type: 'string' },
    { fieldKey: 'bic', labelDe: 'BIC', type: 'string' },
  ],
};

// Section 5: Monatliche Einnahmen
const section5Einnahmen: SectionDefinition = {
  id: 'income',
  number: 5,
  title: 'Monatliche Einnahmen',
  icon: Wallet,
  description: 'Alle regelmäßigen Einkünfte pro Monat',
  fields: [
    { fieldKey: 'net_income_monthly', labelDe: 'Nettoeinkommen (Gehalt)', type: 'decimal' },
    { fieldKey: 'side_job_income_monthly', labelDe: 'Nebentätigkeit', type: 'decimal' },
    { fieldKey: 'rental_income_monthly', labelDe: 'Mieteinnahmen', type: 'decimal', notes: 'Vorausfüllung aus MOD-04 möglich' },
    { fieldKey: 'child_benefit_monthly', labelDe: 'Kindergeld', type: 'decimal' },
    { fieldKey: 'alimony_income_monthly', labelDe: 'Unterhalt (erhalten)', type: 'decimal' },
    { fieldKey: 'pension_state_monthly', labelDe: 'Rente (gesetzlich)', type: 'decimal' },
    { fieldKey: 'pension_private_monthly', labelDe: 'Rente (privat)', type: 'decimal' },
    { fieldKey: 'other_regular_income_monthly', labelDe: 'Sonstiges', type: 'decimal' },
    { fieldKey: 'other_income_description', labelDe: 'Beschreibung Sonstiges', type: 'string' },
  ],
};

// Section 6: Monatliche Ausgaben
const section6Ausgaben: SectionDefinition = {
  id: 'expenses',
  number: 6,
  title: 'Monatliche Ausgaben',
  icon: CreditCard,
  description: 'Fixkosten und regelmäßige Ausgaben',
  fields: [
    { fieldKey: 'current_rent_monthly', labelDe: 'Aktuelle Warmmiete', type: 'decimal' },
    { fieldKey: 'health_insurance_monthly', labelDe: 'Private Krankenversicherung', type: 'decimal' },
    { fieldKey: 'child_support_amount_monthly', labelDe: 'Unterhaltsverpflichtungen', type: 'decimal' },
    { fieldKey: 'car_leasing_monthly', labelDe: 'Leasing (Kfz)', type: 'decimal' },
    { fieldKey: 'other_fixed_costs_monthly', labelDe: 'Sonstige Fixkosten', type: 'decimal' },
  ],
};

// Section 7: Vermögen
const section7Vermoegen: SectionDefinition = {
  id: 'assets',
  number: 7,
  title: 'Vermögen',
  icon: PiggyBank,
  description: 'Liquide Mittel und Vermögenswerte',
  fields: [
    { fieldKey: 'bank_savings', labelDe: 'Bank-/Sparguthaben', type: 'decimal' },
    { fieldKey: 'securities_value', labelDe: 'Wertpapiere/Fonds', type: 'decimal' },
    { fieldKey: 'building_society_value', labelDe: 'Bausparguthaben', type: 'decimal' },
    { fieldKey: 'life_insurance_value', labelDe: 'Rückkaufswert Lebensversicherung', type: 'decimal' },
    { fieldKey: 'other_assets_value', labelDe: 'Sonstige Vermögenswerte', type: 'decimal' },
    { fieldKey: 'other_assets_description', labelDe: 'Beschreibung Sonstige', type: 'string' },
    // Hinweis: Immobilienvermögen aus MOD-04 (read-only)
  ],
};

// Section 8: Verbindlichkeiten (1:N Tabelle)
const section8Verbindlichkeiten: SectionDefinition = {
  id: 'liabilities',
  number: 8,
  title: 'Verbindlichkeiten',
  icon: AlertCircle,
  description: 'Bestehende Kredite und Verpflichtungen (1:N via applicant_liabilities)',
  fields: [
    { fieldKey: 'liability_type', labelDe: 'Art', type: 'enum', notes: 'immobiliendarlehen | ratenkredit | leasing | sonstige' },
    { fieldKey: 'creditor_name', labelDe: 'Gläubiger/Bank', type: 'string' },
    { fieldKey: 'original_amount', labelDe: 'Ursprungsbetrag', type: 'decimal' },
    { fieldKey: 'remaining_balance', labelDe: 'Restschuld', type: 'decimal' },
    { fieldKey: 'monthly_rate', labelDe: 'Monatsrate', type: 'decimal' },
    { fieldKey: 'interest_rate_fixed_until', labelDe: 'Zinsbindung bis', type: 'date' },
    { fieldKey: 'end_date', labelDe: 'Laufzeitende', type: 'date' },
  ],
};

// Section 9: Erklärungen
const section9Erklaerungen: SectionDefinition = {
  id: 'declarations',
  number: 9,
  title: 'Erklärungen',
  icon: FileText,
  description: 'SCHUFA-Einwilligung und rechtliche Bestätigungen',
  fields: [
    { fieldKey: 'schufa_consent', labelDe: 'SCHUFA-Einwilligung', type: 'boolean' },
    { fieldKey: 'no_insolvency', labelDe: 'Kein Insolvenzverfahren', type: 'boolean' },
    { fieldKey: 'no_tax_arrears', labelDe: 'Keine Steuerrückstände', type: 'boolean' },
    { fieldKey: 'data_correct_confirmed', labelDe: 'Richtigkeit der Angaben bestätigt', type: 'boolean' },
  ],
};

// All 9 sections
const sections: SectionDefinition[] = [
  section1Person,
  section2Haushalt,
  section3Beschaeftigung,
  section4Bank,
  section5Einnahmen,
  section6Ausgaben,
  section7Vermoegen,
  section8Verbindlichkeiten,
  section9Erklaerungen,
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
              <h1 className="text-2xl font-bold">Selbstauskunft — Mastervorlage (v2)</h1>
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
              Referenz aus aktueller Implementierung (v2)
            </p>
            <p className="text-muted-foreground mt-1">
              Feldstruktur abgeleitet aus <code className="bg-muted px-1 rounded">src/types/finance.ts</code> (ApplicantProfile Interface) 
              und UI-Struktur aus <code className="bg-muted px-1 rounded">SelbstauskunftFormV2.tsx</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section Structure Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">9-Sektionen-Struktur:</span>
            {sections.map((s) => (
              <Badge key={s.id} variant="outline" className="gap-1">
                <span className="font-bold">{s.number}.</span> {s.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Sections */}
      <Tabs defaultValue="person" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 h-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger 
                key={section.id} 
                value={section.id} 
                className="flex flex-col gap-1 py-2 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{section.number}. {section.title}</span>
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
                          <span className="text-primary font-bold">{section.number}.</span>
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
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div 
                  key={section.id} 
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs font-medium">{section.number}. {section.title}</div>
                  <div className="text-xs text-muted-foreground">{section.fields.length} Felder</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Consistency Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Änderungshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Änderung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">v1</TableCell>
                <TableCell>2026-01-26</TableCell>
                <TableCell>Initial (8 Sektionen)</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell className="font-mono font-bold">v2</TableCell>
                <TableCell>2026-02-06</TableCell>
                <TableCell>
                  <strong>9 Sektionen:</strong> Bankverbindung separiert, Einnahmen/Ausgaben getrennt, 
                  Verbindlichkeiten als 1:N Tabelle (applicant_liabilities)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Related Docs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verknüpfte Dokumentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">docs/modules/MOD-07_FINANZIERUNG.md</Badge>
            <Badge variant="outline">docs/workflows/GOLDEN_PATH_FINANZIERUNG.md</Badge>
            <Badge variant="outline">src/types/finance.ts</Badge>
            <Badge variant="outline">src/components/finanzierung/SelbstauskunftFormV2.tsx</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

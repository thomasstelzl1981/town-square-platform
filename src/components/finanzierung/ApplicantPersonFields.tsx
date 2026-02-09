/**
 * Reusable person fields for applicant profiles (used for both primary and co-applicant)
 * Covers Section 1 (Person), Section 3 (Employment), Section 4 (Bank),
 * Section 5 (Income), Section 6 (Expenses), Section 7 (Assets)
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Inline FormField to avoid circular deps
function FormField({ 
  label, required = false, children, hint, className = ''
}: { label: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export interface ApplicantFormData {
  salutation: string;
  first_name: string;
  last_name: string;
  birth_name: string;
  birth_date: string;
  birth_place: string;
  birth_country: string;
  nationality: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  address_since: string;
  previous_address_street: string;
  previous_address_postal_code: string;
  previous_address_city: string;
  phone: string;
  phone_mobile: string;
  email: string;
  tax_id: string;
  // Employment
  employment_type: string;
  employer_name: string;
  employed_since: string;
  contract_type: string;
  probation_until: string;
  employer_in_germany: boolean;
  salary_currency: string;
  salary_payments_per_year: number;
  has_side_job: boolean;
  side_job_type: string;
  side_job_since: string;
  vehicles_count: number;
  retirement_date: string;
  pension_state_monthly: number | null;
  pension_private_monthly: number | null;
  company_name: string;
  company_legal_form: string;
  company_founded: string;
  company_industry: string;
  // Bank
  iban: string;
  bic: string;
  // Income
  net_income_monthly: number | null;
  self_employed_income_monthly: number | null;
  side_job_income_monthly: number | null;
  rental_income_monthly: number | null;
  child_benefit_monthly: number | null;
  alimony_income_monthly: number | null;
  other_regular_income_monthly: number | null;
  // Expenses
  current_rent_monthly: number | null;
  health_insurance_monthly: number | null;
  child_support_amount_monthly: number | null;
  car_leasing_monthly: number | null;
  other_fixed_costs_monthly: number | null;
  // Assets
  bank_savings: number | null;
  securities_value: number | null;
  building_society_value: number | null;
  life_insurance_value: number | null;
  other_assets_value: number | null;
}

export function createEmptyApplicantFormData(): ApplicantFormData {
  return {
    salutation: '', first_name: '', last_name: '', birth_name: '',
    birth_date: '', birth_place: '', birth_country: 'DE', nationality: 'DE',
    address_street: '', address_postal_code: '', address_city: '', address_since: '',
    previous_address_street: '', previous_address_postal_code: '', previous_address_city: '',
    phone: '', phone_mobile: '', email: '', tax_id: '',
    employment_type: 'angestellt', employer_name: '', employed_since: '',
    contract_type: 'unbefristet', probation_until: '', employer_in_germany: true,
    salary_currency: 'EUR', salary_payments_per_year: 12, has_side_job: false,
    side_job_type: '', side_job_since: '', vehicles_count: 0, retirement_date: '',
    pension_state_monthly: null, pension_private_monthly: null,
    company_name: '', company_legal_form: '', company_founded: '', company_industry: '',
    iban: '', bic: '',
    net_income_monthly: null, self_employed_income_monthly: null,
    side_job_income_monthly: null, rental_income_monthly: null,
    child_benefit_monthly: null, alimony_income_monthly: null,
    other_regular_income_monthly: null,
    current_rent_monthly: null, health_insurance_monthly: null,
    child_support_amount_monthly: null, car_leasing_monthly: null,
    other_fixed_costs_monthly: null,
    bank_savings: null, securities_value: null, building_society_value: null,
    life_insurance_value: null, other_assets_value: null,
  };
}

interface ApplicantSectionProps {
  formData: ApplicantFormData;
  onChange: (field: string, value: unknown) => void;
  readOnly: boolean;
  label: string; // "1. Antragsteller:in" or "2. Antragsteller:in"
}

/** Section 1: Person fields */
export function PersonSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField label="Anrede">
          <Select value={formData.salutation} onValueChange={v => onChange('salutation', v)} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Herr">Herr</SelectItem>
              <SelectItem value="Frau">Frau</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Vorname" required>
          <Input value={formData.first_name} onChange={e => onChange('first_name', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Nachname" required>
          <Input value={formData.last_name} onChange={e => onChange('last_name', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Geburtsname">
          <Input value={formData.birth_name} onChange={e => onChange('birth_name', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField label="Geburtsdatum" required>
          <Input type="date" value={formData.birth_date} onChange={e => onChange('birth_date', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Geburtsort">
          <Input value={formData.birth_place} onChange={e => onChange('birth_place', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Geburtsland">
          <Input value={formData.birth_country} onChange={e => onChange('birth_country', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Staatsangehörigkeit">
          <Input value={formData.nationality} onChange={e => onChange('nationality', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField label="Straße, Hausnummer" required className="lg:col-span-2">
          <Input value={formData.address_street} onChange={e => onChange('address_street', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Wohnhaft seit">
          <Input type="date" value={formData.address_since} onChange={e => onChange('address_since', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="PLZ" required>
          <Input value={formData.address_postal_code} onChange={e => onChange('address_postal_code', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Wohnort" required className="md:col-span-2">
          <Input value={formData.address_city} onChange={e => onChange('address_city', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Vorherige Adresse (Straße)" hint="Falls weniger als 3 Jahre an aktueller Adresse">
          <Input value={formData.previous_address_street} onChange={e => onChange('previous_address_street', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Vorherige PLZ">
          <Input value={formData.previous_address_postal_code} onChange={e => onChange('previous_address_postal_code', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Vorheriger Wohnort">
          <Input value={formData.previous_address_city} onChange={e => onChange('previous_address_city', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField label="Telefon (Festnetz)">
          <Input value={formData.phone} onChange={e => onChange('phone', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Telefon (Mobil)" required>
          <Input value={formData.phone_mobile} onChange={e => onChange('phone_mobile', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="E-Mail" required>
          <Input type="email" value={formData.email} onChange={e => onChange('email', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Steuer-IdNr.">
          <Input value={formData.tax_id} onChange={e => onChange('tax_id', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>
    </div>
  );
}

/** Section 3: Employment fields */
export function EmploymentSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>

      {/* Employment Type Switch */}
      <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
        <Label className="font-medium">Beschäftigungsart:</Label>
        <div className="flex items-center gap-4">
          <Button variant={formData.employment_type !== 'selbststaendig' ? 'default' : 'outline'} size="sm" onClick={() => onChange('employment_type', 'angestellt')} disabled={readOnly}>Angestellt</Button>
          <Button variant={formData.employment_type === 'selbststaendig' ? 'default' : 'outline'} size="sm" onClick={() => onChange('employment_type', 'selbststaendig')} disabled={readOnly}>Selbstständig</Button>
        </div>
      </div>

      {formData.employment_type !== 'selbststaendig' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Name des Arbeitgebers">
              <Input value={formData.employer_name} onChange={e => onChange('employer_name', e.target.value)} disabled={readOnly} />
            </FormField>
            <FormField label="Beschäftigt seit">
              <Input type="date" value={formData.employed_since} onChange={e => onChange('employed_since', e.target.value)} disabled={readOnly} />
            </FormField>
            <FormField label="Vertragsverhältnis">
              <Select value={formData.contract_type} onValueChange={v => onChange('contract_type', v)} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unbefristet">Unbefristet</SelectItem>
                  <SelectItem value="befristet">Befristet</SelectItem>
                  <SelectItem value="probezeit">In Probezeit</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Sitz in Deutschland">
              <div className="flex items-center h-10 gap-3">
                <Checkbox checked={formData.employer_in_germany} onCheckedChange={v => onChange('employer_in_germany', v)} disabled={readOnly} />
                <Label className="text-sm">Ja</Label>
              </div>
            </FormField>
            <FormField label="Gehaltswährung">
              <Select value={formData.salary_currency} onValueChange={v => onChange('salary_currency', v)} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                  <SelectItem value="USD">US-Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Zahlungen/Jahr">
              <Select value={String(formData.salary_payments_per_year)} onValueChange={v => onChange('salary_payments_per_year', parseInt(v))} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12x</SelectItem>
                  <SelectItem value="13">13x</SelectItem>
                  <SelectItem value="14">14x</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Anzahl Kfz im Haushalt">
              <Input type="number" min="0" value={formData.vehicles_count || ''} onChange={e => onChange('vehicles_count', parseInt(e.target.value) || 0)} disabled={readOnly} />
            </FormField>
          </div>
        </div>
      )}

      {formData.employment_type === 'selbststaendig' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Firma / Name">
              <Input value={formData.company_name} onChange={e => onChange('company_name', e.target.value)} disabled={readOnly} />
            </FormField>
            <FormField label="Rechtsform">
              <Select value={formData.company_legal_form} onValueChange={v => onChange('company_legal_form', v)} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                  <SelectItem value="freiberufler">Freiberufler</SelectItem>
                  <SelectItem value="gbr">GbR</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ug">UG (haftungsbeschränkt)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Selbstständig seit">
              <Input type="date" value={formData.company_founded} onChange={e => onChange('company_founded', e.target.value)} disabled={readOnly} />
            </FormField>
          </div>
          <FormField label="Branche">
            <Input value={formData.company_industry} onChange={e => onChange('company_industry', e.target.value)} disabled={readOnly} />
          </FormField>
        </div>
      )}

      {/* Nebentätigkeit */}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Checkbox checked={formData.has_side_job} onCheckedChange={v => onChange('has_side_job', v)} disabled={readOnly} />
          <Label>Zusätzliche Nebentätigkeit</Label>
        </div>
        {formData.has_side_job && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
            <FormField label="Art der Nebentätigkeit">
              <Select value={formData.side_job_type} onValueChange={v => onChange('side_job_type', v)} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nebentaetigkeit">Nebentätigkeit</SelectItem>
                  <SelectItem value="freiberuflich">Freiberuflich</SelectItem>
                  <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Seit">
              <Input type="date" value={formData.side_job_since} onChange={e => onChange('side_job_since', e.target.value)} disabled={readOnly} />
            </FormField>
          </div>
        )}
      </div>

      {/* Rente */}
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Rentenbeginn (geplant)">
          <Input type="date" value={formData.retirement_date} onChange={e => onChange('retirement_date', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="Gesetzliche Rente (mtl.)">
          <Input type="number" step="0.01" placeholder="€" value={formData.pension_state_monthly || ''} onChange={e => onChange('pension_state_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Private Rente (mtl.)">
          <Input type="number" step="0.01" placeholder="€" value={formData.pension_private_monthly || ''} onChange={e => onChange('pension_private_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
      </div>
    </div>
  );
}

/** Section 4: Bank fields */
export function BankSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="IBAN" required>
          <Input placeholder="DE89 3704 0044 0532 0130 00" value={formData.iban} onChange={e => onChange('iban', e.target.value)} disabled={readOnly} />
        </FormField>
        <FormField label="BIC">
          <Input placeholder="COBADEFFXXX" value={formData.bic} onChange={e => onChange('bic', e.target.value)} disabled={readOnly} />
        </FormField>
      </div>
    </div>
  );
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** Section 5: Income fields */
export function IncomeSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  const total = (formData.net_income_monthly || 0) + (formData.self_employed_income_monthly || 0) +
    (formData.side_job_income_monthly || 0) + (formData.rental_income_monthly || 0) +
    (formData.child_benefit_monthly || 0) + (formData.alimony_income_monthly || 0) +
    (formData.other_regular_income_monthly || 0);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField label="Nettoeinkommen" required>
          <Input type="number" step="0.01" placeholder="€" value={formData.net_income_monthly || ''} onChange={e => onChange('net_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Aus selbstständiger Tätigkeit">
          <Input type="number" step="0.01" placeholder="€" value={formData.self_employed_income_monthly || ''} onChange={e => onChange('self_employed_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Nebentätigkeit">
          <Input type="number" step="0.01" placeholder="€" value={formData.side_job_income_monthly || ''} onChange={e => onChange('side_job_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Mieteinnahmen">
          <Input type="number" step="0.01" placeholder="€" value={formData.rental_income_monthly || ''} onChange={e => onChange('rental_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Kindergeld">
          <Input type="number" step="0.01" placeholder="€" value={formData.child_benefit_monthly || ''} onChange={e => onChange('child_benefit_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Unterhaltseinnahmen">
          <Input type="number" step="0.01" placeholder="€" value={formData.alimony_income_monthly || ''} onChange={e => onChange('alimony_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Sonstiges">
          <Input type="number" step="0.01" placeholder="€" value={formData.other_regular_income_monthly || ''} onChange={e => onChange('other_regular_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
      </div>
      <Separator />
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Summe der Einnahmen</p>
          <p className="text-2xl font-bold">{eurFormat.format(total)}</p>
        </div>
      </div>
    </div>
  );
}

/** Section 6: Expenses fields */
export function ExpensesSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  const total = (formData.current_rent_monthly || 0) + (formData.health_insurance_monthly || 0) +
    (formData.child_support_amount_monthly || 0) + (formData.car_leasing_monthly || 0) +
    (formData.other_fixed_costs_monthly || 0);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField label="Aktuelle Warmmiete">
          <Input type="number" step="0.01" placeholder="€" value={formData.current_rent_monthly || ''} onChange={e => onChange('current_rent_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Private Krankenversicherung">
          <Input type="number" step="0.01" placeholder="€" value={formData.health_insurance_monthly || ''} onChange={e => onChange('health_insurance_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Unterhaltsverpflichtungen">
          <Input type="number" step="0.01" placeholder="€" value={formData.child_support_amount_monthly || ''} onChange={e => onChange('child_support_amount_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Leasing (Kfz)">
          <Input type="number" step="0.01" placeholder="€" value={formData.car_leasing_monthly || ''} onChange={e => onChange('car_leasing_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Sonstige Fixkosten">
          <Input type="number" step="0.01" placeholder="€" value={formData.other_fixed_costs_monthly || ''} onChange={e => onChange('other_fixed_costs_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
      </div>
      <Separator />
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Summe der Ausgaben</p>
          <p className="text-2xl font-bold text-destructive">{eurFormat.format(total)}</p>
        </div>
      </div>
    </div>
  );
}

/** Section 7: Assets fields */
export function AssetsSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  const total = (formData.bank_savings || 0) + (formData.securities_value || 0) +
    (formData.building_society_value || 0) + (formData.life_insurance_value || 0) +
    (formData.other_assets_value || 0);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField label="Bank-/Sparguthaben">
          <Input type="number" step="0.01" placeholder="€" value={formData.bank_savings || ''} onChange={e => onChange('bank_savings', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Wertpapiere/Aktien">
          <Input type="number" step="0.01" placeholder="€" value={formData.securities_value || ''} onChange={e => onChange('securities_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Bausparguthaben">
          <Input type="number" step="0.01" placeholder="€" value={formData.building_society_value || ''} onChange={e => onChange('building_society_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Lebens-/Rentenversicherung">
          <Input type="number" step="0.01" placeholder="€" value={formData.life_insurance_value || ''} onChange={e => onChange('life_insurance_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
        <FormField label="Sonstiges Vermögen">
          <Input type="number" step="0.01" placeholder="€" value={formData.other_assets_value || ''} onChange={e => onChange('other_assets_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </FormField>
      </div>
      <Separator />
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Summe des Vermögens</p>
          <p className="text-2xl font-bold text-green-600">{eurFormat.format(total)}</p>
        </div>
      </div>
    </div>
  );
}

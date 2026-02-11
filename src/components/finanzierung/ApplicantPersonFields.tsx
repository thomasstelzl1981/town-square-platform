/**
 * Reusable person fields for applicant profiles (used for both primary and co-applicant)
 * Covers Section 1 (Person), Section 3 (Employment), Section 4 (Bank),
 * Section 5 (Income), Section 6 (Expenses), Section 7 (Assets)
 * 
 * Uses tabular Table-Row layout for compact, bank-standard presentation.
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

// Tabular row helper – Label | Input in a compact table row
function TR({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="w-[200px] border-r py-1.5 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </TableCell>
      <TableCell className="py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

// Compact inline input for table cells
function TInput({ value, onChange, disabled, type = 'text', placeholder, step, min, className = '' }: {
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  className?: string;
}) {
  return (
    <Input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      step={step}
      min={min}
      className={`h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 ${className}`}
    />
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
  label: string;
}

/** Section 1: Person fields */
export function PersonSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>
      <Table>
        <TableBody>
          <TR label="Anrede">
            <Select value={formData.salutation} onValueChange={v => onChange('salutation', v)} disabled={readOnly}>
              <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue placeholder="Auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Herr">Herr</SelectItem>
                <SelectItem value="Frau">Frau</SelectItem>
              </SelectContent>
            </Select>
          </TR>
          <TR label="Vorname" required>
            <TInput value={formData.first_name} onChange={e => onChange('first_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Nachname" required>
            <TInput value={formData.last_name} onChange={e => onChange('last_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsname">
            <TInput value={formData.birth_name} onChange={e => onChange('birth_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsdatum" required>
            <TInput type="date" value={formData.birth_date} onChange={e => onChange('birth_date', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsort">
            <TInput value={formData.birth_place} onChange={e => onChange('birth_place', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsland">
            <TInput value={formData.birth_country} onChange={e => onChange('birth_country', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Staatsangehörigkeit">
            <TInput value={formData.nationality} onChange={e => onChange('nationality', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>

      <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide pt-2">Adresse</h4>
      <Table>
        <TableBody>
          <TR label="Straße, Hausnummer" required>
            <TInput value={formData.address_street} onChange={e => onChange('address_street', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="PLZ" required>
            <TInput value={formData.address_postal_code} onChange={e => onChange('address_postal_code', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Wohnort" required>
            <TInput value={formData.address_city} onChange={e => onChange('address_city', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Wohnhaft seit">
            <TInput type="date" value={formData.address_since} onChange={e => onChange('address_since', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Vorherige Straße">
            <TInput value={formData.previous_address_street} onChange={e => onChange('previous_address_street', e.target.value)} disabled={readOnly} placeholder="Falls < 3 Jahre an akt. Adresse" />
          </TR>
          <TR label="Vorherige PLZ">
            <TInput value={formData.previous_address_postal_code} onChange={e => onChange('previous_address_postal_code', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Vorheriger Wohnort">
            <TInput value={formData.previous_address_city} onChange={e => onChange('previous_address_city', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>

      <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide pt-2">Kontakt</h4>
      <Table>
        <TableBody>
          <TR label="Telefon (Festnetz)">
            <TInput value={formData.phone} onChange={e => onChange('phone', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Telefon (Mobil)" required>
            <TInput value={formData.phone_mobile} onChange={e => onChange('phone_mobile', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="E-Mail" required>
            <TInput type="email" value={formData.email} onChange={e => onChange('email', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Steuer-IdNr.">
            <TInput value={formData.tax_id} onChange={e => onChange('tax_id', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 3: Employment fields */
export function EmploymentSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>

      {/* Employment Type Switch */}
      <div className="flex items-center gap-4 py-2">
        <Label className="text-xs font-medium text-muted-foreground">Beschäftigungsart:</Label>
        <div className="flex items-center gap-2">
          <Button variant={formData.employment_type !== 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => onChange('employment_type', 'angestellt')} disabled={readOnly}>Angestellt</Button>
          <Button variant={formData.employment_type === 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => onChange('employment_type', 'selbststaendig')} disabled={readOnly}>Selbstständig</Button>
        </div>
      </div>

      {formData.employment_type !== 'selbststaendig' && (
        <Table>
          <TableBody>
            <TR label="Arbeitgeber">
              <TInput value={formData.employer_name} onChange={e => onChange('employer_name', e.target.value)} disabled={readOnly} />
            </TR>
            <TR label="Beschäftigt seit">
              <TInput type="date" value={formData.employed_since} onChange={e => onChange('employed_since', e.target.value)} disabled={readOnly} />
            </TR>
            <TR label="Vertragsverhältnis">
              <Select value={formData.contract_type} onValueChange={v => onChange('contract_type', v)} disabled={readOnly}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unbefristet">Unbefristet</SelectItem>
                  <SelectItem value="befristet">Befristet</SelectItem>
                  <SelectItem value="probezeit">In Probezeit</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Sitz in Deutschland">
              <div className="flex items-center h-7 gap-2">
                <Checkbox checked={formData.employer_in_germany} onCheckedChange={v => onChange('employer_in_germany', v)} disabled={readOnly} />
                <Label className="text-xs">Ja</Label>
              </div>
            </TR>
            <TR label="Gehaltswährung">
              <Select value={formData.salary_currency} onValueChange={v => onChange('salary_currency', v)} disabled={readOnly}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Zahlungen/Jahr">
              <Select value={String(formData.salary_payments_per_year)} onValueChange={v => onChange('salary_payments_per_year', parseInt(v))} disabled={readOnly}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12x</SelectItem>
                  <SelectItem value="13">13x</SelectItem>
                  <SelectItem value="14">14x</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Anzahl Kfz">
              <TInput type="number" min="0" value={formData.vehicles_count || ''} onChange={e => onChange('vehicles_count', parseInt(e.target.value) || 0)} disabled={readOnly} />
            </TR>
          </TableBody>
        </Table>
      )}

      {formData.employment_type === 'selbststaendig' && (
        <Table>
          <TableBody>
            <TR label="Firma / Name">
              <TInput value={formData.company_name} onChange={e => onChange('company_name', e.target.value)} disabled={readOnly} />
            </TR>
            <TR label="Rechtsform">
              <Select value={formData.company_legal_form} onValueChange={v => onChange('company_legal_form', v)} disabled={readOnly}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                  <SelectItem value="freiberufler">Freiberufler</SelectItem>
                  <SelectItem value="gbr">GbR</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ug">UG (haftungsbeschränkt)</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Selbstständig seit">
              <TInput type="date" value={formData.company_founded} onChange={e => onChange('company_founded', e.target.value)} disabled={readOnly} />
            </TR>
            <TR label="Branche">
              <TInput value={formData.company_industry} onChange={e => onChange('company_industry', e.target.value)} disabled={readOnly} />
            </TR>
          </TableBody>
        </Table>
      )}

      {/* Nebentätigkeit */}
      <div className="flex items-center gap-3 py-2">
        <Checkbox checked={formData.has_side_job} onCheckedChange={v => onChange('has_side_job', v)} disabled={readOnly} />
        <Label className="text-xs">Zusätzliche Nebentätigkeit</Label>
      </div>
      {formData.has_side_job && (
        <Table>
          <TableBody>
            <TR label="Art der Nebentätigkeit">
              <Select value={formData.side_job_type} onValueChange={v => onChange('side_job_type', v)} disabled={readOnly}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nebentaetigkeit">Nebentätigkeit</SelectItem>
                  <SelectItem value="freiberuflich">Freiberuflich</SelectItem>
                  <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Seit">
              <TInput type="date" value={formData.side_job_since} onChange={e => onChange('side_job_since', e.target.value)} disabled={readOnly} />
            </TR>
          </TableBody>
        </Table>
      )}

      {/* Rente */}
      <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide pt-2">Rente</h4>
      <Table>
        <TableBody>
          <TR label="Rentenbeginn (geplant)">
            <TInput type="date" value={formData.retirement_date} onChange={e => onChange('retirement_date', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Gesetzliche Rente (mtl.)">
            <TInput type="number" step="0.01" placeholder="€" value={formData.pension_state_monthly || ''} onChange={e => onChange('pension_state_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Private Rente (mtl.)">
            <TInput type="number" step="0.01" placeholder="€" value={formData.pension_private_monthly || ''} onChange={e => onChange('pension_private_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 4: Bank fields */
export function BankSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>
      <Table>
        <TableBody>
          <TR label="IBAN" required>
            <TInput placeholder="DE89 3704 0044 0532 0130 00" value={formData.iban} onChange={e => onChange('iban', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="BIC">
            <TInput placeholder="COBADEFFXXX" value={formData.bic} onChange={e => onChange('bic', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
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
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>
      <Table>
        <TableBody>
          <TR label="Nettoeinkommen" required>
            <TInput type="number" step="0.01" placeholder="€" value={formData.net_income_monthly || ''} onChange={e => onChange('net_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Aus selbstst. Tätigkeit">
            <TInput type="number" step="0.01" placeholder="€" value={formData.self_employed_income_monthly || ''} onChange={e => onChange('self_employed_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Nebentätigkeit">
            <TInput type="number" step="0.01" placeholder="€" value={formData.side_job_income_monthly || ''} onChange={e => onChange('side_job_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Mieteinnahmen">
            <TInput type="number" step="0.01" placeholder="€" value={formData.rental_income_monthly || ''} onChange={e => onChange('rental_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Kindergeld">
            <TInput type="number" step="0.01" placeholder="€" value={formData.child_benefit_monthly || ''} onChange={e => onChange('child_benefit_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Unterhaltseinnahmen">
            <TInput type="number" step="0.01" placeholder="€" value={formData.alimony_income_monthly || ''} onChange={e => onChange('alimony_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstiges">
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_regular_income_monthly || ''} onChange={e => onChange('other_regular_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[200px] border-r py-1.5 px-3 text-xs">Summe Einnahmen</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold">{eurFormat.format(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 6: Expenses fields */
export function ExpensesSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  const total = (formData.current_rent_monthly || 0) + (formData.health_insurance_monthly || 0) +
    (formData.child_support_amount_monthly || 0) + (formData.car_leasing_monthly || 0) +
    (formData.other_fixed_costs_monthly || 0);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>
      <Table>
        <TableBody>
          <TR label="Aktuelle Warmmiete">
            <TInput type="number" step="0.01" placeholder="€" value={formData.current_rent_monthly || ''} onChange={e => onChange('current_rent_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Private Krankenversicherung">
            <TInput type="number" step="0.01" placeholder="€" value={formData.health_insurance_monthly || ''} onChange={e => onChange('health_insurance_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Unterhaltsverpflichtungen">
            <TInput type="number" step="0.01" placeholder="€" value={formData.child_support_amount_monthly || ''} onChange={e => onChange('child_support_amount_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Leasing (Kfz)">
            <TInput type="number" step="0.01" placeholder="€" value={formData.car_leasing_monthly || ''} onChange={e => onChange('car_leasing_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstige Fixkosten">
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_fixed_costs_monthly || ''} onChange={e => onChange('other_fixed_costs_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[200px] border-r py-1.5 px-3 text-xs">Summe Ausgaben</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-destructive">{eurFormat.format(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 7: Assets fields */
export function AssetsSection({ formData, onChange, readOnly, label }: ApplicantSectionProps) {
  const total = (formData.bank_savings || 0) + (formData.securities_value || 0) +
    (formData.building_society_value || 0) + (formData.life_insurance_value || 0) +
    (formData.other_assets_value || 0);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{label}</h3>
      <Table>
        <TableBody>
          <TR label="Bank-/Sparguthaben">
            <TInput type="number" step="0.01" placeholder="€" value={formData.bank_savings || ''} onChange={e => onChange('bank_savings', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Wertpapiere/Aktien">
            <TInput type="number" step="0.01" placeholder="€" value={formData.securities_value || ''} onChange={e => onChange('securities_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Bausparguthaben">
            <TInput type="number" step="0.01" placeholder="€" value={formData.building_society_value || ''} onChange={e => onChange('building_society_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Lebens-/Rentenversicherung">
            <TInput type="number" step="0.01" placeholder="€" value={formData.life_insurance_value || ''} onChange={e => onChange('life_insurance_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstiges Vermögen">
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_assets_value || ''} onChange={e => onChange('other_assets_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[200px] border-r py-1.5 px-3 text-xs">Summe Vermögen</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-green-600">{eurFormat.format(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

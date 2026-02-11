/**
 * Reusable person fields for applicant profiles (used for both primary and co-applicant)
 * Covers Section 1 (Person), Section 3 (Employment), Section 4 (Bank),
 * Section 5 (Income), Section 6 (Expenses), Section 7 (Assets)
 * 
 * 3-column layout: Label | AS1 | AS2 (side-by-side)
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** 3-column table row: Label | AS1 value | AS2 value */
export function TR({ label, required, children, children2 }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  children2?: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </TableCell>
      <TableCell className="py-1.5 px-3 border-r">{children}</TableCell>
      <TableCell className="py-1.5 px-3">{children2 ?? <span className="text-muted-foreground/40">—</span>}</TableCell>
    </TableRow>
  );
}

/** Dual-column header row for section tables */
export function DualHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[180px] border-r text-xs">Feld</TableHead>
        <TableHead className="text-xs border-r">1. Antragsteller</TableHead>
        <TableHead className="text-xs">2. Antragsteller</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** Section header row spanning all 3 columns */
export function SectionHeaderRow({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={3} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
        {title}
      </TableCell>
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

/** Dual-applicant section props used by all sections */
export interface DualApplicantSectionProps {
  formData: ApplicantFormData;
  coFormData: ApplicantFormData;
  onChange: (field: string, value: unknown) => void;
  onCoChange: (field: string, value: unknown) => void;
  readOnly: boolean;
  coReadOnly?: boolean;
  onCoFirstInput?: () => void;
}

// Legacy single-applicant interface (kept for backward compat)
interface ApplicantSectionProps {
  formData: ApplicantFormData;
  onChange: (field: string, value: unknown) => void;
  readOnly: boolean;
  label: string;
}

/** Wrap co-applicant onChange to trigger auto-create on first input */
function useCoChangeWrapper(onCoChange: (field: string, value: unknown) => void, onCoFirstInput?: () => void) {
  const triggered = React.useRef(false);
  return React.useCallback((field: string, value: unknown) => {
    if (!triggered.current && onCoFirstInput && value !== '' && value !== null && value !== undefined) {
      triggered.current = true;
      onCoFirstInput();
    }
    onCoChange(field, value);
  }, [onCoChange, onCoFirstInput]);
}

/** Inline select for table cells */
function TSelect({ value, onValueChange, disabled, placeholder, children }: {
  value: string; onValueChange: (v: string) => void; disabled?: boolean; placeholder?: string; children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-7 border-0 bg-transparent shadow-none"><SelectValue placeholder={placeholder || 'Auswählen'} /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

/** Section 1: Person fields (dual) */
export function PersonSection(props: ApplicantSectionProps): React.ReactElement;
export function PersonSection(props: DualApplicantSectionProps): React.ReactElement;
export function PersonSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  const coField = (field: string, type?: string, placeholder?: string) => {
    if (!isDual || !coFormData) return undefined;
    return <TInput value={coFormData[field as keyof ApplicantFormData] as string} onChange={e => coChange(field, e.target.value)} disabled={coReadOnly} type={type} placeholder={placeholder} />;
  };

  const coSelect = (field: string, items: { value: string; label: string }[]) => {
    if (!isDual || !coFormData) return undefined;
    return (
      <TSelect value={(coFormData[field as keyof ApplicantFormData] as string) || ''} onValueChange={v => coChange(field, v)} disabled={coReadOnly}>
        {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
      </TSelect>
    );
  };

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Persönliche Daten" />
          <TR label="Anrede"
            children2={coSelect('salutation', [{ value: 'Herr', label: 'Herr' }, { value: 'Frau', label: 'Frau' }])}>
            <TSelect value={formData.salutation} onValueChange={v => onChange('salutation', v)} disabled={readOnly}>
              <SelectItem value="Herr">Herr</SelectItem>
              <SelectItem value="Frau">Frau</SelectItem>
            </TSelect>
          </TR>
          <TR label="Vorname" required children2={coField('first_name')}>
            <TInput value={formData.first_name} onChange={e => onChange('first_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Nachname" required children2={coField('last_name')}>
            <TInput value={formData.last_name} onChange={e => onChange('last_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsname" children2={coField('birth_name')}>
            <TInput value={formData.birth_name} onChange={e => onChange('birth_name', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsdatum" required children2={coField('birth_date', 'date')}>
            <TInput type="date" value={formData.birth_date} onChange={e => onChange('birth_date', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsort" children2={coField('birth_place')}>
            <TInput value={formData.birth_place} onChange={e => onChange('birth_place', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Geburtsland" children2={coField('birth_country')}>
            <TInput value={formData.birth_country} onChange={e => onChange('birth_country', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Staatsangehörigkeit" children2={coField('nationality')}>
            <TInput value={formData.nationality} onChange={e => onChange('nationality', e.target.value)} disabled={readOnly} />
          </TR>

          <SectionHeaderRow title="Adresse" />
          <TR label="Straße, Hausnummer" required children2={coField('address_street')}>
            <TInput value={formData.address_street} onChange={e => onChange('address_street', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="PLZ" required children2={coField('address_postal_code')}>
            <TInput value={formData.address_postal_code} onChange={e => onChange('address_postal_code', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Wohnort" required children2={coField('address_city')}>
            <TInput value={formData.address_city} onChange={e => onChange('address_city', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Wohnhaft seit" children2={coField('address_since', 'date')}>
            <TInput type="date" value={formData.address_since} onChange={e => onChange('address_since', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Vorherige Straße" children2={coField('previous_address_street')}>
            <TInput value={formData.previous_address_street} onChange={e => onChange('previous_address_street', e.target.value)} disabled={readOnly} placeholder="Falls < 3 Jahre" />
          </TR>
          <TR label="Vorherige PLZ" children2={coField('previous_address_postal_code')}>
            <TInput value={formData.previous_address_postal_code} onChange={e => onChange('previous_address_postal_code', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Vorheriger Wohnort" children2={coField('previous_address_city')}>
            <TInput value={formData.previous_address_city} onChange={e => onChange('previous_address_city', e.target.value)} disabled={readOnly} />
          </TR>

          <SectionHeaderRow title="Kontakt" />
          <TR label="Telefon (Festnetz)" children2={coField('phone')}>
            <TInput value={formData.phone} onChange={e => onChange('phone', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Telefon (Mobil)" required children2={coField('phone_mobile')}>
            <TInput value={formData.phone_mobile} onChange={e => onChange('phone_mobile', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="E-Mail" required children2={coField('email')}>
            <TInput type="email" value={formData.email} onChange={e => onChange('email', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Steuer-IdNr." children2={coField('tax_id')}>
            <TInput value={formData.tax_id} onChange={e => onChange('tax_id', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 3: Employment fields (dual) */
export function EmploymentSection(props: ApplicantSectionProps): React.ReactElement;
export function EmploymentSection(props: DualApplicantSectionProps): React.ReactElement;
export function EmploymentSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  const coField = (field: string, type?: string, placeholder?: string) => {
    if (!isDual || !coFormData) return undefined;
    return <TInput value={coFormData[field as keyof ApplicantFormData] as string | number | null} onChange={e => coChange(field, type === 'number' ? (parseFloat(e.target.value) || null) : e.target.value)} disabled={coReadOnly} type={type} placeholder={placeholder} />;
  };

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Beschäftigung" />
          <TR label="Beschäftigungsart"
            children2={isDual && coFormData ? (
              <div className="flex items-center gap-2">
                <Button variant={coFormData.employment_type !== 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-6 text-xs" onClick={() => coChange('employment_type', 'angestellt')} disabled={coReadOnly}>Angestellt</Button>
                <Button variant={coFormData.employment_type === 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-6 text-xs" onClick={() => coChange('employment_type', 'selbststaendig')} disabled={coReadOnly}>Selbstständig</Button>
              </div>
            ) : undefined}>
            <div className="flex items-center gap-2">
              <Button variant={formData.employment_type !== 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-6 text-xs" onClick={() => onChange('employment_type', 'angestellt')} disabled={readOnly}>Angestellt</Button>
              <Button variant={formData.employment_type === 'selbststaendig' ? 'default' : 'outline'} size="sm" className="h-6 text-xs" onClick={() => onChange('employment_type', 'selbststaendig')} disabled={readOnly}>Selbstständig</Button>
            </div>
          </TR>

          {/* Angestellt fields */}
          {formData.employment_type !== 'selbststaendig' && (
            <>
              <TR label="Arbeitgeber" children2={coField('employer_name')}>
                <TInput value={formData.employer_name} onChange={e => onChange('employer_name', e.target.value)} disabled={readOnly} />
              </TR>
              <TR label="Beschäftigt seit" children2={coField('employed_since', 'date')}>
                <TInput type="date" value={formData.employed_since} onChange={e => onChange('employed_since', e.target.value)} disabled={readOnly} />
              </TR>
              <TR label="Vertragsverhältnis"
                children2={isDual && coFormData ? (
                  <TSelect value={coFormData.contract_type} onValueChange={v => coChange('contract_type', v)} disabled={coReadOnly}>
                    <SelectItem value="unbefristet">Unbefristet</SelectItem>
                    <SelectItem value="befristet">Befristet</SelectItem>
                    <SelectItem value="probezeit">In Probezeit</SelectItem>
                  </TSelect>
                ) : undefined}>
                <TSelect value={formData.contract_type} onValueChange={v => onChange('contract_type', v)} disabled={readOnly}>
                  <SelectItem value="unbefristet">Unbefristet</SelectItem>
                  <SelectItem value="befristet">Befristet</SelectItem>
                  <SelectItem value="probezeit">In Probezeit</SelectItem>
                </TSelect>
              </TR>
              <TR label="Sitz in Deutschland"
                children2={isDual && coFormData ? (
                  <div className="flex items-center h-7 gap-2">
                    <Checkbox checked={coFormData.employer_in_germany} onCheckedChange={v => coChange('employer_in_germany', v)} disabled={coReadOnly} />
                    <Label className="text-xs">Ja</Label>
                  </div>
                ) : undefined}>
                <div className="flex items-center h-7 gap-2">
                  <Checkbox checked={formData.employer_in_germany} onCheckedChange={v => onChange('employer_in_germany', v)} disabled={readOnly} />
                  <Label className="text-xs">Ja</Label>
                </div>
              </TR>
              <TR label="Gehaltswährung"
                children2={isDual && coFormData ? (
                  <TSelect value={coFormData.salary_currency} onValueChange={v => coChange('salary_currency', v)} disabled={coReadOnly}>
                    <SelectItem value="EUR">EUR</SelectItem><SelectItem value="CHF">CHF</SelectItem><SelectItem value="USD">USD</SelectItem>
                  </TSelect>
                ) : undefined}>
                <TSelect value={formData.salary_currency} onValueChange={v => onChange('salary_currency', v)} disabled={readOnly}>
                  <SelectItem value="EUR">EUR</SelectItem><SelectItem value="CHF">CHF</SelectItem><SelectItem value="USD">USD</SelectItem>
                </TSelect>
              </TR>
              <TR label="Zahlungen/Jahr"
                children2={isDual && coFormData ? (
                  <TSelect value={String(coFormData.salary_payments_per_year)} onValueChange={v => coChange('salary_payments_per_year', parseInt(v))} disabled={coReadOnly}>
                    <SelectItem value="12">12x</SelectItem><SelectItem value="13">13x</SelectItem><SelectItem value="14">14x</SelectItem>
                  </TSelect>
                ) : undefined}>
                <TSelect value={String(formData.salary_payments_per_year)} onValueChange={v => onChange('salary_payments_per_year', parseInt(v))} disabled={readOnly}>
                  <SelectItem value="12">12x</SelectItem><SelectItem value="13">13x</SelectItem><SelectItem value="14">14x</SelectItem>
                </TSelect>
              </TR>
              <TR label="Anzahl Kfz" children2={coField('vehicles_count', 'number')}>
                <TInput type="number" min="0" value={formData.vehicles_count || ''} onChange={e => onChange('vehicles_count', parseInt(e.target.value) || 0)} disabled={readOnly} />
              </TR>
            </>
          )}

          {/* Selbstständig fields */}
          {formData.employment_type === 'selbststaendig' && (
            <>
              <TR label="Firma / Name" children2={coField('company_name')}>
                <TInput value={formData.company_name} onChange={e => onChange('company_name', e.target.value)} disabled={readOnly} />
              </TR>
              <TR label="Rechtsform"
                children2={isDual && coFormData ? (
                  <TSelect value={coFormData.company_legal_form} onValueChange={v => coChange('company_legal_form', v)} disabled={coReadOnly}>
                    <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                    <SelectItem value="freiberufler">Freiberufler</SelectItem>
                    <SelectItem value="gbr">GbR</SelectItem>
                    <SelectItem value="gmbh">GmbH</SelectItem>
                    <SelectItem value="ug">UG</SelectItem>
                  </TSelect>
                ) : undefined}>
                <TSelect value={formData.company_legal_form} onValueChange={v => onChange('company_legal_form', v)} disabled={readOnly}>
                  <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                  <SelectItem value="freiberufler">Freiberufler</SelectItem>
                  <SelectItem value="gbr">GbR</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ug">UG</SelectItem>
                </TSelect>
              </TR>
              <TR label="Selbstständig seit" children2={coField('company_founded', 'date')}>
                <TInput type="date" value={formData.company_founded} onChange={e => onChange('company_founded', e.target.value)} disabled={readOnly} />
              </TR>
              <TR label="Branche" children2={coField('company_industry')}>
                <TInput value={formData.company_industry} onChange={e => onChange('company_industry', e.target.value)} disabled={readOnly} />
              </TR>
            </>
          )}

          {/* Nebentätigkeit */}
          <TR label="Nebentätigkeit"
            children2={isDual && coFormData ? (
              <div className="flex items-center h-7 gap-2">
                <Checkbox checked={coFormData.has_side_job} onCheckedChange={v => coChange('has_side_job', v)} disabled={coReadOnly} />
                <Label className="text-xs">Ja</Label>
              </div>
            ) : undefined}>
            <div className="flex items-center h-7 gap-2">
              <Checkbox checked={formData.has_side_job} onCheckedChange={v => onChange('has_side_job', v)} disabled={readOnly} />
              <Label className="text-xs">Ja</Label>
            </div>
          </TR>
          {formData.has_side_job && (
            <>
              <TR label="Art der Nebentätigkeit"
                children2={isDual && coFormData?.has_side_job ? (
                  <TSelect value={coFormData.side_job_type} onValueChange={v => coChange('side_job_type', v)} disabled={coReadOnly}>
                    <SelectItem value="nebentaetigkeit">Nebentätigkeit</SelectItem>
                    <SelectItem value="freiberuflich">Freiberuflich</SelectItem>
                    <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                  </TSelect>
                ) : undefined}>
                <TSelect value={formData.side_job_type} onValueChange={v => onChange('side_job_type', v)} disabled={readOnly}>
                  <SelectItem value="nebentaetigkeit">Nebentätigkeit</SelectItem>
                  <SelectItem value="freiberuflich">Freiberuflich</SelectItem>
                  <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                </TSelect>
              </TR>
              <TR label="Seit" children2={isDual && coFormData?.has_side_job ? coField('side_job_since', 'date') : undefined}>
                <TInput type="date" value={formData.side_job_since} onChange={e => onChange('side_job_since', e.target.value)} disabled={readOnly} />
              </TR>
            </>
          )}

          {/* Rente */}
          <SectionHeaderRow title="Rente" />
          <TR label="Rentenbeginn (geplant)" children2={coField('retirement_date', 'date')}>
            <TInput type="date" value={formData.retirement_date} onChange={e => onChange('retirement_date', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="Gesetzliche Rente (mtl.)" children2={coField('pension_state_monthly', 'number', '€')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.pension_state_monthly || ''} onChange={e => onChange('pension_state_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Private Rente (mtl.)" children2={coField('pension_private_monthly', 'number', '€')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.pension_private_monthly || ''} onChange={e => onChange('pension_private_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 4: Bank fields (dual) */
export function BankSection(props: ApplicantSectionProps): React.ReactElement;
export function BankSection(props: DualApplicantSectionProps): React.ReactElement;
export function BankSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Bankverbindung" />
          <TR label="IBAN" required
            children2={isDual && coFormData ? <TInput placeholder="DE..." value={coFormData.iban} onChange={e => coChange('iban', e.target.value)} disabled={coReadOnly} /> : undefined}>
            <TInput placeholder="DE89 3704 0044 0532 0130 00" value={formData.iban} onChange={e => onChange('iban', e.target.value)} disabled={readOnly} />
          </TR>
          <TR label="BIC"
            children2={isDual && coFormData ? <TInput placeholder="COBADEFFXXX" value={coFormData.bic} onChange={e => coChange('bic', e.target.value)} disabled={coReadOnly} /> : undefined}>
            <TInput placeholder="COBADEFFXXX" value={formData.bic} onChange={e => onChange('bic', e.target.value)} disabled={readOnly} />
          </TR>
        </TableBody>
      </Table>
    </div>
  );
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** Helper to build numeric dual fields */
function numericCoField(coFormData: ApplicantFormData | undefined, coChange: (f: string, v: unknown) => void, coReadOnly: boolean, isDual: boolean, field: string) {
  if (!isDual || !coFormData) return undefined;
  return <TInput type="number" step="0.01" placeholder="€" value={(coFormData[field as keyof ApplicantFormData] as number | null) || ''} onChange={e => coChange(field, parseFloat(e.target.value) || null)} disabled={coReadOnly} />;
}

/** Section 5: Income fields (dual) */
export function IncomeSection(props: ApplicantSectionProps): React.ReactElement;
export function IncomeSection(props: DualApplicantSectionProps): React.ReactElement;
export function IncomeSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  const total = (formData.net_income_monthly || 0) + (formData.self_employed_income_monthly || 0) +
    (formData.side_job_income_monthly || 0) + (formData.rental_income_monthly || 0) +
    (formData.child_benefit_monthly || 0) + (formData.alimony_income_monthly || 0) +
    (formData.other_regular_income_monthly || 0);

  const coTotal = coFormData ? (coFormData.net_income_monthly || 0) + (coFormData.self_employed_income_monthly || 0) +
    (coFormData.side_job_income_monthly || 0) + (coFormData.rental_income_monthly || 0) +
    (coFormData.child_benefit_monthly || 0) + (coFormData.alimony_income_monthly || 0) +
    (coFormData.other_regular_income_monthly || 0) : 0;

  const cf = (field: string) => numericCoField(coFormData, coChange, coReadOnly, isDual, field);

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Monatliche Einnahmen" />
          <TR label="Nettoeinkommen" required children2={cf('net_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.net_income_monthly || ''} onChange={e => onChange('net_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Aus selbstst. Tätigkeit" children2={cf('self_employed_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.self_employed_income_monthly || ''} onChange={e => onChange('self_employed_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Nebentätigkeit" children2={cf('side_job_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.side_job_income_monthly || ''} onChange={e => onChange('side_job_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Mieteinnahmen" children2={cf('rental_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.rental_income_monthly || ''} onChange={e => onChange('rental_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Kindergeld" children2={cf('child_benefit_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.child_benefit_monthly || ''} onChange={e => onChange('child_benefit_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Unterhaltseinnahmen" children2={cf('alimony_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.alimony_income_monthly || ''} onChange={e => onChange('alimony_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstiges" children2={cf('other_regular_income_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_regular_income_monthly || ''} onChange={e => onChange('other_regular_income_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs">Summe Einnahmen</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold border-r">{eurFormat.format(total)}</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold">{isDual ? eurFormat.format(coTotal) : '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 6: Expenses fields (dual) */
export function ExpensesSection(props: ApplicantSectionProps): React.ReactElement;
export function ExpensesSection(props: DualApplicantSectionProps): React.ReactElement;
export function ExpensesSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  const total = (formData.current_rent_monthly || 0) + (formData.health_insurance_monthly || 0) +
    (formData.child_support_amount_monthly || 0) + (formData.car_leasing_monthly || 0) +
    (formData.other_fixed_costs_monthly || 0);

  const coTotal = coFormData ? (coFormData.current_rent_monthly || 0) + (coFormData.health_insurance_monthly || 0) +
    (coFormData.child_support_amount_monthly || 0) + (coFormData.car_leasing_monthly || 0) +
    (coFormData.other_fixed_costs_monthly || 0) : 0;

  const cf = (field: string) => numericCoField(coFormData, coChange, coReadOnly, isDual, field);

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Monatliche Ausgaben" />
          <TR label="Aktuelle Warmmiete" children2={cf('current_rent_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.current_rent_monthly || ''} onChange={e => onChange('current_rent_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Private Krankenversicherung" children2={cf('health_insurance_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.health_insurance_monthly || ''} onChange={e => onChange('health_insurance_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Unterhaltsverpflichtungen" children2={cf('child_support_amount_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.child_support_amount_monthly || ''} onChange={e => onChange('child_support_amount_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Leasing (Kfz)" children2={cf('car_leasing_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.car_leasing_monthly || ''} onChange={e => onChange('car_leasing_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstige Fixkosten" children2={cf('other_fixed_costs_monthly')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_fixed_costs_monthly || ''} onChange={e => onChange('other_fixed_costs_monthly', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs">Summe Ausgaben</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-destructive border-r">{eurFormat.format(total)}</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-destructive">{isDual ? eurFormat.format(coTotal) : '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** Section 7: Assets fields (dual) */
export function AssetsSection(props: ApplicantSectionProps): React.ReactElement;
export function AssetsSection(props: DualApplicantSectionProps): React.ReactElement;
export function AssetsSection(props: ApplicantSectionProps | DualApplicantSectionProps) {
  const isDual = 'coFormData' in props;
  const { formData, onChange, readOnly } = props;
  const coFormData = isDual ? props.coFormData : undefined;
  const rawCoChange = isDual ? props.onCoChange : undefined;
  const coReadOnly = isDual ? (props.coReadOnly ?? false) : true;
  const coChange = useCoChangeWrapper(rawCoChange || (() => {}), isDual ? props.onCoFirstInput : undefined);

  const total = (formData.bank_savings || 0) + (formData.securities_value || 0) +
    (formData.building_society_value || 0) + (formData.life_insurance_value || 0) +
    (formData.other_assets_value || 0);

  const coTotal = coFormData ? (coFormData.bank_savings || 0) + (coFormData.securities_value || 0) +
    (coFormData.building_society_value || 0) + (coFormData.life_insurance_value || 0) +
    (coFormData.other_assets_value || 0) : 0;

  const cf = (field: string) => numericCoField(coFormData, coChange, coReadOnly, isDual, field);

  return (
    <div className="space-y-3">
      <Table>
        {isDual && <DualHeader />}
        <TableBody>
          <SectionHeaderRow title="Vermögenswerte" />
          <TR label="Bank-/Sparguthaben" children2={cf('bank_savings')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.bank_savings || ''} onChange={e => onChange('bank_savings', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Wertpapiere/Aktien" children2={cf('securities_value')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.securities_value || ''} onChange={e => onChange('securities_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Bausparguthaben" children2={cf('building_society_value')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.building_society_value || ''} onChange={e => onChange('building_society_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Lebens-/Rentenversicherung" children2={cf('life_insurance_value')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.life_insurance_value || ''} onChange={e => onChange('life_insurance_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TR label="Sonstiges Vermögen" children2={cf('other_assets_value')}>
            <TInput type="number" step="0.01" placeholder="€" value={formData.other_assets_value || ''} onChange={e => onChange('other_assets_value', parseFloat(e.target.value) || null)} disabled={readOnly} />
          </TR>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs">Summe Vermögen</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-green-600 border-r">{eurFormat.format(total)}</TableCell>
            <TableCell className="py-1.5 px-3 text-sm font-bold text-green-600">{isDual ? eurFormat.format(coTotal) : '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

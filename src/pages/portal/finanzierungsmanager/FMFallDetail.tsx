/**
 * FM Fall Detail — Case Cockpit (tabular, bank-style Selbstauskunft)
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { 
  ArrowLeft, User, Building2, Clock, CheckCircle2, 
  XCircle, AlertCircle, MessageSquare, Loader2, Send, Save,
  Calculator, Mail, Globe, History, CreditCard
} from 'lucide-react';
import { useFinanceRequest, useUpdateRequestStatus, useUpdateApplicantProfile } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { CaseStepper } from '@/components/finanzierungsmanager/CaseStepper';
import { PageShell } from '@/components/shared/PageShell';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { toast } from 'sonner';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurFormatFull = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

/** Bank-style table row: Label | Value (or editable input) */
function TR({ label, value, editable, onChange }: {
  label: string;
  value: string | number | null | undefined;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">
        {editable && onChange ? (
          <Input 
            value={value ?? ''} 
            onChange={e => onChange(e.target.value)} 
            className="h-6 text-xs border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 rounded-none" 
          />
        ) : (
          <span>{value || '—'}</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Section header inside table */
function SectionRow({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
        {title}
      </TableCell>
    </TableRow>
  );
}

export default function FMFallDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useFinanceRequest(requestId);
  const { data: bankContacts } = useFinanceBankContacts();
  const updateStatus = useUpdateRequestStatus();

  const [note, setNote] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [activeTab, setActiveTab] = useState('antragsteller');

  // Editable loan fields
  const [loanEdits, setLoanEdits] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!request) {
    return (
      <PageShell>
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Fall nicht gefunden</p>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Zurück</Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const applicant = request.applicant_profiles?.[0];
  const property = request.properties;
  const currentStatus = request.status;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ requestId: request.id, status: newStatus, notes: note || undefined });
      toast.success(`Status → ${getStatusLabel(newStatus)}`);
      setNote('');
    } catch { toast.error('Fehler beim Aktualisieren'); }
  };

  // Simple loan calculation
  const purchasePrice = Number(loanEdits.purchase_price || applicant?.purchase_price || 0);
  const equity = Number(loanEdits.equity_amount || applicant?.equity_amount || 0);
  const loanAmount = Number(loanEdits.loan_amount_requested || applicant?.loan_amount_requested || 0);
  const interestRate = Number(loanEdits.interest_rate || 3.5);
  const repaymentRate = Number(loanEdits.repayment_rate || applicant?.repayment_rate_percent || 2);
  const fixedPeriod = Number(loanEdits.fixed_rate_period || applicant?.fixed_rate_period_years || 10);

  const monthlyRate = loanAmount > 0 ? (loanAmount * (interestRate + repaymentRate) / 100 / 12) : 0;
  const yearlyRepayment = loanAmount > 0 ? (loanAmount * repaymentRate / 100) : 0;
  const remainingDebt = loanAmount > 0 ? Math.max(0, loanAmount - (yearlyRepayment * fixedPeriod)) : 0;

  const canSubmit = ['ready_for_submission', 'ready_to_submit', 'editing', 'in_processing', 'active'].includes(currentStatus);

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold tracking-tight uppercase truncate">
            {request.public_id || request.id.slice(0, 8)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {applicant?.first_name} {applicant?.last_name} · {applicant?.email || 'Keine E-Mail'}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(currentStatus)} className="text-xs shrink-0">
          {getStatusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Stepper */}
      <CaseStepper currentStatus={currentStatus} />

      {/* Status Actions — compact */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Aktion:</span>
        {(currentStatus === 'delegated' || currentStatus === 'assigned') && (
          <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('accepted')}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Annehmen
          </Button>
        )}
        {currentStatus === 'accepted' && (
          <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('editing')}>
            <Clock className="h-3 w-3 mr-1" /> Bearbeitung starten
          </Button>
        )}
        {['editing', 'in_processing', 'active'].includes(currentStatus) && (
          <>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange('needs_customer_action')}>
              <MessageSquare className="h-3 w-3 mr-1" /> Rückfrage
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('ready_for_submission')}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
            </Button>
          </>
        )}
        {currentStatus === 'needs_customer_action' && (
          <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('editing')}>
            <ArrowLeft className="h-3 w-3 mr-1" /> Zurück in Bearbeitung
          </Button>
        )}
        <div className="flex-1" />
        {!['completed', 'rejected'].includes(currentStatus) && (
          <>
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleStatusChange('completed')}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Abschließen
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleStatusChange('rejected')}>
              <XCircle className="h-3 w-3 mr-1" /> Ablehnen
            </Button>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="antragsteller" className="text-xs"><User className="h-3 w-3 mr-1" /> Selbstauskunft</TabsTrigger>
          <TabsTrigger value="objekt" className="text-xs"><Building2 className="h-3 w-3 mr-1" /> Objekt</TabsTrigger>
          <TabsTrigger value="finanzierung" className="text-xs"><Calculator className="h-3 w-3 mr-1" /> Finanzierung</TabsTrigger>
          <TabsTrigger value="einreichung" className="text-xs"><Send className="h-3 w-3 mr-1" /> Einreichung</TabsTrigger>
          <TabsTrigger value="notizen" className="text-xs"><History className="h-3 w-3 mr-1" /> Notizen</TabsTrigger>
        </TabsList>

        {/* ===== Tab: Selbstauskunft (Bank-style tabular) ===== */}
        <TabsContent value="antragsteller">
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                <h3 className="text-sm font-semibold">Finanzierungsantrag und Selbstauskunft</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Vollständigkeit: {applicant?.completion_score || 0}%</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${applicant?.completion_score || 0}%` }} />
                  </div>
                </div>
              </div>
              <Table>
                <TableBody>
                  {/* Section: Persönliche Daten */}
                  <SectionRow title="1. Angaben zur Person" />
                  <TR label="Anrede" value={applicant?.salutation} />
                  <TR label="Name" value={applicant?.last_name} />
                  <TR label="Vorname" value={applicant?.first_name} />
                  <TR label="Geburtsname" value={applicant?.birth_name} />
                  <TR label="Geburtsdatum" value={applicant?.birth_date} />
                  <TR label="Geburtsort / -land" value={[applicant?.birth_place, applicant?.birth_country].filter(Boolean).join(', ')} />
                  <TR label="Staatsangehörigkeit" value={applicant?.nationality} />
                  <TR label="Familienstand" value={applicant?.marital_status} />
                  <TR label="Gütertrennung" value={applicant?.property_separation ? 'Ja' : applicant?.property_separation === false ? 'Nein' : null} />
                  <TR label="Steuer-IdNr." value={applicant?.tax_id} />
                  <TR label="Ausweisart" value={applicant?.id_document_type} />
                  <TR label="Ausweisnummer" value={applicant?.id_document_number} />
                  <TR label="Gültig bis" value={applicant?.id_document_valid_until} />

                  {/* Section: Anschrift */}
                  <SectionRow title="2. Anschrift & Kontakt" />
                  <TR label="Straße" value={applicant?.address_street} />
                  <TR label="PLZ / Ort" value={[applicant?.address_postal_code, applicant?.address_city].filter(Boolean).join(' ')} />
                  <TR label="Wohnhaft seit" value={applicant?.address_since} />
                  <TR label="Vorherige Anschrift" value={[applicant?.previous_address_street, applicant?.previous_address_postal_code, applicant?.previous_address_city].filter(Boolean).join(', ')} />
                  <TR label="Telefon (Festnetz)" value={applicant?.phone} />
                  <TR label="Telefon (Mobil)" value={applicant?.phone_mobile} />
                  <TR label="E-Mail" value={applicant?.email} />

                  {/* Section: Haushalt */}
                  <SectionRow title="3. Haushalt" />
                  <TR label="Erwachsene im Haushalt" value={applicant?.adults_count} />
                  <TR label="Kinder (Anzahl)" value={applicant?.children_count} />
                  <TR label="Geburtsdaten Kinder" value={applicant?.children_birth_dates} />
                  <TR label="Unterhaltspflicht" value={applicant?.child_support_obligation ? 'Ja' : 'Nein'} />
                  <TR label="Unterhalt mtl." value={applicant?.child_support_amount_monthly ? eurFormatFull.format(applicant.child_support_amount_monthly) : null} />
                  <TR label="Kindergeld mtl." value={applicant?.child_benefit_monthly ? eurFormatFull.format(applicant.child_benefit_monthly) : null} />

                  {/* Section: Beschäftigung */}
                  <SectionRow title="4. Beschäftigung" />
                  <TR label="Beschäftigungsart" value={applicant?.employment_type} />
                  <TR label="Arbeitgeber" value={applicant?.employer_name} />
                  <TR label="Sitz Arbeitgeber" value={applicant?.employer_location} />
                  <TR label="Branche" value={applicant?.employer_industry} />
                  <TR label="Position / Beruf" value={applicant?.position} />
                  <TR label="Beschäftigt seit" value={applicant?.employed_since} />
                  <TR label="Vertrag" value={applicant?.contract_type} />
                  <TR label="Probezeit bis" value={applicant?.probation_until} />
                  <TR label="AG in Deutschland" value={applicant?.employer_in_germany ? 'Ja' : applicant?.employer_in_germany === false ? 'Nein' : null} />
                  <TR label="Gehaltswährung" value={applicant?.salary_currency} />
                  <TR label="Gehaltszahlungen/Jahr" value={applicant?.salary_payments_per_year} />

                  {/* Nebentätigkeit */}
                  {applicant?.has_side_job && (
                    <>
                      <SectionRow title="4a. Nebentätigkeit" />
                      <TR label="Art" value={applicant?.side_job_type} />
                      <TR label="Seit" value={applicant?.side_job_since} />
                      <TR label="Einkommen mtl." value={applicant?.side_job_income_monthly ? eurFormatFull.format(applicant.side_job_income_monthly) : null} />
                    </>
                  )}

                  {/* Selbstständig */}
                  {applicant?.employment_type === 'selbststaendig' && (
                    <>
                      <SectionRow title="4b. Selbstständigkeit" />
                      <TR label="Firma" value={applicant?.company_name} />
                      <TR label="Rechtsform" value={applicant?.company_legal_form} />
                      <TR label="Adresse" value={applicant?.company_address} />
                      <TR label="Gegründet" value={applicant?.company_founded} />
                      <TR label="HR-Nummer" value={applicant?.company_register_number} />
                      <TR label="USt-IdNr." value={applicant?.company_vat_id} />
                      <TR label="Branche" value={applicant?.company_industry} />
                      <TR label="Mitarbeiter" value={applicant?.company_employees} />
                      <TR label="Anteil %" value={applicant?.company_ownership_percent} />
                      <TR label="GF" value={applicant?.company_managing_director ? 'Ja' : 'Nein'} />
                    </>
                  )}

                  {/* Section: Einnahmen */}
                  <SectionRow title="5. Monatliche Einnahmen" />
                  <TR label="Netto-Einkommen" value={applicant?.net_income_monthly ? eurFormatFull.format(applicant.net_income_monthly) : null} />
                  <TR label="Bonus p.a." value={applicant?.bonus_yearly ? eurFormat.format(applicant.bonus_yearly) : null} />
                  <TR label="Mieteinnahmen" value={applicant?.rental_income_monthly ? eurFormatFull.format(applicant.rental_income_monthly) : null} />
                  <TR label="Unterhaltseinkommen" value={applicant?.alimony_income_monthly ? eurFormatFull.format(applicant.alimony_income_monthly) : null} />
                  <TR label="Sonst. Einkommen" value={applicant?.other_regular_income_monthly ? eurFormatFull.format(applicant.other_regular_income_monthly) : null} />
                  <TR label="Beschreibung" value={applicant?.other_income_description} />

                  {/* Section: Ausgaben */}
                  <SectionRow title="6. Monatliche Ausgaben" />
                  <TR label="Aktuelle Miete" value={applicant?.current_rent_monthly ? eurFormatFull.format(applicant.current_rent_monthly) : null} />
                  <TR label="Lebenshaltung" value={applicant?.living_expenses_monthly ? eurFormatFull.format(applicant.living_expenses_monthly) : null} />
                  <TR label="Kfz-Leasing" value={applicant?.car_leasing_monthly ? eurFormatFull.format(applicant.car_leasing_monthly) : null} />
                  <TR label="Krankenversicherung" value={applicant?.health_insurance_monthly ? eurFormatFull.format(applicant.health_insurance_monthly) : null} />
                  <TR label="Sonst. Fixkosten" value={applicant?.other_fixed_costs_monthly ? eurFormatFull.format(applicant.other_fixed_costs_monthly) : null} />

                  {/* Section: Vermögen */}
                  <SectionRow title="7. Vermögenswerte" />
                  <TR label="Bankguthaben" value={applicant?.bank_savings ? eurFormat.format(applicant.bank_savings) : null} />
                  <TR label="Wertpapiere" value={applicant?.securities_value ? eurFormat.format(applicant.securities_value) : null} />
                  <TR label="Bausparvertrag" value={applicant?.building_society_value ? eurFormat.format(applicant.building_society_value) : null} />
                  <TR label="Lebensversicherung" value={applicant?.life_insurance_value ? eurFormat.format(applicant.life_insurance_value) : null} />
                  <TR label="Sonstige Vermögen" value={applicant?.other_assets_value ? eurFormat.format(applicant.other_assets_value) : null} />
                  <TR label="Beschreibung" value={applicant?.other_assets_description} />

                  {/* Section: Bankverbindung */}
                  <SectionRow title="8. Bankverbindung" />
                  <TR label="IBAN" value={applicant?.iban} />
                  <TR label="BIC" value={applicant?.bic} />

                  {/* Section: Erklärungen */}
                  <SectionRow title="9. Erklärungen" />
                  <TR label="SCHUFA-Einwilligung" value={applicant?.schufa_consent ? '✓ Ja' : '✗ Nein'} />
                  <TR label="Keine Insolvenz" value={applicant?.no_insolvency ? '✓ Ja' : '✗ Nein'} />
                  <TR label="Keine Steuerrückstände" value={applicant?.no_tax_arrears ? '✓ Ja' : '✗ Nein'} />
                  <TR label="Daten korrekt bestätigt" value={applicant?.data_correct_confirmed ? '✓ Ja' : '✗ Nein'} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: Objekt ===== */}
        <TabsContent value="objekt">
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <SectionRow title="Finanzierungsobjekt" />
                  {property ? (
                    <>
                      <TR label="Code" value={property.code} />
                      <TR label="Adresse" value={property.address} />
                      <TR label="PLZ / Ort" value={`${property.postal_code || ''} ${property.city || ''}`} />
                      <TR label="Kaufpreis" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                      <TR label="Quelle" value={request.object_source === 'mod04_property' ? 'Aus Bestand (MOD-04)' : 'Eigenes Objekt'} />
                    </>
                  ) : request.custom_object_data ? (
                    <>
                      <TR label="Typ" value="Eigenes Objekt" />
                      <TR label="Adresse" value={applicant?.object_address} />
                      <TR label="Objekttyp" value={applicant?.object_type} />
                      <TR label="Verwendung" value={applicant?.purpose} />
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-sm">
                        Kein Objekt verknüpft
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: Finanzierung ===== */}
        <TabsContent value="finanzierung">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Inputs */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b bg-muted/20">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Darlehensparameter</h3>
                </div>
                <Table>
                  <TableBody>
                    <TR label="Kaufpreis" value={loanEdits.purchase_price ?? applicant?.purchase_price ?? ''} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, purchase_price: v }))} />
                    <TR label="Eigenkapital" value={loanEdits.equity_amount ?? applicant?.equity_amount ?? ''} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, equity_amount: v }))} />
                    <TR label="Darlehenswunsch" value={loanEdits.loan_amount_requested ?? applicant?.loan_amount_requested ?? ''} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, loan_amount_requested: v }))} />
                    <TR label="Sollzins (%)" value={loanEdits.interest_rate ?? '3.5'} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, interest_rate: v }))} />
                    <TR label="Tilgung (%)" value={loanEdits.repayment_rate ?? applicant?.repayment_rate_percent ?? '2'} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, repayment_rate: v }))} />
                    <TR label="Zinsbindung (Jahre)" value={loanEdits.fixed_rate_period ?? applicant?.fixed_rate_period_years ?? '10'} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, fixed_rate_period: v }))} />
                    <TR label="Nebenkosten" value={loanEdits.ancillary_costs ?? applicant?.ancillary_costs ?? ''} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, ancillary_costs: v }))} />
                    <TR label="Modernisierung" value={loanEdits.modernization_costs ?? applicant?.modernization_costs ?? ''} editable 
                      onChange={v => setLoanEdits(p => ({ ...p, modernization_costs: v }))} />
                  </TableBody>
                </Table>
                <div className="px-4 py-2 border-t">
                  <Button size="sm" className="h-7 text-xs">
                    <Save className="h-3 w-3 mr-1" /> Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Calculation Output */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b bg-muted/20">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Calculator className="h-3.5 w-3.5" /> Kalkulation</h3>
                </div>
                <div className="p-4 border-b bg-primary/5">
                  <div className="text-xs text-muted-foreground">Monatliche Rate</div>
                  <div className="text-xl font-bold text-primary">{eurFormatFull.format(monthlyRate)}</div>
                </div>
                <Table>
                  <TableBody>
                    <TR label="Darlehensbetrag" value={eurFormat.format(loanAmount)} />
                    <TR label="Sollzins" value={`${interestRate}%`} />
                    <TR label="Tilgung" value={`${repaymentRate}%`} />
                    <TR label="Zinsbindung" value={`${fixedPeriod} Jahre`} />
                    <TR label="Annuität p.a." value={eurFormat.format(monthlyRate * 12)} />
                    <TR label="Restschuld" value={eurFormat.format(remainingDebt)} />
                    <TR label="EK-Quote" value={purchasePrice > 0 ? `${((equity / purchasePrice) * 100).toFixed(1)}%` : '—'} />
                    {applicant?.max_monthly_rate && (
                      <TR label="Max. tragbare Rate" value={eurFormatFull.format(applicant.max_monthly_rate)} />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Tab: Einreichung ===== */}
        <TabsContent value="einreichung">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mail Submission */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Einreichung per E-Mail</h3>
                {!canSubmit ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-40" />
                    Erst ab Status "Ready" möglich. Aktuell: {getStatusLabel(currentStatus)}
                  </p>
                ) : (
                  <>
                    <select
                      className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs"
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                    >
                      <option value="">— Bank auswählen —</option>
                      {bankContacts?.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bank_name} — {bank.contact_name || bank.contact_email}
                        </option>
                      ))}
                    </select>
                    <div className="p-2 rounded bg-muted/50 border text-xs space-y-0.5">
                      <div>Betreff: Finanzierungsanfrage {request.public_id}</div>
                      <div>Antragsteller: {applicant?.first_name} {applicant?.last_name}</div>
                      <div>Darlehenswunsch: {applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : '—'}</div>
                    </div>
                    <Button 
                      className="w-full h-8 text-xs" 
                      disabled={!selectedBankId}
                      onClick={() => {
                        handleStatusChange('submitted_to_bank');
                        toast.success('Einreichung wird vorbereitet...');
                      }}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> An Bank senden
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Platform Submission */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Plattform-Übergabe</h3>
                <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs" disabled={!canSubmit}>
                  <option value="">— Plattform wählen —</option>
                  <option value="europace">Europace</option>
                  <option value="hypoport">Hypoport</option>
                </select>
                <Button className="w-full h-8 text-xs" disabled variant="outline">
                  <Globe className="h-3.5 w-3.5 mr-1" /> Integration ausstehend
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Wird in einer späteren Phase aktiviert.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Tab: Notizen ===== */}
        <TabsContent value="notizen">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><History className="h-3.5 w-3.5" /> Notizen & Timeline</h3>
              <Textarea
                placeholder="Interne Notiz zum Fall..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!note.trim()}>
                <Save className="h-3 w-3 mr-1" /> Notiz speichern
              </Button>
              <Separator />
              <div className="text-center py-4 text-muted-foreground">
                <History className="h-6 w-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">Noch keine Einträge</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

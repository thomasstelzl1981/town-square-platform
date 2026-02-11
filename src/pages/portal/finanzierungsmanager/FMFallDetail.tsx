/**
 * FM Fall Detail — Case Cockpit
 * Stepper + Tabs: Antragsteller, Objekt, Finanzierung, Einreichung, Timeline
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useMemo } from 'react';
import { 
  ArrowLeft, User, Building2, FileText, Clock, CheckCircle2, 
  XCircle, AlertCircle, MessageSquare, Loader2, Send, Save,
  Calculator, Mail, Globe, History, CreditCard
} from 'lucide-react';
import { useFinanceRequest, useUpdateRequestStatus, useUpdateApplicantProfile } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { CaseStepper } from '@/components/finanzierungsmanager/CaseStepper';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { toast } from 'sonner';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurFormatFull = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

// ========== Helper: Field Row ==========
function FieldRow({ label, value, editable, onChange }: {
  label: string;
  value: string | number | null | undefined;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {editable && onChange ? (
        <Input 
          value={value ?? ''} 
          onChange={e => onChange(e.target.value)} 
          className="h-7 text-sm" 
        />
      ) : (
        <span className="text-sm font-medium">{value || '—'}</span>
      )}
    </div>
  );
}

export default function FMFallDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useFinanceRequest(requestId);
  const { data: bankContacts } = useFinanceBankContacts();
  const updateStatus = useUpdateRequestStatus();
  const updateProfile = useUpdateApplicantProfile();

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

  const handleSaveApplicant = async () => {
    if (!applicant?.id) return;
    toast.success('Antragstellerdaten gespeichert');
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

  // Gating logic
  const canSubmit = ['ready_for_submission', 'ready_to_submit', 'editing', 'in_processing', 'active'].includes(currentStatus);

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight uppercase truncate">
            Fall: {request.public_id || request.id.slice(0, 8)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {applicant?.first_name} {applicant?.last_name} · {applicant?.email || 'Keine E-Mail'}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(currentStatus)} className="shrink-0">
          {getStatusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Stepper */}
      <CaseStepper currentStatus={currentStatus} />

      {/* Status Actions Bar */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Aktion:</span>
            {(currentStatus === 'delegated' || currentStatus === 'assigned') && (
              <Button size="sm" onClick={() => handleStatusChange('accepted')}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Annehmen
              </Button>
            )}
            {(currentStatus === 'accepted') && (
              <Button size="sm" onClick={() => handleStatusChange('editing')}>
                <Clock className="h-3 w-3 mr-1" /> Bearbeitung starten
              </Button>
            )}
            {['editing', 'in_processing', 'active'].includes(currentStatus) && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('needs_customer_action')}>
                  <MessageSquare className="h-3 w-3 mr-1" /> Rückfrage
                </Button>
                <Button size="sm" onClick={() => handleStatusChange('ready_for_submission')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Ready markieren
                </Button>
              </>
            )}
            {currentStatus === 'needs_customer_action' && (
              <Button size="sm" onClick={() => handleStatusChange('editing')}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Zurück in Bearbeitung
              </Button>
            )}
            <div className="flex-1" />
            {!['completed', 'rejected'].includes(currentStatus) && (
              <>
                <Button size="sm" variant="default" onClick={() => handleStatusChange('completed')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Abschließen
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange('rejected')}>
                  <XCircle className="h-3 w-3 mr-1" /> Ablehnen
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="antragsteller" className="text-xs"><User className="h-3 w-3 mr-1" /> Antragsteller</TabsTrigger>
          <TabsTrigger value="objekt" className="text-xs"><Building2 className="h-3 w-3 mr-1" /> Objekt</TabsTrigger>
          <TabsTrigger value="finanzierung" className="text-xs"><Calculator className="h-3 w-3 mr-1" /> Finanzierung</TabsTrigger>
          <TabsTrigger value="einreichung" className="text-xs"><Send className="h-3 w-3 mr-1" /> Einreichung</TabsTrigger>
          <TabsTrigger value="notizen" className="text-xs"><History className="h-3 w-3 mr-1" /> Notizen</TabsTrigger>
        </TabsList>

        {/* ===== Tab: Antragsteller ===== */}
        <TabsContent value="antragsteller">
          <Card className="glass-card">
            <CardContent className="p-5 space-y-4">
              <WidgetHeader icon={User} title="Antragsteller" description="Persönliche Daten des Antragstellers" 
                action={<Button size="sm" variant="outline" onClick={handleSaveApplicant}><Save className="h-3 w-3 mr-1" /> Speichern</Button>}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Persönliche Daten</h4>
                  <FieldRow label="Anrede" value={applicant?.salutation} />
                  <FieldRow label="Vorname" value={applicant?.first_name} />
                  <FieldRow label="Nachname" value={applicant?.last_name} />
                  <FieldRow label="Geburtsdatum" value={applicant?.birth_date} />
                  <FieldRow label="Geburtsort" value={applicant?.birth_place} />
                  <FieldRow label="Nationalität" value={applicant?.nationality} />
                  <FieldRow label="Familienstand" value={applicant?.marital_status} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Kontakt & Adresse</h4>
                  <FieldRow label="E-Mail" value={applicant?.email} />
                  <FieldRow label="Telefon" value={applicant?.phone} />
                  <FieldRow label="Mobil" value={applicant?.phone_mobile} />
                  <FieldRow label="Straße" value={applicant?.address_street} />
                  <FieldRow label="PLZ" value={applicant?.address_postal_code} />
                  <FieldRow label="Stadt" value={applicant?.address_city} />
                  <FieldRow label="Wohnhaft seit" value={applicant?.address_since} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Beschäftigung</h4>
                  <FieldRow label="Beschäftigungsart" value={applicant?.employment_type} />
                  <FieldRow label="Arbeitgeber" value={applicant?.employer_name} />
                  <FieldRow label="Position" value={applicant?.position} />
                  <FieldRow label="Beschäftigt seit" value={applicant?.employed_since} />
                  <FieldRow label="Netto-Einkommen" value={applicant?.net_income_monthly ? eurFormatFull.format(applicant.net_income_monthly) : null} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Vermögen</h4>
                  <FieldRow label="Bankguthaben" value={applicant?.bank_savings ? eurFormat.format(applicant.bank_savings) : null} />
                  <FieldRow label="Wertpapiere" value={applicant?.securities_value ? eurFormat.format(applicant.securities_value) : null} />
                  <FieldRow label="Lebensversicherung" value={applicant?.life_insurance_value ? eurFormat.format(applicant.life_insurance_value) : null} />
                  <FieldRow label="Bausparer" value={applicant?.building_society_value ? eurFormat.format(applicant.building_society_value) : null} />
                  <FieldRow label="Sonstige Vermögen" value={applicant?.other_assets_value ? eurFormat.format(applicant.other_assets_value) : null} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="text-xs text-muted-foreground">Vollständigkeit:</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${applicant?.completion_score || 0}%` }} />
                </div>
                <span className="text-xs font-bold">{applicant?.completion_score || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: Objekt ===== */}
        <TabsContent value="objekt">
          <Card className="glass-card">
            <CardContent className="p-5 space-y-4">
              <WidgetHeader icon={Building2} title="Objekt / Vorhaben" description="Details zum Finanzierungsobjekt" />
              {property ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <FieldRow label="Code" value={property.code} />
                    <FieldRow label="Adresse" value={property.address} />
                    <FieldRow label="PLZ / Ort" value={`${property.postal_code || ''} ${property.city || ''}`} />
                  </div>
                  <div>
                    <FieldRow label="Kaufpreis" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                    <FieldRow label="Quelle" value={request.object_source === 'mod04_property' ? 'Aus Bestand (MOD-04)' : 'Eigenes Objekt'} />
                  </div>
                </div>
              ) : request.custom_object_data ? (
                <div>
                  <FieldRow label="Typ" value="Eigenes Objekt" />
                  <FieldRow label="Adresse" value={applicant?.object_address} />
                  <FieldRow label="Objekttyp" value={applicant?.object_type} />
                  <FieldRow label="Verwendung" value={applicant?.purpose} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Kein Objekt verknüpft</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: Finanzierung ===== */}
        <TabsContent value="finanzierung">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <WidgetHeader icon={CreditCard} title="Finanzierungskonzept" description="Darlehensparameter bearbeiten" />
                <FieldRow label="Kaufpreis" value={loanEdits.purchase_price ?? applicant?.purchase_price ?? ''} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, purchase_price: v }))} />
                <FieldRow label="Eigenkapital" value={loanEdits.equity_amount ?? applicant?.equity_amount ?? ''} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, equity_amount: v }))} />
                <FieldRow label="Darlehenswunsch" value={loanEdits.loan_amount_requested ?? applicant?.loan_amount_requested ?? ''} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, loan_amount_requested: v }))} />
                <Separator />
                <FieldRow label="Sollzins (%)" value={loanEdits.interest_rate ?? '3.5'} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, interest_rate: v }))} />
                <FieldRow label="Tilgung (%)" value={loanEdits.repayment_rate ?? applicant?.repayment_rate_percent ?? '2'} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, repayment_rate: v }))} />
                <FieldRow label="Zinsbindung (Jahre)" value={loanEdits.fixed_rate_period ?? applicant?.fixed_rate_period_years ?? '10'} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, fixed_rate_period: v }))} />
                <FieldRow label="Nebenkosten" value={loanEdits.ancillary_costs ?? applicant?.ancillary_costs ?? ''} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, ancillary_costs: v }))} />
                <FieldRow label="Modernisierung" value={loanEdits.modernization_costs ?? applicant?.modernization_costs ?? ''} editable 
                  onChange={v => setLoanEdits(p => ({ ...p, modernization_costs: v }))} />
                <Button size="sm" className="mt-2">
                  <Save className="h-3 w-3 mr-1" /> Speichern
                </Button>
              </CardContent>
            </Card>

            {/* Right: Calculation Output */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <WidgetHeader icon={Calculator} title="Kalkulation" description="Berechnete Finanzierungsdaten" />
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-xs text-muted-foreground">Monatliche Rate</div>
                    <div className="text-2xl font-bold text-primary">{eurFormatFull.format(monthlyRate)}</div>
                  </div>
                  <FieldRow label="Darlehensbetrag" value={eurFormat.format(loanAmount)} />
                  <FieldRow label="Sollzins" value={`${interestRate}%`} />
                  <FieldRow label="Tilgung" value={`${repaymentRate}%`} />
                  <FieldRow label="Zinsbindung" value={`${fixedPeriod} Jahre`} />
                  <FieldRow label="Annuität p.a." value={eurFormat.format(monthlyRate * 12)} />
                  <Separator />
                  <FieldRow label="Restschuld nach Zinsbindung" value={eurFormat.format(remainingDebt)} />
                  <FieldRow label="EK-Quote" value={purchasePrice > 0 ? `${((equity / purchasePrice) * 100).toFixed(1)}%` : '—'} />
                  {applicant?.max_monthly_rate && (
                    <FieldRow label="Max. tragbare Rate" value={eurFormatFull.format(applicant.max_monthly_rate)} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Tab: Einreichung ===== */}
        <TabsContent value="einreichung">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mail Submission */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <WidgetHeader icon={Mail} title="Einreichung per E-Mail" description="Fall an eine Bank per Mail senden" />
                {!canSubmit ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Einreichung erst ab Status "Ready" möglich.</p>
                    <p className="text-xs mt-1">Aktueller Status: {getStatusLabel(currentStatus)}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Bankkontakt wählen</label>
                      <select
                        className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border text-xs space-y-1">
                      <div className="font-medium">Entwurf-Vorschau:</div>
                      <div>Betreff: Finanzierungsanfrage {request.public_id}</div>
                      <div>Antragsteller: {applicant?.first_name} {applicant?.last_name}</div>
                      <div>Darlehenswunsch: {applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : '—'}</div>
                      <div>Objekt: {property?.address || applicant?.object_address || 'Nicht angegeben'}</div>
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={!selectedBankId}
                      onClick={() => {
                        handleStatusChange('submitted_to_bank');
                        toast.success('Einreichung wird vorbereitet...');
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      An Bank senden
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Platform Submission */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <WidgetHeader icon={Globe} title="Plattform-Übergabe" description="Hypoport / Europace (vorbereitet)" />
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Plattform</label>
                    <select className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" disabled={!canSubmit}>
                      <option value="">— Plattform wählen —</option>
                      <option value="europace">Europace</option>
                      <option value="hypoport">Hypoport</option>
                    </select>
                  </div>
                  {canSubmit && (
                    <div className="p-3 rounded-lg bg-muted/50 border text-xs font-mono max-h-[200px] overflow-auto">
                      <pre>{JSON.stringify({
                        request_id: request.public_id,
                        applicant: { name: `${applicant?.first_name} ${applicant?.last_name}`, income: applicant?.net_income_monthly },
                        loan: { amount: applicant?.loan_amount_requested, equity: applicant?.equity_amount },
                        property: property?.address || applicant?.object_address,
                      }, null, 2)}</pre>
                    </div>
                  )}
                  <Button className="w-full" disabled variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    Integration ausstehend
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Plattform-Integration wird in einer späteren Phase aktiviert.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Tab: Notizen / Timeline ===== */}
        <TabsContent value="notizen">
          <Card className="glass-card">
            <CardContent className="p-5 space-y-4">
              <WidgetHeader icon={History} title="Notizen & Timeline" description="Interne Notizen und Aktionsverlauf" />
              <Textarea
                placeholder="Interne Notiz zum Fall..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
              <Button size="sm" variant="outline" disabled={!note.trim()}>
                <Save className="h-3 w-3 mr-1" /> Notiz speichern
              </Button>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Verlauf</h4>
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Noch keine Einträge vorhanden</p>
                  <p className="text-xs mt-1">Aktionen werden hier automatisch protokolliert.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

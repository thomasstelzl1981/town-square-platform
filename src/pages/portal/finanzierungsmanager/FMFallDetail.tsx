/**
 * FM Fall Detail — Vertical Flow (no tabs)
 * All sections stacked: Summary → Selbstauskunft → Objekt → Kalkulator → Notizen → Finish
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useState, useCallback } from 'react';
import { 
  ArrowLeft, User, Building2, Clock, CheckCircle2, 
  XCircle, MessageSquare, Loader2, Save,
  Calculator, History, CreditCard, FileText, ArrowRight
} from 'lucide-react';
import { useFinanceRequest, useUpdateRequestStatus, useUpdateApplicantProfile } from '@/hooks/useFinanceRequest';
import { CaseStepper } from '@/components/finanzierungsmanager/CaseStepper';
import { PageShell } from '@/components/shared/PageShell';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { toast } from 'sonner';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import { profileToFormData } from '@/components/finanzierung/SelbstauskunftFormV2';
import { supabase } from '@/integrations/supabase/client';
import * as React from 'react';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurFormatFull = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

/** Bank-style table row */
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
  const { data: request, isLoading, refetch: refetchRequest } = useFinanceRequest(requestId);
  const updateStatus = useUpdateRequestStatus();

  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loanEdits, setLoanEdits] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ApplicantFormData | null>(null);
  const [coFormData, setCoFormData] = useState<ApplicantFormData | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);

  React.useEffect(() => {
    if (request && !formInitialized) {
      const applicant = request.applicant_profiles?.[0];
      const coApplicant = request.applicant_profiles?.[1];
      if (applicant) setFormData(profileToFormData(applicant as any));
      setCoFormData(coApplicant ? profileToFormData(coApplicant as any) : createEmptyApplicantFormData());
      setFormInitialized(true);
    }
  }, [request, formInitialized]);

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
  const coApplicant = request.applicant_profiles?.[1];
  const property = request.properties;
  const currentStatus = request.status;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ requestId: request.id, status: newStatus, notes: note || undefined });
      toast.success(`Status → ${getStatusLabel(newStatus)}`);
      setNote('');
    } catch { toast.error('Fehler beim Aktualisieren'); }
  };

  const handleChange = (field: string, value: unknown) => setFormData(prev => prev ? { ...prev, [field]: value } : prev);
  const handleCoChange = (field: string, value: unknown) => setCoFormData(prev => prev ? { ...prev, [field]: value } : prev);

  const handleCoFirstInput = async () => {
    if (coApplicant || !applicant) return;
    try {
      const { error } = await supabase.from('applicant_profiles').insert({
        tenant_id: (applicant as any).tenant_id,
        party_role: 'co_applicant',
        profile_type: 'person',
        finance_request_id: request.id,
        linked_primary_profile_id: applicant.id,
      });
      if (error) throw error;
      toast.success('2. Antragsteller angelegt');
      refetchRequest();
    } catch (err) {
      console.error('Co-applicant create error:', err);
    }
  };

  const handleSaveApplicants = async () => {
    if (!formData || !applicant) return;
    setIsSaving(true);
    try {
      const { error: e1 } = await supabase.from('applicant_profiles').update(formData as any).eq('id', applicant.id);
      if (e1) throw e1;
      if (coApplicant && coFormData) {
        const { error: e2 } = await supabase.from('applicant_profiles').update(coFormData as any).eq('id', coApplicant.id);
        if (e2) throw e2;
      }
      toast.success('Selbstauskunft gespeichert');
      refetchRequest();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Loan calculation
  const purchasePrice = Number(loanEdits.purchase_price || applicant?.purchase_price || 0);
  const equity = Number(loanEdits.equity_amount || applicant?.equity_amount || 0);
  const loanAmount = Number(loanEdits.loan_amount_requested || applicant?.loan_amount_requested || 0);
  const interestRate = Number(loanEdits.interest_rate || 3.5);
  const repaymentRate = Number(loanEdits.repayment_rate || applicant?.repayment_rate_percent || 2);
  const fixedPeriod = Number(loanEdits.fixed_rate_period || applicant?.fixed_rate_period_years || 10);
  const monthlyRate = loanAmount > 0 ? (loanAmount * (interestRate + repaymentRate) / 100 / 12) : 0;
  const yearlyRepayment = loanAmount > 0 ? (loanAmount * repaymentRate / 100) : 0;
  const remainingDebt = loanAmount > 0 ? Math.max(0, loanAmount - (yearlyRepayment * fixedPeriod)) : 0;

  const dualProps = formData && coFormData ? {
    formData,
    coFormData,
    onChange: handleChange,
    onCoChange: handleCoChange,
    readOnly: false,
    onCoFirstInput: handleCoFirstInput,
  } : null;

  return (
    <PageShell>
      {/* ===== HEADER ===== */}
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

      {/* ===== STEPPER ===== */}
      <CaseStepper currentStatus={currentStatus} />

      {/* ===== STATUS ACTIONS ===== */}
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

      {/* ===== BLOCK 1: KURZBESCHREIBUNG ===== */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Kurzbeschreibung
            </h3>
          </div>
          <Table>
            <TableBody>
              <TR label="Antragsteller" value={`${applicant?.first_name || ''} ${applicant?.last_name || ''}`} />
              <TR label="E-Mail" value={applicant?.email} />
              <TR label="Objekt" value={property?.address || applicant?.object_address || 'Kein Objekt'} />
              <TR label="Darlehenswunsch" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
              <TR label="Eigenkapital" value={applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : null} />
              <TR label="Status" value={getStatusLabel(currentStatus)} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== BLOCK 2: SELBSTAUSKUNFT ===== */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Selbstauskunft
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Vollständigkeit: {applicant?.completion_score || 0}%</span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${applicant?.completion_score || 0}%` }} />
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveApplicants} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Speichern
              </Button>
            </div>
          </div>
          {dualProps ? (
            <div className="p-4 space-y-6">
              <PersonSection {...dualProps} />
              <EmploymentSection {...dualProps} />
              <BankSection {...dualProps} />
              <IncomeSection {...dualProps} />
              <ExpensesSection {...dualProps} />
              <AssetsSection {...dualProps} />
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Daten werden geladen...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== BLOCK 3: OBJEKT ===== */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Objekt-Daten
            </h3>
          </div>
          <Table>
            <TableBody>
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

      {/* ===== BLOCK 4: KALKULATOR ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

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

      {/* ===== BLOCK 5: NOTIZEN ===== */}
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

      {/* ===== BLOCK 6: FERTIGSTELLEN ===== */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6 text-center space-y-3">
          <h3 className="text-sm font-semibold">Finanzierungsakte fertigstellen</h3>
          <p className="text-xs text-muted-foreground">
            Wenn alle Daten vollständig sind, markieren Sie die Akte als bereit zur Einreichung.
          </p>
          <Button
            size="lg"
            className="w-full max-w-md"
            disabled={['ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'].includes(currentStatus)}
            onClick={() => handleStatusChange('ready_for_submission')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finanzierungsakte fertigstellen
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {['ready_for_submission', 'ready_to_submit'].includes(currentStatus) && (
            <p className="text-xs text-primary font-medium">✓ Akte ist bereit — weiter zur Einreichung</p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

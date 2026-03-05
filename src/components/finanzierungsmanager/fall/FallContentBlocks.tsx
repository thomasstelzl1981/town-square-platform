/**
 * FallContentBlocks — Shared content blocks (Kurzbeschreibung, Objekt, Kalkulator, Datenraum, Notizen, Fertigstellen)
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { FileText, Building2, Calculator, CreditCard, History, FolderOpen, Save, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { getStatusLabel } from '@/types/finance';
import { calcAnnuity } from '@/engines/finanzierung/engine';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurFormatFull = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

function TR({ label, value, editable, onChange }: { label: string; value: string | number | null | undefined; editable?: boolean; onChange?: (val: string) => void }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[100px] md:w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">
        {editable && onChange ? <Input value={value ?? ''} onChange={e => onChange(e.target.value)} className="h-6 text-xs border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 rounded-none" /> : <span>{value || '—'}</span>}
      </TableCell>
    </TableRow>
  );
}

interface FallContentBlocksProps {
  request: any;
  applicant: any;
  coApplicant: any;
  property: any;
  currentStatus: string;
  isProlongation: boolean;
  purposeLabel: string;
  splitView: boolean;
  onStatusChange: (status: string) => void;
}

export function FallContentBlocks({ request, applicant, property, currentStatus, isProlongation, purposeLabel, splitView, onStatusChange }: FallContentBlocksProps) {
  const [note, setNote] = useState('');
  const [loanEdits, setLoanEdits] = useState<Record<string, string>>({});

  const loanAmount = Number(loanEdits.loan_amount_requested || applicant?.loan_amount_requested || 0);
  const interestRate = Number(loanEdits.interest_rate || 3.5);
  const repaymentRate = Number(loanEdits.repayment_rate || applicant?.repayment_rate_percent || 2);
  const fixedPeriod = Number(loanEdits.fixed_rate_period || applicant?.fixed_rate_period_years || 10);
  const annuityResult = loanAmount > 0 ? calcAnnuity({ loanAmount, interestRatePercent: interestRate, repaymentRatePercent: repaymentRate, fixedRatePeriodYears: fixedPeriod }) : null;
  const monthlyRate = annuityResult?.monthlyRate ?? 0;
  const remainingDebt = annuityResult?.remainingDebt ?? 0;
  const objektwert = Number(loanEdits.objektwert || property?.purchase_price || 0);
  const beleihungsauslauf = objektwert > 0 ? (loanAmount / objektwert * 100) : 0;
  const purchasePrice = Number(loanEdits.purchase_price || applicant?.purchase_price || 0);
  const equity = Number(loanEdits.equity_amount || applicant?.equity_amount || 0);

  const kurzbeschreibungBlock = (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Kurzbeschreibung</h3></div>
        <Table><TableBody>
          <TR label="Antragsteller" value={`${applicant?.first_name || ''} ${applicant?.last_name || ''}`} />
          <TR label="E-Mail" value={applicant?.email} />
          <TR label="Zweck" value={purposeLabel} />
          <TR label="Objekt" value={property?.address || applicant?.object_address || 'Kein Objekt'} />
          {isProlongation ? (<><TR label="Restschuld" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} /><TR label="Objektwert" value={property?.purchase_price ? eurFormat.format(property.purchase_price) : null} /></>) : (<><TR label="Darlehenswunsch" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} /><TR label="Eigenkapital" value={applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : null} /></>)}
          <TR label="Status" value={getStatusLabel(currentStatus)} />
        </TableBody></Table>
      </CardContent>
    </Card>
  );

  const objektBlock = (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Objekt-Daten</h3></div>
        <Table><TableBody>
          {property ? (<><TR label="Code" value={property.code} /><TR label="Adresse" value={property.address} /><TR label="PLZ / Ort" value={`${property.postal_code || ''} ${property.city || ''}`} />{isProlongation ? <TR label="Objektwert" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} /> : <TR label="Kaufpreis" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} />}<TR label="Quelle" value={request.object_source === 'mod04_property' ? 'Aus Bestand (MOD-04)' : 'Eigenes Objekt'} /></>) : request.custom_object_data ? (<><TR label="Typ" value="Eigenes Objekt" /><TR label="Adresse" value={applicant?.object_address} /><TR label="Objekttyp" value={applicant?.object_type} /><TR label="Verwendung" value={purposeLabel} /></>) : (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-sm">Kein Objekt verknüpft</TableCell></TableRow>)}
        </TableBody></Table>
      </CardContent>
    </Card>
  );

  const kalkulatorBlock = (
    <div className={splitView ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> {isProlongation ? 'Prolongationsparameter' : 'Darlehensparameter'}</h3></div>
          <Table><TableBody>
            {isProlongation ? (<><TR label="Objektwert" value={loanEdits.objektwert ?? property?.purchase_price ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, objektwert: v }))} /><TR label="Restschuld" value={loanEdits.loan_amount_requested ?? applicant?.loan_amount_requested ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, loan_amount_requested: v }))} /></>) : (<><TR label="Kaufpreis" value={loanEdits.purchase_price ?? applicant?.purchase_price ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, purchase_price: v }))} /><TR label="Eigenkapital" value={loanEdits.equity_amount ?? applicant?.equity_amount ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, equity_amount: v }))} /><TR label="Darlehenswunsch" value={loanEdits.loan_amount_requested ?? applicant?.loan_amount_requested ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, loan_amount_requested: v }))} /></>)}
            <TR label="Sollzins (%)" value={loanEdits.interest_rate ?? '3.5'} editable onChange={v => setLoanEdits(p => ({ ...p, interest_rate: v }))} />
            <TR label="Tilgung (%)" value={loanEdits.repayment_rate ?? applicant?.repayment_rate_percent ?? '2'} editable onChange={v => setLoanEdits(p => ({ ...p, repayment_rate: v }))} />
            <TR label="Zinsbindung (Jahre)" value={loanEdits.fixed_rate_period ?? applicant?.fixed_rate_period_years ?? '10'} editable onChange={v => setLoanEdits(p => ({ ...p, fixed_rate_period: v }))} />
            {!isProlongation && (<><TR label="Nebenkosten" value={loanEdits.ancillary_costs ?? applicant?.ancillary_costs ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, ancillary_costs: v }))} /><TR label="Modernisierung" value={loanEdits.modernization_costs ?? applicant?.modernization_costs ?? ''} editable onChange={v => setLoanEdits(p => ({ ...p, modernization_costs: v }))} /></>)}
          </TableBody></Table>
        </CardContent>
      </Card>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><Calculator className="h-4 w-4" /> Kalkulation</h3></div>
          <div className="p-4 border-b bg-primary/5"><div className="text-xs text-muted-foreground">Monatliche Rate</div><div className="text-xl font-bold text-primary">{eurFormatFull.format(monthlyRate)}</div></div>
          <Table><TableBody>
            <TR label={isProlongation ? 'Restschuld (aktuell)' : 'Darlehensbetrag'} value={eurFormat.format(loanAmount)} />
            <TR label="Sollzins" value={`${interestRate}%`} />
            <TR label="Tilgung" value={`${repaymentRate}%`} />
            <TR label="Zinsbindung" value={`${fixedPeriod} Jahre`} />
            <TR label="Annuität p.a." value={eurFormat.format(monthlyRate * 12)} />
            <TR label="Restschuld (nach Zinsbindung)" value={eurFormat.format(remainingDebt)} />
            {isProlongation ? <TR label="Beleihungsauslauf" value={objektwert > 0 ? `${beleihungsauslauf.toFixed(1)}%` : '—'} /> : <TR label="EK-Quote" value={purchasePrice > 0 ? `${((equity / purchasePrice) * 100).toFixed(1)}%` : '—'} />}
            {applicant?.max_monthly_rate && <TR label="Max. tragbare Rate" value={eurFormatFull.format(applicant.max_monthly_rate)} />}
          </TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );

  const datenraumBlock = (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Datenraum</h3></div>
        <div className="p-4 text-center space-y-2">
          <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Datenraum: <span className="font-mono text-[10px]">MOD_11/{request.id.slice(0, 8)}…</span></p>
          <p className="text-[10px] text-muted-foreground">Unterlagen per E-Mail oder DMS-Upload bereitstellen</p>
        </div>
      </CardContent>
    </Card>
  );

  const notizenBlock = (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Notizen & Timeline</h3>
        <Textarea placeholder="Interne Notiz zum Fall..." value={note} onChange={e => setNote(e.target.value)} rows={3} className="text-sm" />
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!note.trim()}><Save className="h-3 w-3 mr-1" /> Notiz speichern</Button>
        <Separator />
        <div className="text-center py-4 text-muted-foreground"><History className="h-6 w-6 mx-auto mb-1 opacity-30" /><p className="text-xs">Noch keine Einträge</p></div>
      </CardContent>
    </Card>
  );

  const fertigstellenBlock = (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-6 text-center space-y-3">
        <h3 className="text-base font-semibold">Finanzierungsakte fertigstellen</h3>
        <p className="text-xs text-muted-foreground">Markieren Sie die Akte als bereit zur Einreichung. Fehlende Unterlagen können jederzeit nachgereicht werden — das Ampelsystem zeigt den aktuellen Dokumentenstatus.</p>
        <Button size="lg" className="w-full max-w-md" disabled={['ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'].includes(currentStatus)} onClick={() => onStatusChange('ready_for_submission')}>
          <CheckCircle2 className="h-4 w-4 mr-2" />Finanzierungsakte fertigstellen<ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        {['ready_for_submission', 'ready_to_submit'].includes(currentStatus) && <p className="text-xs text-primary font-medium">✓ Akte ist bereit — weiter zur Einreichung</p>}
      </CardContent>
    </Card>
  );

  return { kurzbeschreibungBlock, objektBlock, kalkulatorBlock, datenraumBlock, notizenBlock, fertigstellenBlock };
}

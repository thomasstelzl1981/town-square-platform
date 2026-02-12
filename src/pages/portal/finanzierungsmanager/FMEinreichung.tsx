/**
 * FM Einreichung — Master-Detail view: Case widgets on top,
 * persistent 4-step workflow below (always visible, fills on case selection).
 */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileText, Building2, Mail, Check, ChevronRight, Globe,
  Send, AlertTriangle, Archive, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { useFinanceRequest } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import {
  useSubmissionLogs, useCreateSubmissionLog,
  useSendSubmissionEmail, useUpdateSubmissionLog,
} from '@/hooks/useFinanceSubmission';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FutureRoomCase } from '@/types/finance';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const READY_STATUSES = ['ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'];

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

function TR({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  const display = typeof value === 'string' ? value.trim() : value;
  if (!display && display !== 0) return null;
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{display}</TableCell>
    </TableRow>
  );
}

const STEPS = [
  { id: 1, label: 'Exposé', icon: FileText },
  { id: 2, label: 'Bank & Kanal', icon: Building2 },
  { id: 3, label: 'E-Mail', icon: Mail },
  { id: 4, label: 'Status', icon: Check },
];

function WorkflowStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 py-3 px-1 overflow-x-auto">
      {STEPS.map((step, idx) => {
        const isActive = step.id === current;
        const isDone = step.id < current;
        return (
          <div key={step.id} className="flex items-center">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1 text-muted-foreground flex-shrink-0" />}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              isActive && 'bg-primary text-primary-foreground',
              isDone && 'text-primary',
              !isActive && !isDone && 'text-muted-foreground'
            )}>
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                isActive && 'bg-primary-foreground text-primary',
                isDone && 'bg-primary text-primary-foreground',
                !isActive && !isDone && 'border border-muted-foreground'
              )}>
                {isDone ? <Check className="h-3 w-3" /> : step.id}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Inline workflow sections ──────────────────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

export default function FMEinreichung({ cases, isLoading }: Props) {
  const { requestId: routeRequestId } = useParams<{ requestId: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(routeRequestId || null);

  // Filtered cases
  const readyCases = useMemo(
    () => cases.filter(c => READY_STATUSES.includes(getRequestStatus(c))),
    [cases]
  );

  // Selected case data
  const { data: request, isLoading: reqLoading } = useFinanceRequest(selectedId || undefined);
  const { data: bankContacts } = useFinanceBankContacts();
  const { data: submissionLogs = [] } = useSubmissionLogs(selectedId || undefined);
  const sendEmail = useSendSubmissionEmail();
  const createLog = useCreateSubmissionLog();
  const updateLog = useUpdateSubmissionLog();

  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [externalSoftwareName, setExternalSoftwareName] = useState('Europace');

  const applicant = request?.applicant_profiles?.[0];
  const property = request?.properties;

  const currentStep = useMemo(() => {
    if (!selectedId) return 1;
    if (submissionLogs.length > 0) return 4;
    if (selectedBanks.length > 0) return 3;
    return 2;
  }, [selectedId, submissionLogs.length, selectedBanks.length]);

  const toggleBank = (bankId: string) => {
    setSelectedBanks(prev => {
      if (prev.includes(bankId)) return prev.filter(id => id !== bankId);
      if (prev.length >= 3) { toast.info('Maximal 3 Banken auswählbar'); return prev; }
      return [...prev, bankId];
    });
  };

  const selectedBankDetails = bankContacts?.filter(b => selectedBanks.includes(b.id)) || [];

  const generateEmailBody = (bankName: string) => {
    const name = `${applicant?.first_name || ''} ${applicant?.last_name || ''}`.trim();
    const amount = applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : 'k.A.';
    return `Sehr geehrte Damen und Herren,\n\nanbei übermittle ich Ihnen die Finanzierungsanfrage für ${name} über ${amount}.\n\nDie vollständige Finanzierungsakte inkl. Selbstauskunft finden Sie im beigefügten PDF sowie im Datenraum.\n\nMit freundlichen Grüßen`;
  };

  const getEmailDraft = (bankId: string, bankName: string) => emailDrafts[bankId] || generateEmailBody(bankName);

  const handleSendEmail = async (bank: any) => {
    if (!bank || !selectedId) return;
    const subject = `Finanzierungsanfrage ${request?.public_id || selectedId.slice(0, 8)} — ${applicant?.first_name} ${applicant?.last_name}`;
    const body = getEmailDraft(bank.id, bank.bank_name);
    await sendEmail.mutateAsync({
      finance_request_id: selectedId,
      bank_contact_id: bank.id,
      to_email: bank.contact_email || '',
      subject,
      html_content: body.replace(/\n/g, '<br/>'),
    });
  };

  const handleSendAll = async () => {
    for (const bank of selectedBankDetails) {
      if (!bank.contact_email) { toast.error(`${bank.bank_name}: Keine E-Mail-Adresse`); continue; }
      await handleSendEmail(bank);
    }
    if (selectedId) await supabase.from('finance_requests').update({ status: 'submitted_to_bank' }).eq('id', selectedId);
    setSelectedBanks([]);
  };

  const handleExternalHandoff = async () => {
    if (!selectedId) return;
    await createLog.mutateAsync({
      finance_request_id: selectedId,
      channel: 'external',
      status: 'handed_over',
      external_software_name: externalSoftwareName,
    });
    await supabase.from('finance_requests').update({ status: 'submitted_to_bank' }).eq('id', selectedId);
    toast.success(`Fall an ${externalSoftwareName} übergeben`);
  };

  const handleUpdateLogStatus = async (logId: string, newStatus: string) => {
    await updateLog.mutateAsync({
      id: logId,
      status: newStatus,
      ...(newStatus !== 'waiting' && newStatus !== 'sent' ? { response_received_at: new Date().toISOString() } : {}),
    });
    toast.success('Status aktualisiert');
  };

  const handleSelectBank = async (logId: string) => {
    for (const log of submissionLogs) {
      if (log.is_selected && log.id !== logId) {
        await updateLog.mutateAsync({ id: log.id, is_selected: false });
      }
    }
    await updateLog.mutateAsync({ id: logId, is_selected: true, status: 'approved' });
    toast.success('Finanzierende Bank ausgewählt');
  };

  const handleArchiveCase = async () => {
    if (!selectedId) return;
    await supabase.from('finance_requests').update({ status: 'completed' }).eq('id', selectedId);
    toast.success('Fall abgeschlossen und archiviert');
    setSelectedId(null);
  };

  const handleCaseSelect = (reqId: string) => {
    setSelectedId(prev => prev === reqId ? null : reqId);
    setSelectedBanks([]);
    setEmailDrafts({});
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="EINREICHUNG"
        description={`${readyCases.length} Einreichungen — Dokumentation aller Bank-Einreichungen.`}
      />

      {/* ── Case Widget Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {readyCases.map(c => {
          const reqId = c.finance_mandates?.finance_request_id || c.id;
          return (
            <FinanceCaseCard
              key={c.id}
              caseData={c}
              isSelected={selectedId === reqId}
              onClick={() => handleCaseSelect(reqId)}
            />
          );
        })}
        {readyCases.length === 0 && (
          <FinanceCaseCardPlaceholder label="Keine Akten bereit" />
        )}
      </div>

      {/* ── Stepper ── */}
      <WorkflowStepper current={currentStep} />

      {/* ── STEP 1: Exposé ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> 1. Finanzierungs-Exposé
            </h3>
            {selectedId && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" /> PDF Export
              </Button>
            )}
          </div>
          {!selectedId ? (
            <EmptyHint text="Bitte wählen Sie oben eine Akte aus." />
          ) : reqLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : request ? (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Antragsteller</TableCell>
                </TableRow>
                <TR label="Name" value={[applicant?.first_name, applicant?.last_name].filter(Boolean).join(' ') || null} />
                <TR label="E-Mail" value={applicant?.email} />
                <TR label="Telefon" value={applicant?.phone} />
                <TR label="Adresse" value={[applicant?.address_street, applicant?.address_postal_code, applicant?.address_city].filter(Boolean).join(', ') || null} />
                <TR label="Beruf" value={applicant?.position} />
                <TR label="Netto-Einkommen" value={applicant?.net_income_monthly ? eurFormat.format(applicant.net_income_monthly) : null} />
                <TableRow>
                  <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Finanzierung</TableCell>
                </TableRow>
                {request.purpose === 'umschuldung' ? (
                  <>
                    <TR label="Restschuld" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
                    <TR label="Objektwert" value={property?.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                    <TR label="Verwendung" value="Prolongation / Umschuldung" />
                  </>
                ) : (
                  <>
                    <TR label="Darlehenswunsch" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
                    <TR label="Eigenkapital" value={applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : null} />
                    <TR label="Kaufpreis" value={applicant?.purchase_price ? eurFormat.format(applicant.purchase_price) : null} />
                    <TR label="Verwendung" value={applicant?.purpose} />
                  </>
                )}
                <TableRow>
                  <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Objekt</TableCell>
                </TableRow>
                {property ? (
                  <>
                    <TR label="Adresse" value={property.address} />
                    <TR label="PLZ / Ort" value={[property.postal_code, property.city].filter(Boolean).join(' ') || null} />
                    <TR label="Kaufpreis" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                  </>
                ) : (
                  <>
                    <TR label="Adresse" value={applicant?.object_address} />
                    <TR label="Objekttyp" value={applicant?.object_type} />
                  </>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyHint text="Fall nicht gefunden." />
          )}
        </CardContent>
      </Card>

      {/* ── STEP 2: Bank & Kanal ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> 2. Kanal & Bankauswahl
            </h3>
          </div>
          {!selectedId ? (
            <EmptyHint text="Bitte wählen Sie oben eine Akte aus." />
          ) : submissionLogs.length > 0 ? (
            <EmptyHint text="Banken bereits eingereicht — siehe Status unten." />
          ) : (
            <>
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">E-Mail Einreichung</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Wählen Sie bis zu 3 Banken aus, an die der Finanzierungsantrag per E-Mail gesendet wird.
                </p>
              </div>
              <div className="px-4 pb-4 space-y-1.5">
                {(!bankContacts || bankContacts.length === 0) ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Keine Bankkontakte vorhanden.</p>
                ) : (
                  bankContacts.map(bank => (
                    <label
                      key={bank.id}
                      className={cn(
                        'flex items-center gap-3 py-2 px-3 rounded-md border transition-colors cursor-pointer text-sm',
                        selectedBanks.includes(bank.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                      )}
                    >
                      <Checkbox checked={selectedBanks.includes(bank.id)} onCheckedChange={() => toggleBank(bank.id)} />
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-medium">{bank.bank_name}</span>
                        {bank.contact_name && <span className="text-xs text-muted-foreground">— {bank.contact_name}</span>}
                        {bank.contact_email && <span className="text-xs text-muted-foreground">— {bank.contact_email}</span>}
                      </div>
                    </label>
                  ))
                )}
              </div>
              {selectedBanks.length > 0 && (
                <div className="px-4 pb-4">
                  <Button size="sm">Weiter zu E-Mail-Entwürfen ({selectedBanks.length}) <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
                </div>
              )}
              <Separator />
              {/* External software */}
              <div className="px-4 py-4 bg-muted/5">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Externe Software (Europace etc.)</span>
                </div>
                <div className="border border-dashed rounded-md p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">Keine Rückspielung. Der Fall wird als „übergeben" markiert.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={externalSoftwareName} onChange={(e) => setExternalSoftwareName(e.target.value)} placeholder="Software-Name" className="h-8 text-sm max-w-[200px]" />
                    <Button size="sm" variant="outline" onClick={handleExternalHandoff} disabled={createLog.isPending} className="h-8 text-xs">
                      <Globe className="h-3 w-3 mr-1" /> Fall übergeben
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 3: E-Mail Drafts ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" /> 3. E-Mail-Entwürfe
            </h3>
          </div>
          {!selectedId || selectedBankDetails.length === 0 ? (
            <EmptyHint text={selectedId ? 'Wird nach Bankauswahl verfügbar.' : 'Bitte wählen Sie oben eine Akte aus.'} />
          ) : (
            <>
              <div className="p-4 space-y-4">
                {selectedBankDetails.map(bank => {
                  const subject = `Finanzierungsanfrage ${request?.public_id || selectedId.slice(0, 8)} — ${applicant?.first_name} ${applicant?.last_name}`;
                  return (
                    <div key={bank.id} className="border rounded-md overflow-hidden">
                      <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                        <span className="font-semibold text-sm">{bank.bank_name}</span>
                        <Badge variant="outline" className="text-[10px]">Entwurf</Badge>
                      </div>
                      <div className="p-3 space-y-2 text-xs">
                        <div><span className="text-muted-foreground">An:</span> {bank.contact_email || 'Keine E-Mail'}</div>
                        <div><span className="text-muted-foreground">Betreff:</span> {subject}</div>
                        <Textarea
                          value={getEmailDraft(bank.id, bank.bank_name)}
                          onChange={(e) => setEmailDrafts(prev => ({ ...prev, [bank.id]: e.target.value }))}
                          className="text-xs min-h-[120px] mt-2"
                        />
                        <div className="text-muted-foreground">📎 Finanzierungsakte.pdf · 📎 Datenraum-Link</div>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendEmail(bank)} disabled={sendEmail.isPending || !bank.contact_email}>
                            <Send className="h-3 w-3 mr-1" /> Senden
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t flex justify-end">
                <Button onClick={handleSendAll} disabled={sendEmail.isPending} className="text-xs">
                  <Send className="h-3.5 w-3.5 mr-1" /> Alle senden ({selectedBankDetails.length})
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 4: Status & Result ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Check className="h-4 w-4" /> 4. Status & Ergebnis
            </h3>
          </div>
          {!selectedId || submissionLogs.length === 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Bank / Kanal</TableHead>
                  <TableHead className="text-xs">Eingereicht</TableHead>
                  <TableHead className="text-xs">Kanal</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-[140px]">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    {selectedId ? 'Noch keine Einreichungen vorhanden.' : 'Bitte wählen Sie oben eine Akte aus.'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Bank / Kanal</TableHead>
                    <TableHead className="text-xs">Eingereicht</TableHead>
                    <TableHead className="text-xs">Kanal</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs w-[140px]">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionLogs.map(log => (
                    <TableRow key={log.id} className={cn(log.is_selected && 'bg-primary/5')}>
                      <TableCell className="text-sm font-medium">
                        {log.finance_bank_contacts?.bank_name || log.external_software_name || '—'}
                        {log.is_selected && <Badge className="ml-2 text-[10px]" variant="default">Ausgewählt</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.submitted_at ? new Date(log.submitted_at).toLocaleDateString('de-DE') : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{log.channel === 'email' ? 'E-Mail' : 'Extern'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={log.status} onValueChange={(val) => handleUpdateLogStatus(log.id, val)}>
                          <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sent">Gesendet</SelectItem>
                            <SelectItem value="waiting">Warte auf Antwort</SelectItem>
                            <SelectItem value="follow_up">Nachfrage</SelectItem>
                            <SelectItem value="approved">Zusage</SelectItem>
                            <SelectItem value="rejected">Absage</SelectItem>
                            <SelectItem value="handed_over">Übergeben</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {!log.is_selected && log.status === 'approved' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSelectBank(log.id)}>Auswählen</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {submissionLogs.some(l => l.is_selected) && (
                <div className="px-4 py-3 border-t flex justify-end">
                  <Button onClick={handleArchiveCase} className="text-xs">
                    <Archive className="h-3.5 w-3.5 mr-1" /> Fall abschließen → Archiv
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

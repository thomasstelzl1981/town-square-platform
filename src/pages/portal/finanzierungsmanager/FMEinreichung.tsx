/**
 * FM Einreichung — Orchestrator (R-1 Refactoring)
 * 4 eigenständige Kacheln: 1. Exposé  2. Bankauswahl + E-Mail  3. Status & Ergebnis  4. Europace API
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { FinanzExposeeCard } from '@/components/finanzierungsmanager/FinanzExposeeCard';
import { BankSelectionCard } from '@/components/finanzierungsmanager/BankSelectionCard';
import { EmailDraftsSection } from '@/components/finanzierungsmanager/EmailDraftsSection';
import { SubmissionStatusCard } from '@/components/finanzierungsmanager/SubmissionStatusCard';
import { EuropaceCard } from '@/components/finanzierungsmanager/EuropaceCard';
import { useFinanceRequest } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import {
  useSubmissionLogs, useCreateSubmissionLog,
  useSendSubmissionEmail, useUpdateSubmissionLog,
} from '@/hooks/useFinanceSubmission';
import { useResearchEngine } from '@/hooks/useResearchEngine';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FutureRoomCase } from '@/types/finance';
import {
  europace_request_vorschlaege,
  europace_poll_vorschlaege,
  type EuropaceVorschlag,
  type EuropaceLeadRating,
  type EuropaceCaseData,
} from '@/services/europace/consumerLoanAdapter';
import { eurFormat, READY_STATUSES, MAX_BANKS, getRequestStatus } from '@/components/finanzierungsmanager/fmEinreichungTypes';
import type { SelectedBank } from '@/components/finanzierungsmanager/fmEinreichungTypes';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

export default function FMEinreichung({ cases, isLoading }: Props) {
  const { requestId: routeRequestId } = useParams<{ requestId: string }>();
  const { activeTenantId } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(routeRequestId || null);

  const readyCases = useMemo(
    () => cases.filter(c => READY_STATUSES.includes(getRequestStatus(c))),
    [cases]
  );

  const { data: request, isLoading: reqLoading } = useFinanceRequest(selectedId || undefined);
  const { data: bankContacts } = useFinanceBankContacts();
  const { data: submissionLogs = [] } = useSubmissionLogs(selectedId || undefined);
  const sendEmail = useSendSubmissionEmail();
  const createLog = useCreateSubmissionLog();
  const updateLog = useUpdateSubmissionLog();

  const [selectedBanks, setSelectedBanks] = useState<SelectedBank[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [externalSoftwareName, setExternalSoftwareName] = useState('Europace');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [manualBankName, setManualBankName] = useState('');
  const [manualBankEmail, setManualBankEmail] = useState('');

  // Europace State
  const [epLoading, setEpLoading] = useState(false);
  const [epAnfrageId, setEpAnfrageId] = useState<string | null>(null);
  const [epVorschlaege, setEpVorschlaege] = useState<EuropaceVorschlag[]>([]);
  const [epLeadRating, setEpLeadRating] = useState<EuropaceLeadRating | null>(null);
  const [epError, setEpError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // KI-Bankensuche
  const researchEngine = useResearchEngine();
  const [aiSearchInput, setAiSearchInput] = useState('');

  const applicant = request?.applicant_profiles?.[0];
  const property = request?.properties;

  const defaultAiQuery = useMemo(() => {
    const plz = property?.postal_code || applicant?.address_postal_code || '';
    const city = property?.city || applicant?.address_city || '';
    return [plz, city].filter(Boolean).join(' ');
  }, [property?.postal_code, property?.city, applicant?.address_postal_code, applicant?.address_city]);

  const searchBanks = useCallback(async (customQuery?: string) => {
    const locationHint = customQuery?.trim() || aiSearchInput.trim() || defaultAiQuery;
    if (!locationHint) { researchEngine.reset(); return; }
    await researchEngine.search({
      intent: 'find_companies',
      query: `Bank ${locationHint}`,
      location: locationHint,
      max_results: 25,
      context: { module: 'finanzierung' },
    });
  }, [aiSearchInput, defaultAiQuery, researchEngine]);

  useEffect(() => {
    if (selectedId && !reqLoading && (applicant || property)) {
      setAiSearchInput(defaultAiQuery);
      searchBanks(defaultAiQuery);
    } else {
      researchEngine.reset();
      setAiSearchInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, reqLoading, defaultAiQuery]);

  // Bank helpers
  const addBank = (bank: SelectedBank) => {
    if (selectedBanks.length >= MAX_BANKS) { toast.info(`Maximal ${MAX_BANKS} Banken auswählbar`); return; }
    if (selectedBanks.some(b => b.id === bank.id)) { toast.info('Bank bereits ausgewählt'); return; }
    setSelectedBanks(prev => [...prev, bank]);
  };
  const removeBank = (id: string) => setSelectedBanks(prev => prev.filter(b => b.id !== id));
  const addManualBank = () => {
    if (!manualBankName.trim() || !manualBankEmail.trim()) { toast.error('Name und E-Mail erforderlich'); return; }
    addBank({ id: `manual-${Date.now()}`, name: manualBankName.trim(), email: manualBankEmail.trim(), source: 'manuell' });
    setManualBankName('');
    setManualBankEmail('');
  };

  const filteredBankContacts = useMemo(() => {
    if (!bankContacts) return [];
    if (!bankSearchQuery.trim()) return bankContacts;
    const q = bankSearchQuery.toLowerCase();
    return bankContacts.filter(b =>
      b.bank_name?.toLowerCase().includes(q) || b.contact_email?.toLowerCase().includes(q)
    );
  }, [bankContacts, bankSearchQuery]);

  // Email helpers
  const generateEmailBody = () => {
    const name = `${applicant?.first_name || '[Kundenname]'} ${applicant?.last_name || ''}`.trim();
    const amount = applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : '[Betrag]';
    const objectType = applicant?.object_type || '[Objekttyp]';
    const location = [property?.postal_code || applicant?.address_postal_code, property?.city || applicant?.address_city].filter(Boolean).join(' ') || '[PLZ Ort]';
    const purchasePrice = (property?.purchase_price || applicant?.purchase_price) ? eurFormat.format(property?.purchase_price || applicant?.purchase_price || 0) : '[Kaufpreis]';
    const equity = applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : '[EK]';
    return `Sehr geehrte Damen und Herren,\n\nanbei übermittle ich Ihnen die Finanzierungsanfrage für ${name} über ${amount}.\n\nDie vollständige Finanzierungsakte inkl. Selbstauskunft und Bonitätsunterlagen finden Sie im beigefügten PDF sowie im Datenraum.\n\nEckdaten:\n- Objektart: ${objectType}\n- Standort: ${location}\n- Kaufpreis: ${purchasePrice}\n- Darlehenswunsch: ${amount}\n- Eigenkapital: ${equity}\n\nFür Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`;
  };
  const getEmailDraft = (bankKey: string) => emailDrafts[bankKey] || generateEmailBody();
  const emailSubject = `Finanzierungsanfrage ${request?.public_id || selectedId?.slice(0, 8) || '...'} — ${applicant?.first_name || '[Vorname]'} ${applicant?.last_name || '[Nachname]'}`;
  const updateBankEmail = (bankId: string, email: string) => {
    setSelectedBanks(prev => prev.map(b => b.id === bankId ? { ...b, email } : b));
  };

  const handleSendEmail = async (bank: SelectedBank) => {
    if (!selectedId || !bank.email) { toast.error(`${bank.name}: Keine E-Mail-Adresse`); return; }
    const body = getEmailDraft(bank.id);
    if (bank.source === 'kontaktbuch') {
      await sendEmail.mutateAsync({ finance_request_id: selectedId, bank_contact_id: bank.id, to_email: bank.email, subject: emailSubject, html_content: body.replace(/\n/g, '<br/>') });
    } else {
      let sentViaUserAccount = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: mailAccounts } = await (supabase as any).from('mail_accounts').select('id, email_address, provider').eq('user_id', user.id).eq('status', 'active').limit(1);
          if (mailAccounts?.length > 0) {
            const { error: mailError } = await supabase.functions.invoke('sot-mail-send', { body: { account_id: mailAccounts[0].id, to: bank.email, subject: emailSubject, html_content: body.replace(/\n/g, '<br/>'), context: 'finance_submission' } });
            if (!mailError) { sentViaUserAccount = true; toast.success(`E-Mail an ${bank.name} über ${mailAccounts[0].email_address} versendet`); }
          }
        }
      } catch (err) { console.warn('[FMEinreichung] Mail-Account-Check fehlgeschlagen:', err); }
      if (!sentViaUserAccount) {
        const { error: mailError } = await supabase.functions.invoke('sot-system-mail-send', { body: { to: bank.email, subject: emailSubject, html_content: body.replace(/\n/g, '<br/>'), context: 'finance_submission' } });
        if (mailError) { toast.error(`Versand an ${bank.name} fehlgeschlagen`); return; }
        toast.info(`E-Mail an ${bank.name} über System-Mail versendet.`);
      }
      await createLog.mutateAsync({ finance_request_id: selectedId, channel: 'email', status: 'sent', email_subject: emailSubject, email_body: body, external_software_name: bank.name, tenant_id: activeTenantId! });
    }
  };

  const handleSendAll = async () => {
    for (const bank of selectedBanks) {
      if (!bank.email) { toast.error(`${bank.name}: Keine E-Mail-Adresse`); continue; }
      await handleSendEmail(bank);
    }
    if (selectedId) await supabase.from('finance_requests').update({ status: 'submitted_to_bank' }).eq('id', selectedId);
    toast.success(`${selectedBanks.length} E-Mails versendet`);
    setSelectedBanks([]);
  };

  const handleExternalHandoff = async () => {
    if (!selectedId) return;
    await createLog.mutateAsync({ finance_request_id: selectedId, channel: 'external', status: 'handed_over', external_software_name: externalSoftwareName, tenant_id: activeTenantId! });
    await supabase.from('finance_requests').update({ status: 'submitted_to_bank' }).eq('id', selectedId);
    toast.success(`Fall an ${externalSoftwareName} übergeben`);
  };

  // Europace
  const handleEuropaceRequest = async () => {
    if (!selectedId || !request) return;
    setEpLoading(true); setEpError(null); setEpVorschlaege([]); setEpLeadRating(null); setEpAnfrageId(null);
    try {
      const caseData: EuropaceCaseData = {
        caseId: selectedId,
        applicant: { net_income_monthly: applicant?.net_income_monthly ?? undefined, birth_date: applicant?.birth_date ?? undefined, equity_amount: applicant?.equity_amount ?? undefined, purchase_price: applicant?.purchase_price ?? undefined, object_type: applicant?.object_type ?? undefined, address_postal_code: applicant?.address_postal_code ?? undefined, address_city: applicant?.address_city ?? undefined, employment_type: applicant?.employment_type ?? undefined, employed_since: applicant?.employed_since ?? undefined, contract_type: applicant?.contract_type ?? undefined, other_regular_income_monthly: applicant?.other_regular_income_monthly ?? undefined, max_monthly_rate: applicant?.max_monthly_rate ?? undefined },
        property: { purchase_price: property?.purchase_price ?? undefined, object_type: (property as any)?.object_type ?? undefined, postal_code: property?.postal_code ?? undefined, city: property?.city ?? undefined },
      };
      const anfrageId = await europace_request_vorschlaege(caseData);
      setEpAnfrageId(anfrageId);
      toast.info('Europace: Konditionen werden ermittelt…');
      pollEuropace(anfrageId);
    } catch (err: any) { setEpError(err.message || 'Fehler bei Europace-Anfrage'); setEpLoading(false); }
  };

  const pollEuropace = async (anfrageId: string) => {
    try {
      const result = await europace_poll_vorschlaege(anfrageId);
      if (result === null) { pollRef.current = setTimeout(() => pollEuropace(anfrageId), 2000); return; }
      setEpVorschlaege(result.vorschlaege || []); setEpLeadRating(result.leadRating || null); setEpLoading(false);
      toast.success(`${result.vorschlaege?.length || 0} Vorschläge ermittelt`);
    } catch (err: any) { setEpError(err.message || 'Polling fehlgeschlagen'); setEpLoading(false); }
  };

  useEffect(() => { return () => { if (pollRef.current) clearTimeout(pollRef.current); }; }, [selectedId]);

  const handleUpdateLogStatus = async (logId: string, newStatus: string) => {
    await updateLog.mutateAsync({ id: logId, status: newStatus, ...(newStatus !== 'waiting' && newStatus !== 'sent' ? { response_received_at: new Date().toISOString() } : {}) });
    toast.success('Status aktualisiert');
  };

  const handleSelectBank = async (logId: string) => {
    for (const log of submissionLogs) { if (log.is_selected && log.id !== logId) await updateLog.mutateAsync({ id: log.id, is_selected: false }); }
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
    setSelectedBanks([]); setEmailDrafts({});
  };

  if (isLoading) {
    return <PageShell><div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader title="Einreichung" description={`${readyCases.length} Einreichungen — Dokumentation aller Bank-Einreichungen.`} />

      <WidgetGrid>
        {readyCases.map(c => {
          const reqId = c.finance_mandates?.finance_request_id || c.id;
          return <WidgetCell key={c.id}><FinanceCaseCard caseData={c} isSelected={selectedId === reqId} onClick={() => handleCaseSelect(reqId)} /></WidgetCell>;
        })}
        {readyCases.length === 0 && <WidgetCell><FinanceCaseCardPlaceholder label="Keine Akten bereit" /></WidgetCell>}
      </WidgetGrid>

      <FinanzExposeeCard selectedId={selectedId} reqLoading={reqLoading} request={request} applicant={applicant} property={property} />

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> 2. Bankauswahl & E-Mail-Einreichung
            </h3>
          </div>
          <BankSelectionCard
            selectedId={selectedId} selectedBanks={selectedBanks} addBank={addBank} removeBank={removeBank}
            bankSearchQuery={bankSearchQuery} setBankSearchQuery={setBankSearchQuery} filteredBankContacts={filteredBankContacts}
            aiSearchInput={aiSearchInput} setAiSearchInput={setAiSearchInput} searchBanks={() => searchBanks()} researchEngine={researchEngine}
            manualBankName={manualBankName} setManualBankName={setManualBankName} manualBankEmail={manualBankEmail} setManualBankEmail={setManualBankEmail} addManualBank={addManualBank}
          />
          <Separator />
          <EmailDraftsSection
            selectedBanks={selectedBanks} emailSubject={emailSubject} getEmailDraft={getEmailDraft} setEmailDrafts={setEmailDrafts}
            updateBankEmail={updateBankEmail} generateEmailBody={generateEmailBody} handleSendEmail={handleSendEmail} handleSendAll={handleSendAll} sendEmailPending={sendEmail.isPending}
          />
        </CardContent>
      </Card>

      <SubmissionStatusCard selectedId={selectedId} submissionLogs={submissionLogs} handleUpdateLogStatus={handleUpdateLogStatus} handleSelectBank={handleSelectBank} handleArchiveCase={handleArchiveCase} />

      <EuropaceCard
        selectedId={selectedId} request={request} epLoading={epLoading} epAnfrageId={epAnfrageId} epVorschlaege={epVorschlaege} epLeadRating={epLeadRating} epError={epError}
        handleEuropaceRequest={handleEuropaceRequest} externalSoftwareName={externalSoftwareName} setExternalSoftwareName={setExternalSoftwareName}
        handleExternalHandoff={handleExternalHandoff} createLogPending={createLog.isPending}
      />
    </PageShell>
  );
}

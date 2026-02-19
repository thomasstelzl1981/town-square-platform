/**
 * FM Einreichung — 4 eigenständige Kacheln:
 * 1. Exposé  2. Bankauswahl + E-Mail  3. Status & Ergebnis  4. Europace API
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileText, Building2, Mail, Check, Globe,
  Send, AlertTriangle, Archive, Download, X, Plus, Sparkles, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { useFinanceRequest } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import {
  useSubmissionLogs, useCreateSubmissionLog,
  useSendSubmissionEmail, useUpdateSubmissionLog,
} from '@/hooks/useFinanceSubmission';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SearchProgressIndicator } from '@/components/portal/shared/SearchProgressIndicator';
import type { FutureRoomCase } from '@/types/finance';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const READY_STATUSES = ['ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'];
const MAX_BANKS = 4;

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

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

interface SelectedBank {
  id: string;
  name: string;
  email: string;
  source: 'kontaktbuch' | 'ki' | 'manuell';
}

// ─── KI-Vorschläge — Google Places Ergebnistyp ───────────────────────
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
}

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

  // ─── KI-Bankensuche State ──────────────────────────────────────────
  const [aiResults, setAiResults] = useState<PlaceResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [aiElapsed, setAiElapsed] = useState(0);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applicant = request?.applicant_profiles?.[0];
  const property = request?.properties;

  // Default-Suchbegriff aus Falldaten
  const defaultAiQuery = useMemo(() => {
    const plz = property?.postal_code || applicant?.address_postal_code || '';
    const city = property?.city || applicant?.address_city || '';
    return [plz, city].filter(Boolean).join(' ');
  }, [property?.postal_code, property?.city, applicant?.address_postal_code, applicant?.address_city]);

  // ─── KI-Bankensuche via Google Places ──────────────────────────────
  const searchBanks = useCallback(async (customQuery?: string) => {
    const locationHint = customQuery?.trim() || aiSearchInput.trim() || defaultAiQuery;
    if (!locationHint) { setAiResults([]); return; }

    setAiLoading(true);
    setAiError(null);
    setAiElapsed(0);
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    aiTimerRef.current = setInterval(() => setAiElapsed(p => p + 1), 1000);

    try {
      const { data, error } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'find_companies',
          query: `Bank ${locationHint}`,
          location: locationHint,
          max_results: 25,
          context: { module: 'finanzierung' },
        },
      });
      if (error) throw error;
      const mapped = (data?.results || []).map((r: any, idx: number) => ({
        place_id: `engine_${idx}`,
        name: r.name,
        formatted_address: r.address || '',
        phone_number: r.phone,
        website: r.website,
        rating: r.rating,
        user_ratings_total: r.reviews_count,
      }));
      setAiResults(mapped as PlaceResult[]);
    } catch (err: any) {
      console.error('KI-Bankensuche Fehler:', err);
      setAiError('Bankensuche fehlgeschlagen');
      toast.error('KI-Bankensuche fehlgeschlagen');
    } finally {
      if (aiTimerRef.current) { clearInterval(aiTimerRef.current); aiTimerRef.current = null; }
      setAiLoading(false);
    }
  }, [aiSearchInput, defaultAiQuery]);

  // Auto-Suche wenn Fall ausgewählt & Daten geladen + Suchfeld vorbelegen
  useEffect(() => {
    if (selectedId && !reqLoading && (applicant || property)) {
      setAiSearchInput(defaultAiQuery);
      searchBanks(defaultAiQuery);
    } else {
      setAiResults([]);
      setAiSearchInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, reqLoading, defaultAiQuery]);

  // ─── Bank helpers ───────────────────────────────────────────────────
  const addBank = (bank: SelectedBank) => {
    if (selectedBanks.length >= MAX_BANKS) { toast.info(`Maximal ${MAX_BANKS} Banken auswählbar`); return; }
    if (selectedBanks.some(b => b.id === bank.id)) { toast.info('Bank bereits ausgewählt'); return; }
    setSelectedBanks(prev => [...prev, bank]);
  };

  const removeBank = (id: string) => {
    setSelectedBanks(prev => prev.filter(b => b.id !== id));
  };

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

  // ─── E-Mail helpers ─────────────────────────────────────────────────
  const generateEmailBody = () => {
    const name = `${applicant?.first_name || '[Kundenname]'} ${applicant?.last_name || ''}`.trim();
    const amount = applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : '[Betrag]';
    const objectType = applicant?.object_type || '[Objekttyp]';
    const location = [property?.postal_code || applicant?.address_postal_code, property?.city || applicant?.address_city].filter(Boolean).join(' ') || '[PLZ Ort]';
    const purchasePrice = (property?.purchase_price || applicant?.purchase_price) ? eurFormat.format(property?.purchase_price || applicant?.purchase_price || 0) : '[Kaufpreis]';
    const equity = applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : '[EK]';

    return `Sehr geehrte Damen und Herren,

anbei übermittle ich Ihnen die Finanzierungsanfrage für ${name} über ${amount}.

Die vollständige Finanzierungsakte inkl. Selbstauskunft und Bonitätsunterlagen finden Sie im beigefügten PDF sowie im Datenraum.

Eckdaten:
- Objektart: ${objectType}
- Standort: ${location}
- Kaufpreis: ${purchasePrice}
- Darlehenswunsch: ${amount}
- Eigenkapital: ${equity}

Für Rückfragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`;
  };

  const getEmailDraft = (bankKey: string) => emailDrafts[bankKey] || generateEmailBody();

  const emailSubject = `Finanzierungsanfrage ${request?.public_id || selectedId?.slice(0, 8) || '...'} — ${applicant?.first_name || '[Vorname]'} ${applicant?.last_name || '[Nachname]'}`;

  const updateBankEmail = (bankId: string, email: string) => {
    setSelectedBanks(prev => prev.map(b => b.id === bankId ? { ...b, email } : b));
  };

  const handleSendEmail = async (bank: SelectedBank) => {
    if (!selectedId || !bank.email) {
      toast.error(`${bank.name}: Keine E-Mail-Adresse`);
      return;
    }
    const body = getEmailDraft(bank.id);

    if (bank.source === 'kontaktbuch') {
      await sendEmail.mutateAsync({
        finance_request_id: selectedId,
        bank_contact_id: bank.id,
        to_email: bank.email,
        subject: emailSubject,
        html_content: body.replace(/\n/g, '<br/>'),
      });
    } else {
      // KI- und manuelle Banken: auch via Resend senden
      const { error: mailError } = await supabase.functions.invoke('sot-system-mail-send', {
        body: {
          to: bank.email,
          subject: emailSubject,
          html_content: body.replace(/\n/g, '<br/>'),
          context: 'finance_submission',
        },
      });
      if (mailError) { toast.error(`Versand an ${bank.name} fehlgeschlagen`); return; }

      await createLog.mutateAsync({
        finance_request_id: selectedId,
        channel: 'email',
        status: 'sent',
        email_subject: emailSubject,
        email_body: body,
        external_software_name: bank.name,
        tenant_id: activeTenantId!,
      });
      toast.success(`E-Mail an ${bank.name} versendet`);
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
    await createLog.mutateAsync({
      finance_request_id: selectedId,
      channel: 'external',
      status: 'handed_over',
      external_software_name: externalSoftwareName,
      tenant_id: activeTenantId!,
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
        title="Einreichung"
        description={`${readyCases.length} Einreichungen — Dokumentation aller Bank-Einreichungen.`}
      />

      {/* ── Case Widget Cards ── */}
      <WidgetGrid>
        {readyCases.map(c => {
          const reqId = c.finance_mandates?.finance_request_id || c.id;
          return (
            <WidgetCell key={c.id}>
              <FinanceCaseCard
                caseData={c}
                isSelected={selectedId === reqId}
                onClick={() => handleCaseSelect(reqId)}
              />
            </WidgetCell>
          );
        })}
        {readyCases.length === 0 && (
          <WidgetCell>
            <FinanceCaseCardPlaceholder label="Keine Akten bereit" />
          </WidgetCell>
        )}
      </WidgetGrid>

      {/* ── KACHEL 1: Exposé ── */}
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

      {/* ── KACHEL 2: Bankauswahl & E-Mail-Einreichung ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> 2. Bankauswahl & E-Mail-Einreichung
            </h3>
          </div>

          {/* ── Bankauswahl Bereich — 2×2 Grid + Sammlung ── */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── Quelle 1: Zone-1 Kontaktbuch ── */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Bankkontaktbuch (Zone 1)
                </div>
                <Input
                  placeholder="Bank suchen..."
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {filteredBankContacts.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">Keine Banken gefunden</p>
                  ) : (
                    filteredBankContacts.slice(0, 12).map(bank => (
                      <button
                        key={bank.id}
                        onClick={() => addBank({
                          id: bank.id,
                          name: bank.bank_name,
                          email: bank.contact_email || '',
                          source: 'kontaktbuch',
                        })}
                        disabled={selectedBanks.length >= MAX_BANKS || selectedBanks.some(b => b.email === bank.contact_email)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/5 transition-colors disabled:opacity-40',
                          selectedBanks.some(b => b.email === bank.contact_email) && 'bg-primary/10'
                        )}
                      >
                        <span className="font-medium">{bank.bank_name}</span>
                        {bank.contact_email && (
                          <span className="text-muted-foreground ml-1">— {bank.contact_email}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Quelle 2: KI-Suche (Google Places) ── */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                  KI-Bankensuche
                  {aiResults.length > 0 && (
                    <Badge variant="outline" className="text-[9px] ml-auto">{aiResults.length} Treffer</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="PLZ, Ort oder Adresse eingeben…"
                    value={aiSearchInput}
                    onChange={(e) => setAiSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchBanks()}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs shrink-0"
                    onClick={() => searchBanks()}
                    disabled={aiLoading || !aiSearchInput.trim()}
                  >
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    KI-Suche
                  </Button>
                </div>

                {aiLoading ? (
                  <SearchProgressIndicator
                    elapsedSeconds={aiElapsed}
                    estimatedDuration={55}
                    phases={[
                      { upTo: 15, label: "Banken im Umkreis suchen…" },
                      { upTo: 35, label: "Websites nach Kontaktdaten scannen…" },
                      { upTo: 55, label: "Ergebnisse zusammenführen…" },
                    ]}
                  />
                ) : aiError ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-[10px] text-destructive">{aiError}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => searchBanks()}>
                      Erneut suchen
                    </Button>
                  </div>
                ) : aiResults.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    {selectedId ? 'Suchbegriff eingeben und „KI-Suche" klicken' : 'Bitte zuerst eine Akte auswählen'}
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {aiResults.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={() => addBank({
                          id: place.place_id,
                          name: place.name,
                          email: '',
                          source: 'ki',
                        })}
                        disabled={selectedBanks.length >= MAX_BANKS || selectedBanks.some(b => b.id === place.place_id)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors disabled:opacity-40"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-accent-foreground shrink-0" />
                          <span className="font-medium truncate">{place.name}</span>
                          <Plus className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                        </div>
                        <div className="pl-5 text-[10px] text-muted-foreground truncate">{place.formatted_address}</div>
                        {place.phone_number && (
                          <div className="pl-5 text-[10px] text-muted-foreground">{place.phone_number}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Quelle 3: Manuelle Eingabe ── */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Manuelle Eingabe
                </div>
                <Input
                  placeholder="Bankname"
                  value={manualBankName}
                  onChange={(e) => setManualBankName(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="E-Mail-Adresse"
                  type="email"
                  value={manualBankEmail}
                  onChange={(e) => setManualBankEmail(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs w-full"
                  onClick={addManualBank}
                  disabled={selectedBanks.length >= MAX_BANKS}
                >
                  <Plus className="h-3 w-3 mr-1" /> Hinzufügen
                </Button>
              </div>

              {/* ── Ausgewählte Banken (Sammlung) ── */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Ausgewählte Banken
                  <Badge variant="outline" className="text-[9px] ml-auto">{selectedBanks.length}/{MAX_BANKS}</Badge>
                </div>
                {selectedBanks.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-6">
                    Noch keine Banken ausgewählt. Wählen Sie bis zu {MAX_BANKS} Banken aus den anderen Quellen.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedBanks.map((bank, idx) => (
                      <div key={bank.id} className="flex items-center gap-2 border rounded px-3 py-2 bg-muted/20">
                        <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{bank.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {bank.email || 'E-Mail wird im Entwurf ergänzt'}
                            <Badge variant="outline" className="text-[9px] ml-2">
                              {bank.source === 'kontaktbuch' ? 'Kontaktbuch' : bank.source === 'ki' ? 'KI' : 'Manuell'}
                            </Badge>
                          </div>
                        </div>
                        <button onClick={() => removeBank(bank.id)} className="hover:bg-destructive/20 rounded-full p-1 shrink-0">
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    {/* Leere Slots anzeigen */}
                    {Array.from({ length: MAX_BANKS - selectedBanks.length }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="flex items-center gap-2 border border-dashed rounded px-3 py-2">
                        <span className="text-xs font-bold text-muted-foreground/40 w-5">{selectedBanks.length + idx + 1}.</span>
                        <span className="text-[10px] text-muted-foreground/40 italic">Frei — Bank aus Suche oder KI wählen</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* ── E-Mail-Client (immer sichtbar) ── */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">E-Mail-Entwürfe</span>
              {selectedBanks.length > 0 && (
                <Badge variant="outline" className="text-[10px] ml-auto">{selectedBanks.length} Empfänger</Badge>
              )}
            </div>

            {selectedBanks.length === 0 ? (
              /* Generischer Entwurf als Vorschau */
              <div className="border rounded-md overflow-hidden opacity-70">
                <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                  <span className="font-semibold text-sm text-muted-foreground">[Bank auswählen]</span>
                  <Badge variant="outline" className="text-[10px]">Vorschau</Badge>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  <div><span className="text-muted-foreground">An:</span> <span className="text-muted-foreground italic">wird nach Bankauswahl befüllt</span></div>
                  <div><span className="text-muted-foreground">Betreff:</span> {emailSubject}</div>
                  <Textarea
                    value={generateEmailBody()}
                    readOnly
                    className="text-xs min-h-[180px] mt-2 bg-muted/10"
                  />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">📎 Finanzierungsakte.pdf</Badge>
                    <Badge variant="secondary" className="text-[10px]">📎 Datenraum-Link</Badge>
                  </div>
                </div>
              </div>
            ) : (
              /* Pro Bank ein editierbarer Entwurf */
              <>
                {selectedBanks.map(bank => (
                  <div key={bank.id} className="border rounded-md overflow-hidden">
                    <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{bank.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {bank.source === 'kontaktbuch' ? 'Kontaktbuch' : bank.source === 'ki' ? 'KI' : 'Manuell'}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Entwurf</Badge>
                    </div>
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground shrink-0">An:</span>
                        <Input
                          value={bank.email}
                          onChange={(e) => updateBankEmail(bank.id, e.target.value)}
                          placeholder="E-Mail-Adresse eingeben…"
                          type="email"
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                      <div><span className="text-muted-foreground">Betreff:</span> {emailSubject}</div>
                      <Textarea
                        value={getEmailDraft(bank.id)}
                        onChange={(e) => setEmailDrafts(prev => ({ ...prev, [bank.id]: e.target.value }))}
                        className="text-xs min-h-[180px] mt-2"
                      />
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">📎 Finanzierungsakte.pdf</Badge>
                        <Badge variant="secondary" className="text-[10px]">📎 Datenraum-Link</Badge>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendEmail(bank)} disabled={sendEmail.isPending || !bank.email}>
                          <Send className="h-3 w-3 mr-1" /> Senden
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSendAll} disabled={sendEmail.isPending} className="text-xs">
                    <Send className="h-3.5 w-3.5 mr-1" /> Alle senden ({selectedBanks.length})
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── KACHEL 3: Status & Ergebnis ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Check className="h-4 w-4" /> 3. Status & Ergebnis
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

      {/* ── KACHEL 4: API-Übergabe (Europace) ── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" /> 4. API-Übergabe (Europace)
            </h3>
          </div>
          <div className="p-4">
            <div className="border border-dashed rounded-md p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Die Übergabe an eine externe Software (z. B. Europace) erfolgt unabhängig vom E-Mail-Einreichungsweg. Der Fall wird als „übergeben" markiert — keine Rückspielung.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={externalSoftwareName}
                  onChange={(e) => setExternalSoftwareName(e.target.value)}
                  placeholder="Software-Name"
                  className="h-8 text-sm max-w-[200px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExternalHandoff}
                  disabled={createLog.isPending || !selectedId}
                  className="h-8 text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" /> Fall übergeben
                </Button>
              </div>
              {!selectedId && (
                <p className="text-[10px] text-muted-foreground">Bitte wählen Sie oben eine Akte aus.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

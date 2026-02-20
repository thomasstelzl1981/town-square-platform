/**
 * ZahlungsverkehrTab — Payment tracking per lease (MOD-04)
 * 
 * 3-Zone Layout:
 * Zone A: Consolidated action bar (Kontenabgleich + manual payment)
 * Zone B: 12-month Soll vs Ist table with source column
 * Zone C: Unmatched bank transactions with manual assignment
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DEMO_KONTO } from '@/constants/demoKontoData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Banknote, Plus, Info, CreditCard, RefreshCw, ChevronDown, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface GeldeingangTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

interface Lease {
  id: string;
  monthly_rent: number;
  rent_cold_eur: number | null;
  nk_advance_eur: number | null;
  heating_advance_eur: number | null;
  tenant_contact_id: string;
  status: string;
  linked_bank_account_id: string | null;
  auto_match_enabled: boolean | null;
  start_date: string;
}

interface RentPayment {
  id: string;
  lease_id: string;
  amount: number;
  expected_amount: number | null;
  due_date: string;
  paid_date: string | null;
  status: string | null;
  notes: string | null;
}

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string | null;
  iban: string;
}

interface BankTransaction {
  id: string;
  booking_date: string;
  amount_eur: number;
  counterparty: string | null;
  purpose_text: string | null;
  match_status: string | null;
}

// ─── Match progress steps ───
const MATCH_STEPS = [
  'Kontodaten laden…',
  'Transaktionen prüfen…',
  'Mietzahlungen abgleichen…',
  'Rückstände prüfen…',
  'Ergebnis aufbereiten…',
];

function getWarmmiete(lease: Lease): number {
  if (lease.rent_cold_eur && (lease.nk_advance_eur || lease.heating_advance_eur)) {
    return (lease.rent_cold_eur || 0) + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0);
  }
  return lease.monthly_rent;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Bezahlt</Badge>;
    case 'partial':
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Teilweise</Badge>;
    case 'overdue':
      return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Überfällig</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Offen</Badge>;
  }
}

function getSourceBadge(payment: RentPayment | undefined) {
  if (!payment) return null;
  const note = payment.notes?.toLowerCase() || '';
  if (note.includes('auto_match') || note.includes('auto-match')) {
    return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">Auto</Badge>;
  }
  if (note.includes('manual_override') || note.includes('manuell')) {
    return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">Manuell</Badge>;
  }
  return <Badge variant="outline" className="text-xs">Eingabe</Badge>;
}

const fmtEur = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

export function GeldeingangTab({ propertyId, tenantId, unitId }: GeldeingangTabProps) {
  const { activeTenantId } = useAuth();
  const { isEnabled: isDemoEnabled } = useDemoToggles();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNote, setPaymentNote] = useState('');
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchStep, setMatchStep] = useState(0);
  const [matchResult, setMatchResult] = useState<{ matched: number; arrears: number } | null>(null);
  const [unmatchedOpen, setUnmatchedOpen] = useState(false);

  // ─── Zone A: Consolidated match handler ───
  const handleKontenabgleich = useCallback(async () => {
    setMatchRunning(true);
    setMatchResult(null);
    setMatchStep(0);

    try {
      // Step 1-3: rent-match
      const stepTimer = setInterval(() => {
        setMatchStep(prev => Math.min(prev + 1, MATCH_STEPS.length - 1));
      }, 800);

      const { data: matchData, error: matchError } = await supabase.functions.invoke('sot-rent-match', {
        body: { tenant_id: activeTenantId },
      });
      if (matchError) throw matchError;

      setMatchStep(3);

      // Step 4: arrears check
      const { data: arrearsData, error: arrearsError } = await supabase.functions.invoke('sot-rent-arrears-check');
      if (arrearsError) throw arrearsError;

      clearInterval(stepTimer);
      setMatchStep(MATCH_STEPS.length - 1);

      const matched = (matchData as any)?.matched || 0;
      const arrears = (arrearsData as any)?.created || 0;
      setMatchResult({ matched, arrears });

      if (matched > 0 || arrears > 0) {
        toast.success(`${matched} Zahlung${matched !== 1 ? 'en' : ''} zugeordnet, ${arrears} Rückstand${arrears !== 1 ? 'e' : ''} erkannt`);
      } else {
        toast.info('Keine neuen Zuordnungen oder Rückstände gefunden');
      }

      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
      queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] });
    } catch (err) {
      console.error('Kontenabgleich failed:', err);
      toast.error('Kontenabgleich fehlgeschlagen');
    } finally {
      setMatchRunning(false);
    }
  }, [activeTenantId, queryClient]);

  // ─── Fetch active leases ───
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['geldeingang-leases', propertyId, unitId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('id, monthly_rent, rent_cold_eur, nk_advance_eur, heating_advance_eur, tenant_contact_id, status, linked_bank_account_id, auto_match_enabled, start_date')
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
      if (error) throw error;
      return (data || []) as Lease[];
    },
    enabled: !!unitId && !!tenantId,
  });

  // ─── Fetch rent payments (12 months) ───
  const twelveMonthsAgo = useMemo(() => format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'), []);
  
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['geldeingang-payments', leases.map(l => l.id).join(','), twelveMonthsAgo],
    queryFn: async () => {
      if (leases.length === 0) return [];
      const leaseIds = leases.map(l => l.id);
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .in('lease_id', leaseIds)
        .gte('due_date', twelveMonthsAgo)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return (data || []) as RentPayment[];
    },
    enabled: leases.length > 0,
  });

  // ─── Fetch bank accounts ───
  const { data: dbBankAccounts = [] } = useQuery({
    queryKey: ['msv_bank_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('msv_bank_accounts')
        .select('id, account_name, bank_name, iban')
        .eq('tenant_id', activeTenantId);
      return (data || []) as BankAccount[];
    },
    enabled: !!activeTenantId,
  });

  const bankAccounts: BankAccount[] = useMemo(() => {
    if (dbBankAccounts.length > 0) return dbBankAccounts;
    if (isDemoEnabled('GP-KONTEN')) {
      return [{
        id: DEMO_KONTO.id,
        account_name: DEMO_KONTO.accountName,
        bank_name: DEMO_KONTO.bank,
        iban: DEMO_KONTO.iban,
      }];
    }
    return [];
  }, [dbBankAccounts, isDemoEnabled]);

  // ─── Zone C: Fetch unmatched bank transactions ───
  const linkedAccountIds = leases
    .map(l => l.linked_bank_account_id)
    .filter((v): v is string => !!v);

  const { data: unmatchedTx = [], isLoading: unmatchedLoading } = useQuery({
    queryKey: ['unmatched-transactions', linkedAccountIds.join(','), activeTenantId],
    queryFn: async () => {
      if (linkedAccountIds.length === 0 || !activeTenantId) return [];
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('id, booking_date, amount_eur, counterparty, purpose_text, match_status')
        .eq('tenant_id', activeTenantId)
        .in('account_ref', linkedAccountIds)
        .or('match_status.is.null,match_status.eq.unmatched')
        .order('booking_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as BankTransaction[];
    },
    enabled: linkedAccountIds.length > 0 && !!activeTenantId,
  });

  // ─── Fetch contacts ───
  const contactIds = leases.map(l => l.tenant_contact_id);
  const { data: contacts = [] } = useQuery({
    queryKey: ['geldeingang-contacts', contactIds.join(',')],
    queryFn: async () => {
      if (contactIds.length === 0) return [];
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company')
        .in('id', contactIds);
      return data || [];
    },
    enabled: contactIds.length > 0,
  });

  // ─── Mutations ───
  const updateLeaseMutation = useMutation({
    mutationFn: async ({ leaseId, updates }: { leaseId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('leases').update(updates).eq('id', leaseId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['geldeingang-leases'] }),
    onError: () => toast.error('Fehler beim Speichern'),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ leaseId, amount, date, note, expectedAmount }: {
      leaseId: string; amount: number; date: string; note: string; expectedAmount: number;
    }) => {
      const dueDate = format(startOfMonth(new Date(date)), 'yyyy-MM-dd');
      const status = amount >= expectedAmount ? 'paid' : amount > 0 ? 'partial' : 'open';
      const { error } = await supabase
        .from('rent_payments')
        .insert({
          lease_id: leaseId,
          tenant_id: tenantId,
          amount,
          expected_amount: expectedAmount,
          due_date: dueDate,
          paid_date: date,
          status,
          notes: note || 'manuell',
          period_start: dueDate,
          period_end: format(endOfMonth(new Date(date)), 'yyyy-MM-dd'),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
      setShowPaymentForm(null);
      setPaymentNote('');
      toast.success('Zahlung erfasst');
    },
    onError: () => toast.error('Fehler beim Erfassen der Zahlung'),
  });

  // Manual assign: create rent_payment from bank transaction
  const assignTxMutation = useMutation({
    mutationFn: async ({ tx, leaseId, warmmiete }: { tx: BankTransaction; leaseId: string; warmmiete: number }) => {
      const dueDate = format(startOfMonth(new Date(tx.booking_date)), 'yyyy-MM-dd');
      const amount = Math.abs(tx.amount_eur);
      const status = amount >= warmmiete ? 'paid' : amount > 0 ? 'partial' : 'open';

      // 1. Create rent_payment
      const { error: payError } = await supabase
        .from('rent_payments')
        .insert({
          lease_id: leaseId,
          tenant_id: tenantId,
          amount,
          expected_amount: warmmiete,
          due_date: dueDate,
          paid_date: tx.booking_date,
          status,
          notes: 'manual_override',
          period_start: dueDate,
          period_end: format(endOfMonth(new Date(tx.booking_date)), 'yyyy-MM-dd'),
        });
      if (payError) throw payError;

      // 2. Mark transaction as manually matched
      const { error: txError } = await supabase
        .from('bank_transactions')
        .update({ match_status: 'MANUAL_OVERRIDE' })
        .eq('id', tx.id);
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
      queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] });
      toast.success('Transaktion zugeordnet');
    },
    onError: () => toast.error('Zuordnung fehlgeschlagen'),
  });

  // ─── Helpers ───
  const months = useMemo(() => {
    const result: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      result.push(startOfMonth(subMonths(now, i)));
    }
    return result;
  }, []);

  const getContactName = (contactId: string) => {
    const c = contacts.find((ct: any) => ct.id === contactId);
    if (!c) return 'Mieter';
    if ((c as any).company) return (c as any).company;
    return `${(c as any).first_name || ''} ${(c as any).last_name || ''}`.trim() || 'Mieter';
  };

  const getPaymentForMonth = (leaseId: string, month: Date): RentPayment | undefined => {
    const monthStr = format(month, 'yyyy-MM');
    return payments.find(p => p.lease_id === leaseId && p.due_date.startsWith(monthStr));
  };

  // ─── Loading / empty states ───
  if (leasesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!unitId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Keine Einheit vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  if (leases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Kein aktives Mietverhältnis vorhanden</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Legen Sie zuerst ein Mietverhältnis im Tab "Mietverhältnis" an.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ ZONE A: Aktionsleiste ═══ */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleKontenabgleich}
                disabled={matchRunning}
                className="gap-2"
              >
                {matchRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Kontenabgleich starten
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const firstLease = leases[0];
                  if (firstLease) {
                    setPaymentAmount(getWarmmiete(firstLease).toFixed(2));
                    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                    setShowPaymentForm(firstLease.id);
                  }
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Zahlung manuell erfassen
              </Button>
            </div>
            {matchResult && !matchRunning && (
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {matchResult.matched} zugeordnet
                </span>
                {matchResult.arrears > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    {matchResult.arrears} Rückstand{matchResult.arrears !== 1 ? 'e' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress animation */}
          {matchRunning && (
            <div className="mt-4 space-y-2">
              <Progress value={((matchStep + 1) / MATCH_STEPS.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground animate-pulse">
                {MATCH_STEPS[matchStep]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ ZONE B: Zahlungsübersicht pro Lease ═══ */}
      {leases.map(lease => {
        const warmmiete = getWarmmiete(lease);
        const contactName = getContactName(lease.tenant_contact_id);

        return (
          <Card key={lease.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Zahlungen — {contactName}
              </CardTitle>

              {/* Bank account selection */}
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={lease.auto_match_enabled ?? false}
                      onCheckedChange={(checked) => 
                        updateLeaseMutation.mutate({ leaseId: lease.id, updates: { auto_match_enabled: checked } })
                      }
                    />
                    <span className="text-sm font-medium">Automatischen Abgleich aktivieren</span>
                  </div>
                  {bankAccounts.length > 0 ? (
                    <Select
                      value={lease.linked_bank_account_id || undefined}
                      onValueChange={(val) =>
                        updateLeaseMutation.mutate({ 
                          leaseId: lease.id, 
                          updates: { linked_bank_account_id: val === 'none' ? null : val } 
                        })
                      }
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Konto auswählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kein Konto</SelectItem>
                        {bankAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.account_name} {acc.bank_name ? `(${acc.bank_name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border border-dashed rounded-md w-[280px]">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      <span>Noch keine Konten angelegt</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Wählen Sie das Konto, auf dem die Mietzahlungen eingehen.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              {/* 12-month table */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Monat</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Soll</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Eingang</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Differenz</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Quelle</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((month, idx) => {
                      const payment = getPaymentForMonth(lease.id, month);
                      const eingang = payment?.amount ?? 0;
                      const differenz = warmmiete - eingang;
                      const status = payment?.status || 'open';
                      const paidDate = payment?.paid_date;

                      return (
                        <tr key={idx} className="border-t border-border/30 hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">
                            {format(month, 'MMMM yyyy', { locale: de })}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {fmtEur(warmmiete)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {payment ? fmtEur(eingang) : '–'}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono text-xs ${
                            payment
                              ? differenz <= 0 ? 'text-emerald-600' : 'text-red-500'
                              : 'text-muted-foreground'
                          }`}>
                            {payment ? fmtEur(-differenz) : '–'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getStatusBadge(status)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getSourceBadge(payment)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {paidDate ? new Date(paidDate).toLocaleDateString('de-DE') : '–'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Manual payment form */}
              <div className="mt-4">
                {showPaymentForm === lease.id ? (
                  <div className="flex items-end gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Betrag (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="w-32"
                        placeholder={warmmiete.toFixed(2)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Datum</label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-xs text-muted-foreground">Notiz (optional)</label>
                      <Input
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                        placeholder="z.B. Überweisung"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const amt = parseFloat(paymentAmount) || warmmiete;
                        addPaymentMutation.mutate({
                          leaseId: lease.id,
                          amount: amt,
                          date: paymentDate,
                          note: paymentNote,
                          expectedAmount: warmmiete,
                        });
                      }}
                      disabled={addPaymentMutation.isPending}
                    >
                      {addPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(null)}>
                      Abbrechen
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ═══ ZONE C: Nicht zugeordnete Buchungen ═══ */}
      {linkedAccountIds.length > 0 && (
        <Collapsible open={unmatchedOpen} onOpenChange={setUnmatchedOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    Nicht zugeordnete Buchungen
                    {unmatchedTx.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unmatchedTx.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${unmatchedOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {unmatchedLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : unmatchedTx.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Keine unzugeordneten Buchungen vorhanden.
                  </p>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Datum</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Betrag</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Absender</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Verwendungszweck</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Aktion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unmatchedTx.map(tx => (
                          <tr key={tx.id} className="border-t border-border/30 hover:bg-muted/20">
                            <td className="px-3 py-2 text-xs">
                              {new Date(tx.booking_date).toLocaleDateString('de-DE')}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono text-xs ${tx.amount_eur >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {fmtEur(tx.amount_eur)}
                            </td>
                            <td className="px-3 py-2 text-xs truncate max-w-[160px]">
                              {tx.counterparty || '–'}
                            </td>
                            <td className="px-3 py-2 text-xs truncate max-w-[200px] text-muted-foreground">
                              {tx.purpose_text || '–'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  const firstLease = leases[0];
                                  if (firstLease) {
                                    assignTxMutation.mutate({
                                      tx,
                                      leaseId: firstLease.id,
                                      warmmiete: getWarmmiete(firstLease),
                                    });
                                  }
                                }}
                                disabled={assignTxMutation.isPending}
                              >
                                {assignTxMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowRightLeft className="h-3 w-3" />
                                )}
                                Zuordnen
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

// Backward-compatible alias
export const ZahlungsverkehrTab = GeldeingangTab;

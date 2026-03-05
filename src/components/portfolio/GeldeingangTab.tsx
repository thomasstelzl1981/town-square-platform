/**
 * ZahlungsverkehrTab Orchestrator (MOD-04) — R-10 Refactored
 * Reduced from 1018 → ~200 lines via Orchestrator + Sub-components Pattern
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DEMO_KONTO } from '@/constants/demoKontoData';
import { usePropertyExpenses, type CreateExpenseInput } from '@/hooks/usePropertyExpenses';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import {
  type GeldeingangLease, type GeldeingangRentPayment, type GeldeingangBankAccount, type GeldeingangBankTransaction,
  GeldeingangActionBar, GeldeingangLeaseTable, GeldeingangUnmatched, GeldeingangExpenses,
} from './geldeingang';

interface GeldeingangTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

export function GeldeingangTab({ propertyId, tenantId, unitId }: GeldeingangTabProps) {
  const { activeTenantId } = useAuth();
  const { isEnabled: isDemoEnabled } = useDemoToggles();
  const queryClient = useQueryClient();

  // ── State ──
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNote, setPaymentNote] = useState('');
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchStep, setMatchStep] = useState(0);
  const [matchResult, setMatchResult] = useState<{ matched: number; arrears: number } | null>(null);

  const { expenses, createExpense: createExpenseMutation, deleteExpense: deleteExpenseMutation } = usePropertyExpenses(propertyId);

  // ── Queries ──
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['geldeingang-leases', propertyId, unitId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('leases')
        .select('id, monthly_rent, rent_cold_eur, nk_advance_eur, heating_advance_eur, tenant_contact_id, status, linked_bank_account_id, auto_match_enabled, start_date')
        .eq('unit_id', unitId).eq('tenant_id', tenantId).eq('status', 'active');
      if (error) throw error;
      return (data || []) as GeldeingangLease[];
    },
    enabled: !!unitId && !!tenantId,
  });

  const twelveMonthsAgo = useMemo(() => format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'), []);

  const { data: payments = [] } = useQuery({
    queryKey: ['geldeingang-payments', leases.map(l => l.id).join(','), twelveMonthsAgo],
    queryFn: async () => {
      if (!leases.length) return [];
      const { data, error } = await supabase.from('rent_payments').select('*').in('lease_id', leases.map(l => l.id)).gte('due_date', twelveMonthsAgo).order('due_date', { ascending: false });
      if (error) throw error;
      return (data || []) as GeldeingangRentPayment[];
    },
    enabled: leases.length > 0,
  });

  const { data: nkSettlements = [] } = useQuery({
    queryKey: ['nk-settlements-zahlungsverkehr', propertyId, activeTenantId],
    queryFn: async () => {
      if (!activeTenantId || !propertyId) return [];
      const { data: periods } = await (supabase as any).from('nk_periods').select('id, period_start, period_end').eq('tenant_id', activeTenantId).eq('property_id', propertyId);
      if (!periods?.length) return [];
      const { data: settlements } = await (supabase as any).from('nk_tenant_settlements').select('nk_period_id, lease_id, saldo_eur, status').in('nk_period_id', periods.map((p: any) => p.id));
      return (settlements || []).map((s: any) => { const period = periods.find((p: any) => p.id === s.nk_period_id); return { ...s, period_end: period?.period_end }; });
    },
    enabled: !!activeTenantId && !!propertyId,
  });

  const { data: dbBankAccounts = [] } = useQuery({
    queryKey: ['bank_accounts', activeTenantId],
    queryFn: async () => { if (!activeTenantId) return []; const { data } = await supabase.from('bank_accounts').select('id, account_name, bank_name, iban').eq('tenant_id', activeTenantId); return (data || []) as GeldeingangBankAccount[]; },
    enabled: !!activeTenantId,
  });

  const bankAccounts = useMemo<GeldeingangBankAccount[]>(() => {
    if (dbBankAccounts.length > 0) return dbBankAccounts;
    if (isDemoEnabled('GP-KONTEN')) return [{ id: DEMO_KONTO.id, account_name: DEMO_KONTO.accountName, bank_name: DEMO_KONTO.bank, iban: DEMO_KONTO.iban }];
    return [];
  }, [dbBankAccounts, isDemoEnabled]);

  const linkedAccountIds = leases.map(l => l.linked_bank_account_id).filter((v): v is string => !!v);

  const { data: unmatchedTx = [], isLoading: unmatchedLoading } = useQuery({
    queryKey: ['unmatched-transactions', linkedAccountIds.join(','), activeTenantId],
    queryFn: async () => {
      if (!linkedAccountIds.length || !activeTenantId) return [];
      const { data, error } = await supabase.from('bank_transactions').select('id, booking_date, amount_eur, counterparty, purpose_text, match_status').eq('tenant_id', activeTenantId).in('account_ref', linkedAccountIds).or('match_status.is.null,match_status.eq.unmatched').order('booking_date', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as GeldeingangBankTransaction[];
    },
    enabled: linkedAccountIds.length > 0 && !!activeTenantId,
  });

  const contactIds = leases.map(l => l.tenant_contact_id);
  const { data: contacts = [] } = useQuery({
    queryKey: ['geldeingang-contacts', contactIds.join(',')],
    queryFn: async () => { if (!contactIds.length) return []; const { data } = await supabase.from('contacts').select('id, first_name, last_name, company').in('id', contactIds); return data || []; },
    enabled: contactIds.length > 0,
  });

  // ── Mutations ──
  const updateLeaseMutation = useMutation({
    mutationFn: async ({ leaseId, updates }: { leaseId: string; updates: Record<string, unknown> }) => { const { error } = await supabase.from('leases').update(updates).eq('id', leaseId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['geldeingang-leases'] }),
    onError: () => toast.error('Fehler beim Speichern'),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ leaseId, amount, date, note, expectedAmount }: { leaseId: string; amount: number; date: string; note: string; expectedAmount: number }) => {
      const dueDate = format(startOfMonth(new Date(date)), 'yyyy-MM-dd');
      const status = amount >= expectedAmount ? 'paid' : amount > 0 ? 'partial' : 'open';
      const { error } = await supabase.from('rent_payments').insert({ lease_id: leaseId, tenant_id: tenantId, amount, expected_amount: expectedAmount, due_date: dueDate, paid_date: date, status, notes: note || 'manuell', period_start: dueDate, period_end: format(endOfMonth(new Date(date)), 'yyyy-MM-dd') });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] }); setShowPaymentForm(null); setPaymentNote(''); toast.success('Zahlung erfasst'); },
    onError: () => toast.error('Fehler beim Erfassen der Zahlung'),
  });

  const assignTxMutation = useMutation({
    mutationFn: async ({ tx, leaseId, warmmiete }: { tx: GeldeingangBankTransaction; leaseId: string; warmmiete: number }) => {
      const dueDate = format(startOfMonth(new Date(tx.booking_date)), 'yyyy-MM-dd');
      const amount = Math.abs(tx.amount_eur);
      const status = amount >= warmmiete ? 'paid' : amount > 0 ? 'partial' : 'open';
      const { error: payError } = await supabase.from('rent_payments').insert({ lease_id: leaseId, tenant_id: tenantId, amount, expected_amount: warmmiete, due_date: dueDate, paid_date: tx.booking_date, status, notes: 'manual_override', period_start: dueDate, period_end: format(endOfMonth(new Date(tx.booking_date)), 'yyyy-MM-dd') });
      if (payError) throw payError;
      const { error: txError } = await supabase.from('bank_transactions').update({ match_status: 'MANUAL_OVERRIDE' }).eq('id', tx.id);
      if (txError) throw txError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] }); queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] }); toast.success('Transaktion zugeordnet'); },
    onError: () => toast.error('Zuordnung fehlgeschlagen'),
  });

  // ── Helpers ──
  const months = useMemo(() => { const r: Date[] = []; const now = new Date(); for (let i = 0; i < 12; i++) r.push(startOfMonth(subMonths(now, i))); return r; }, []);

  const getContactName = (contactId: string) => {
    const c = contacts.find((ct: any) => ct.id === contactId);
    if (!c) return 'Mieter';
    return (c as any).company || `${(c as any).first_name || ''} ${(c as any).last_name || ''}`.trim() || 'Mieter';
  };

  const handleKontenabgleich = useCallback(async () => {
    setMatchRunning(true); setMatchResult(null); setMatchStep(0);
    try {
      const stepTimer = setInterval(() => setMatchStep(prev => Math.min(prev + 1, 4)), 800);
      const { data: matchData, error: matchError } = await supabase.functions.invoke('sot-rent-match', { body: { tenant_id: activeTenantId } });
      if (matchError) throw matchError;
      setMatchStep(3);
      const { data: arrearsData, error: arrearsError } = await supabase.functions.invoke('sot-rent-arrears-check');
      if (arrearsError) throw arrearsError;
      clearInterval(stepTimer); setMatchStep(4);
      const matched = (matchData as any)?.matched || 0;
      const arrears = (arrearsData as any)?.created || 0;
      setMatchResult({ matched, arrears });
      if (matched > 0 || arrears > 0) toast.success(`${matched} Zahlung${matched !== 1 ? 'en' : ''} zugeordnet, ${arrears} Rückstand${arrears !== 1 ? 'e' : ''} erkannt`);
      else toast.info('Keine neuen Zuordnungen oder Rückstände gefunden');
      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
      queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] });
    } catch { toast.error('Kontenabgleich fehlgeschlagen'); }
    finally { setMatchRunning(false); }
  }, [activeTenantId, queryClient]);

  // ── Loading / empty ──
  if (leasesLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!unitId) return <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 text-center"><Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">Keine Einheit vorhanden</p></CardContent></Card>;
  if (!leases.length) return <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 text-center"><Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">Kein aktives Mietverhältnis vorhanden</p><p className="text-xs text-muted-foreground/70 mt-1">Legen Sie zuerst ein Mietverhältnis im Tab "Mietverhältnis" an.</p></CardContent></Card>;

  return (
    <div className="space-y-6">
      <GeldeingangActionBar leases={leases} matchRunning={matchRunning} matchStep={matchStep} matchResult={matchResult} onKontenabgleich={handleKontenabgleich} onShowPaymentForm={(leaseId, amount) => { setPaymentAmount(amount); setPaymentDate(format(new Date(), 'yyyy-MM-dd')); setShowPaymentForm(leaseId); }} propertyId={propertyId} unitId={unitId} createExpenseMutation={createExpenseMutation} />

      {leases.map(lease => (
        <GeldeingangLeaseTable key={lease.id} lease={lease} months={months} payments={payments} nkSettlements={nkSettlements} bankAccounts={bankAccounts} contactName={getContactName(lease.tenant_contact_id)} showPaymentForm={showPaymentForm === lease.id} paymentAmount={paymentAmount} paymentDate={paymentDate} paymentNote={paymentNote} onPaymentAmountChange={setPaymentAmount} onPaymentDateChange={setPaymentDate} onPaymentNoteChange={setPaymentNote} onShowPaymentForm={() => setShowPaymentForm(lease.id)} onHidePaymentForm={() => setShowPaymentForm(null)} onSubmitPayment={(leaseId, amount, date, note, expected) => addPaymentMutation.mutate({ leaseId, amount, date, note, expectedAmount: expected })} onUpdateLease={(leaseId, updates) => updateLeaseMutation.mutate({ leaseId, updates })} isSubmitting={addPaymentMutation.isPending} />
      ))}

      {linkedAccountIds.length > 0 && <GeldeingangUnmatched unmatchedTx={unmatchedTx} unmatchedLoading={unmatchedLoading} leases={leases} propertyId={propertyId} unitId={unitId} assignTxMutation={assignTxMutation} createExpenseMutation={createExpenseMutation} />}

      <GeldeingangExpenses expenses={expenses} deleteExpenseMutation={deleteExpenseMutation} />
    </div>
  );
}

export const ZahlungsverkehrTab = GeldeingangTab;

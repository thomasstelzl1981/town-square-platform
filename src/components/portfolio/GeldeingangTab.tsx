/**
 * GeldeingangTab — Rent payment tracking per lease (MOD-04)
 * 
 * Shows a 12-month table of expected vs actual rent payments,
 * bank account selection for auto-matching, and manual payment entry.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Banknote, Plus, Info, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
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

const fmtEur = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

export function GeldeingangTab({ propertyId, tenantId, unitId }: GeldeingangTabProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null); // lease_id
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNote, setPaymentNote] = useState('');
  const [arrearsChecking, setArrearsChecking] = useState(false);
  const [matchRunning, setMatchRunning] = useState(false);

  const handleRentMatch = async () => {
    setMatchRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-rent-match', {
        body: { tenant_id: activeTenantId },
      });
      if (error) throw error;
      const result = data as { matched?: number; checked?: number };
      if (result.matched && result.matched > 0) {
        toast.success(`${result.matched} Mietzahlung${result.matched > 1 ? 'en' : ''} automatisch zugeordnet`);
      } else {
        toast.info(`${result.checked || 0} Transaktionen geprüft — keine neuen Zuordnungen`);
      }
      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
    } catch (err) {
      console.error('Rent match failed:', err);
      toast.error('Abgleich fehlgeschlagen');
    } finally {
      setMatchRunning(false);
    }
  };

  const handleArrearsCheck = async () => {
    setArrearsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-rent-arrears-check');
      if (error) throw error;
      const result = data as { checked?: number; created?: number };
      if (result.created && result.created > 0) {
        toast.success(`${result.created} Mietrückstand${result.created > 1 ? 'e' : ''} erkannt — Task-Widget erstellt`);
      } else {
        toast.info(`${result.checked || 0} Mietverhältnisse geprüft — keine Rückstände`);
      }
      queryClient.invalidateQueries({ queryKey: ['geldeingang-payments'] });
    } catch (err) {
      console.error('Arrears check failed:', err);
      toast.error('Mieteingang-Prüfung fehlgeschlagen');
    } finally {
      setArrearsChecking(false);
    }
  };

  // Fetch active leases for this unit
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

  // Fetch rent payments for the last 12 months
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

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
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

  // Fetch contact names for leases
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

  // Update lease bank account / auto_match
  const updateLeaseMutation = useMutation({
    mutationFn: async ({ leaseId, updates }: { leaseId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', leaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geldeingang-leases'] });
    },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  // Insert payment
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
          notes: note || null,
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

  // Generate 12-month grid
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

  if (leasesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
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
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <DesktopOnly>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRentMatch}
            disabled={matchRunning}
            className="gap-1.5"
          >
            {matchRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Abgleich starten
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArrearsCheck}
            disabled={arrearsChecking}
            className="gap-1.5"
          >
            {arrearsChecking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Mieteingang prüfen
          </Button>
        </DesktopOnly>
      </div>
      {leases.map(lease => {
        const warmmiete = getWarmmiete(lease);
        const contactName = getContactName(lease.tenant_contact_id);

        return (
          <Card key={lease.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Geldeingang — {contactName}
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
                  <Select
                    value={lease.linked_bank_account_id || ''}
                    onValueChange={(val) =>
                      updateLeaseMutation.mutate({ leaseId: lease.id, updates: { linked_bank_account_id: val || null } })
                    }
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Konto auswählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_name} {acc.bank_name ? `(${acc.bank_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Wählen Sie das Konto, auf dem die Mietzahlungen eingehen. Die Konten verwalten Sie unter Finanzanalyse › Übersicht.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              {/* Payment table */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Monat</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Soll (Warmmiete)</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Eingang</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Differenz</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
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
                              ? differenz <= 0 
                                ? 'text-emerald-600' 
                                : 'text-red-500'
                              : 'text-muted-foreground'
                          }`}>
                            {payment ? fmtEur(-differenz) : '–'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getStatusBadge(status)}
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

              {/* Manual payment entry */}
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
                      {addPaymentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Speichern'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPaymentForm(null)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPaymentAmount(warmmiete.toFixed(2));
                      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                      setShowPaymentForm(lease.id);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Zahlung erfassen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * R-10: Zone B — 12-month Soll vs Ist table per lease
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { fmtEur, getWarmmiete, getStatusBadge, getSourceBadge } from './geldeingangHelpers';
import type { GeldeingangLease, GeldeingangRentPayment, GeldeingangBankAccount } from './geldeingangTypes';

interface GeldeingangLeaseTableProps {
  lease: GeldeingangLease;
  months: Date[];
  payments: GeldeingangRentPayment[];
  nkSettlements: any[];
  bankAccounts: GeldeingangBankAccount[];
  contactName: string;
  showPaymentForm: boolean;
  paymentAmount: string;
  paymentDate: string;
  paymentNote: string;
  onPaymentAmountChange: (v: string) => void;
  onPaymentDateChange: (v: string) => void;
  onPaymentNoteChange: (v: string) => void;
  onShowPaymentForm: () => void;
  onHidePaymentForm: () => void;
  onSubmitPayment: (leaseId: string, amount: number, date: string, note: string, expected: number) => void;
  onUpdateLease: (leaseId: string, updates: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function GeldeingangLeaseTable({
  lease, months, payments, nkSettlements, bankAccounts, contactName,
  showPaymentForm, paymentAmount, paymentDate, paymentNote,
  onPaymentAmountChange, onPaymentDateChange, onPaymentNoteChange,
  onShowPaymentForm, onHidePaymentForm, onSubmitPayment, onUpdateLease, isSubmitting,
}: GeldeingangLeaseTableProps) {
  const warmmiete = getWarmmiete(lease);

  const getPaymentForMonth = (month: Date): GeldeingangRentPayment | undefined => {
    const monthStr = format(month, 'yyyy-MM');
    return payments.find(p => p.lease_id === lease.id && p.due_date.startsWith(monthStr));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />Zahlungen — {contactName}
        </CardTitle>
        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={lease.auto_match_enabled ?? false} onCheckedChange={(checked) => onUpdateLease(lease.id, { auto_match_enabled: checked })} />
              <span className="text-sm font-medium">Automatischen Abgleich aktivieren</span>
            </div>
            {bankAccounts.length > 0 ? (
              <Select value={lease.linked_bank_account_id || undefined} onValueChange={(val) => onUpdateLease(lease.id, { linked_bank_account_id: val === 'none' ? null : val })}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Konto auswählen…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Konto</SelectItem>
                  {bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.account_name} {acc.bank_name ? `(${acc.bank_name})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border border-dashed rounded-md w-[280px]">
                <CreditCard className="h-3.5 w-3.5 shrink-0" /><span>Noch keine Konten angelegt</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5"><Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />Wählen Sie das Konto, auf dem die Mietzahlungen eingehen.</p>
        </div>
      </CardHeader>
      <CardContent>
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
                const payment = getPaymentForMonth(month);
                const eingang = payment?.amount ?? 0;
                const differenz = warmmiete - eingang;
                const status = payment?.status || 'open';
                return (
                  <tr key={idx} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{format(month, 'MMMM yyyy', { locale: de })}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{fmtEur(warmmiete)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{payment ? fmtEur(eingang) : '–'}</td>
                    <td className={`px-3 py-2 text-right font-mono text-xs ${payment ? (differenz <= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-muted-foreground'}`}>{payment ? fmtEur(-differenz) : '–'}</td>
                    <td className="px-3 py-2 text-center">{getStatusBadge(status)}</td>
                    <td className="px-3 py-2 text-center">{getSourceBadge(payment)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{payment?.paid_date ? new Date(payment.paid_date).toLocaleDateString('de-DE') : '–'}</td>
                  </tr>
                );
              })}
              {nkSettlements.filter((s: any) => s.lease_id === lease.id && s.saldo_eur !== 0).map((s: any, idx: number) => (
                <tr key={`nk-${idx}`} className="border-t border-primary/20 bg-primary/5">
                  <td className="px-3 py-2 font-medium text-xs">NK-Abrechnung {s.period_end ? new Date(s.period_end).getFullYear() : ''}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{fmtEur(Math.abs(s.saldo_eur))}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{s.status === 'paid' ? fmtEur(Math.abs(s.saldo_eur)) : '–'}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.status === 'paid' ? '0,00 €' : fmtEur(s.saldo_eur)}</td>
                  <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{s.saldo_eur > 0 ? 'Nachzahlung' : 'Guthaben'}</Badge></td>
                  <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">NK</Badge></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">–</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showPaymentForm && (
          <div className="mt-4 flex items-end gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="space-y-1"><label className="text-xs text-muted-foreground">Betrag (€)</label><Input type="number" step="0.01" value={paymentAmount} onChange={e => onPaymentAmountChange(e.target.value)} className="w-32" placeholder={warmmiete.toFixed(2)} /></div>
            <div className="space-y-1"><label className="text-xs text-muted-foreground">Datum</label><Input type="date" value={paymentDate} onChange={e => onPaymentDateChange(e.target.value)} className="w-40" /></div>
            <div className="space-y-1 flex-1"><label className="text-xs text-muted-foreground">Notiz (optional)</label><Input value={paymentNote} onChange={e => onPaymentNoteChange(e.target.value)} placeholder="z.B. Überweisung" /></div>
            <Button size="sm" disabled={isSubmitting} onClick={() => onSubmitPayment(lease.id, parseFloat(paymentAmount) || warmmiete, paymentDate, paymentNote, warmmiete)}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onHidePaymentForm}>Abbrechen</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * R-10: Zone C — Unmatched bank transactions
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ArrowRightLeft, ChevronDown, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory, type CreateExpenseInput } from '@/hooks/usePropertyExpenses';
import { fmtEur } from './geldeingangHelpers';
import type { GeldeingangBankTransaction, GeldeingangLease } from './geldeingangTypes';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { getWarmmiete } from './geldeingangHelpers';

interface GeldeingangUnmatchedProps {
  unmatchedTx: GeldeingangBankTransaction[];
  unmatchedLoading: boolean;
  leases: GeldeingangLease[];
  propertyId: string;
  unitId: string;
  assignTxMutation: UseMutationResult<void, Error, { tx: GeldeingangBankTransaction; leaseId: string; warmmiete: number }, unknown>;
  createExpenseMutation: UseMutationResult<void, Error, CreateExpenseInput, unknown>;
}

export function GeldeingangUnmatched({
  unmatchedTx, unmatchedLoading, leases,
  propertyId, unitId,
  assignTxMutation, createExpenseMutation,
}: GeldeingangUnmatchedProps) {
  const [unmatchedOpen, setUnmatchedOpen] = useState(false);
  const [assignExpenseTxId, setAssignExpenseTxId] = useState<string | null>(null);
  const [assignExpenseCategory, setAssignExpenseCategory] = useState<ExpenseCategory>('instandhaltung');
  const queryClient = useQueryClient();

  return (
    <Collapsible open={unmatchedOpen} onOpenChange={setUnmatchedOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />Nicht zugeordnete Buchungen
                {unmatchedTx.length > 0 && <Badge variant="secondary" className="text-xs">{unmatchedTx.length}</Badge>}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${unmatchedOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {unmatchedLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : unmatchedTx.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine unzugeordneten Buchungen vorhanden.</p>
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
                    {unmatchedTx.map(tx => {
                      const isExpense = tx.amount_eur < 0;
                      const isAssigningExpense = assignExpenseTxId === tx.id;
                      return (
                        <tr key={tx.id} className="border-t border-border/30 hover:bg-muted/20">
                          <td className="px-3 py-2 text-xs">{new Date(tx.booking_date).toLocaleDateString('de-DE')}</td>
                          <td className={`px-3 py-2 text-right font-mono text-xs ${tx.amount_eur >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtEur(tx.amount_eur)}</td>
                          <td className="px-3 py-2 text-xs truncate max-w-[160px]">{tx.counterparty || '–'}</td>
                          <td className="px-3 py-2 text-xs truncate max-w-[200px] text-muted-foreground">{tx.purpose_text || '–'}</td>
                          <td className="px-3 py-2 text-right">
                            {isExpense ? (
                              isAssigningExpense ? (
                                <div className="flex items-center gap-1.5">
                                  <Select value={assignExpenseCategory} onValueChange={v => setAssignExpenseCategory(v as ExpenseCategory)}>
                                    <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Button size="sm" variant="default" className="h-7 text-xs" disabled={createExpenseMutation.isPending}
                                    onClick={() => {
                                      createExpenseMutation.mutate({ property_id: propertyId, unit_id: unitId || undefined, category: assignExpenseCategory, amount: Math.abs(tx.amount_eur), label: tx.counterparty || tx.purpose_text || 'Bankbuchung', description: tx.purpose_text || undefined, expense_date: tx.booking_date, bank_transaction_id: tx.id, source: 'bank_matched' } as CreateExpenseInput, {
                                        onSuccess: () => { supabase.from('bank_transactions').update({ match_status: 'EXPENSE_MATCHED' }).eq('id', tx.id).then(() => queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] })); toast.success('Ausgabe zugeordnet'); setAssignExpenseTxId(null); },
                                        onError: () => toast.error('Zuordnung fehlgeschlagen'),
                                      });
                                    }}>
                                    {createExpenseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓'}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-1" onClick={() => setAssignExpenseTxId(null)}>✕</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAssignExpenseTxId(tx.id)}><Receipt className="h-3 w-3" />Als Ausgabe</Button>
                              )
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={assignTxMutation.isPending}
                                onClick={() => { const l = leases[0]; if (l) assignTxMutation.mutate({ tx, leaseId: l.id, warmmiete: getWarmmiete(l) }); }}>
                                {assignTxMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRightLeft className="h-3 w-3" />}Zuordnen
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/**
 * TransactionReviewQueue — Review AI-suggested & rule-categorized transactions
 * Part of Engine 17: ENG-KONTOMATCH Phase 5
 *
 * Shows transactions with match_category set, allowing users to:
 * - Confirm correct categorizations
 * - Override incorrect ones
 * - Trigger re-categorization
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Brain, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionCategory } from '@/engines/kontoMatch/spec';

interface TransactionReviewQueueProps {
  accountRef?: string;
  tenantId?: string;
  /** Show only AI-suggested (needs review) or all categorized */
  mode?: 'review' | 'all';
}

const CATEGORY_LABELS: Record<string, string> = {
  MIETE: 'Miete',
  HAUSGELD: 'Hausgeld',
  GRUNDSTEUER: 'Grundsteuer',
  VERSICHERUNG: 'Versicherung',
  DARLEHEN: 'Darlehen',
  INSTANDHALTUNG: 'Instandhaltung',
  EINSPEISEVERGUETUNG: 'Einspeisevergütung',
  WARTUNG: 'Wartung',
  PACHT: 'Pacht',
  GEHALT: 'Gehalt',
  SONSTIG_EINGANG: 'Sonstiger Eingang',
  SONSTIG_AUSGANG: 'Sonstiger Ausgang',
};

const CATEGORY_COLORS: Record<string, string> = {
  MIETE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  HAUSGELD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  GRUNDSTEUER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  VERSICHERUNG: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  DARLEHEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  INSTANDHALTUNG: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  EINSPEISEVERGUETUNG: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  WARTUNG: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  PACHT: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  GEHALT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TransactionReviewQueue({ accountRef, tenantId, mode = 'review' }: TransactionReviewQueueProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const tid = tenantId || activeTenantId;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');

  // Load categorized transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['review-queue', accountRef, tid, mode],
    queryFn: async () => {
      let query = supabase
        .from('bank_transactions')
        .select('id, booking_date, amount_eur, counterparty, purpose_text, match_category, match_confidence, match_rule_code, match_status')
        .not('match_category', 'is', null)
        .order('booking_date', { ascending: false })
        .limit(100);

      if (accountRef) query = query.eq('account_ref', accountRef);
      if (tid) query = query.eq('tenant_id', tid);
      if (mode === 'review') {
        query = query.in('match_status', ['AI_SUGGESTED', 'CATEGORIZED']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tid,
  });

  // Confirm a categorization
  const confirmMutation = useMutation({
    mutationFn: async (txId: string) => {
      const { error } = await supabase
        .from('bank_transactions')
        .update({ match_status: 'CONFIRMED' })
        .eq('id', txId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kategorie bestätigt');
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });

  // Override a categorization
  const overrideMutation = useMutation({
    mutationFn: async ({ txId, category }: { txId: string; category: string }) => {
      const { error } = await supabase
        .from('bank_transactions')
        .update({
          match_category: category,
          match_status: 'MANUAL_OVERRIDE',
          match_confidence: 1.0,
          match_rule_code: 'MANUAL',
        })
        .eq('id', txId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kategorie geändert');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });

  // Trigger bulk re-categorization
  const recategorizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-transaction-categorize', {
        body: { tenant_id: tid, account_ref: accountRef },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.categorized || 0} Transaktionen kategorisiert`);
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
    onError: (err) => toast.error('Fehler: ' + err.message),
  });

  const reviewCount = transactions.filter(t => t.match_status === 'AI_SUGGESTED').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          Lade Transaktionen…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Kategorisierung</CardTitle>
            {reviewCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <Brain className="h-3 w-3 mr-1" />
                {reviewCount} zu prüfen
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recategorizeMutation.mutate()}
            disabled={recategorizeMutation.isPending}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', recategorizeMutation.isPending && 'animate-spin')} />
            Kategorisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
            Keine kategorisierten Transaktionen. Klicken Sie auf „Kategorisieren", um die automatische Zuordnung zu starten.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Empfänger</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Zweck</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Betrag</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kategorie</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Conf.</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isAI = tx.match_rule_code === 'AI_FALLBACK';
                    const isEditing = editingId === tx.id;
                    const confidence = tx.match_confidence ? Math.round(tx.match_confidence * 100) : 0;

                    return (
                      <tr key={tx.id} className={cn(
                        'border-b last:border-0 hover:bg-muted/20',
                        isAI && tx.match_status === 'AI_SUGGESTED' && 'bg-amber-50/50 dark:bg-amber-950/10',
                      )}>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {fmtDate(tx.booking_date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">
                          {tx.counterparty || '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs max-w-[180px] truncate">
                          {tx.purpose_text || '—'}
                        </td>
                        <td className={cn(
                          'px-3 py-2 text-right font-medium whitespace-nowrap',
                          Number(tx.amount_eur) >= 0 ? 'text-emerald-600' : 'text-destructive',
                        )}>
                          {Number(tx.amount_eur) >= 0 ? '+' : ''}{fmt(Number(tx.amount_eur))}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger className="h-7 text-xs w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(TransactionCategory).map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-xs">
                                    {CATEGORY_LABELS[cat] || cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px]', CATEGORY_COLORS[tx.match_category || ''])}
                              >
                                {isAI && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                                {CATEGORY_LABELS[tx.match_category || ''] || tx.match_category}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn(
                            'text-xs font-mono',
                            confidence >= 90 ? 'text-emerald-600' : confidence >= 75 ? 'text-amber-600' : 'text-red-500',
                          )}>
                            {confidence}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {tx.match_status === 'CONFIRMED' || tx.match_status === 'MANUAL_OVERRIDE' ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> OK
                            </Badge>
                          ) : isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => overrideMutation.mutate({ txId: tx.id, category: editCategory })}
                                disabled={!editCategory || overrideMutation.isPending}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Bestätigen"
                                onClick={() => confirmMutation.mutate(tx.id)}
                                disabled={confirmMutation.isPending}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Korrigieren"
                                onClick={() => {
                                  setEditingId(tx.id);
                                  setEditCategory(tx.match_category || '');
                                }}
                              >
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

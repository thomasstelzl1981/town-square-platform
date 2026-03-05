/**
 * R-10: Zone D — Recorded expenses collapsible
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Receipt, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EXPENSE_CATEGORY_LABELS } from '@/hooks/usePropertyExpenses';
import { fmtEur } from './geldeingangHelpers';
import type { UseMutationResult } from '@tanstack/react-query';

interface ExpenseRecord {
  id: string;
  expense_date: string;
  category: string;
  label: string;
  amount: number;
  source: string;
}

interface GeldeingangExpensesProps {
  expenses: ExpenseRecord[];
  deleteExpenseMutation: UseMutationResult<void, Error, string, unknown>;
}

export function GeldeingangExpenses({ expenses, deleteExpenseMutation }: GeldeingangExpensesProps) {
  const [expensesOpen, setExpensesOpen] = useState(false);

  if (expenses.length === 0) return null;

  return (
    <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />Erfasste Ausgaben
                <Badge variant="secondary" className="text-xs">{expenses.length}</Badge>
                <Badge variant="outline" className="text-xs font-mono">{fmtEur(expenses.reduce((s, e) => s + e.amount, 0))}</Badge>
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expensesOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kategorie</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Bezeichnung</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Betrag</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Quelle</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="border-t border-border/30 hover:bg-muted/20">
                      <td className="px-3 py-2 text-xs">{new Date(exp.expense_date).toLocaleDateString('de-DE')}</td>
                      <td className="px-3 py-2 text-xs">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</td>
                      <td className="px-3 py-2 text-xs">{exp.label}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-red-500">-{fmtEur(exp.amount)}</td>
                      <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{exp.source === 'bank_matched' ? 'Bank' : 'Manuell'}</Badge></td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteExpenseMutation.mutate(exp.id, { onSuccess: () => toast.success('Ausgabe gelöscht'), onError: () => toast.error('Fehler beim Löschen') })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

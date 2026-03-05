/**
 * R-10: Zone A — Action bar (Kontenabgleich + manual payment + expense capture)
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, RefreshCw, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory, type CreateExpenseInput } from '@/hooks/usePropertyExpenses';
import { fmtEur, getWarmmiete, MATCH_STEPS } from './geldeingangHelpers';
import type { GeldeingangLease } from './geldeingangTypes';
import type { UseMutationResult } from '@tanstack/react-query';

interface GeldeingangActionBarProps {
  leases: GeldeingangLease[];
  matchRunning: boolean;
  matchStep: number;
  matchResult: { matched: number; arrears: number } | null;
  onKontenabgleich: () => void;
  onShowPaymentForm: (leaseId: string, amount: string) => void;
  propertyId: string;
  unitId: string;
  createExpenseMutation: UseMutationResult<void, Error, CreateExpenseInput, unknown>;
}

export function GeldeingangActionBar({
  leases, matchRunning, matchStep, matchResult,
  onKontenabgleich, onShowPaymentForm,
  propertyId, unitId, createExpenseMutation,
}: GeldeingangActionBarProps) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('instandhaltung');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={onKontenabgleich} disabled={matchRunning} className="gap-2">
              {matchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Kontenabgleich starten
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              const firstLease = leases[0];
              if (firstLease) onShowPaymentForm(firstLease.id, getWarmmiete(firstLease).toFixed(2));
            }}>
              <Plus className="h-4 w-4" />Zahlung manuell erfassen
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              setShowExpenseForm(true);
              setExpenseAmount(''); setExpenseLabel(''); setExpenseDescription('');
              setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
              setExpenseCategory('instandhaltung');
            }}>
              <Receipt className="h-4 w-4" />Ausgabe erfassen
            </Button>
          </div>
          {matchResult && !matchRunning && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" />{matchResult.matched} zugeordnet</span>
              {matchResult.arrears > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-4 w-4" />{matchResult.arrears} Rückstand{matchResult.arrears !== 1 ? 'e' : ''}</span>}
            </div>
          )}
        </div>

        {matchRunning && (
          <div className="mt-4 space-y-2">
            <Progress value={((matchStep + 1) / MATCH_STEPS.length) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground animate-pulse">{MATCH_STEPS[matchStep]}</p>
          </div>
        )}

        {showExpenseForm && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" />Ausgabe erfassen</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Kategorie</label>
                <Select value={expenseCategory} onValueChange={v => setExpenseCategory(v as ExpenseCategory)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Betrag (€)</label><Input type="number" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="0,00" /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Datum</label><Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Bezeichnung</label><Input value={expenseLabel} onChange={e => setExpenseLabel(e.target.value)} placeholder="z.B. Heizungswartung" /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-muted-foreground">Beschreibung (optional)</label><Input value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Details zur Ausgabe…" /></div>
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={createExpenseMutation.isPending} onClick={() => {
                const amt = parseFloat(expenseAmount);
                if (!amt || !expenseLabel.trim()) { toast.error('Betrag und Bezeichnung sind Pflichtfelder'); return; }
                createExpenseMutation.mutate({ property_id: propertyId, unit_id: unitId || undefined, category: expenseCategory, amount: amt, label: expenseLabel.trim(), description: expenseDescription.trim() || undefined, expense_date: expenseDate, source: 'manual' } as CreateExpenseInput, {
                  onSuccess: () => { toast.success('Ausgabe erfasst'); setShowExpenseForm(false); },
                  onError: () => toast.error('Fehler beim Erfassen'),
                });
              }}>
                {createExpenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Abbrechen</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

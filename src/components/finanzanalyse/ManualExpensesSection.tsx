/**
 * ManualExpensesSection — Editable manual expenses (Miete, Unterhalt, Sonstiges)
 * For MOD-18 Finanzanalyse
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManualExpenses, type ManualExpense } from '@/hooks/useManualExpenses';
import { Plus, Trash2, Receipt, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS = [
  { value: 'miete', label: 'Miete' },
  { value: 'unterhalt', label: 'Unterhalt' },
  { value: 'sonstige', label: 'Sonstiges' },
];

const CATEGORY_LABELS: Record<string, string> = {
  miete: 'Miete',
  unterhalt: 'Unterhalt',
  sonstige: 'Sonstiges',
};

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export function ManualExpensesSection() {
  const { expenses, createExpense, updateExpense, deleteExpense } = useManualExpenses();
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ category: 'sonstige', label: '', monthly_amount: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const handleAdd = () => {
    if (!newForm.label || !newForm.monthly_amount) {
      toast.error('Bitte Bezeichnung und Betrag eingeben');
      return;
    }
    createExpense.mutate(
      { category: newForm.category, label: newForm.label, monthly_amount: Number(newForm.monthly_amount) },
      {
        onSuccess: () => {
          toast.success('Ausgabe hinzugefügt');
          setNewForm({ category: 'sonstige', label: '', monthly_amount: '' });
          setShowAdd(false);
        },
      },
    );
  };

  const handleUpdate = (id: string) => {
    updateExpense.mutate(
      { id, label: editForm.label, monthly_amount: Number(editForm.monthly_amount), category: editForm.category },
      {
        onSuccess: () => {
          toast.success('Ausgabe aktualisiert');
          setEditingId(null);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteExpense.mutate(id, { onSuccess: () => toast.success('Ausgabe entfernt') });
  };

  const startEdit = (e: ManualExpense) => {
    setEditingId(e.id);
    setEditForm({ category: e.category, label: e.label, monthly_amount: e.monthly_amount });
  };

  const total = expenses.reduce((s, e) => s + (e.monthly_amount || 0), 0);

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold">Sonstige Ausgaben</h3>
          </div>
          <Button variant="glass" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Hinzufügen
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Erfasse hier Ausgaben, die nicht durch Verträge abgedeckt sind (z.B. Miete, Unterhalt, Vereinsbeiträge).
        </p>

        {/* Existing entries */}
        {expenses.length > 0 && (
          <div className="space-y-2 mb-4">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                {editingId === e.id ? (
                  <>
                    <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="h-8 text-sm flex-1" value={editForm.label}
                      onChange={ev => setEditForm(f => ({ ...f, label: ev.target.value }))} />
                    <Input className="h-8 text-sm w-24 text-right" type="number" value={editForm.monthly_amount}
                      onChange={ev => setEditForm(f => ({ ...f, monthly_amount: ev.target.value }))} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(e.id)}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      ✕
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground min-w-[70px] text-center">
                      {CATEGORY_LABELS[e.category] || e.category}
                    </span>
                    <span className="text-sm flex-1 cursor-pointer" onClick={() => startEdit(e)}>
                      {e.label || '—'}
                    </span>
                    <span className="text-sm font-medium tabular-nums">{fmt(e.monthly_amount)}/mtl.</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"
                      onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-semibold text-sm">
              <span>Summe</span>
              <span>{fmt(total)}/mtl.</span>
            </div>
          </div>
        )}

        {expenses.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground italic">Keine manuellen Ausgaben erfasst.</p>
        )}

        {/* Add new */}
        {showAdd && (
          <div className="flex items-end gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-xs">Kategorie</Label>
              <Select value={newForm.category} onValueChange={v => setNewForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Bezeichnung</Label>
              <Input className="h-8 text-sm" placeholder="z.B. Warmmiete, Kindesunterhalt..."
                value={newForm.label} onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">€/mtl.</Label>
              <Input className="h-8 text-sm text-right" type="number" placeholder="0"
                value={newForm.monthly_amount} onChange={e => setNewForm(f => ({ ...f, monthly_amount: e.target.value }))} />
            </div>
            <Button size="sm" className="h-8" onClick={handleAdd} disabled={createExpense.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Speichern
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowAdd(false)}>
              Abbrechen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

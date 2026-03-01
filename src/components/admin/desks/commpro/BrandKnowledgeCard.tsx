import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Plus, Pencil, Trash2, Info, GripVertical } from 'lucide-react';
import type { KnowledgeItem } from '@/hooks/useBrandKnowledge';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  brandKey: string;
  brandLabel: string;
  items: KnowledgeItem[];
  isLoading: boolean;
  createItem: UseMutationResult<void, Error, { title_de: string; category: string; content: string; phone_prompt_priority?: number }>;
  updateItem: UseMutationResult<void, Error, { id: string; updates: Partial<KnowledgeItem> }>;
  deleteItem: UseMutationResult<void, Error, string>;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  brand_persona: { label: 'Persona', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300' },
  faq: { label: 'FAQ', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  instruction: { label: 'Anweisung', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
};

const EMPTY_FORM = { title_de: '', category: 'instruction', content: '', phone_prompt_priority: 50 };

export function BrandKnowledgeCard({ brandKey, brandLabel, items, isLoading, createItem, updateItem, deleteItem }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditId(item.id);
    setForm({
      title_de: item.title_de,
      category: item.category === 'brand_persona' ? 'brand_persona' : (item.content_type === 'faq' ? 'faq' : 'instruction'),
      content: item.content,
      phone_prompt_priority: item.phone_prompt_priority ?? 50,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_de.trim() || !form.content.trim()) return;
    if (editId) {
      await updateItem.mutateAsync({
        id: editId,
        updates: {
          title_de: form.title_de,
          content: form.content,
          phone_prompt_priority: form.phone_prompt_priority,
        },
      });
    } else {
      await createItem.mutateAsync({
        title_de: form.title_de,
        category: form.category,
        content: form.content,
        phone_prompt_priority: form.phone_prompt_priority,
      });
    }
    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const getCategoryInfo = (item: KnowledgeItem) => {
    if (item.category === 'brand_persona') return CATEGORY_LABELS.brand_persona;
    if (item.content_type === 'faq') return CATEGORY_LABELS.faq;
    return CATEGORY_LABELS.instruction;
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Wissensbasis — {brandLabel}
            </CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Laden…</p>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Noch keine Wissensartikel für {brandLabel}.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Ersten Artikel erstellen
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50 rounded-lg border border-border/50">
              {items.map((item) => {
                const cat = getCategoryInfo(item);
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.title_de}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cat.color}`}>
                          {cat.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">Prio {item.phone_prompt_priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteItem.mutate(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Diese Artikel fließen automatisch in den Armstrong-Prompt ein.
              Die Priorität bestimmt die Reihenfolge — niedrigere Werte erscheinen zuerst.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Wissensartikel bearbeiten' : 'Neuen Wissensartikel erstellen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Titel</label>
              <Input
                value={form.title_de}
                onChange={e => setForm(f => ({ ...f, title_de: e.target.value }))}
                placeholder="z.B. Kernleistungen von Ncore"
              />
            </div>

            {!editId && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategorie</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_persona">Persona</SelectItem>
                    <SelectItem value="instruction">Anweisung</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priorität (niedrig = wichtig)</label>
              <Input
                type="number"
                value={form.phone_prompt_priority}
                onChange={e => setForm(f => ({ ...f, phone_prompt_priority: Number(e.target.value) }))}
                min={1}
                max={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Inhalt</label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Der Inhalt, den Armstrong am Telefon verwenden soll…"
                rows={8}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button
                onClick={handleSave}
                disabled={!form.title_de.trim() || !form.content.trim() || createItem.isPending || updateItem.isPending}
              >
                {editId ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

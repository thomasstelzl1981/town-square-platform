import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Cpu, Plus, Pencil, Copy, Trash2, X, AlertTriangle, Loader2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface SortRule {
  id?: string;
  field: string;
  operator: string;
  keywords_json: string[];
}

interface SortContainer {
  id: string;
  tenant_id: string;
  name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  inbox_sort_rules: SortRule[];
}

const FIELD_LABELS: Record<string, string> = {
  subject: 'Betreff',
  from: 'Absender',
  to: 'Empfänger',
};

export function SortierenTab() {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const seedingRef = useRef(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<SortContainer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRules, setFormRules] = useState<SortRule[]>([{ field: 'subject', operator: 'contains', keywords_json: [] }]);
  const [keywordInput, setKeywordInput] = useState<Record<number, string>>({});

  // ── Query: ai_extraction_enabled ──
  const { data: aiEnabled = false } = useQuery({
    queryKey: ['ai-extraction-enabled', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return false;
      const { data, error } = await supabase
        .from('organizations')
        .select('ai_extraction_enabled')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data?.ai_extraction_enabled ?? false;
    },
    enabled: !!activeTenantId,
  });

  // ── Query: containers + rules ──
  const { data: containers = [], isLoading } = useQuery({
    queryKey: ['sort-containers', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('inbox_sort_containers')
        .select('*, inbox_sort_rules(*)')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as SortContainer[];
    },
    enabled: !!activeTenantId,
  });

  // ── Default seed: "Rechnungen" ──
  useEffect(() => {
    if (!activeTenantId || isLoading || seedingRef.current) return;
    if (containers.length > 0) return;
    seedingRef.current = true;

    (async () => {
      const { data: container, error: cErr } = await supabase
        .from('inbox_sort_containers')
        .insert({ tenant_id: activeTenantId, name: 'Rechnungen', is_enabled: true })
        .select('id')
        .single();
      if (cErr || !container) { seedingRef.current = false; return; }

      await supabase.from('inbox_sort_rules').insert({
        tenant_id: activeTenantId,
        container_id: container.id,
        field: 'subject',
        operator: 'contains',
        keywords_json: ['Rechnung', 'Invoice'],
      });
      queryClient.invalidateQueries({ queryKey: ['sort-containers'] });
      seedingRef.current = false;
    })();
  }, [activeTenantId, isLoading, containers.length, queryClient]);

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      if (!formName.trim()) throw new Error('Name ist Pflicht');

      if (editingContainer) {
        // Update name
        await supabase.from('inbox_sort_containers')
          .update({ name: formName.trim() })
          .eq('id', editingContainer.id);
        // Delete old rules, insert new
        await supabase.from('inbox_sort_rules')
          .delete()
          .eq('container_id', editingContainer.id);
        if (formRules.length > 0) {
          await supabase.from('inbox_sort_rules').insert(
            formRules.filter(r => r.keywords_json.length > 0).map(r => ({
              tenant_id: activeTenantId,
              container_id: editingContainer.id,
              field: r.field,
              operator: r.operator,
              keywords_json: r.keywords_json,
            }))
          );
        }
      } else {
        // Create
        const { data: container, error } = await supabase
          .from('inbox_sort_containers')
          .insert({ tenant_id: activeTenantId, name: formName.trim(), is_enabled: true })
          .select('id')
          .single();
        if (error || !container) throw error || new Error('Fehler');
        if (formRules.length > 0) {
          await supabase.from('inbox_sort_rules').insert(
            formRules.filter(r => r.keywords_json.length > 0).map(r => ({
              tenant_id: activeTenantId,
              container_id: container.id,
              field: r.field,
              operator: r.operator,
              keywords_json: r.keywords_json,
            }))
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sort-containers'] });
      closeDialog();
      toast.success(editingContainer ? 'Kachel aktualisiert' : 'Kachel erstellt');
    },
    onError: () => toast.error('Speichern fehlgeschlagen'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox_sort_containers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sort-containers'] });
      setDeleteId(null);
      toast.success('Kachel gelöscht');
    },
    onError: () => toast.error('Löschen fehlgeschlagen'),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (container: SortContainer) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { data: newC, error } = await supabase
        .from('inbox_sort_containers')
        .insert({ tenant_id: activeTenantId, name: `${container.name} (Kopie)`, is_enabled: container.is_enabled })
        .select('id')
        .single();
      if (error || !newC) throw error || new Error('Fehler');
      if (container.inbox_sort_rules.length > 0) {
        await supabase.from('inbox_sort_rules').insert(
          container.inbox_sort_rules.map(r => ({
            tenant_id: activeTenantId,
            container_id: newC.id,
            field: r.field,
            operator: r.operator,
            keywords_json: r.keywords_json,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sort-containers'] });
      toast.success('Kachel dupliziert');
    },
    onError: () => toast.error('Duplizieren fehlgeschlagen'),
  });

  // ── Helpers ──
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingContainer(null);
    setFormName('');
    setFormRules([{ field: 'subject', operator: 'contains', keywords_json: [] }]);
    setKeywordInput({});
  };

  const openCreate = () => {
    setEditingContainer(null);
    setFormName('');
    setFormRules([{ field: 'subject', operator: 'contains', keywords_json: [] }]);
    setKeywordInput({});
    setDialogOpen(true);
  };

  const openEdit = (c: SortContainer) => {
    setEditingContainer(c);
    setFormName(c.name);
    setFormRules(
      c.inbox_sort_rules.length > 0
        ? c.inbox_sort_rules.map(r => ({ field: r.field, operator: r.operator, keywords_json: Array.isArray(r.keywords_json) ? r.keywords_json : [] }))
        : [{ field: 'subject', operator: 'contains', keywords_json: [] }]
    );
    setKeywordInput({});
    setDialogOpen(true);
  };

  const addRule = () => {
    setFormRules(prev => [...prev, { field: 'subject', operator: 'contains', keywords_json: [] }]);
  };

  const removeRule = (idx: number) => {
    setFormRules(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRuleField = (idx: number, field: string) => {
    setFormRules(prev => prev.map((r, i) => i === idx ? { ...r, field } : r));
  };

  const addKeyword = (idx: number) => {
    const kw = (keywordInput[idx] || '').trim();
    if (!kw) return;
    setFormRules(prev => prev.map((r, i) =>
      i === idx && !r.keywords_json.includes(kw) ? { ...r, keywords_json: [...r.keywords_json, kw] } : r
    ));
    setKeywordInput(prev => ({ ...prev, [idx]: '' }));
  };

  const removeKeyword = (ruleIdx: number, kwIdx: number) => {
    setFormRules(prev => prev.map((r, i) =>
      i === ruleIdx ? { ...r, keywords_json: r.keywords_json.filter((_, ki) => ki !== kwIdx) } : r
    ));
  };

  // ── Render ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Global Gate Banner */}
      {!aiEnabled && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Dokumenten-Auslesung ist deaktiviert</p>
            <p className="text-xs text-muted-foreground">Sortierregeln werden nicht ausgeführt. Du kannst Kacheln trotzdem erstellen und konfigurieren.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/portal/dms/einstellungen')}>
            Jetzt aktivieren
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-h2 text-foreground">Sortieren</h1>
        <p className="text-sm text-muted-foreground mt-1">Erstelle Sortierkacheln. Diese erzeugen Vorschläge im Posteingang.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {containers.map((c) => (
          <Card key={c.id} className="glass-card flex flex-col overflow-hidden">
            <CardContent className="p-5 flex-1 flex flex-col gap-3">
              {/* Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                </div>
                <Badge variant="outline" className={aiEnabled && c.is_enabled
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'border-border text-muted-foreground'
                }>
                  {aiEnabled && c.is_enabled ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>

              {/* Rule Badges */}
              <div className="flex flex-wrap gap-1.5">
                {c.inbox_sort_rules.map((r, i) => {
                  const keywords = Array.isArray(r.keywords_json) ? r.keywords_json : [];
                  return (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {FIELD_LABELS[r.field] || r.field}: {keywords.join(', ') || '—'}
                    </Badge>
                  );
                })}
                {c.inbox_sort_rules.length === 0 && (
                  <span className="text-xs text-muted-foreground">Keine Regeln definiert</span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex gap-1.5 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="flex-1 gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                </Button>
                <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate(c)} className="gap-1.5 text-xs" disabled={duplicateMutation.isPending}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="gap-1.5 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* New Tile Button */}
        <button
          onClick={openCreate}
          className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Neue Sortierkachel</span>
        </button>
      </div>

      {/* ── CRUD Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContainer ? 'Kachel bearbeiten' : 'Neue Sortierkachel'}</DialogTitle>
            <DialogDescription>Definiere Name und Sortierregeln.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="z.B. Rechnungen" />
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <Label>Regeln</Label>
              {formRules.map((rule, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Regel {idx + 1}</span>
                    {formRules.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeRule(idx)} className="h-6 w-6 p-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Feld</span>
                      <Select value={rule.field} onValueChange={(v) => updateRuleField(idx, v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subject">Betreff</SelectItem>
                          <SelectItem value="from">Absender</SelectItem>
                          <SelectItem value="to">Empfänger</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Operator</span>
                      <Input value="enthält" disabled className="h-9 opacity-60" />
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords_json.map((kw, ki) => (
                        <Badge key={ki} variant="secondary" className="gap-1 pr-1">
                          {kw}
                          <button onClick={() => removeKeyword(idx, ki)} className="ml-0.5 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput[idx] || ''}
                        onChange={(e) => setKeywordInput(prev => ({ ...prev, [idx]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(idx))}
                        placeholder="Keyword eingeben + Enter"
                        className="h-9"
                      />
                      <Button variant="outline" size="sm" onClick={() => addKeyword(idx)} className="h-9 shrink-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addRule} className="w-full gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Regel hinzufügen
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Abbrechen</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formName.trim()}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sortierkachel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Kachel und alle zugehörigen Regeln werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

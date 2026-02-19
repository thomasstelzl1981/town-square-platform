/**
 * Tab 7: Consent Templates — consent_templates CRUD + user_consents Read-only
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, AlertCircle, Plus, Pencil } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { toast } from 'sonner';

export function ComplianceConsents() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [titleDe, setTitleDe] = useState('');
  const [bodyDe, setBodyDe] = useState('');

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['consent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consent_templates' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ['user-consents-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_consents').select('*').order('consented_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const upsertTemplate = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from('consent_templates' as any).update({
          code, title_de: titleDe, body_de: bodyDe, updated_at: new Date().toISOString(),
        } as any).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('consent_templates' as any).insert({
          code, title_de: titleDe, body_de: bodyDe, version: 1, is_active: false,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success(editId ? 'Template aktualisiert' : 'Template erstellt');
      resetForm();
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('consent_templates' as any).update({ is_active: !isActive } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success('Status geändert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditId(null);
    setCode('');
    setTitleDe('');
    setBodyDe('');
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setCode(t.code || '');
    setTitleDe(t.title_de || '');
    setBodyDe(t.body_de || '');
    setDialogOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (templatesLoading || consentsLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Consent Templates
            </CardTitle>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="h-3 w-3 mr-1" /> Neues Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <p className="font-medium">{t.title_de || t.code}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.code} · v{t.version || 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={t.is_active ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleActive.mutate({ id: t.id, isActive: t.is_active })}
                    >
                      {t.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Noch keine Consent Templates angelegt.</p>
              <p className="text-xs">Klicken Sie oben auf „Neues Template" um eines zu erstellen.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) resetForm(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Consent Template bearbeiten' : 'Neues Consent Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Code</label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="z.B. MARKETING_CONSENT_V1" className="mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titel (DE)</label>
              <Input value={titleDe} onChange={e => setTitleDe(e.target.value)} placeholder="Anzeigename" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Zustimmungstext (DE, Markdown)</label>
              <Textarea
                value={bodyDe}
                onChange={e => setBodyDe(e.target.value)}
                placeholder="Der Text, den der Nutzer zur Zustimmung sieht..."
                className="min-h-[200px] font-mono text-sm mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Abbrechen</Button>
              <Button onClick={() => upsertTemplate.mutate()} disabled={!code || !titleDe || upsertTemplate.isPending}>
                {editId ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Erteilte Consents ({consents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {consents && consents.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {consents.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                  <span>{c.template_id?.slice(0, 8)}… — {c.status}</span>
                  <span className="text-muted-foreground">{new Date(c.consented_at).toLocaleDateString('de-DE')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Keine Consents vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * AgreementsTemplateDialog — Create/Edit agreement template dialog
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface AgreementTemplate {
  id: string; code: string; title: string; content: string; version: number;
  is_active: boolean; requires_consent: boolean; valid_from: string; valid_until: string | null; created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: AgreementTemplate | null;
  onSaved: () => void;
  onError: (msg: string) => void;
}

export function AgreementsTemplateDialog({ open, onOpenChange, editingTemplate, onSaved, onError }: Props) {
  const [form, setForm] = useState({ code: '', title: '', content: '', is_active: true, requires_consent: true });
  const [saving, setSaving] = useState(false);

  const initForm = (template?: AgreementTemplate | null) => {
    if (template) {
      setForm({ code: template.code, title: template.title, content: template.content, is_active: template.is_active, requires_consent: template.requires_consent });
    } else {
      setForm({ code: '', title: '', content: '', is_active: true, requires_consent: true });
    }
  };

  // Sync form when dialog opens
  if (open && form.code === '' && editingTemplate) initForm(editingTemplate);

  const handleSave = async () => {
    if (!form.code || !form.title || !form.content) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase.from('agreement_templates').update({
          title: form.title, content: form.content, is_active: form.is_active,
          requires_consent: form.requires_consent, version: editingTemplate.version + 1,
        }).eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agreement_templates').insert({
          code: form.code, title: form.title, content: form.content,
          is_active: form.is_active, requires_consent: form.requires_consent,
        });
        if (error) throw error;
      }
      onOpenChange(false);
      initForm(null);
      onSaved();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : String(err));
    } finally { setSaving(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) initForm(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</DialogTitle>
            <DialogDescription>{editingTemplate ? 'Änderungen erhöhen die Versionsnummer automatisch.' : 'Erstelle eine neue Vereinbarungsvorlage'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="z.B. SALES_MANDATE" disabled={!!editingTemplate} /></div>
              <div className="space-y-2"><Label>Titel</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="z.B. Verkaufsmandat" /></div>
            </div>
            <div className="space-y-2"><Label>Inhalt</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Vollständiger Text..." rows={8} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={c => setForm(p => ({ ...p, is_active: c }))} /><Label>Aktiv</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.requires_consent} onCheckedChange={c => setForm(p => ({ ...p, requires_consent: c }))} /><Label>Zustimmung erforderlich</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.code || !form.title || !form.content}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AgreementsViewDialog({ template, onClose }: { template: any | null; onClose: () => void }) {
  return (
    <Dialog open={!!template} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template?.title}</DialogTitle>
          <DialogDescription>Code: {template?.code} | Version: {template?.version}</DialogDescription>
        </DialogHeader>
        {template && (
          <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/30">
            <pre className="whitespace-pre-wrap text-sm">{template.content}</pre>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

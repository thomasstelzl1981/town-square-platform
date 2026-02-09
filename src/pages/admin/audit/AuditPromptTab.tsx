import { useState, useEffect } from 'react';
import { useAuditTemplates, useSaveTemplate, useDuplicateTemplate, useSetDefaultTemplate } from './useAuditTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Save, Star, Download, Loader2, CopyPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditPromptTab() {
  const { data: templates, isLoading } = useAuditTemplates();
  const saveTemplate = useSaveTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const setDefault = useSetDefaultTemplate();

  const [selectedId, setSelectedId] = useState<string>('');
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);

  const selected = templates?.find(t => t.id === selectedId);

  // Auto-select default template
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedId) {
      const def = templates.find(t => t.is_default) || templates[0];
      setSelectedId(def.id);
      setEditContent(def.content_txt);
    }
  }, [templates, selectedId]);

  useEffect(() => {
    if (selected) {
      setEditContent(selected.content_txt);
      setEditing(false);
    }
  }, [selectedId]);

  const handleCopy = async () => {
    const today = new Date().toISOString().split('T')[0];
    const text = editContent.replace(/\{\{today\}\}/g, today);
    await navigator.clipboard.writeText(text);
    toast.success('Prompt in Zwischenablage kopiert');
  };

  const handleSave = () => {
    if (!selected) return;
    saveTemplate.mutate({ id: selected.id, content_txt: editContent }, {
      onSuccess: () => { toast.success('Gespeichert'); setEditing(false); },
    });
  };

  const handleDuplicate = () => {
    if (!selected) return;
    duplicateTemplate.mutate(selected, { onSuccess: () => toast.success('Kopie erstellt') });
  };

  const handleSetDefault = () => {
    if (!selected) return;
    setDefault.mutate(selected.id, { onSuccess: () => toast.success('Als Standard gesetzt') });
  };

  const handleExport = () => {
    const blob = new Blob([editContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected?.title || 'audit-prompt'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Template auswählen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Template wählen..." />
            </SelectTrigger>
            <SelectContent>
              {(templates || []).map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title} {t.is_default && '⭐'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>v{selected.version}</span>
                {selected.is_default && <Badge variant="default" className="text-xs">Standard</Badge>}
                {selected.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>

              <Textarea
                value={editContent}
                onChange={e => { setEditContent(e.target.value); setEditing(true); }}
                className="font-mono text-xs min-h-[400px] resize-y"
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCopy} className="gap-1.5">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={!editing || saveTemplate.isPending} className="gap-1.5">
                  <Save className="h-4 w-4" /> Speichern
                </Button>
                <Button variant="outline" onClick={handleDuplicate} disabled={duplicateTemplate.isPending} className="gap-1.5">
                  <CopyPlus className="h-4 w-4" /> Duplizieren
                </Button>
                <Button variant="outline" onClick={handleSetDefault} disabled={selected.is_default || setDefault.isPending} className="gap-1.5">
                  <Star className="h-4 w-4" /> Standard
                </Button>
                <Button variant="outline" onClick={handleExport} className="gap-1.5">
                  <Download className="h-4 w-4" /> Export .txt
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

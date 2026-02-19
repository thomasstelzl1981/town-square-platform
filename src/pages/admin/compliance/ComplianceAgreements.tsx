/**
 * Tab 6: Agreement Templates — Jedes Template als eigene Card mit sichtbaren Feldern
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, Save } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { toast } from 'sonner';

function AgreementCard({ template }: { template: any }) {
  const qc = useQueryClient();
  const [editTitle, setEditTitle] = useState(template.title);
  const [editContent, setEditContent] = useState(template.content || '');

  // Sync if template changes externally
  useEffect(() => {
    setEditTitle(template.title);
    setEditContent(template.content || '');
  }, [template.title, template.content]);

  const updateTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('agreement_templates').update({
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString(),
      }).eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement-templates'] });
      toast.success('Template gespeichert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4" />
            <span className="font-mono text-xs text-muted-foreground">{template.code}</span>
            <span>· v{template.version}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={template.is_active ? 'default' : 'secondary'}>{template.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
            <Badge variant="outline" className="text-xs">{template.requires_consent ? 'Consent nötig' : 'Info'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Titel</label>
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Inhalt (Markdown)</label>
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Template-Text als Markdown..."
            className="min-h-[400px] font-mono text-sm mt-1"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => updateTemplate.mutate()}
            disabled={updateTemplate.isPending}
          >
            <Save className="h-3 w-3 mr-1" /> Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceAgreements() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['agreement-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agreement_templates').select('*').order('code');
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <FileCheck className="h-5 w-5" /> Vereinbarungs-Templates
      </h3>
      {templates?.map(t => (
        <AgreementCard key={t.id} template={t} />
      ))}
      {(!templates || templates.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">Keine Agreement Templates vorhanden.</p>
      )}
    </div>
  );
}

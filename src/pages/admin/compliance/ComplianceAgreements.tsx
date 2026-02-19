/**
 * Tab 6: Agreement Templates — Wrapper um bestehende agreement_templates mit Editor
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileCheck, ChevronDown, Save } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { toast } from 'sonner';

export function ComplianceAgreements() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['agreement-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agreement_templates').select('*').order('code');
      if (error) throw error;
      return data || [];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { error } = await supabase.from('agreement_templates').update({
        title,
        content,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement-templates'] });
      toast.success('Template gespeichert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  if (isLoading) return <LoadingState />;

  const handleOpen = (t: any) => {
    if (openId === t.id) {
      setOpenId(null);
    } else {
      setOpenId(t.id);
      setEditTitle(t.title);
      setEditContent(t.content || '');
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" /> Vereinbarungs-Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates?.map(t => (
            <Collapsible key={t.id} open={openId === t.id} onOpenChange={() => handleOpen(t)}>
              <div className="rounded-lg border">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.code} · v{t.version}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                      <Badge variant="outline" className="text-xs">{t.requires_consent ? 'Consent nötig' : 'Info'}</Badge>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openId === t.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3 border-t">
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
                        className="min-h-[300px] font-mono text-sm mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => updateTemplate.mutate({ id: t.id, title: editTitle, content: editContent })}
                        disabled={updateTemplate.isPending}
                      >
                        <Save className="h-3 w-3 mr-1" /> Speichern
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          {(!templates || templates.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Agreement Templates vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

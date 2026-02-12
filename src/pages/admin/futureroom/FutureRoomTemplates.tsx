/**
 * ZONE-1: FutureRoom E-Mail Vorlagen
 * Manages finance-category email templates (e.g. FM Vorstellung)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Save, Eye, Variable } from 'lucide-react';

interface FinanceTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  category: string | null;
  is_active: boolean | null;
  variables: unknown;
  updated_at: string | null;
}

export default function FutureRoomTemplates() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['finance-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_email_templates')
        .select('*')
        .eq('category', 'finance')
        .order('name');
      if (error) throw error;
      return data as FinanceTemplate[];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, subject, body_html }: { id: string; subject: string; body_html: string }) => {
      const { error } = await supabase
        .from('admin_email_templates')
        .update({ subject, body_html, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-email-templates'] });
      setEditingId(null);
      toast.success('Vorlage gespeichert');
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('admin_email_templates')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-email-templates'] }),
  });

  const startEdit = (t: FinanceTemplate) => {
    setEditingId(t.id);
    setEditSubject(t.subject);
    setEditBodyHtml(t.body_html || '');
    setPreviewMode(false);
  };

  const sampleVars: Record<string, string> = {
    customer_name: 'Max Mustermann',
    manager_name: 'Anna Schmidt',
    manager_phone: '+49 170 1234567',
    manager_email: 'anna.schmidt@futureroom.com',
    manager_company: 'FutureRoom GmbH',
    public_id: 'SOT-F-2026-001',
  };

  const renderPreview = (html: string) => {
    let preview = html;
    for (const [key, val] of Object.entries(sampleVars)) {
      preview = preview.split(`{{${key}}}`).join(val);
    }
    return preview;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">E-Mail-Vorlagen</h2>
        <p className="text-muted-foreground">
          Vorlagen für automatische FutureRoom-Benachrichtigungen verwalten
        </p>
      </div>

      {/* Variable Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Verfügbare Platzhalter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sampleVars).map(([key, val]) => (
              <Badge key={key} variant="outline" className="font-mono text-xs">
                {'{{' + key + '}}'} → {val}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Lade Vorlagen...</div>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Finance-Vorlagen gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription>Kategorie: {t.category}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${t.id}`} className="text-xs text-muted-foreground">Aktiv</Label>
                    <Switch
                      id={`active-${t.id}`}
                      checked={t.is_active ?? false}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: t.id, is_active: checked })}
                    />
                  </div>
                  <Badge variant={t.is_active ? 'default' : 'secondary'}>
                    {t.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingId === t.id ? (
                <>
                  <div className="space-y-2">
                    <Label>Betreff</Label>
                    <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Inhalt (HTML)</Label>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {previewMode ? 'Editor' : 'Vorschau'}
                      </Button>
                    </div>
                    {previewMode ? (
                      <Card className="p-4 bg-muted/30">
                        <p className="text-sm font-medium mb-2">Betreff: {renderPreview(editSubject)}</p>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderPreview(editBodyHtml) }}
                        />
                      </Card>
                    ) : (
                      <Textarea
                        value={editBodyHtml}
                        onChange={(e) => setEditBodyHtml(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateTemplate.mutate({ id: t.id, subject: editSubject, body_html: editBodyHtml })}
                      disabled={updateTemplate.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Speichern
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>Abbrechen</Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Betreff</Label>
                    <p className="text-sm font-medium">{t.subject}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Vorschau</Label>
                    <Card className="p-4 bg-muted/30 mt-1">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderPreview(t.body_html || '') }}
                      />
                    </Card>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => startEdit(t)}>
                    Bearbeiten
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

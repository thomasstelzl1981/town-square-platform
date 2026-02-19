/**
 * Tab 7: Consent Templates — Inline-Cards statt Dialog
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Save, Plus } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { toast } from 'sonner';

function ConsentCard({ template }: { template: any }) {
  const qc = useQueryClient();
  const [code, setCode] = useState(template.code || '');
  const [titleDe, setTitleDe] = useState(template.title_de || '');
  const [bodyDe, setBodyDe] = useState(template.body_de || '');

  const updateTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('consent_templates' as any).update({
        code, title_de: titleDe, body_de: bodyDe, updated_at: new Date().toISOString(),
      } as any).eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success('Template gespeichert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('consent_templates' as any).update({ is_active: !template.is_active } as any).eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success('Status geändert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{titleDe || code}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={template.is_active ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => toggleActive.mutate()}
            >
              {template.is_active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
            <Badge variant="outline" className="text-xs">v{template.version || 1}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Code</label>
          <Input value={code} onChange={e => setCode(e.target.value)} className="mt-1 font-mono" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Titel (DE)</label>
          <Input value={titleDe} onChange={e => setTitleDe(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Zustimmungstext (DE, Markdown)</label>
          <Textarea
            value={bodyDe}
            onChange={e => setBodyDe(e.target.value)}
            placeholder="Der Text, den der Nutzer zur Zustimmung sieht..."
            className="min-h-[300px] font-mono text-sm mt-1"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => updateTemplate.mutate()} disabled={!code || !titleDe || updateTemplate.isPending}>
            <Save className="h-3 w-3 mr-1" /> Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NewConsentCard() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [titleDe, setTitleDe] = useState('');
  const [bodyDe, setBodyDe] = useState('');

  const createTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('consent_templates' as any).insert({
        code, title_de: titleDe, body_de: bodyDe, version: 1, is_active: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success('Template erstellt');
      setCode('');
      setTitleDe('');
      setBodyDe('');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" /> Neues Consent Template
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            className="min-h-[300px] font-mono text-sm mt-1"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => createTemplate.mutate()} disabled={!code || !titleDe || createTemplate.isPending}>
            <Plus className="h-3 w-3 mr-1" /> Erstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceConsents() {
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

  if (templatesLoading || consentsLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <ShieldCheck className="h-5 w-5" /> Consent Templates
      </h3>

      {templates?.map((t: any) => (
        <ConsentCard key={t.id} template={t} />
      ))}

      <NewConsentCard />

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

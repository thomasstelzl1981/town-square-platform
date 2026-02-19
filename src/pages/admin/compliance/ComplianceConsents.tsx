/**
 * Tab 7: Consent Templates — Bestehende consent_templates UI
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/shared';

export function ComplianceConsents() {
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['consent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consent_templates' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Consent Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <span className="font-mono">{t.code || t.id}</span>
                  <Badge variant="secondary">v{t.version || 1}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Noch keine Consent Templates angelegt.</p>
              <p className="text-xs">Templates können hier erstellt werden, um optionale Zustimmungen zu verwalten.</p>
            </div>
          )}
        </CardContent>
      </Card>

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

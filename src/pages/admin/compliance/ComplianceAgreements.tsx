/**
 * Tab 6: Agreement Templates — Wrapper um bestehende agreement_templates
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck } from 'lucide-react';
import { LoadingState } from '@/components/shared';

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" /> Vereinbarungs-Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates?.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{t.code} · v{t.version}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                <Badge variant="outline" className="text-xs">{t.requires_consent ? 'Consent nötig' : 'Info'}</Badge>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Agreement Templates vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

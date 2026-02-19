/**
 * Tab 10: Audit & Security — Security ToDos + Ledger Viewer
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingState } from '@/components/shared';

const SECURITY_TODOS = [
  { label: 'Leaked Password Protection aktivieren', severity: 'high', status: 'open' },
  { label: 'OTP Expiry reduzieren (< 60s)', severity: 'medium', status: 'open' },
  { label: 'Overly permissive RLS Policies prüfen (USING true)', severity: 'medium', status: 'open' },
  { label: 'Public Storage Buckets prüfen (docs-export, social-assets)', severity: 'low', status: 'info' },
  { label: 'Cookie-Banner implementieren', severity: 'medium', status: 'open' },
  { label: 'MFA-Option anbieten', severity: 'low', status: 'planned' },
  { label: 'Account-Löschung im Portal implementieren', severity: 'high', status: 'open' },
  { label: 'DSAR-Export automatisieren', severity: 'medium', status: 'planned' },
];

export function ComplianceAuditSecurity() {
  const { data: legalEvents, isLoading } = useQuery({
    queryKey: ['ledger-legal-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_event_ledger')
        .select('*')
        .like('event_type', 'legal.%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const severityIcon = (s: string) => {
    if (s === 'high') return <XCircle className="h-4 w-4 text-destructive" />;
    if (s === 'medium') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security ToDos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {SECURITY_TODOS.map((todo, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                {severityIcon(todo.severity)}
                <span className="text-sm">{todo.label}</span>
              </div>
              <Badge variant={todo.status === 'open' ? 'destructive' : todo.status === 'planned' ? 'secondary' : 'outline'} className="text-xs">
                {todo.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal Ledger Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState /> : legalEvents && legalEvents.length > 0 ? (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {legalEvents.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{e.event_type}</Badge>
                    <span className="text-muted-foreground">{e.direction}</span>
                  </div>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString('de-DE')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Legal-Events im Ledger.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

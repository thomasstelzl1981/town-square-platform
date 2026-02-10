/**
 * Sales Desk Approval Section - Zone 2 → Zone 1 workflow
 * MOD-13 PROJEKTE
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Globe, 
  Users, 
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SalesApprovalSectionProps {
  projectId?: string;
  projectName?: string;
  isDemo?: boolean;
}

const STATUS_CONFIG = {
  pending: { label: 'Ausstehend', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  approved: { label: 'Freigegeben', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  rejected: { label: 'Abgelehnt', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  withdrawn: { label: 'Zurückgezogen', icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function SalesApprovalSection({ projectId, projectName, isDemo = false }: SalesApprovalSectionProps) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  // Fetch existing request for this project
  const { data: request } = useQuery({
    queryKey: ['sales-desk-request', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !isDemo,
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!projectId || !tenantId || !user) throw new Error('Fehlende Daten');
      const { error } = await supabase
        .from('sales_desk_requests')
        .insert({
          project_id: projectId,
          tenant_id: tenantId,
          requested_by: user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] });
      toast.success('Freigabe-Anfrage gesendet', { description: 'Der Sales Desk wird Ihr Projekt prüfen.' });
    },
    onError: (err: Error) => toast.error('Fehler: ' + err.message),
  });

  const status = isDemo ? null : request?.status;
  const statusConfig = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Freigabe & Distribution
        {isDemo && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Card */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Freigabe-Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusConfig ? (
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                  <statusConfig.icon className={`h-5 w-5 ${statusConfig.color}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{statusConfig.label}</p>
                  {request?.reviewed_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.reviewed_at).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Nicht beantragt</p>
                  <p className="text-xs text-muted-foreground">Freigabe erforderlich für Vertrieb</p>
                </div>
              </div>
            )}

            {(!status || status === 'rejected' || status === 'withdrawn') && (
              <Button
                className="w-full mt-3 gap-2"
                size="sm"
                onClick={() => !isDemo && submitRequest.mutate()}
                disabled={isDemo || submitRequest.isPending}
              >
                {submitRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                An Sales Desk senden
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Distribution Channels */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vertriebskanäle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Users, label: 'Partnernetzwerk (Zone 2)', active: status === 'approved' },
              { icon: Globe, label: 'Kaufy Marktplatz (Zone 3)', active: status === 'approved' },
              { icon: Globe, label: 'Projekt-Landingpage', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ablauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Freigabe an Sales Desk senden</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Zone 1 prüft Mandat & Provision</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Nach Approval: Sichtbar in Partnernetzwerk + Kaufy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

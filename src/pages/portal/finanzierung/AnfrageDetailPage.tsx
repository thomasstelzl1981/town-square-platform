/**
 * MOD-07: Finance Request Detail Page
 * Shows request details with object info, calculation summary, and submit action
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Building2, Send, Clock, CheckCircle, 
  FileText, Loader2, AlertCircle, User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  submitted: { label: 'Eingereicht', variant: 'default' },
  in_review: { label: 'In Prüfung', variant: 'outline' },
  delegated: { label: 'Zugewiesen', variant: 'outline' },
  accepted: { label: 'Angenommen', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
};

export default function AnfrageDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch request with related data
  const { data: request, isLoading } = useQuery({
    queryKey: ['finance-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      
      const { data, error } = await supabase
        .from('finance_requests')
        .select(`
          *,
          property:properties(id, address, city, purchase_price),
          mandate:finance_mandates(*)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  // Submit request mutation (creates mandate)
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!request || !activeOrganization) throw new Error('Missing data');

      // Update request status
      const { error: reqError } = await supabase
        .from('finance_requests')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // Create mandate for Zone-1 intake
      const { error: mandateError } = await supabase
        .from('finance_mandates')
        .insert({
          finance_request_id: request.id,
          tenant_id: activeOrganization.id,
          status: 'new',
        });

      if (mandateError) throw mandateError;
    },
    onSuccess: () => {
      toast.success('Anfrage erfolgreich eingereicht');
      queryClient.invalidateQueries({ queryKey: ['finance-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Einreichen: ' + (error as Error).message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Anfrage nicht gefunden</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/portal/finanzierung/anfrage">Zurück zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[request.status] || statusLabels.draft;
  const canSubmit = request.status === 'draft';
  const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/portal/finanzierung/anfrage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              Finanzierungsanfrage
            </h2>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            {request.public_id || request.id.slice(0, 8)}
          </p>
        </div>
        {canSubmit && (
          <Button 
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Anfrage einreichen
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Object Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Finanzierungsobjekt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.property ? (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Adresse</div>
                  <div className="font-medium">
                    {request.property.address}, {request.property.city}
                  </div>
                </div>
                {request.property.purchase_price && (
                  <div>
                    <div className="text-sm text-muted-foreground">Kaufpreis</div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(request.property.purchase_price)}
                    </div>
                  </div>
                )}
              </>
            ) : request.custom_object_data ? (
              <div>
                <div className="text-sm text-muted-foreground">Objektdaten (manuell)</div>
                <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(request.custom_object_data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Kein Objekt zugeordnet
              </div>
            )}

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground">Objektquelle</div>
              <div className="font-medium capitalize">
                {request.object_source || 'Nicht angegeben'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status & Zeitverlauf
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Erstellt am</div>
              <div className="font-medium">
                {format(new Date(request.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })}
              </div>
            </div>

            {request.submitted_at && (
              <div>
                <div className="text-sm text-muted-foreground">Eingereicht am</div>
                <div className="font-medium">
                  {format(new Date(request.submitted_at), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                </div>
              </div>
            )}

            {mandate && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Mandatsstatus</div>
                  <Badge variant="outline" className="mt-1">
                    {mandate.status}
                  </Badge>
                </div>

                {mandate.assigned_manager_id && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Finanzierungsmanager zugewiesen</div>
                      <div className="font-medium">
                        Manager-ID: {mandate.assigned_manager_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Objektbezogene Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dokument-Upload wird in Phase 5 implementiert</p>
              <p className="text-sm">object_type='finance_request'</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

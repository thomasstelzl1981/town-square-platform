import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, FileText, Building2, User, Clock, 
  CheckCircle2, Send, AlertCircle, Loader2 
} from 'lucide-react';
import { useFinanceRequests, useCreateFinanceRequest } from '@/hooks/useFinanceRequest';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { FinanceRequestStatus } from '@/types/finance';

const statusConfig: Record<FinanceRequestStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
  collecting: { label: 'Dokumente sammeln', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  ready: { label: 'Bereit', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  submitted: { label: 'Eingereicht', variant: 'default', icon: <Send className="h-3 w-3" /> },
  assigned: { label: 'Zugewiesen', variant: 'default', icon: <User className="h-3 w-3" /> },
  in_processing: { label: 'In Bearbeitung', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  needs_customer_action: { label: 'Aktion erforderlich', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  completed: { label: 'Abgeschlossen', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: 'Abgelehnt', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export function FinanceRequestList() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useFinanceRequests();
  const createRequest = useCreateFinanceRequest();

  const handleCreate = async () => {
    const result = await createRequest.mutateAsync({});
    if (result?.id) {
      navigate(`/portal/finanzierung/${result.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Finanzierungsanträge</h3>
        <p className="text-muted-foreground mb-6">
          Erstellen Sie Ihren ersten Finanzierungsantrag, um Dokumente zu sammeln und einzureichen.
        </p>
        <Button onClick={handleCreate} disabled={createRequest.isPending}>
          {createRequest.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Neuer Antrag
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={createRequest.isPending}>
          {createRequest.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Neuer Antrag
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => {
          const primaryApplicant = request.applicant_profiles?.find(p => p.party_role === 'primary');
          const status = statusConfig[request.status as FinanceRequestStatus] || statusConfig.draft;
          const completionScore = primaryApplicant?.completion_score || 0;

          return (
            <Card
              key={request.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/portal/finanzierung/${request.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: ID and Applicant */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {request.public_id || 'FIN-...'}
                        </span>
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {primaryApplicant?.first_name && primaryApplicant?.last_name
                            ? `${primaryApplicant.first_name} ${primaryApplicant.last_name}`
                            : 'Antragsteller ausfüllen'}
                        </span>
                        {request.property_id && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Objekt verknüpft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress and Date */}
                  <div className="flex items-center gap-6">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Vollständigkeit</span>
                        <span className="font-medium">{completionScore}%</span>
                      </div>
                      <Progress value={completionScore} className="h-1.5" />
                    </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(request.created_at), 'dd. MMM yyyy', { locale: de })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

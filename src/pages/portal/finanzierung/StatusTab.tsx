/**
 * MOD-07 Finanzierung - Status Tab
 * 
 * Übersicht aller finance_requests + Mandat-Spiegel + Case-Spiegel (read-only nach Einreichung)
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, FileText, CheckCircle2, Send, AlertCircle,
  ArrowRight, Loader2, ArrowLeft, Building2
} from 'lucide-react';
import { useFinanceRequests, useFinanceRequest, useSubmitFinanceRequest } from '@/hooks/useFinanceRequest';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { SelbstauskunftForm } from '@/components/finanzierung';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  draft: { label: 'Entwurf', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  collecting: { label: 'Sammeln', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
  ready: { label: 'Bereit', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  submitted: { label: 'Eingereicht', variant: 'default', icon: <Send className="h-3 w-3" /> },
};

export default function StatusTab() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // If we have an ID, show detail view
  if (id) {
    return <StatusDetail requestId={id} />;
  }
  
  // Otherwise show list
  return <StatusList />;
}

function StatusList() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useFinanceRequests();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Status
        </h2>
        <p className="text-muted-foreground">
          Übersicht aller Finanzierungsanfragen und deren Status
        </p>
      </div>

      {/* Request List */}
      {(!requests || requests.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Finanzierungen</h3>
            <p className="text-muted-foreground mb-6">
              Sie haben noch keine Finanzierungsanfragen erstellt.
            </p>
            <Button onClick={() => navigate('/portal/finanzierung/neu')}>
              Neue Finanzierung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.draft;
            const primaryApplicant = request.applicant_profiles?.find(
              (p: any) => p.party_role === 'primary'
            );
            
            return (
              <Card 
                key={request.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/portal/finanzierung/status/${request.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{request.public_id || 'Entwurf'}</span>
                          <Badge variant={status.variant} className="gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {primaryApplicant?.first_name && primaryApplicant?.last_name
                            ? `${primaryApplicant.first_name} ${primaryApplicant.last_name}`
                            : 'Antragsteller ausfüllen'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Erstellt: {format(new Date(request.created_at), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {primaryApplicant?.completion_score !== undefined && (
                        <Badge variant="outline">
                          {primaryApplicant.completion_score}% vollständig
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusDetail({ requestId }: { requestId: string }) {
  const navigate = useNavigate();
  const { data: request, isLoading } = useFinanceRequest(requestId);
  const submitRequest = useSubmitFinanceRequest();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Anfrage nicht gefunden</h3>
          <Button onClick={() => navigate('/portal/finanzierung/status')}>
            Zurück zur Übersicht
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[request.status] || statusConfig.draft;
  const primaryProfile = request.applicant_profiles?.find(
    (p: any) => p.party_role === 'primary'
  );
  const isReadOnly = request.status === 'submitted';

  const handleSubmit = async () => {
    await submitRequest.mutateAsync(requestId);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/portal/finanzierung/status')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {request.public_id || 'Finanzierungsantrag'}
          </h2>
          <p className="text-muted-foreground">
            Erstellt: {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
          </p>
        </div>
        <Badge variant={status.variant} className="gap-1 text-base px-3 py-1">
          {status.icon}
          {status.label}
        </Badge>
      </div>

      {/* Read-only Notice for Submitted */}
      {isReadOnly && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Antrag eingereicht</p>
              <p className="text-sm text-muted-foreground">
                Dieser Antrag wurde eingereicht und kann nicht mehr bearbeitet werden.
                Verfolgen Sie den Status im Mandat-Spiegel unten.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mandate Mirror (for submitted requests) */}
      {isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Mandat-Status
            </CardTitle>
            <CardDescription>
              Status der Bearbeitung durch den Finanzierungsmanager
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Mirror from finance_mandates / future_room_cases */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">In Bearbeitung</p>
                <p className="text-sm text-muted-foreground">
                  Ihr Antrag wird geprüft und einem Manager zugewiesen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applicant Profile */}
      {primaryProfile && (
        <SelbstauskunftForm 
          profile={primaryProfile as any} 
          readOnly={isReadOnly}
        />
      )}

      {/* Submit Button (for draft requests) */}
      {!isReadOnly && primaryProfile && (primaryProfile as any).completion_score >= 80 && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Antrag bereit zur Einreichung</p>
                <p className="text-sm text-muted-foreground">
                  Alle Pflichtfelder sind ausgefüllt.
                </p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={submitRequest.isPending}>
              {submitRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Antrag einreichen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Loader2, ArrowRight, CheckCircle2, Clock,
  AlertTriangle
} from 'lucide-react';
import { SelbstauskunftFormV2 } from '@/components/finanzierung/SelbstauskunftFormV2';
import { AcceptMandateDialog } from '@/components/finanzierung/AcceptMandateDialog';
import { useAcceptMandate } from '@/hooks/useFinanceMandate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ApplicantProfile } from '@/types/finance';

interface CaseDetailTabProps {
  cases: any[];
  isLoading: boolean;
}

export default function CaseDetailTab({ cases, isLoading }: CaseDetailTabProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const acceptMandate = useAcceptMandate();
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no caseId, show list of cases that need acceptance or are active
  if (!caseId) {
    // Filter cases: show delegated (need acceptance) and active cases
    const delegatedCases = cases.filter(c => {
      const mandate = c.finance_mandates;
      return mandate?.status === 'delegated' && !mandate?.accepted_at;
    });
    
    const activeCases = cases.filter(c => {
      const mandate = c.finance_mandates;
      return mandate?.status === 'accepted' || c.status === 'active';
    });

    if (delegatedCases.length === 0 && activeCases.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine aktiven Fälle</h3>
            <p className="text-muted-foreground">
              Sie haben noch keine Finanzierungsmandate angenommen.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Pending Acceptance */}
        {delegatedCases.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                Warten auf Annahme
              </Badge>
              <span className="text-sm text-muted-foreground">({delegatedCases.length})</span>
            </div>
            <div className="grid gap-4">
              {delegatedCases.map((caseItem) => {
                const mandate = caseItem.finance_mandates;
                const request = mandate?.finance_requests;
                const applicant = request?.applicant_profiles?.[0];
                const completionScore = applicant?.completion_score || 0;

                return (
                  <Card 
                    key={caseItem.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors border-amber-300"
                    onClick={() => navigate(`/portal/finanzierungsmanager/selbstauskunft/${caseItem.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {applicant?.first_name && applicant?.last_name
                                  ? `${applicant.first_name} ${applicant.last_name}`
                                  : 'Name nicht angegeben'}
                              </span>
                              <Badge variant="outline">
                                {completionScore}% vollständig
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request?.public_id || mandate?.public_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {applicant?.loan_amount_requested && (
                            <span className="font-medium">
                              {new Intl.NumberFormat('de-DE', { 
                                style: 'currency', 
                                currency: 'EUR', 
                                maximumFractionDigits: 0 
                              }).format(applicant.loan_amount_requested)}
                            </span>
                          )}
                          <Button size="sm" variant="default">
                            Prüfen & Annehmen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Cases */}
        {activeCases.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="gap-1 bg-green-500">
                <CheckCircle2 className="h-3 w-3" />
                Aktive Fälle
              </Badge>
              <span className="text-sm text-muted-foreground">({activeCases.length})</span>
            </div>
            <div className="grid gap-4">
              {activeCases.map((caseItem) => {
                const mandate = caseItem.finance_mandates;
                const request = mandate?.finance_requests;
                const applicant = request?.applicant_profiles?.[0];
                const completionScore = applicant?.completion_score || 0;

                return (
                  <Card 
                    key={caseItem.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/portal/finanzierungsmanager/selbstauskunft/${caseItem.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {applicant?.first_name && applicant?.last_name
                                  ? `${applicant.first_name} ${applicant.last_name}`
                                  : 'Name nicht angegeben'}
                              </span>
                              <Badge variant={completionScore >= 80 ? 'default' : 'secondary'}>
                                {completionScore}% vollständig
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request?.public_id || mandate?.public_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {applicant?.loan_amount_requested && (
                            <span className="font-medium">
                              {new Intl.NumberFormat('de-DE', { 
                                style: 'currency', 
                                currency: 'EUR', 
                                maximumFractionDigits: 0 
                              }).format(applicant.loan_amount_requested)}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show detail view
  const selectedCase = cases.find(c => c.id === caseId);
  if (!selectedCase) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Fall nicht gefunden</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/portal/finanzierungsmanager/selbstauskunft')}
          >
            Zurück zur Übersicht
          </Button>
        </CardContent>
      </Card>
    );
  }

  const mandate = selectedCase.finance_mandates;
  const request = mandate?.finance_requests;
  const applicant = request?.applicant_profiles?.[0];
  const needsAcceptance = mandate?.status === 'delegated' && !mandate?.accepted_at;

  const handleAccept = async () => {
    if (!mandate?.id) return;
    
    try {
      await acceptMandate.mutateAsync(mandate.id);
      setAcceptDialogOpen(false);
      toast.success('Mandat erfolgreich angenommen');
      // TODO: Trigger customer notification email via Edge Function
    } catch (error) {
      toast.error('Fehler beim Annehmen des Mandats');
    }
  };

  const applicantName = applicant?.first_name && applicant?.last_name
    ? `${applicant.first_name} ${applicant.last_name}`
    : 'Antragsteller';

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/portal/finanzierungsmanager/selbstauskunft')}
        >
          ← Zurück zur Übersicht
        </Button>
        <div className="flex items-center gap-3">
          {needsAcceptance && (
            <Button onClick={() => setAcceptDialogOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mandat annehmen
            </Button>
          )}
          {!needsAcceptance && (
            <Button
              onClick={() => navigate(`/portal/finanzierungsmanager/einreichen/${caseId}`)}
              disabled={!applicant || applicant.completion_score < 80}
            >
              Weiter zur Einreichung
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {applicantName}
            </CardTitle>
            <div className="flex items-center gap-2">
              {needsAcceptance && (
                <Badge variant="destructive">Annahme erforderlich</Badge>
              )}
              <Badge variant="outline">{request?.public_id || mandate?.public_id}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Accept Mandate Banner */}
      {needsAcceptance && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Mandat noch nicht angenommen</p>
              <p className="text-sm text-amber-700">
                Bitte prüfen Sie die Unterlagen und nehmen Sie das Mandat an, um mit der Bearbeitung zu beginnen.
              </p>
            </div>
            <Button onClick={() => setAcceptDialogOpen(true)}>
              Jetzt annehmen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selbstauskunft Form */}
      {applicant ? (
        <SelbstauskunftFormV2 
          profile={applicant as unknown as ApplicantProfile} 
          readOnly={needsAcceptance} 
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Keine Antragstellerdaten verfügbar
          </CardContent>
        </Card>
      )}

      {/* Accept Dialog */}
      <AcceptMandateDialog
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        loanAmount={applicant?.loan_amount_requested || null}
        applicantName={applicantName}
        onAccept={handleAccept}
        isPending={acceptMandate.isPending}
      />
    </div>
  );
}

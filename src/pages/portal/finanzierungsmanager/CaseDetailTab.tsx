import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Loader2, FileText, ArrowRight, 
  CheckCircle2, AlertTriangle, Building2 
} from 'lucide-react';
import { SelbstauskunftForm } from '@/components/finanzierung/SelbstauskunftForm';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CaseDetailTabProps {
  cases: any[];
  isLoading: boolean;
}

export default function CaseDetailTab({ cases, isLoading }: CaseDetailTabProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no caseId, show list
  if (!caseId) {
    if (cases.length === 0) {
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ihre Fälle</h2>
        <div className="grid gap-4">
          {cases.map((caseItem) => {
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
        <Button
          onClick={() => navigate(`/portal/finanzierungsmanager/einreichen/${caseId}`)}
          disabled={!applicant || applicant.completion_score < 80}
        >
          Weiter zur Einreichung
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {applicant?.first_name && applicant?.last_name
                ? `${applicant.first_name} ${applicant.last_name}`
                : 'Antragsteller'}
            </CardTitle>
            <Badge variant="outline">{request?.public_id || mandate?.public_id}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Selbstauskunft Form */}
      {applicant ? (
        <SelbstauskunftForm profile={applicant} readOnly={false} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Keine Antragstellerdaten verfügbar
          </CardContent>
        </Card>
      )}
    </div>
  );
}

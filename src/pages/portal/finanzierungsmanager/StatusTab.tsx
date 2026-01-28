import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Loader2, CheckCircle2, Send, 
  AlertCircle, Building2, User 
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface StatusTabProps {
  cases: any[];
  isLoading: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'In Bearbeitung', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600' },
  missing_docs: { label: 'Dokumente fehlen', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-500/10 text-red-600' },
  ready_to_submit: { label: 'Bereit', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
  submitted: { label: 'Eingereicht', icon: <Send className="h-4 w-4" />, color: 'bg-primary/10 text-primary' },
  closed: { label: 'Abgeschlossen', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
};

export default function StatusTab({ cases, isLoading }: StatusTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Fälle</h3>
          <p className="text-muted-foreground">
            Sie haben noch keine aktiven Finanzierungsfälle.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by status
  const grouped = cases.reduce((acc, c) => {
    const status = c.status || 'active';
    if (!acc[status]) acc[status] = [];
    acc[status].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Status-Übersicht</h2>

      {Object.entries(grouped).map(([status, items]) => {
        const config = statusConfig[status] || statusConfig.active;
        
        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({(items as any[]).length})
              </span>
            </div>
            
            <div className="grid gap-3">
              {(items as any[]).map((caseItem) => {
                const mandate = caseItem.finance_mandates;
                const request = mandate?.finance_requests;
                const applicant = request?.applicant_profiles?.[0];

                return (
                  <Card key={caseItem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium">
                              {applicant?.first_name} {applicant?.last_name}
                            </span>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{request?.public_id}</span>
                              {caseItem.submitted_to_bank_at && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {format(new Date(caseItem.submitted_to_bank_at), 'dd.MM.yyyy', { locale: de })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {applicant?.loan_amount_requested && (
                          <span className="font-medium">
                            {new Intl.NumberFormat('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              maximumFractionDigits: 0 
                            }).format(applicant.loan_amount_requested)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

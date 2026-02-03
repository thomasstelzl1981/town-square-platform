/**
 * FM Dashboard — Finance Manager Overview
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

export default function FMDashboard({ cases, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const newCases = cases.filter(c => c.status === 'active' && !c.first_action_at);
  const inProgressCases = cases.filter(c => c.status === 'active' && !!c.first_action_at);
  const needsActionCases = cases.filter(c => 
    c.finance_mandates?.finance_requests?.status === 'needs_customer_action'
  );
  const completedCases = cases.filter(c => c.status === 'completed' || c.status === 'closed');

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('faelle')}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Neu zugewiesen
            </CardDescription>
            <CardTitle className="text-3xl">{newCases.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('faelle')}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Bearbeitung
            </CardDescription>
            <CardTitle className="text-3xl">{inProgressCases.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('faelle')}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Warte auf Kunde
            </CardDescription>
            <CardTitle className="text-3xl text-destructive">{needsActionCases.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Abgeschlossen
            </CardDescription>
            <CardTitle className="text-3xl">{completedCases.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Fälle</CardTitle>
          <CardDescription>
            Ihre zuletzt zugewiesenen Finanzierungsanfragen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Fälle zugewiesen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.slice(0, 5).map((c) => {
                const mandate = c.finance_mandates;
                const request = mandate?.finance_requests;
                const applicant = request?.applicant_profiles?.[0];
                
                return (
                  <div 
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`faelle/${request?.id || c.id}`)}
                  >
                    <div>
                      <div className="font-medium">
                        {applicant?.first_name && applicant?.last_name
                          ? `${applicant.first_name} ${applicant.last_name}`
                          : mandate?.public_id || 'Unbekannt'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {applicant?.loan_amount_requested
                          ? new Intl.NumberFormat('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR',
                              maximumFractionDigits: 0
                            }).format(applicant.loan_amount_requested)
                          : 'Kein Betrag'}
                      </div>
                    </div>
                    <Badge variant={c.status === 'active' ? 'secondary' : 'outline'}>
                      {c.status === 'active' ? 'Aktiv' : c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          
          {cases.length > 5 && (
            <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('faelle')}>
              Alle {cases.length} Fälle anzeigen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

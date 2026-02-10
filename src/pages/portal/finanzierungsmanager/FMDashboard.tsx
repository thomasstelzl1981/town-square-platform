/**
 * FM Dashboard — Finance Manager Overview
 */
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('faelle')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Neu zugewiesen</p>
                <p className="text-2xl font-bold mt-1">{newCases.length}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('faelle')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Bearbeitung</p>
                <p className="text-2xl font-bold mt-1">{inProgressCases.length}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('faelle')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Warte auf Kunde</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{needsActionCases.length}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                <p className="text-2xl font-bold mt-1">{completedCases.length}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Aktuelle Fälle</h3>
              <p className="text-xs text-muted-foreground">Ihre zuletzt zugewiesenen Finanzierungsanfragen</p>
            </div>
          </div>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
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

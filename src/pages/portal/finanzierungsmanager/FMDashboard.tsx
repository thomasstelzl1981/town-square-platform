/**
 * FM Dashboard — Two sections: (A) Fälle in Bearbeitung, (B) Finanzierungsmandate
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, CalendarClock, Activity, Check, X, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { Badge } from '@/components/ui/badge';
import { useAcceptMandate, useUpdateMandateStatus, useFinanceMandates } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

function getApplicantName(c: FutureRoomCase): string {
  const ap = c.finance_mandates?.finance_requests?.applicant_profiles?.[0];
  if (ap?.first_name && ap?.last_name) return `${ap.first_name} ${ap.last_name}`;
  return c.finance_mandates?.public_id || 'Unbekannt';
}

function getLoanAmount(c: FutureRoomCase): number | null {
  return c.finance_mandates?.finance_requests?.applicant_profiles?.[0]?.loan_amount_requested || null;
}

export default function FMDashboard({ cases, isLoading }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const acceptMandate = useAcceptMandate();
  const updateStatus = useUpdateMandateStatus();

  // Filter: only cases NOT yet submitted
  const SUBMITTED_STATUSES = ['submitted_to_bank', 'completed', 'rejected', 'archived'];
  const activeCases = cases.filter(c => !SUBMITTED_STATUSES.includes(getRequestStatus(c)));

  // Fetch pending mandates assigned to this manager
  const { data: allMandates = [], isLoading: loadingMandates } = useFinanceMandates();
  const pendingMandates = (allMandates as any[]).filter(
    (m) => (m.status === 'delegated' || m.status === 'assigned') && m.assigned_manager_id === user?.id
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // Overdue: active cases older than 3 days without first_action
  const overdueCases = activeCases.filter(c => {
    if (c.status !== 'active') return false;
    const age = Date.now() - new Date(c.created_at).getTime();
    return age > 3 * 24 * 60 * 60 * 1000 && !c.first_action_at;
  });

  // Recent activity (only from active cases)
  const recentCases = [...activeCases].sort((a, b) => 
    new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  ).slice(0, 6);

  const handleCaseClick = (requestId: string) => {
    navigate(`faelle/${requestId}`);
  };

  const handleAcceptMandate = async (mandateId: string) => {
    try {
      await acceptMandate.mutateAsync(mandateId);
    } catch {
      // Error handled in hook
    }
  };

  const handleDeclineMandate = async (mandateId: string) => {
    try {
      await updateStatus.mutateAsync({ mandateId, status: 'rejected' as any });
      toast.success('Mandat abgelehnt');
    } catch {
      // Error handled in hook
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="FINANZIERUNGSMANAGER"
        description={`${activeCases.length} Fälle in Bearbeitung — noch nicht eingereicht.`}
        actions={
          <Button onClick={() => navigate('/portal/finanzierungsmanager/finanzierungsakte')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Fall
          </Button>
        }
      />

      {/* Section A: Fälle in Bearbeitung */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fälle in Bearbeitung
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {activeCases.map(c => (
            <FinanceCaseCard
              key={c.id}
              caseData={c}
              onClick={handleCaseClick}
            />
          ))}
          {activeCases.length === 0 && (
            <FinanceCaseCardPlaceholder />
          )}
        </div>
      </div>

      {/* Section B: Finanzierungsmandate */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Finanzierungsmandate
        </h3>
        {loadingMandates ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingMandates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Keine neuen Mandate vorhanden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMandates.map((m: any) => {
              const req = m.finance_requests;
              const ap = req?.applicant_profiles?.[0];
              const name = ap?.first_name && ap?.last_name
                ? `${ap.first_name} ${ap.last_name}`
                : 'Unbekannt';
              const loan = ap?.loan_amount_requested;
              return (
                <Card key={m.id} className="border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{m.public_id || m.id.slice(0, 8)}</span>
                      <Badge variant="outline">{m.status === 'delegated' ? 'Zugewiesen' : 'Angefragt'}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      {loan && <p className="text-xs text-muted-foreground">{eurFormat.format(loan)}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptMandate(m.id)}
                        disabled={acceptMandate.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Annehmen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDeclineMandate(m.id)}
                        disabled={updateStatus.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Widgets below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <WidgetHeader
              icon={CalendarClock}
              title="Fällig / Überfällig"
              description={overdueCases.length > 0 ? `${overdueCases.length} Fälle` : 'Keine überfälligen Fälle'}
            />
            {overdueCases.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Alles im Zeitplan ✓</p>
            ) : (
              <div className="space-y-1">
                {overdueCases.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-destructive/5 border border-destructive/20 cursor-pointer hover:border-destructive/40 transition-colors text-sm"
                    onClick={() => handleCaseClick(c.finance_mandates?.finance_request_id || c.id)}
                  >
                    <span className="font-medium text-sm">{getApplicantName(c)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { locale: de })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <WidgetHeader
              icon={Activity}
              title="Letzte Aktivitäten"
            />
            {recentCases.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Noch keine Fälle</p>
            ) : (
              <div className="space-y-1">
                {recentCases.map(c => {
                  const status = getRequestStatus(c);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 transition-colors cursor-pointer text-sm"
                      onClick={() => handleCaseClick(c.finance_mandates?.finance_request_id || c.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm">{getApplicantName(c)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {getLoanAmount(c) ? eurFormat.format(getLoanAmount(c)!) : ''}
                        </span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(status)} className="text-[10px] shrink-0 ml-2">
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

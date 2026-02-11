/**
 * FM Dashboard — Finance Manager Overview with Pipeline Board + KPIs
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Clock, AlertCircle, CheckCircle2, Loader2, 
  Send, FileCheck, ArrowRight, Plus, CalendarClock, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

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

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function FMDashboard({ cases, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // Pipeline counts
  const delegated = cases.filter(c => {
    const s = getRequestStatus(c);
    return s === 'delegated' || s === 'assigned';
  });
  const accepted = cases.filter(c => getRequestStatus(c) === 'accepted' || (c.status === 'active' && !c.first_action_at));
  const editing = cases.filter(c => {
    const s = getRequestStatus(c);
    return s === 'editing' || s === 'in_processing' || (c.status === 'active' && !!c.first_action_at);
  });
  const needsAction = cases.filter(c => getRequestStatus(c) === 'needs_customer_action');
  const ready = cases.filter(c => getRequestStatus(c) === 'ready_for_submission' || c.status === 'ready_to_submit');
  const submitted = cases.filter(c => getRequestStatus(c) === 'submitted_to_bank' || !!c.submitted_to_bank_at);
  const completed = cases.filter(c => getRequestStatus(c) === 'completed' || c.status === 'completed' || c.status === 'closed');
  const rejected = cases.filter(c => getRequestStatus(c) === 'rejected');

  // Overdue: active cases older than 3 days without first_action
  const overdueCases = cases.filter(c => {
    if (c.status !== 'active') return false;
    const age = Date.now() - new Date(c.created_at).getTime();
    return age > 3 * 24 * 60 * 60 * 1000 && !c.first_action_at;
  });

  // Recent 5 cases
  const recentCases = [...cases].sort((a, b) => 
    new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  ).slice(0, 6);

  return (
    <PageShell>
      <ModulePageHeader
        title="FINANZIERUNGSMANAGER"
        description="Pipeline, Fälle und Aktionen im Überblick — Ihr zentrales Management-Cockpit für alle Finanzierungen."
        actions={
          <Button onClick={() => navigate('faelle')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Fall
          </Button>
        }
      />

      {/* Pipeline KPI Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Delegiert" value={delegated.length} icon={FolderOpen} onClick={() => navigate('faelle')} />
        <KPICard label="Angenommen" value={accepted.length} icon={CheckCircle2} onClick={() => navigate('faelle')} />
        <KPICard label="In Bearbeitung" value={editing.length} icon={Clock} onClick={() => navigate('faelle')} />
        <KPICard label="Rückfrage" value={needsAction.length} icon={AlertCircle} 
          subtitleClassName="text-destructive" subtitle={needsAction.length > 0 ? 'Aktion nötig' : undefined}
          onClick={() => navigate('faelle')} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Ready" value={ready.length} icon={FileCheck} onClick={() => navigate('faelle')} />
        <KPICard label="Eingereicht" value={submitted.length} icon={Send} onClick={() => navigate('faelle')} />
        <KPICard label="Abgeschlossen" value={completed.length} icon={CheckCircle2} />
        <KPICard label="Abgelehnt" value={rejected.length} icon={AlertCircle} />
      </div>

      {/* Two widgets side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today Due / Overdue */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <WidgetHeader
              icon={CalendarClock}
              title="Heute fällig / Überfällig"
              description={`${overdueCases.length} Fälle benötigen Aufmerksamkeit`}
            />
            {overdueCases.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarClock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Keine überfälligen Fälle</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueCases.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20 cursor-pointer hover:border-destructive/40 transition-colors"
                    onClick={() => navigate(`faelle/${c.finance_mandates?.finance_request_id || c.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{getApplicantName(c)}</p>
                      <p className="text-xs text-muted-foreground">
                        Seit {formatDistanceToNow(new Date(c.created_at), { locale: de })}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">Überfällig</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <WidgetHeader
              icon={Activity}
              title="Letzte Aktivitäten"
              description="Ihre zuletzt bearbeiteten Fälle"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('faelle')}>
                  Alle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              }
            />
            {recentCases.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Noch keine Fälle vorhanden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCases.map(c => {
                  const status = getRequestStatus(c);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`faelle/${c.finance_mandates?.finance_request_id || c.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{getApplicantName(c)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getLoanAmount(c) ? eurFormat.format(getLoanAmount(c)!) : 'Kein Betrag'} · {formatDistanceToNow(new Date(c.updated_at || c.created_at), { addSuffix: true, locale: de })}
                        </p>
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

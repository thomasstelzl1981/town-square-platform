/**
 * FM Dashboard — Finance Manager Overview (clean, no counters)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Loader2, ArrowRight, Plus, CalendarClock, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
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
        description={`${cases.length} Fälle in Bearbeitung — Ihr zentrales Management-Cockpit.`}
        actions={
          <Button onClick={() => navigate('faelle')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Fall
          </Button>
        }
      />

      {/* Two widgets side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today Due / Overdue */}
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
                    onClick={() => navigate(`faelle/${c.finance_mandates?.finance_request_id || c.id}`)}
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
              action={
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('faelle')}>
                  Alle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              }
            />
            {recentCases.length === 0 ? (
              <div className="text-center py-4">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Noch keine Fälle</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentCases.map(c => {
                  const status = getRequestStatus(c);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 transition-colors cursor-pointer text-sm"
                      onClick={() => navigate(`faelle/${c.finance_mandates?.finance_request_id || c.id}`)}
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

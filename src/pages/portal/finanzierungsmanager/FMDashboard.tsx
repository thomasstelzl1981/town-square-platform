/**
 * FM Dashboard — (A) Fälle in Bearbeitung, (B) Finanzierungsmandate, (C) Manager-Visitenkarte
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Check, X, Inbox, User, Phone, Mail, MapPin } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
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
  const { user, profile } = useAuth();
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

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.display_name || '—';
  const address = [profile?.street, profile?.house_number].filter(Boolean).join(' ');
  const cityLine = [profile?.postal_code, profile?.city].filter(Boolean).join(' ');
  const fullAddress = [address, cityLine].filter(Boolean).join(', ');

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

      {/* Manager Visitenkarte */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-lg font-semibold">{fullName}</h3>
              <p className="text-xs text-muted-foreground">Finanzierungsmanager</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 pt-2">
                {profile?.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                )}
                {profile?.phone_mobile && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{profile.phone_mobile}</span>
                  </div>
                )}
                {profile?.phone_landline && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{profile.phone_landline}</span>
                  </div>
                )}
                {fullAddress && (
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{fullAddress}</span>
                  </div>
                )}
                {profile?.letterhead_company_line && (
                  <div className="flex items-center gap-2 text-xs col-span-full">
                    <span className="text-muted-foreground">{profile.letterhead_company_line}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant="outline" className="text-[10px]">{activeCases.length} aktive Fälle</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </PageShell>
  );
}

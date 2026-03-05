/**
 * FM Dashboard — Orchestrator
 * R-29: 472 → ~130 lines
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ManagerVisitenkarte } from '@/components/shared/ManagerVisitenkarte';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAcceptMandate, useUpdateMandateStatus, useFinanceMandates } from '@/hooks/useFinanceMandate';
import { useCancelFinanceRequest } from '@/hooks/useFinanceRequest';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import FinanzierungsRechner from '@/components/finanzierungsmanager/FinanzierungsRechner';
import { FMProfileEditSheet } from '@/components/finanzierungsmanager/dashboard';
import { FMZinsTickerWidget } from '@/components/finanzierungsmanager/dashboard/FMZinsTickerWidget';
import { FMMandateCards } from '@/components/finanzierungsmanager/dashboard/FMMandateCards';
import type { FutureRoomCase } from '@/types/finance';

interface Props { cases: FutureRoomCase[]; isLoading: boolean; }

function getRequestStatus(c: FutureRoomCase): string { return c.finance_mandates?.finance_requests?.status || c.status; }

export default function FMDashboard({ cases, isLoading }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const acceptMandate = useAcceptMandate();
  const updateStatus = useUpdateMandateStatus();
  const cancelRequest = useCancelFinanceRequest();
  const [editOpen, setEditOpen] = useState(false);

  const SUBMITTED_STATUSES = ['submitted_to_bank', 'completed', 'rejected', 'archived'];
  const activeCases = cases.filter(c => !SUBMITTED_STATUSES.includes(getRequestStatus(c)));

  const { data: allMandates = [], isLoading: loadingMandates } = useFinanceMandates();
  const pendingMandates = (allMandates as any[]).filter(m => (m.status === 'delegated' || m.status === 'assigned') && m.assigned_manager_id === user?.id);

  if (isLoading) return <PageShell><div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  const handleAcceptMandate = async (id: string) => { try { await acceptMandate.mutateAsync(id); } catch {} };
  const handleDeclineMandate = async (id: string) => { try { await updateStatus.mutateAsync({ mandateId: id, status: 'rejected' as any }); toast.success('Mandat abgelehnt'); } catch {} };

  const reg34i = (profile as any)?.reg_34i_number;
  const regIhk = (profile as any)?.reg_34i_ihk;

  return (
    <PageShell>
      <ModulePageHeader title="Finanzierungsmanager" description={`${activeCases.length} Fälle in Bearbeitung — noch nicht eingereicht.`}
        actions={<Button variant="glass" size="icon-round" onClick={() => navigate('/portal/finanzierungsmanager/finanzierungsakte')}><Plus className="h-4 w-4" /></Button>}
      />

      <div className={DESIGN.DASHBOARD_HEADER.GRID}>
        <ManagerVisitenkarte role="Finanzierungsmanager" gradientFrom="hsl(220,70%,50%)" gradientTo="hsl(250,60%,60%)" badgeText={`${activeCases.length} aktive Fälle`} onEdit={() => setEditOpen(true)}>
          {(reg34i || regIhk) && (<><Separator className="my-1" /><div className="space-y-0.5">{reg34i && <div className="flex items-center gap-2 text-[11px]"><Shield className="h-3 w-3 text-muted-foreground shrink-0" /><span>§34i: {reg34i}</span></div>}{regIhk && <div className="text-[11px] text-muted-foreground pl-5">IHK: {regIhk}</div>}</div></>)}
        </ManagerVisitenkarte>
        <div className={DESIGN.DASHBOARD_HEADER.CARD_HEIGHT}><FMZinsTickerWidget /></div>
      </div>

      <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mt-6')}>Aktuelle Fälle</h2>
      <WidgetGrid>
        {activeCases.map(c => <WidgetCell key={c.id}><FinanceCaseCard caseData={c} onClick={reqId => navigate(`faelle/${reqId}`)} onDelete={reqId => cancelRequest.mutate(reqId)} isDeleting={cancelRequest.isPending} /></WidgetCell>)}
        {activeCases.length === 0 && <WidgetCell><FinanceCaseCardPlaceholder /></WidgetCell>}
      </WidgetGrid>

      <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mt-6')}>Neue Mandate</h2>
      <FMMandateCards mandates={pendingMandates} loading={loadingMandates} onAccept={handleAcceptMandate} onDecline={handleDeclineMandate} isAccepting={acceptMandate.isPending} isDeclining={updateStatus.isPending} />

      <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mt-6')}>Finanzierungsrechner</h2>
      <FinanzierungsRechner />

      <FMProfileEditSheet open={editOpen} onOpenChange={setEditOpen} />
    </PageShell>
  );
}

/**
 * Manager-Freischaltung — Orchestrator for Zone 1 Admin Page
 * R-14 Refactoring: 635 → ~140 lines
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, CheckCircle, XCircle, Users, FileText, ArrowRight, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { PdfExportFooter } from '@/components/pdf';
import { ROLE_EXTRA_TILES } from '@/constants/rolesMatrix';
import {
  PendingApplicationsTable, DecidedApplicationsTable, ActiveManagersTable,
  FreischaltungReviewDialog, getRoleLabel,
} from '@/components/admin/freischaltung';
import type { ManagerApplication, ActiveManager } from '@/components/admin/freischaltung';

export default function ManagerFreischaltung() {
  const { isPlatformAdmin } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ManagerApplication[]>([]);
  const [activeManagers, setActiveManagers] = useState<ActiveManager[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ManagerApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, orgsRes, profilesRes, linksRes] = await Promise.all([
        supabase.from('manager_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('organizations').select('id, name, org_type'),
        supabase.from('profiles').select('id, email, display_name'),
        supabase.from('org_links').select('*').eq('link_type', 'manages').eq('status', 'active'),
      ]);
      const appsData = (appsRes.data || []) as unknown as ManagerApplication[];
      const orgs = orgsRes.data || [];
      const profiles = profilesRes.data || [];
      const links = linksRes.data || [];
      setApplications(appsData.map(app => ({
        ...app,
        org_name: orgs.find(o => o.id === app.tenant_id)?.name || '—',
        user_email: profiles.find(p => p.id === app.user_id)?.email || '—',
        user_display_name: profiles.find(p => p.id === app.user_id)?.display_name || undefined,
      })));
      setActiveManagers(orgs.filter(o => o.org_type === 'partner').map(org => ({
        org_id: org.id, org_name: org.name || '—',
        role: appsData.find(a => a.tenant_id === org.id && a.status === 'approved')?.requested_role || '—',
        activated_at: appsData.find(a => a.tenant_id === org.id && a.status === 'approved')?.reviewed_at || undefined,
        client_count: links.filter(l => l.from_org_id === org.id).length,
      })));
    } catch (error) { console.error(error); toast.error('Fehler beim Laden der Daten'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isPlatformAdmin) fetchData(); }, [isPlatformAdmin, fetchData]);

  function openReviewDialog(app: ManagerApplication, action: 'approve' | 'reject') {
    setSelectedApp(app); setReviewAction(action); setRejectionReason(''); setReviewDialogOpen(true);
  }

  async function handleReview() {
    if (!selectedApp || !reviewAction) return;
    setProcessing(true);
    try {
      if (reviewAction === 'approve') {
        if (!selectedApp.user_id) {
          const { data, error } = await supabase.functions.invoke('sot-manager-activate', { body: { application_id: selectedApp.id } });
          if (error) throw new Error(error.message || 'Edge function error');
          if (data?.error) throw new Error(data.error);
          toast.success(`Manager genehmigt — ${getRoleLabel(selectedApp.requested_role)} aktiviert. Zugangsdaten wurden per E-Mail versendet.`);
        } else {
          await supabase.from('manager_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() } as never).eq('id', selectedApp.id);
          await supabase.from('organizations').update({ org_type: 'partner' } as never).eq('id', selectedApp.tenant_id);
          await supabase.from('memberships').update({ role: selectedApp.requested_role } as never).eq('tenant_id', selectedApp.tenant_id).eq('user_id', selectedApp.user_id);
          for (const tileCode of (ROLE_EXTRA_TILES[selectedApp.requested_role] || [])) {
            await supabase.from('tenant_tile_activation').upsert({ tenant_id: selectedApp.tenant_id, tile_code: tileCode, status: 'active' } as never, { onConflict: 'tenant_id,tile_code' });
          }
          toast.success(`Manager genehmigt — ${getRoleLabel(selectedApp.requested_role)} aktiviert`);
        }
      } else {
        await supabase.from('manager_applications').update({ status: 'rejected', rejection_reason: rejectionReason || 'Keine Begründung angegeben', reviewed_at: new Date().toISOString() } as never).eq('id', selectedApp.id);
        toast.success('Antrag abgelehnt');
      }
      setReviewDialogOpen(false);
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Fehler bei der Verarbeitung'); }
    finally { setProcessing(false); }
  }

  async function handleSetInReview(appId: string) {
    try { await supabase.from('manager_applications').update({ status: 'in_review' } as never).eq('id', appId); toast.success('Status auf "In Prüfung" gesetzt'); fetchData(); }
    catch (error) { console.error(error); }
  }

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const pendingCount = applications.filter(a => a.status === 'submitted' || a.status === 'in_review').length;
  const kpis: DeskKPI[] = [
    { label: 'Offene Anträge', value: pendingCount, icon: Inbox, color: 'text-amber-500' },
    { label: 'Aktive Manager', value: activeManagers.length, icon: Users, color: 'text-emerald-500' },
    { label: 'Genehmigt', value: applications.filter(a => a.status === 'approved').length, icon: CheckCircle, color: 'text-primary' },
    { label: 'Abgelehnt', value: applications.filter(a => a.status === 'rejected').length, icon: XCircle, color: 'text-muted-foreground' },
  ];

  return (
    <OperativeDeskShell title="Manager-Freischaltung" subtitle="Bewerbungen · Qualifikationsprüfung · Freischaltung · Kundenzuweisung" moduleCode="ZONE-1" zoneFlow={{ z3Surface: 'Bewerber (Z2)', z1Desk: 'Manager-Freischaltung', z2Manager: 'Manager-Account' }} kpis={kpis}>
      <div className="space-y-6" ref={contentRef}>
        <Card className="border-dashed"><CardContent className="py-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="secondary" className="shrink-0">GP-MANAGER-LIFECYCLE</Badge><span>Bewerbung (Z2)</span><ArrowRight className="h-3 w-3 shrink-0" /><span>Qualifikation (Z1)</span><ArrowRight className="h-3 w-3 shrink-0" /><span>Freischaltung (Z1)</span><ArrowRight className="h-3 w-3 shrink-0" /><span>Kundenzuweisung (Z1→Z2)</span></div></CardContent></Card>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1"><Clock className="h-3.5 w-3.5" />Offene Anträge{pendingCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>}</TabsTrigger>
            <TabsTrigger value="decided" className="gap-1"><FileText className="h-3.5 w-3.5" />Entschieden</TabsTrigger>
            <TabsTrigger value="managers" className="gap-1"><Users className="h-3.5 w-3.5" />Aktive Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-4">
            <PendingApplicationsTable apps={applications.filter(a => ['submitted', 'in_review'].includes(a.status))} onSetInReview={handleSetInReview} onApprove={(app) => openReviewDialog(app, 'approve')} onReject={(app) => openReviewDialog(app, 'reject')} />
          </TabsContent>
          <TabsContent value="decided" className="space-y-4">
            <DecidedApplicationsTable apps={applications.filter(a => ['approved', 'rejected'].includes(a.status))} />
          </TabsContent>
          <TabsContent value="managers" className="space-y-4">
            <ActiveManagersTable managers={activeManagers} />
          </TabsContent>
        </Tabs>

        <FreischaltungReviewDialog
          open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}
          selectedApp={selectedApp} reviewAction={reviewAction}
          rejectionReason={rejectionReason} onRejectionReasonChange={setRejectionReason}
          processing={processing} onConfirm={handleReview}
        />

        <PdfExportFooter contentRef={contentRef} documentTitle="Manager-Freischaltung" subtitle={`${applications.length} Anträge · ${activeManagers.length} aktive Manager`} moduleName="Zone 1 Admin" />
      </div>
    </OperativeDeskShell>
  );
}

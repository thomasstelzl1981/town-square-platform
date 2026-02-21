/**
 * Manager-Freischaltung — Zone 1 Admin Page
 * 
 * Manages the full Manager-Lifecycle:
 * - View incoming manager applications
 * - Review qualifications (§34i, etc.)
 * - Approve/Reject applications
 * - Upgrade org_type to partner + activate manager tiles
 * - Create org_links / org_delegations for client assignment
 * 
 * Golden Path: GP-MANAGER-LIFECYCLE
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserCheck, Loader2, Clock, CheckCircle, XCircle, Eye, 
  Users, ShieldCheck, FileText, ArrowRight, AlertTriangle,
  Inbox, UserPlus, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { PdfExportFooter } from '@/components/pdf';
import { ROLES_CATALOG, ROLE_EXTRA_TILES, BASE_TILES } from '@/constants/rolesMatrix';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ManagerApplication {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  requested_role: string;
  qualification_data: Record<string, unknown> | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  source_brand: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  // Enriched
  org_name?: string;
  user_email?: string;
  user_display_name?: string;
}

interface ActiveManager {
  org_id: string;
  org_name: string;
  role: string;
  user_email?: string;
  activated_at?: string;
  client_count: number;
}

// ─── Role label helper ──────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  finance_manager: 'Finanzierungsmanager',
  akquise_manager: 'Akquise-Manager',
  sales_partner: 'Vertriebspartner',
  project_manager: 'Projektmanager',
  pet_manager: 'Pet Manager',
};

const ROLE_MODULE_MAP: Record<string, string> = {
  finance_manager: 'MOD-11',
  akquise_manager: 'MOD-12',
  sales_partner: 'MOD-09 + MOD-10',
  project_manager: 'MOD-13',
  pet_manager: 'MOD-22',
};

function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Entwurf</Badge>;
    case 'submitted':
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Eingereicht</Badge>;
    case 'in_review':
      return <Badge variant="secondary" className="border-primary/30"><Eye className="h-3 w-3 mr-1" />In Prüfung</Badge>;
    case 'approved':
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Genehmigt</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function ManagerFreischaltung() {
  const { isPlatformAdmin } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ManagerApplication[]>([]);
  const [activeManagers, setActiveManagers] = useState<ActiveManager[]>([]);

  // Dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ManagerApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────
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

      // Enrich applications
      const enrichedApps = appsData.map(app => ({
        ...app,
        org_name: orgs.find(o => o.id === app.tenant_id)?.name || '—',
        user_email: profiles.find(p => p.id === app.user_id)?.email || '—',
        user_display_name: profiles.find(p => p.id === app.user_id)?.display_name || undefined,
      }));
      setApplications(enrichedApps);

      // Build active managers from partner orgs
      const partnerOrgs = orgs.filter(o => o.org_type === 'partner');
      const managers: ActiveManager[] = partnerOrgs.map(org => ({
        org_id: org.id,
        org_name: org.name || '—',
        role: enrichedApps.find(a => a.tenant_id === org.id && a.status === 'approved')?.requested_role || '—',
        activated_at: enrichedApps.find(a => a.tenant_id === org.id && a.status === 'approved')?.reviewed_at || undefined,
        client_count: links.filter(l => l.from_org_id === org.id).length,
      }));
      setActiveManagers(managers);
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPlatformAdmin) fetchData();
  }, [isPlatformAdmin, fetchData]);

  // ─── Review Actions ─────────────────────────────────────────────────────
  function openReviewDialog(app: ManagerApplication, action: 'approve' | 'reject') {
    setSelectedApp(app);
    setReviewAction(action);
    setRejectionReason('');
    setReviewDialogOpen(true);
  }

  async function handleReview() {
    if (!selectedApp || !reviewAction) return;
    setProcessing(true);

    try {
      if (reviewAction === 'approve') {
        // For anonymous applications (no user_id): call edge function to create user + activate
        if (!selectedApp.user_id) {
          const { data, error } = await supabase.functions.invoke('sot-manager-activate', {
            body: { application_id: selectedApp.id },
          });
          if (error) throw new Error(error.message || 'Edge function error');
          if (data?.error) throw new Error(data.error);
          toast.success(`Manager genehmigt — ${getRoleLabel(selectedApp.requested_role)} aktiviert. Zugangsdaten wurden per E-Mail versendet.`);
        } else {
          // Existing user: upgrade directly
          await supabase
            .from('manager_applications')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
            } as never)
            .eq('id', selectedApp.id);

          await supabase
            .from('organizations')
            .update({ org_type: 'partner' } as never)
            .eq('id', selectedApp.tenant_id);

          await supabase
            .from('memberships')
            .update({ role: selectedApp.requested_role } as never)
            .eq('tenant_id', selectedApp.tenant_id)
            .eq('user_id', selectedApp.user_id);

          const extraTiles = ROLE_EXTRA_TILES[selectedApp.requested_role] || [];
          for (const tileCode of extraTiles) {
            await supabase.from('tenant_tile_activation').upsert({
              tenant_id: selectedApp.tenant_id,
              tile_code: tileCode,
              status: 'active',
            } as never, { onConflict: 'tenant_id,tile_code' });
          }

          toast.success(`Manager genehmigt — ${getRoleLabel(selectedApp.requested_role)} aktiviert`);
        }
      } else {
        // Reject
        await supabase
          .from('manager_applications')
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason || 'Keine Begründung angegeben',
            reviewed_at: new Date().toISOString(),
          } as never)
          .eq('id', selectedApp.id);

        toast.success('Antrag abgelehnt');
      }

      setReviewDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error processing review:', error);
      toast.error(error.message || 'Fehler bei der Verarbeitung');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSetInReview(appId: string) {
    try {
      await supabase
        .from('manager_applications')
        .update({ status: 'in_review' } as never)
        .eq('id', appId);
      toast.success('Status auf "In Prüfung" gesetzt');
      fetchData();
    } catch (error) {
      console.error('Error setting in_review:', error);
    }
  }

  // ─── Guards ─────────────────────────────────────────────────────────────
  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── KPIs ───────────────────────────────────────────────────────────────
  const pendingCount = applications.filter(a => a.status === 'submitted' || a.status === 'in_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const kpis: DeskKPI[] = [
    { label: 'Offene Anträge', value: pendingCount, icon: Inbox, color: 'text-amber-500' },
    { label: 'Aktive Manager', value: activeManagers.length, icon: Users, color: 'text-emerald-500' },
    { label: 'Genehmigt', value: approvedCount, icon: CheckCircle, color: 'text-primary' },
    { label: 'Abgelehnt', value: rejectedCount, icon: XCircle, color: 'text-muted-foreground' },
  ];

  // ─── Filter applications by tab ────────────────────────────────────────
  const pendingApps = applications.filter(a => ['submitted', 'in_review'].includes(a.status));
  const decidedApps = applications.filter(a => ['approved', 'rejected'].includes(a.status));

  return (
    <OperativeDeskShell
      title="Manager-Freischaltung"
      subtitle="Bewerbungen · Qualifikationsprüfung · Freischaltung · Kundenzuweisung"
      moduleCode="ZONE-1"
      zoneFlow={{
        z3Surface: 'Bewerber (Z2)',
        z1Desk: 'Manager-Freischaltung',
        z2Manager: 'Manager-Account',
      }}
      kpis={kpis}
    >
      <div className="space-y-6" ref={contentRef}>
        {/* Golden Path Info */}
        <Card className="border-dashed">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="shrink-0">GP-MANAGER-LIFECYCLE</Badge>
              <span>Bewerbung (Z2)</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span>Qualifikation (Z1)</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span>Freischaltung (Z1)</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span>Kundenzuweisung (Z1→Z2)</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              Offene Anträge
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="decided" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Entschieden
            </TabsTrigger>
            <TabsTrigger value="managers" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              Aktive Manager
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: Offene Anträge ──────────────────────────────────── */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-amber-500" />
                  Offene Manager-Bewerbungen
                </CardTitle>
                <CardDescription>
                  {pendingApps.length} Anträge warten auf Prüfung
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApps.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground">Keine offenen Anträge</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bewerber</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Gewünschte Rolle</TableHead>
                        <TableHead>Modul</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Eingereicht</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApps.map(app => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.applicant_name || app.user_display_name || app.user_email || '—'}</p>
                              <p className="text-xs text-muted-foreground">{app.applicant_email || app.user_email || '—'}</p>
                              {app.applicant_phone && (
                                <p className="text-xs text-muted-foreground">{app.applicant_phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {app.source_brand || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(app.requested_role)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {ROLE_MODULE_MAP[app.requested_role] || '—'}
                          </TableCell>
                          <TableCell><StatusBadge status={app.status} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(app.created_at), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {app.status === 'submitted' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetInReview(app.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Prüfen
                              </Button>
                            )}
                            {(app.status === 'submitted' || app.status === 'in_review') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700"
                                  onClick={() => openReviewDialog(app, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openReviewDialog(app, 'reject')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Entschieden ─────────────────────────────────────── */}
          <TabsContent value="decided" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Entschiedene Anträge</CardTitle>
                <CardDescription>{decidedApps.length} Anträge abgeschlossen</CardDescription>
              </CardHeader>
              <CardContent>
                {decidedApps.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground">Noch keine entschiedenen Anträge</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bewerber</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Entschieden am</TableHead>
                        <TableHead>Grund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {decidedApps.map(app => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.user_display_name || app.user_email}</p>
                              <p className="text-xs text-muted-foreground">{app.org_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(app.requested_role)}</Badge>
                          </TableCell>
                          <TableCell><StatusBadge status={app.status} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {app.reviewed_at
                              ? format(new Date(app.reviewed_at), 'dd.MM.yyyy HH:mm', { locale: de })
                              : '—'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {app.rejection_reason || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Aktive Manager ──────────────────────────────────── */}
          <TabsContent value="managers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  Aktive Manager-Tenants
                </CardTitle>
                <CardDescription>
                  {activeManagers.length} Partner-Organisationen mit Manager-Rolle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeManagers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground">Noch keine aktiven Manager</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Genehmigen Sie eine Bewerbung, um den ersten Manager zu aktivieren
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organisation</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Aktiviert</TableHead>
                        <TableHead>Zugewiesene Kunden</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeManagers.map(mgr => (
                        <TableRow key={mgr.org_id}>
                          <TableCell className="font-medium">{mgr.org_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(mgr.role)}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {mgr.activated_at
                              ? format(new Date(mgr.activated_at), 'dd.MM.yyyy', { locale: de })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={mgr.client_count > 0 ? 'default' : 'secondary'}>
                              {mgr.client_count} Kunden
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Qualification Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rollen-Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                    <div key={roleKey} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          14 Basis + {ROLE_MODULE_MAP[roleKey]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Review Dialog ──────────────────────────────────────────── */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Manager-Bewerbung genehmigen' : 'Manager-Bewerbung ablehnen'}
              </DialogTitle>
              <DialogDescription>
                {selectedApp && (
                  <>
                    <strong>{selectedApp.user_display_name || selectedApp.user_email}</strong>
                    {' '}beantragt die Rolle{' '}
                    <strong>{getRoleLabel(selectedApp.requested_role)}</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {reviewAction === 'approve' && selectedApp && (
                <div className="rounded-lg border p-4 bg-primary/5 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    Bei Genehmigung werden folgende Schritte automatisch ausgeführt:
                  </p>
                  <ul className="text-xs text-primary/80 space-y-1 list-disc list-inside">
                    {!selectedApp.user_id && (
                      <>
                        <li>Neuer Benutzer wird erstellt für <code>{selectedApp.applicant_email}</code></li>
                        <li>Zugangsdaten werden per E-Mail versendet (Password-Reset-Link)</li>
                      </>
                    )}
                    <li>Organisation wird auf <code>org_type: partner</code> upgegradet</li>
                    <li>Mitgliedschaft wird auf <code>{selectedApp.requested_role}</code> gesetzt</li>
                    <li>Manager-Modul(e) <code>{ROLE_MODULE_MAP[selectedApp.requested_role]}</code> werden aktiviert</li>
                  </ul>
                  {selectedApp.source_brand && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Quelle: <Badge variant="outline" className="text-xs ml-1">{selectedApp.source_brand}</Badge>
                    </p>
                  )}
                </div>
              )}

              {reviewAction === 'reject' && (
                <div className="space-y-2">
                  <Label>Ablehnungsgrund</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Begründung für die Ablehnung…"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Der Bewerber erhält diesen Grund und kann sich erneut bewerben.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleReview}
                disabled={processing || (reviewAction === 'reject' && !rejectionReason.trim())}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {reviewAction === 'approve' ? 'Genehmigen & Freischalten' : 'Ablehnen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PdfExportFooter
          contentRef={contentRef}
          documentTitle="Manager-Freischaltung"
          subtitle={`${applications.length} Anträge · ${activeManagers.length} aktive Manager`}
          moduleName="Zone 1 Admin"
        />
      </div>
    </OperativeDeskShell>
  );
}
/**
 * Sales Desk — Zone-1 Admin Desk for Sales Operations
 * Shell + Sub-Routes: Dashboard, Veröffentlichungen, Inbox, Partner, Audit
 */
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Inbox, Users2, FileText, ArrowRight, Ban, CheckCircle2, Building2, Power } from 'lucide-react';
import { useSalesDeskListings } from '@/hooks/useSalesDeskListings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { ImmobilienVertriebsauftraegeCard } from '../sales-desk/ImmobilienVertriebsauftraegeCard';
import { VeroeffentlichungenTab } from '../sales-desk/VeroeffentlichungenTab';
import { InboxTab, PartnerTab, AuditTab } from '../sales-desk/SalesDeskSubPages';

// ─── Dashboard ───────────────────────────────────────────────────────────────
function SalesDeskDashboard() {
  const { data: listings } = useSalesDeskListings();
  const pendingCount = listings?.filter(l => !l.publications.some(p => p.status === 'active')).length || 0;
  const activeCount = listings?.filter(l => l.publications.some(p => p.status === 'active')).length || 0;
  const blockedCount = listings?.filter(l => l.is_blocked).length || 0;

  const { data: projectRequests } = useQuery({
    queryKey: ['sales-desk-project-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('*, dev_projects(name, city, total_units_count)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const queryClient = useQueryClient();

  const handleDeactivateProject = async (requestId: string, projectId: string) => {
    try {
      await supabase.from('sales_desk_requests').update({ status: 'withdrawn' }).eq('id', requestId);

      const { data: units } = await supabase
        .from('dev_project_units')
        .select('property_id')
        .eq('project_id', projectId)
        .not('property_id', 'is', null);

      if (units?.length) {
        const propertyIds = units.map(u => u.property_id!).filter(Boolean);
        const { data: projectListings } = await supabase
          .from('listings')
          .select('id')
          .in('property_id', propertyIds);

        if (projectListings?.length) {
          const listingIds = projectListings.map(l => l.id);
          await supabase.from('listing_publications').delete().in('listing_id', listingIds);
          await supabase.from('listings').delete().in('id', listingIds);
        }
      }

      await supabase.from('dev_projects').update({ kaufy_listed: false }).eq('id', projectId);
      toast.success('Projekt deaktiviert', { description: 'Alle Listings und Publikationen wurden gestoppt.' });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-project-requests'] });
    } catch {
      toast.error('Fehler bei der Deaktivierung');
    }
  };

  return (
    <OperativeDeskShell
      title="Sales Desk"
      subtitle="Zentrale Übersicht für Verkaufsoperationen und Partner-Freigaben"
      moduleCode="MOD-09"
      zoneFlow={{ z3Surface: 'Kaufy Marketplace', z1Desk: 'Sales Desk', z2Manager: 'MOD-09 Vertriebsmanager' }}
      kpis={[
        { label: 'Neue Listings', value: pendingCount, icon: ShoppingBag, subtitle: 'Ausstehende Freigaben' },
        { label: 'Aktive Listings', value: activeCount, icon: CheckCircle2, color: 'text-primary', subtitle: 'Veröffentlicht' },
        { label: 'Blockiert', value: blockedCount, icon: Ban, color: 'text-destructive', subtitle: 'Durch Admin gesperrt' },
        { label: 'Aktive Projekte', value: projectRequests?.length || 0, icon: Building2, subtitle: 'MOD-13 Vertriebsaufträge' },
      ]}
    >
      <div className="space-y-6">
        <ImmobilienVertriebsauftraegeCard />

        {/* Active Projects — Kill-Switch */}
        {projectRequests && projectRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />Aktive Projekt-Vertriebsaufträge
              </CardTitle>
              <CardDescription>Projekte mit aktivem Vertriebsauftrag. Nur Deaktivierung möglich.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Stadt</TableHead>
                    <TableHead className="text-center">Einheiten</TableHead>
                    <TableHead>Aktiviert am</TableHead>
                    <TableHead className="text-center">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.dev_projects?.name || '–'}</TableCell>
                      <TableCell>{req.dev_projects?.city || '–'}</TableCell>
                      <TableCell className="text-center">{req.dev_projects?.total_units_count ?? '–'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(req.requested_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDeactivateProject(req.id, req.project_id)}>
                          <Power className="h-3.5 w-3.5" />Deaktivieren
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <NavCard icon={ShoppingBag} title="Veröffentlichungen" description="Neue und ausstehende Listing-Freigaben verwalten" to="/admin/sales-desk/veroeffentlichungen" />
          <NavCard icon={Inbox} title="Inbox" description="Eingehende Anfragen und Nachrichten" to="/admin/sales-desk/inbox" />
          <NavCard icon={Users2} title="Partner" description="Vertriebspartner-Zuweisungen und -Berechtigungen" to="/admin/sales-desk/partner" />
          <NavCard icon={FileText} title="Audit" description="Prüfpfad und Änderungsprotokolle" to="/admin/sales-desk/audit" />
        </div>
      </div>
    </OperativeDeskShell>
  );
}

function NavCard({ icon: Icon, title, description, to }: { icon: any; title: string; description: string; to: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link to={to}>Öffnen <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
export default function SalesDesk() {
  return (
    <Routes>
      <Route index element={<SalesDeskDashboard />} />
      <Route path="veroeffentlichungen" element={<VeroeffentlichungenTab />} />
      <Route path="inbox" element={<InboxTab />} />
      <Route path="partner" element={<PartnerTab />} />
      <Route path="audit" element={<AuditTab />} />
    </Routes>
  );
}

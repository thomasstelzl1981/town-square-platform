/**
 * OrganizationDetail — Orchestrator for org detail view
 * R-19 Refactoring: 581 → ~160 lines
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, AlertTriangle, Users, LayoutGrid, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { DESIGN } from '@/config/designManifest';
import { AdminBillingTab } from '@/components/armstrong/AdminBillingTab';
import { OrgStammdatenTab, OrgMembersTab, OrgModulesTab } from '@/components/admin/org';

type Organization = Tables<'organizations'>;

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isPlatformAdmin } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [parent, setParent] = useState<Organization | null>(null);
  const [children, setChildren] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [tileActivations, setTileActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockdownDialogOpen, setLockdownDialogOpen] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [pendingLockdownValue, setPendingLockdownValue] = useState(false);
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);
  const [canToggleLockdown, setCanToggleLockdown] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [orgRes, childrenRes, membershipRes, activationsRes, catalogRes] = await Promise.all([
          supabase.from('organizations').select('*').eq('id', id).maybeSingle(),
          supabase.from('organizations').select('*').eq('parent_id', id).order('name'),
          supabase.from('memberships').select('*').eq('tenant_id', id),
          supabase.from('tenant_tile_activation').select('*').eq('tenant_id', id),
          supabase.from('tile_catalog').select('tile_code, title'),
        ]);
        if (orgRes.error) throw orgRes.error;
        if (!orgRes.data) throw new Error('Organisation nicht gefunden');
        const org = orgRes.data;
        setOrganization(org); setChildren(childrenRes.data || []); setMemberships(membershipRes.data || []);
        if (org.parent_id) { const { data } = await supabase.from('organizations').select('*').eq('id', org.parent_id).maybeSingle(); setParent(data); }
        const catalog = catalogRes.data || [];
        setTileActivations((activationsRes.data || []).map(a => ({ tile_code: a.tile_code, tile_name: catalog.find(c => c.tile_code === a.tile_code)?.title || a.tile_code, status: a.status, activated_at: a.activated_at || a.created_at })).sort((a, b) => a.tile_code.localeCompare(b.tile_code)));
        const memberUserIds = (membershipRes.data || []).map(m => m.user_id);
        if (memberUserIds.length > 0) { const { data } = await supabase.from('profiles').select('id, display_name, email, avatar_url, street, city, postal_code').in('id', memberUserIds); const map = new Map(); (data || []).forEach(p => map.set(p.id, p)); setProfiles(map); }
        if (user) { if (isPlatformAdmin) setCanToggleLockdown(true); else { const { data } = await supabase.from('memberships').select('role').eq('user_id', user.id).eq('tenant_id', id).eq('role', 'org_admin').maybeSingle(); setCanToggleLockdown(!!data); } }
      } catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || 'Fehler'); }
      setLoading(false);
    })();
  }, [id, user, isPlatformAdmin]);

  const handleLockdownToggle = (v: boolean) => { setPendingLockdownValue(v); setLockdownReason(''); setLockdownDialogOpen(true); };
  const confirmLockdownChange = async () => {
    if (!organization || !user) return;
    setIsTogglingLockdown(true);
    try {
      const { error } = await supabase.from('organizations').update({ parent_access_blocked: pendingLockdownValue }).eq('id', organization.id);
      if (error) throw error;
      if (lockdownReason.trim()) await supabase.from('audit_events').insert({ actor_user_id: user.id, target_org_id: organization.id, event_type: 'parent_access_blocked_reason', payload: { reason: lockdownReason.trim() } });
      setOrganization({ ...organization, parent_access_blocked: pendingLockdownValue });
      toast.success(pendingLockdownValue ? 'Parent-Zugriff blockiert' : 'Parent-Zugriff wiederhergestellt');
      setLockdownDialogOpen(false);
    } catch (err: unknown) { toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler'); }
    setIsTogglingLockdown(false);
  };

  const formatOrgType = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const orgAdminMembership = memberships.find(m => m.role === 'org_admin');
  const orgAdminProfile = orgAdminMembership ? profiles.get(orgAdminMembership.user_id) : null;
  const activeModuleCount = tileActivations.filter(t => t.status === 'active').length;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error || !organization) return <div className="space-y-4"><Button variant="ghost" asChild><Link to="/admin/organizations"><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Link></Button><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error || 'Organisation nicht gefunden'}</AlertDescription></Alert></div>;

  return (
    <div className={DESIGN.SPACING.SECTION}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/organizations"><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Link></Button>
        <div className="flex-1"><h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>{organization.name}</h2><p className={DESIGN.TYPOGRAPHY.MUTED}>Kunden-Nr: {organization.public_id || '—'} · {formatOrgType(organization.org_type)} · Seit {format(new Date(organization.created_at), 'dd.MM.yyyy', { locale: de })}</p></div>
        <Badge>{formatOrgType(organization.org_type)}</Badge>
      </div>

      <Tabs defaultValue="stammdaten">
        <TabsList>
          <TabsTrigger value="stammdaten" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Stammdaten</TabsTrigger>
          <TabsTrigger value="mitglieder" className="gap-1.5"><Users className="h-3.5 w-3.5" />Mitglieder ({memberships.length})</TabsTrigger>
          <TabsTrigger value="module" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Module ({activeModuleCount})</TabsTrigger>
          <TabsTrigger value="credits" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Credits & Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="stammdaten" className="space-y-6"><OrgStammdatenTab organization={organization} parent={parent} children={children} orgAdminProfile={orgAdminProfile} canToggleLockdown={canToggleLockdown} isTogglingLockdown={isTogglingLockdown} onLockdownToggle={handleLockdownToggle} /></TabsContent>
        <TabsContent value="mitglieder" className="space-y-4"><OrgMembersTab memberships={memberships} profiles={profiles} /></TabsContent>
        <TabsContent value="module" className="space-y-4"><OrgModulesTab tileActivations={tileActivations} activeModuleCount={activeModuleCount} /></TabsContent>
        <TabsContent value="credits" className="space-y-4"><AdminBillingTab tenantId={id!} /></TabsContent>
      </Tabs>

      <Dialog open={lockdownDialogOpen} onOpenChange={setLockdownDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{pendingLockdownValue ? 'Parent-Zugriff blockieren?' : 'Parent-Zugriff wiederherstellen?'}</DialogTitle><DialogDescription>{pendingLockdownValue ? 'Kein übergeordneter Mandant kann dann auf diese Organisation zugreifen.' : 'Parent-Organisationen erhalten wieder Zugriff.'}</DialogDescription></DialogHeader>
          <div className="py-4"><Label htmlFor="reason">Begründung (optional)</Label><Textarea id="reason" placeholder="Begründung eingeben..." value={lockdownReason} onChange={(e) => setLockdownReason(e.target.value)} className="mt-2" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockdownDialogOpen(false)} disabled={isTogglingLockdown}>Abbrechen</Button>
            <Button variant={pendingLockdownValue ? 'destructive' : 'default'} onClick={confirmLockdownChange} disabled={isTogglingLockdown}>{isTogglingLockdown && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{pendingLockdownValue ? 'Blockieren' : 'Wiederherstellen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

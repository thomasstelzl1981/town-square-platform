/**
 * UsersPage — Orchestrator (R-6 Refactored)
 * Manages memberships and user creation
 */
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';
import { UserTable } from '@/components/admin/UserTable';
import { EditRoleDialog, DeleteConfirmDialog, CreateMembershipDialog, CreateUserDialog } from '@/components/admin/UserDialogs';
import { ROLES, type Membership, type MembershipWithOrg, type MembershipRole, type Organization, type ProfileInfo } from '@/components/admin/userTypes';

export default function UsersPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const orgFilter = searchParams.get('org');
  const contentRef = useRef<HTMLDivElement>(null);

  const [memberships, setMemberships] = useState<MembershipWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [superUserIds, setSuperUserIds] = useState<Set<string>>(new Set());
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileInfo>>({});
  
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newMembership, setNewMembership] = useState({ user_id: '', tenant_id: orgFilter || '', role: '' as MembershipRole | '' });

  const [editTarget, setEditTarget] = useState<Membership | null>(null);
  const [editRole, setEditRole] = useState<MembershipRole | ''>('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Membership | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '' });

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      let membershipQuery = supabase.from('memberships').select('*');
      if (orgFilter) membershipQuery = membershipQuery.eq('tenant_id', orgFilter);
      const [orgsRes, membershipRes, userRolesRes, profilesRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        membershipQuery.order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role').eq('role', 'super_user'),
        supabase.from('profiles').select('id, email, display_name'),
      ]);
      if (membershipRes.error) throw membershipRes.error;
      setOrganizations(orgsRes.data || []);
      setMemberships(membershipRes.data || []);
      const suIds = new Set<string>();
      (userRolesRes.data || []).forEach(ur => suIds.add(ur.user_id));
      setSuperUserIds(suIds);
      const pMap: Record<string, ProfileInfo> = {};
      (profilesRes.data || []).forEach(p => { pMap[p.id] = { email: p.email, display_name: p.display_name }; });
      setProfilesMap(pMap);
    } catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden der Daten'); }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [orgFilter]);

  const getOrgName = (tenantId: string) => organizations.find(o => o.id === tenantId)?.name || tenantId;
  const canEditMembership = (m: Membership) => { if (m.user_id === user?.id) return false; if (isPlatformAdmin) return true; return m.role !== 'platform_admin'; };
  const canDeleteMembership = (m: Membership) => canEditMembership(m);
  const availableRoles = isPlatformAdmin ? ROLES : ROLES.filter(r => !r.restricted);

  const handleCreate = async () => {
    if (!newMembership.user_id || !newMembership.tenant_id || !newMembership.role) { setCreateError('Alle Felder sind erforderlich'); return; }
    if (newMembership.role === 'platform_admin' && !isPlatformAdmin) { setCreateError('Nur Platform Admins können die Platform-Admin-Rolle vergeben'); return; }
    setCreating(true); setCreateError(null);
    try {
      const { error } = await supabase.from('memberships').insert({ user_id: newMembership.user_id, tenant_id: newMembership.tenant_id, role: newMembership.role as MembershipRole });
      if (error) throw error;
      setCreateOpen(false); setNewMembership({ user_id: '', tenant_id: orgFilter || '', role: '' }); fetchData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setCreateError(errMsg.includes('duplicate') || (err as { code?: string })?.code === '23505' ? 'Dieser Benutzer hat bereits eine Mitgliedschaft in dieser Organisation' : errMsg);
    }
    setCreating(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !editRole) return;
    if (editRole === 'platform_admin' && !isPlatformAdmin) { setEditError('Nur Platform Admins können die Platform-Admin-Rolle vergeben'); return; }
    setEditing(true); setEditError(null);
    try {
      const { error } = await supabase.from('memberships').update({ role: editRole as MembershipRole }).eq('id', editTarget.id);
      if (error) throw error;
      setEditTarget(null); setEditRole(''); fetchData();
    } catch (err: unknown) { setEditError((err instanceof Error ? err.message : String(err)) || 'Fehler'); }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { const { error } = await supabase.from('memberships').delete().eq('id', deleteTarget.id); if (error) throw error; fetchData(); }
    catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || 'Fehler'); }
    setDeleting(false); setDeleteTarget(null);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) { setCreateUserError('E-Mail und Passwort sind erforderlich'); return; }
    if (newUser.password.length < 6) { setCreateUserError('Passwort muss mindestens 6 Zeichen lang sein'); return; }
    setCreatingUser(true); setCreateUserError(null);
    try {
      const response = await supabase.functions.invoke('sot-create-test-user', { body: { email: newUser.email, password: newUser.password, displayName: newUser.displayName || undefined } });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      toast.success(`Benutzer ${newUser.email} wurde angelegt`);
      setCreateUserOpen(false); setNewUser({ email: '', password: '', displayName: '' }); fetchData();
    } catch (err: unknown) { setCreateUserError((err instanceof Error ? err.message : String(err)) || 'Fehler'); }
    setCreatingUser(false);
  };

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Benutzer & Mitgliedschaften</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>Benutzerrollen und Organisationszugriff verwalten</p>
        </div>
        <div className="flex gap-2">
          {isPlatformAdmin && (<Button variant="outline" onClick={() => setCreateUserOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Neuen Benutzer anlegen</Button>)}
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Mitgliedschaft hinzufügen</Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Mitgliedschaften</CardTitle>
          <CardDescription>{orgFilter ? `Gefiltert nach Organisation: ${getOrgName(orgFilter)}` : 'Alle Mitgliedschaften über alle Organisationen'}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <UserTable memberships={memberships} profilesMap={profilesMap} superUserIds={superUserIds} getOrgName={getOrgName}
              canEditMembership={canEditMembership} canDeleteMembership={canDeleteMembership}
              onEdit={(m) => { setEditTarget(m); setEditRole(m.role as MembershipRole); setEditError(null); }} onDelete={setDeleteTarget} />
          )}
        </CardContent>
      </Card>

      <EditRoleDialog editTarget={editTarget} editRole={editRole} editing={editing} editError={editError}
        availableRoles={availableRoles} getOrgName={getOrgName} onRoleChange={setEditRole} onSave={handleEdit} onClose={() => setEditTarget(null)} />

      <DeleteConfirmDialog deleteTarget={deleteTarget} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />

      <CreateMembershipDialog open={createOpen} creating={creating} createError={createError} newMembership={newMembership}
        organizations={organizations} availableRoles={availableRoles} isPlatformAdmin={isPlatformAdmin}
        onChange={setNewMembership} onCreate={handleCreate} onClose={() => setCreateOpen(false)} />

      <CreateUserDialog open={createUserOpen} creating={creatingUser} createError={createUserError} newUser={newUser}
        onChange={setNewUser} onCreate={handleCreateUser} onClose={() => setCreateUserOpen(false)} />

      <PdfExportFooter contentRef={contentRef} documentTitle="Benutzer & Mitgliedschaften" subtitle={`${memberships.length} Mitgliedschaften`} moduleName="Zone 1 Admin" />
    </div>
  );
}

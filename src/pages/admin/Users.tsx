import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Users, Trash2, AlertTriangle, Pencil, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PdfExportFooter } from '@/components/pdf';
import { ROLES_CATALOG } from '@/constants/rolesMatrix';
import { DESIGN } from '@/config/designManifest';

type Membership = Tables<'memberships'>;
type Organization = Tables<'organizations'>;
type MembershipRole = Enums<'membership_role'>;

interface MembershipWithOrg extends Membership {
  organizations?: Organization;
}

// ============================================================================
// ROLES — abgeleitet aus SSOT (rolesMatrix.ts) + Legacy-Werte aus membership_role Enum
// ============================================================================
const LEGACY_MEMBERSHIP_ROLES: { value: MembershipRole; label: string }[] = [
  { value: 'internal_ops', label: 'Internal Ops (Legacy)' },
  { value: 'renter_user', label: 'Mieter (Legacy)' },
  { value: 'future_room_web_user_lite', label: 'Web User Lite (Legacy)' },
];

const ROLES: { value: MembershipRole; label: string; restricted?: boolean; description?: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }[] = [
  ...ROLES_CATALOG
    .filter(r => !r.isLegacy)
    .map(r => ({
      value: r.membershipRole as MembershipRole,
      label: r.label,
      restricted: r.isSystem,
      description: r.description,
      variant: (r.isSystem ? 'default' : r.code === 'client_user' || r.code === 'super_user' ? 'secondary' : 'outline') as 'default' | 'secondary' | 'outline' | 'destructive',
    }))
    // Deduplicate by membershipRole (super_user + client_user both map to org_admin)
    .filter((role, index, self) => self.findIndex(r => r.value === role.value) === index),
  ...LEGACY_MEMBERSHIP_ROLES.map(r => ({
    ...r,
    restricted: false,
    description: 'Legacy — nicht mehr aktiv vergeben',
    variant: 'outline' as const,
  })),
];

function resolveDisplayRole(
  membershipRole: string,
  userId: string,
  superUserIds: Set<string>,
): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (membershipRole === 'platform_admin') {
    return { label: 'Platform Admin', variant: 'default' };
  }
  if (membershipRole === 'org_admin') {
    if (superUserIds.has(userId)) {
      return { label: 'Super-User', variant: 'secondary' };
    }
    return { label: 'Standardkunde', variant: 'secondary' };
  }
  const found = ROLES.find(r => r.value === membershipRole);
  return { label: found?.label || membershipRole.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), variant: found?.variant || 'outline' };
}

interface ProfileInfo {
  email?: string | null;
  display_name?: string | null;
}

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
  const [newMembership, setNewMembership] = useState({
    user_id: '',
    tenant_id: orgFilter || '',
    role: '' as MembershipRole | '',
  });

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
    setLoading(true);
    setError(null);
    try {
      let membershipQuery = supabase.from('memberships').select('*');
      if (orgFilter) {
        membershipQuery = membershipQuery.eq('tenant_id', orgFilter);
      }

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
      (profilesRes.data || []).forEach(p => {
        pMap[p.id] = { email: p.email, display_name: p.display_name };
      });
      setProfilesMap(pMap);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden der Daten');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [orgFilter]);

  const getOrgName = (tenantId: string) => {
    return organizations.find(o => o.id === tenantId)?.name || tenantId;
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const canEditMembership = (membership: Membership) => {
    if (membership.user_id === user?.id) return false;
    if (isPlatformAdmin) return true;
    if (membership.role === 'platform_admin') return false;
    return true;
  };

  const canDeleteMembership = (membership: Membership) => {
    if (membership.user_id === user?.id) return false;
    if (isPlatformAdmin) return true;
    if (membership.role === 'platform_admin') return false;
    return true;
  };

  const handleCreate = async () => {
    if (!newMembership.user_id || !newMembership.tenant_id || !newMembership.role) {
      setCreateError('Alle Felder sind erforderlich');
      return;
    }

    if (newMembership.role === 'platform_admin' && !isPlatformAdmin) {
      setCreateError('Nur Platform Admins können die Platform-Admin-Rolle vergeben');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: newMembership.user_id,
          tenant_id: newMembership.tenant_id,
          role: newMembership.role as MembershipRole,
        });

      if (error) throw error;

      setCreateOpen(false);
      setNewMembership({ user_id: '', tenant_id: orgFilter || '', role: '' });
      fetchData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('duplicate') || (err as { code?: string })?.code === '23505') {
        setCreateError('Dieser Benutzer hat bereits eine Mitgliedschaft in dieser Organisation');
      } else {
        setCreateError(errMsg || 'Mitgliedschaft konnte nicht erstellt werden');
      }
    }
    setCreating(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !editRole) return;

    if (editRole === 'platform_admin' && !isPlatformAdmin) {
      setEditError('Nur Platform Admins können die Platform-Admin-Rolle vergeben');
      return;
    }

    setEditing(true);
    setEditError(null);

    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: editRole as MembershipRole })
        .eq('id', editTarget.id);

      if (error) throw error;

      setEditTarget(null);
      setEditRole('');
      fetchData();
    } catch (err: unknown) {
      setEditError((err instanceof Error ? err.message : String(err)) || 'Mitgliedschaft konnte nicht aktualisiert werden');
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      fetchData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Mitgliedschaft konnte nicht entfernt werden');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openEditDialog = (membership: Membership) => {
    setEditTarget(membership);
    setEditRole(membership.role as MembershipRole);
    setEditError(null);
  };

  const availableRoles = isPlatformAdmin 
    ? ROLES 
    : ROLES.filter(r => !r.restricted);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      setCreateUserError('E-Mail und Passwort sind erforderlich');
      return;
    }
    if (newUser.password.length < 6) {
      setCreateUserError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setCreatingUser(true);
    setCreateUserError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('sot-create-test-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          displayName: newUser.displayName || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Benutzer ${newUser.email} wurde angelegt`);
      setCreateUserOpen(false);
      setNewUser({ email: '', password: '', displayName: '' });
      fetchData();
    } catch (err: unknown) {
      setCreateUserError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Anlegen des Benutzers');
    }
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
          {isPlatformAdmin && (
            <Button variant="outline" onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Neuen Benutzer anlegen
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Mitgliedschaft hinzufügen
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mitgliedschaft hinzufügen</DialogTitle>
              <DialogDescription>
                Einem Benutzer eine Rolle in einer Organisation zuweisen.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Benutzer-ID</Label>
                <Input
                  id="user_id"
                  value={newMembership.user_id}
                  onChange={(e) => setNewMembership(prev => ({ ...prev, user_id: e.target.value }))}
                  placeholder="UUID des Benutzers"
                />
                <p className="text-xs text-muted-foreground">
                  Benutzer-UUID aus der Profiltabelle eingeben
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant">Organisation</Label>
                <Select
                  value={newMembership.tenant_id}
                  onValueChange={(value) => setNewMembership(prev => ({ ...prev, tenant_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Organisation wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={newMembership.role}
                  onValueChange={(value) => setNewMembership(prev => ({ ...prev, role: value as MembershipRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                        {role.restricted && ' ⚠️'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isPlatformAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Die Platform-Admin-Rolle kann nur von Platform Admins vergeben werden
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mitgliedschaften</CardTitle>
          <CardDescription>
            {orgFilter 
              ? `Gefiltert nach Organisation: ${getOrgName(orgFilter)}`
              : 'Alle Mitgliedschaften über alle Organisationen'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : memberships.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Mitgliedschaften gefunden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => {
                  const profile = profilesMap[membership.user_id];
                  const resolved = resolveDisplayRole(membership.role, membership.user_id, superUserIds);
                  return (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {profile?.display_name || profile?.email || membership.user_id.slice(0, 8) + '...'}
                        </span>
                        {profile?.email && (
                          <span className="text-xs text-muted-foreground">{profile.email}</span>
                        )}
                        {!profile?.email && (
                          <span className="text-xs text-muted-foreground font-mono">{membership.user_id.slice(0, 12)}...</span>
                        )}
                      </div>
                      {membership.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2 mt-1">Du</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getOrgName(membership.tenant_id)}</TableCell>
                    <TableCell>
                      <Badge variant={resolved.variant}>
                        {resolved.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(membership.created_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEditMembership(membership) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(membership)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteMembership(membership) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(membership)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitgliedschaft bearbeiten</DialogTitle>
            <DialogDescription>
              Rolle für diese Mitgliedschaft ändern.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          {editTarget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Benutzer-ID</Label>
                <p className="font-mono text-sm text-muted-foreground">
                  {editTarget.user_id}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Organisation</Label>
                <p className="text-sm">
                  {getOrgName(editTarget.tenant_id)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Neue Rolle</Label>
                <Select
                  value={editRole}
                  onValueChange={(value) => setEditRole(value as MembershipRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                        {role.restricted && ' ⚠️'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Abbrechen</Button>
            <Button onClick={handleEdit} disabled={editing || !editRole}>
              {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitgliedschaft entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Die Rolle des Benutzers in dieser Organisation wird entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
            <DialogDescription>
              Der Benutzer erhält automatisch einen eigenen Mandanten und kann sich sofort mit diesen Daten einloggen.
            </DialogDescription>
          </DialogHeader>

          {createUserError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{createUserError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">E-Mail-Adresse</Label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Passwort</Label>
              <Input
                id="new-password"
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-displayname">Anzeigename (optional)</Label>
              <Input
                id="new-displayname"
                value={newUser.displayName}
                onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Vor- und Nachname"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Benutzer anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Benutzer & Mitgliedschaften"
        subtitle={`${memberships.length} Mitgliedschaften`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Users, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { PdfExportFooter } from '@/components/pdf';
import { ROLES_CATALOG } from '@/constants/rolesMatrix';

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

export default function UsersPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const orgFilter = searchParams.get('org');
  const contentRef = useRef<HTMLDivElement>(null);

  const [memberships, setMemberships] = useState<MembershipWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create membership dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newMembership, setNewMembership] = useState({
    user_id: '',
    tenant_id: orgFilter || '',
    role: '' as MembershipRole | '',
  });

  // Edit membership dialog
  const [editTarget, setEditTarget] = useState<Membership | null>(null);
  const [editRole, setEditRole] = useState<MembershipRole | ''>('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Membership | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Fetch organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      setOrganizations(orgsData || []);

      // Fetch memberships
      let query = supabase.from('memberships').select('*');
      
      if (orgFilter) {
        query = query.eq('tenant_id', orgFilter);
      }
      
      const { data: membershipData, error: membershipError } = await query.order('created_at', { ascending: false });
      
      if (membershipError) throw membershipError;
      setMemberships(membershipData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
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
    // Can't edit your own membership
    if (membership.user_id === user?.id) return false;
    // Platform admin can edit any
    if (isPlatformAdmin) return true;
    // org_admin cannot edit platform_admin memberships
    if (membership.role === 'platform_admin') return false;
    return true;
  };

  const canDeleteMembership = (membership: Membership) => {
    // Can't delete your own membership
    if (membership.user_id === user?.id) return false;
    // Platform admin can delete any
    if (isPlatformAdmin) return true;
    // org_admin cannot delete platform_admin memberships
    if (membership.role === 'platform_admin') return false;
    return true;
  };

  const handleCreate = async () => {
    if (!newMembership.user_id || !newMembership.tenant_id || !newMembership.role) {
      setCreateError('All fields are required');
      return;
    }

    // Only platform_admin can create platform_admin memberships
    if (newMembership.role === 'platform_admin' && !isPlatformAdmin) {
      setCreateError('Only platform admins can assign the platform_admin role');
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
    } catch (err: any) {
      if (err.message.includes('duplicate') || err.code === '23505') {
        setCreateError('This user already has a membership in this organization');
      } else {
        setCreateError(err.message || 'Failed to create membership');
      }
    }
    setCreating(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !editRole) return;

    // Only platform_admin can assign platform_admin role
    if (editRole === 'platform_admin' && !isPlatformAdmin) {
      setEditError('Only platform admins can assign the platform_admin role');
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
    } catch (err: any) {
      setEditError(err.message || 'Failed to update membership');
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
    } catch (err: any) {
      setError(err.message || 'Failed to delete membership');
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

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users & Memberships</h2>
          <p className="text-muted-foreground">Manage user roles and organization access</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Membership</DialogTitle>
              <DialogDescription>
                Assign a role to a user in an organization.
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
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={newMembership.user_id}
                  onChange={(e) => setNewMembership(prev => ({ ...prev, user_id: e.target.value }))}
                  placeholder="UUID of the user"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the user's UUID from profiles
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant">Organization</Label>
                <Select
                  value={newMembership.tenant_id}
                  onValueChange={(value) => setNewMembership(prev => ({ ...prev, tenant_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
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
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newMembership.role}
                  onValueChange={(value) => setNewMembership(prev => ({ ...prev, role: value as MembershipRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
                    Platform Admin role can only be assigned by platform admins
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Membership
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Memberships</CardTitle>
          <CardDescription>
            {orgFilter 
              ? `Filtered by organization: ${getOrgName(orgFilter)}`
              : 'All memberships across organizations'}
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
              <p className="mt-2 text-muted-foreground">No memberships found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-mono text-sm">
                      {membership.user_id.slice(0, 8)}...
                      {membership.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getOrgName(membership.tenant_id)}</TableCell>
                    <TableCell>
                      <Badge variant={ROLES.find(r => r.value === membership.role)?.variant || 'outline'}>
                        {ROLES.find(r => r.value === membership.role)?.label || formatRole(membership.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(membership.created_at), 'MMM d, yyyy')}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
            <DialogDescription>
              Change the role for this membership.
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
                <Label>User ID</Label>
                <p className="font-mono text-sm text-muted-foreground">
                  {editTarget.user_id}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <p className="text-sm">
                  {getOrgName(editTarget.tenant_id)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">New Role</Label>
                <Select
                  value={editRole}
                  onValueChange={(value) => setEditRole(value as MembershipRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editing || !editRole}>
              {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Membership</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's role in this organization. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Users & Memberships"
        subtitle={`${memberships.length} Mitgliedschaften`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}

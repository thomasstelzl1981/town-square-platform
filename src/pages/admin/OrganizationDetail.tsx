import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle, Lock, Building2, Shield, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Organization = Tables<'organizations'>;
type Membership = Tables<'memberships'>;

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isPlatformAdmin } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [parent, setParent] = useState<Organization | null>(null);
  const [children, setChildren] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lockdown toggle state
  const [lockdownDialogOpen, setLockdownDialogOpen] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [pendingLockdownValue, setPendingLockdownValue] = useState(false);
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);

  // Check if current user can toggle lockdown (org_admin of this org or platform_admin)
  const [canToggleLockdown, setCanToggleLockdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (orgError) throw orgError;
        if (!orgData) throw new Error('Organization not found');
        
        setOrganization(orgData);

        // Fetch parent if exists
        if (orgData.parent_id) {
          const { data: parentData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgData.parent_id)
            .maybeSingle();
          setParent(parentData);
        }

        // Fetch children
        const { data: childrenData } = await supabase
          .from('organizations')
          .select('*')
          .eq('parent_id', id)
          .order('name');
        setChildren(childrenData || []);

        // Fetch memberships for this org
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('*')
          .eq('tenant_id', id);
        setMemberships(membershipData || []);

        // Check if user can toggle lockdown
        if (user) {
          // platform_admin can always toggle
          if (isPlatformAdmin) {
            setCanToggleLockdown(true);
          } else {
            // Check if user is org_admin of THIS org (not parent-derived)
            const { data: directMembership } = await supabase
              .from('memberships')
              .select('role')
              .eq('user_id', user.id)
              .eq('tenant_id', id)
              .eq('role', 'org_admin')
              .maybeSingle();
            setCanToggleLockdown(!!directMembership);
          }
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load organization');
      }
      setLoading(false);
    }

    fetchData();
  }, [id, user, isPlatformAdmin]);

  const handleLockdownToggle = (newValue: boolean) => {
    setPendingLockdownValue(newValue);
    setLockdownReason('');
    setLockdownDialogOpen(true);
  };

  const confirmLockdownChange = async () => {
    if (!organization || !user) return;
    
    setIsTogglingLockdown(true);
    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ parent_access_blocked: pendingLockdownValue })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Insert audit event with reason if provided
      if (lockdownReason.trim()) {
        await supabase.from('audit_events').insert({
          actor_user_id: user.id,
          target_org_id: organization.id,
          event_type: 'parent_access_blocked_reason',
          payload: { reason: lockdownReason.trim() }
        });
      }

      setOrganization({ ...organization, parent_access_blocked: pendingLockdownValue });
      toast.success(pendingLockdownValue 
        ? 'Parent access blocked successfully' 
        : 'Parent access restored successfully'
      );
      setLockdownDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update lockdown status');
    }
    setIsTogglingLockdown(false);
  };

  const formatOrgType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Organization not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{organization.name}</h2>
          <p className="text-muted-foreground font-mono text-sm">{organization.slug}</p>
        </div>
        <Badge className="ml-auto">{formatOrgType(organization.org_type)}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stammdaten / Core Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Stammdaten</CardTitle>
            <CardDescription>Core attributes and access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm font-mono">{organization.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="text-sm font-mono">{organization.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline">{formatOrgType(organization.org_type)}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Depth</p>
                <p className="text-sm">{organization.depth}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(organization.created_at), 'PPpp')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
                <p className="text-sm">{format(new Date(organization.updated_at), 'PPpp')}</p>
              </div>
            </div>

            {/* Parent Access Lockdown Toggle */}
            {organization.parent_id && (
              <div className={`p-4 rounded-lg border ${organization.parent_access_blocked ? 'bg-destructive/10 border-destructive/30' : 'bg-muted'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {organization.parent_access_blocked ? (
                      <Shield className="h-5 w-5 text-destructive" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="lockdown-toggle" className="text-sm font-medium">
                        Parent-Zugriff blockieren
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Wenn aktiviert, kann kein übergeordneter Mandant/Partner auf diese Organisation zugreifen. Plattform-Admin ist ausgenommen.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="lockdown-toggle"
                    checked={organization.parent_access_blocked}
                    onCheckedChange={handleLockdownToggle}
                    disabled={!canToggleLockdown || isTogglingLockdown}
                  />
                </div>
                {organization.parent_access_blocked && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Parent organization access is currently blocked</span>
                  </div>
                )}
                {!canToggleLockdown && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Only org admins of this organization or platform admins can change this setting.
                  </p>
                )}
              </div>
            )}

            {/* Immutable Fields Warning */}
            <div className="p-3 bg-muted rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Immutable Fields</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The following cannot be changed after creation: org_type, parent_id, depth, materialized_path
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy</CardTitle>
            <CardDescription>Parent and child organizations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Parent</p>
              {parent ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/organizations/${parent.id}`}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {parent.name}
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">— Root organization —</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Materialized Path
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {organization.materialized_path}
              </code>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Children ({children.length})
              </p>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No child organizations</p>
              ) : (
                <div className="space-y-1">
                  {children.map(child => (
                    <Button key={child.id} variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <Link to={`/admin/organizations/${child.id}`}>
                        <Building2 className="mr-2 h-4 w-4" />
                        {child.name}
                        <div className="ml-auto flex items-center gap-2">
                          {child.parent_access_blocked && (
                            <span title="Parent access blocked">
                              <Shield className="h-3 w-3 text-destructive" />
                            </span>
                          )}
                          <Badge variant="outline">
                            {formatOrgType(child.org_type)}
                          </Badge>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memberships */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
            <CardDescription>Users with roles in this organization</CardDescription>
          </CardHeader>
          <CardContent>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memberships found</p>
            ) : (
              <div className="space-y-2">
                {memberships.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-mono">{m.user_id}</span>
                    <Badge variant={m.role === 'platform_admin' ? 'default' : 'secondary'}>
                      {formatRole(m.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/users?org=${organization.id}`}>
                  Manage Memberships →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lockdown Confirmation Dialog */}
      <Dialog open={lockdownDialogOpen} onOpenChange={setLockdownDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingLockdownValue ? 'Block Parent Access?' : 'Restore Parent Access?'}
            </DialogTitle>
            <DialogDescription>
              {pendingLockdownValue 
                ? 'This will prevent any parent organization from accessing this organization\'s data. Only platform admins will remain unaffected.'
                : 'This will restore access for parent organizations based on hierarchy. Parent org_admins will be able to manage this organization again.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter a reason for this change..."
              value={lockdownReason}
              onChange={(e) => setLockdownReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockdownDialogOpen(false)} disabled={isTogglingLockdown}>
              Cancel
            </Button>
            <Button 
              variant={pendingLockdownValue ? 'destructive' : 'default'}
              onClick={confirmLockdownChange}
              disabled={isTogglingLockdown}
            >
              {isTogglingLockdown && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingLockdownValue ? 'Block Access' : 'Restore Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
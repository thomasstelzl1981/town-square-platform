import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle, Lock, Building2 } from 'lucide-react';
import { format } from 'date-fns';

type Organization = Tables<'organizations'>;
type Membership = Tables<'memberships'>;

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [parent, setParent] = useState<Organization | null>(null);
  const [children, setChildren] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      } catch (err: any) {
        setError(err.message || 'Failed to load organization');
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

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
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Core attributes and hierarchy info</CardDescription>
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
                        <Badge variant="outline" className="ml-auto">
                          {formatOrgType(child.org_type)}
                        </Badge>
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
    </div>
  );
}

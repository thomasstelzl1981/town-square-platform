import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Link2, Shield, ExternalLink } from 'lucide-react';

interface Stats {
  organizations: number;
  profiles: number;
  memberships: number;
  delegations: number;
}

export default function Dashboard() {
  const { profile, memberships, isPlatformAdmin, activeOrganization } = useAuth();
  const [stats, setStats] = useState<Stats>({ organizations: 0, profiles: 0, memberships: 0, delegations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [orgsRes, profilesRes, membershipsRes, delegationsRes] = await Promise.all([
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('memberships').select('id', { count: 'exact', head: true }),
          supabase.from('org_delegations').select('id', { count: 'exact', head: true }),
        ]);
        
        setStats({
          organizations: orgsRes.count || 0,
          profiles: profilesRes.count || 0,
          memberships: membershipsRes.count || 0,
          delegations: delegationsRes.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    }
    
    fetchStats();
  }, []);

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to the System of a Town Admin Portal</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Schnellzugriff auf alle Bereiche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Portal Super User Entry */}
          <div>
            <p className="text-sm font-medium mb-2">Zone 2 – Portal</p>
            <Button 
              variant="default" 
              onClick={() => window.location.href = '/portal'}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Portal Super User öffnen
            </Button>
          </div>

          {/* Zone 3 Websites */}
          <div>
            <p className="text-sm font-medium mb-2">Zone 3 – Websites</p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.open('/kaufy', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Kaufy
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/sot', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                System of a Town
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/miety', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Miety
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Go-live: kaufy.app | systemofatown.app | miety.app
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current User Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Session
          </CardTitle>
          <CardDescription>Your authentication and authorization context</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Display Name</p>
              <p className="text-sm">{profile?.display_name || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Tenant</p>
              <p className="text-sm">{activeOrganization?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {memberships.map(m => (
                  <Badge 
                    key={m.id} 
                    variant={m.role === 'platform_admin' ? 'default' : 'secondary'}
                  >
                    {formatRole(m.role)}
                  </Badge>
                ))}
                {memberships.length === 0 && <span className="text-sm text-muted-foreground">No memberships</span>}
              </div>
            </div>
          </div>
          {isPlatformAdmin && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">🔓 Platform Admin Mode Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                You have unrestricted access to all organizations, users, and data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.organizations}</div>
            <p className="text-xs text-muted-foreground">Total tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.profiles}</div>
            <p className="text-xs text-muted-foreground">Registered profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memberships</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.memberships}</div>
            <p className="text-xs text-muted-foreground">Role assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delegations</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.delegations}</div>
            <p className="text-xs text-muted-foreground">Cross-org access grants</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

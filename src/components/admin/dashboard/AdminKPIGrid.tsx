/**
 * AdminKPIGrid — Stats cards for Admin Dashboard
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Link2 } from 'lucide-react';

interface Stats {
  organizations: number; profiles: number; memberships: number; delegations: number;
  orgsByType: Record<string, number>; membershipsByRole: Record<string, number>; activeDelegations: number;
}

interface Props { stats: Stats; loading: boolean; }

const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function AdminKPIGrid({ stats, loading }: Props) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Organisationen</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '—' : stats.organizations}</div>
          {!loading && Object.keys(stats.orgsByType).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(stats.orgsByType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">{type}: {count}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '—' : stats.profiles}</div>
          <p className="text-xs text-muted-foreground">Registrierte Profile</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mitgliedschaften</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '—' : stats.memberships}</div>
          {!loading && Object.keys(stats.membershipsByRole).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(stats.membershipsByRole).map(([role, count]) => (
                <Badge key={role} variant={role === 'platform_admin' ? 'default' : 'secondary'} className="text-xs">{formatRole(role)}: {count}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delegierungen</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '—' : stats.delegations}</div>
          {!loading && (
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">Aktiv: {stats.activeDelegations}</Badge>
              <Badge variant="outline" className="text-xs">Widerrufen: {stats.delegations - stats.activeDelegations}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

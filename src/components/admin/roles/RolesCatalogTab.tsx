/**
 * RolesCatalogTab — Roles catalog for RolesManagement
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Database, Key } from 'lucide-react';
import { ROLES_CATALOG, BASE_TILES, ROLE_EXTRA_TILES, ALL_TILES } from '@/constants/rolesMatrix';

export function RolesCatalogTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ROLES_CATALOG.length} Rollen — Konsolidiertes Modell</CardTitle>
        <CardDescription>{ROLES_CATALOG.filter(r => r.isSystem).length} System-Rolle + {ROLES_CATALOG.filter(r => !r.isSystem).length} User-Rollen. Jede Rolle hat 14 Basis-Module + optionale Zusatz-Module.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROLES_CATALOG.map(role => {
          const extras = ROLE_EXTRA_TILES[role.membershipRole] || [];
          const isFullAccess = role.code === 'platform_admin' || role.code === 'super_user';
          return (
            <Card key={role.code} className={`border-l-4 ${role.isSystem ? 'border-l-destructive' : isFullAccess ? 'border-l-chart-1' : 'border-l-primary'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{role.label}</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">{role.code}</Badge>
                    {role.isSystem && <Badge variant="destructive" className="text-xs">System</Badge>}
                  </div>
                  <Badge variant="secondary">{role.totalModules} Module</Badge>
                </div>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Database className="h-3 w-3" />membership: <code className="bg-muted px-1 rounded">{role.membershipRole}</code></span>
                  {role.appRole && <span className="flex items-center gap-1"><Key className="h-3 w-3" />app_role: <code className="bg-muted px-1 rounded">{role.appRole}</code></span>}
                </div>
                {isFullAccess ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-chart-1" /><span>Alle {ALL_TILES.length} Module (Vollzugriff)</span></div>
                ) : (
                  <div className="space-y-2">
                    <div><span className="text-xs font-medium text-muted-foreground">14 Basis-Module</span><div className="flex flex-wrap gap-1 mt-1">{BASE_TILES.map(tile => <Badge key={tile} variant="outline" className="text-xs bg-primary/5">{tile}</Badge>)}</div></div>
                    {extras.length > 0 && <div><span className="text-xs font-medium text-chart-2">+ Zusatz-Module</span><div className="flex flex-wrap gap-1 mt-1">{extras.map(tile => <Badge key={tile} className="text-xs bg-chart-2/20 text-chart-2 border-chart-2/30">{tile}</Badge>)}</div></div>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

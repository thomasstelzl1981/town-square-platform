/**
 * RolesGovernanceTab — Governance & onboarding for RolesManagement
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Info, ArrowRight, Database, Users, Key } from 'lucide-react';
import { ROLES_CATALOG, LEGACY_ROLES, ALL_TILES } from '@/constants/rolesMatrix';

export function RolesGovernanceTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Account-Eröffnungsprozess</CardTitle>
            <CardDescription>Was passiert automatisch bei Signup? (handle_new_user Trigger)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge>Signup</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">Organization (client)</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">Profile</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">Membership (org_admin)</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">14 Basis-Tiles aktiviert</Badge>
              </div>
              <Separator />
              <Table>
                <TableHeader><TableRow><TableHead>User-Typ (UI)</TableHead><TableHead>membership_role</TableHead><TableHead>app_role</TableHead><TableHead className="text-center">Module</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ROLES_CATALOG.filter(r => !r.isSystem).map(role => (
                    <TableRow key={role.code}>
                      <TableCell className="font-medium">{role.label}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1 rounded">{role.membershipRole}</code></TableCell>
                      <TableCell>{role.appRole ? <code className="text-xs bg-muted px-1 rounded">{role.appRole}</code> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{role.totalModules}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm"><strong>DB-Funktion:</strong> <code className="bg-muted px-1 rounded text-xs">get_tiles_for_role(membership_role)</code> ist die SSOT für Tile-Zuordnung.</AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />org_admin vs. platform_admin</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2"><p className="font-semibold">org_admin <span className="font-normal text-muted-foreground">(membership_role)</span></p><p className="text-muted-foreground">Tenant-Eigentümer. Automatisch bei Signup vergeben.</p></div>
            <Separator />
            <div className="space-y-2"><p className="font-semibold">platform_admin <span className="font-normal text-muted-foreground">(app_role + membership_role)</span></p><p className="text-muted-foreground">System-Admin (God Mode). Zugriff auf ALLE Tenants + Zone 1.</p></div>
            <Separator />
            <div className="space-y-2"><p className="font-semibold">super_user <span className="font-normal text-muted-foreground">(app_role)</span></p><p className="text-muted-foreground">Sonderfall: membership bleibt org_admin, alle {ALL_TILES.length} Module freigeschaltet — OHNE Zone-1-Zugang.</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Datenbank-Enums</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><h4 className="font-semibold text-sm mb-2">membership_role</h4><div className="flex flex-wrap gap-1">{ROLES_CATALOG.map(r => r.membershipRole).filter((v, i, a) => a.indexOf(v) === i).map(role => <Badge key={role} variant="outline" className="text-xs font-mono">{role}</Badge>)}{LEGACY_ROLES.map(r => <Badge key={r.code} variant="outline" className="text-xs font-mono text-muted-foreground/50 line-through">{r.code}</Badge>)}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">app_role</h4><div className="flex flex-wrap gap-1">{ROLES_CATALOG.filter(r => r.appRole).map(r => <Badge key={r.appRole} variant="outline" className="text-xs font-mono">{r.appRole}</Badge>)}{['moderator', 'user'].map(role => <Badge key={role} variant="outline" className="text-xs font-mono text-muted-foreground/50 line-through">{role}</Badge>)}</div></div>
            <Alert className="border-muted"><Info className="h-4 w-4" /><AlertDescription className="text-xs text-muted-foreground">Durchgestrichene Werte sind Legacy — bleiben im Enum, werden aber nicht mehr vergeben.</AlertDescription></Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

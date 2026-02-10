/**
 * RolesManagement — Rollen & Berechtigungen (Zone 1)
 * 
 * 3 Tabs:
 * 1. Rollen-Katalog: 6 Rollen mit Basis/Zusatz-Trennung
 * 2. Modul-Rollen-Matrix: 21 Module × 6 Rollen mit Farbkodierung
 * 3. Governance: Eröffnungsprozess, DB-Mapping, Legacy-Hinweise
 */
import { Shield, Check, X, Info, ArrowRight, Database, Users, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ROLES_CATALOG,
  MODULES_CATALOG,
  MODULE_ROLE_MATRIX,
  BASE_TILES,
  ROLE_EXTRA_TILES,
  LEGACY_ROLES,
  ALL_TILES,
  hasModuleAccess,
  isBaseTile,
} from '@/constants/rolesMatrix';

export default function RolesManagement() {
  const matrixRoles = ROLES_CATALOG;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Rollen & Berechtigungen</h1>
          <p className="text-muted-foreground">
            Zentrale Übersicht — membership_role steuert Tile-Aktivierung, app_role steuert Zone-1-Zugang
          </p>
        </div>
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Rollen-Katalog</TabsTrigger>
          <TabsTrigger value="matrix">Modul-Rollen-Matrix</TabsTrigger>
          <TabsTrigger value="governance">Governance & Eröffnung</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* Tab 1: Rollen-Katalog */}
        {/* ============================================================ */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>6 Rollen — Konsolidiertes Modell</CardTitle>
              <CardDescription>
                1 System-Rolle + 5 User-Rollen. Jede Rolle hat 14 Basis-Module + optionale Zusatz-Module.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ROLES_CATALOG.map((role) => {
                const extras = ROLE_EXTRA_TILES[role.membershipRole] || [];
                const isFullAccess = role.code === 'platform_admin' || role.code === 'super_user';

                return (
                  <Card
                    key={role.code}
                    className={`border-l-4 ${
                      role.isSystem
                        ? 'border-l-destructive'
                        : isFullAccess
                          ? 'border-l-chart-1'
                          : 'border-l-primary'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{role.label}</CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            {role.code}
                          </Badge>
                          {role.isSystem && (
                            <Badge variant="destructive" className="text-xs">System</Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {role.totalModules} Module
                        </Badge>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* DB-Mapping */}
                      <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          membership: <code className="bg-muted px-1 rounded">{role.membershipRole}</code>
                        </span>
                        {role.appRole && (
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            app_role: <code className="bg-muted px-1 rounded">{role.appRole}</code>
                          </span>
                        )}
                      </div>

                      {/* Module breakdown */}
                      {isFullAccess ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-chart-1" />
                          <span>Alle 21 Module (Vollzugriff)</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">14 Basis-Module</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {BASE_TILES.map((tile) => (
                                <Badge key={tile} variant="outline" className="text-xs bg-primary/5">
                                  {tile}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {extras.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-chart-2">+ Zusatz-Module</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {extras.map((tile) => (
                                  <Badge key={tile} className="text-xs bg-chart-2/20 text-chart-2 border-chart-2/30">
                                    {tile}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 2: Modul-Rollen-Matrix */}
        {/* ============================================================ */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modul-Rollen-Matrix</CardTitle>
              <CardDescription>
                21 Module × 6 Rollen — Grün = Basis (alle Rollen), Blau = Zusatz (rollenspezifisch)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] sticky left-0 bg-background z-10">Modul</TableHead>
                        {matrixRoles.map((role) => (
                          <TableHead key={role.code} className="text-center w-[90px]">
                            <div className="text-xs font-medium">{role.label}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{role.totalModules}</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MODULES_CATALOG.map((mod) => {
                        const isBasis = isBaseTile(mod.code);
                        return (
                          <TableRow key={mod.code} className={isBasis ? '' : 'bg-muted/30'}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground">{mod.code}</span>
                                  {!isBasis && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-chart-2 border-chart-2/30">
                                      Spezial
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm">{mod.name}</span>
                              </div>
                            </TableCell>
                            {matrixRoles.map((role) => {
                              const hasAccess = hasModuleAccess(role.code, mod.code);
                              return (
                                <TableCell key={role.code} className="text-center">
                                  {hasAccess ? (
                                    <Check className={`h-4 w-4 mx-auto ${isBasis ? 'text-primary' : 'text-chart-2'}`} />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground/20 mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legende + Monitoring Platzhalter */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Basis-Modul (alle Rollen)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-chart-2" />
                    <span>Zusatz-Modul (rollenspezifisch)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-muted-foreground/20" />
                    <span className="text-muted-foreground">Kein Zugriff</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Monitoring-Modul (geplant)</p>
                    <p className="text-xs mt-1">
                      Zukünftig erhalten akquise_manager, finance_manager und sales_partner ein zusätzliches Monitoring-Modul zur Dokumentation der Account-Zusammenhänge.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 3: Governance & Eröffnungsprozess */}
        {/* ============================================================ */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Eröffnungsprozess */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Account-Eröffnungsprozess
                </CardTitle>
                <CardDescription>
                  Was passiert automatisch bei Signup? (handle_new_user Trigger)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Flow */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>Signup</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Organization (client)</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Profile</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Membership (org_admin)</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">14 Basis-Tiles aktiviert</Badge>
                  </div>

                  <Separator />

                  {/* Mapping-Tabelle */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User-Typ (UI)</TableHead>
                        <TableHead>membership_role</TableHead>
                        <TableHead>app_role</TableHead>
                        <TableHead className="text-center">Module</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ROLES_CATALOG.filter(r => !r.isSystem).map((role) => (
                        <TableRow key={role.code}>
                          <TableCell className="font-medium">{role.label}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 rounded">{role.membershipRole}</code>
                          </TableCell>
                          <TableCell>
                            {role.appRole ? (
                              <code className="text-xs bg-muted px-1 rounded">{role.appRole}</code>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{role.totalModules}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      <strong>DB-Funktion:</strong> <code className="bg-muted px-1 rounded text-xs">get_tiles_for_role(membership_role)</code> ist die SSOT für Tile-Zuordnung. 
                      Die gleiche Logik ist im Frontend als <code className="bg-muted px-1 rounded text-xs">getTilesForRole()</code> gespiegelt.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* org_admin vs platform_admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  org_admin vs. platform_admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">org_admin <span className="font-normal text-muted-foreground">(membership_role)</span></p>
                  <p className="text-muted-foreground">
                    Tenant-Eigentümer. Automatisch bei Signup vergeben. Steuert Zugriff auf 14 Basis-Module innerhalb SEINES Tenants.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="font-semibold">platform_admin <span className="font-normal text-muted-foreground">(app_role + membership_role)</span></p>
                  <p className="text-muted-foreground">
                    System-Admin (God Mode). Zugriff auf ALLE Tenants + Zone 1. Nur für internal-Organisation. Wird über <code className="bg-muted px-1 rounded text-xs">is_platform_admin()</code> geprüft.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="font-semibold">super_user <span className="font-normal text-muted-foreground">(app_role)</span></p>
                  <p className="text-muted-foreground">
                    Sonderfall: membership bleibt org_admin, aber <code className="bg-muted px-1 rounded text-xs">user_roles.role = super_user</code> schaltet alle 21 Module frei — OHNE Zone-1-Zugang.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DB-Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Datenbank-Enums
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">membership_role</h4>
                  <div className="flex flex-wrap gap-1">
                    {['platform_admin', 'org_admin', 'sales_partner', 'finance_manager', 'akquise_manager'].map(role => (
                      <Badge key={role} variant="outline" className="text-xs font-mono">
                        {role}
                      </Badge>
                    ))}
                    {['internal_ops', 'renter_user', 'future_room_web_user_lite'].map(role => (
                      <Badge key={role} variant="outline" className="text-xs font-mono text-muted-foreground/50 line-through">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">app_role</h4>
                  <div className="flex flex-wrap gap-1">
                    {['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner'].map(role => (
                      <Badge key={role} variant="outline" className="text-xs font-mono">
                        {role}
                      </Badge>
                    ))}
                    {['moderator', 'user'].map(role => (
                      <Badge key={role} variant="outline" className="text-xs font-mono text-muted-foreground/50 line-through">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Alert className="border-muted">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    Durchgestrichene Werte sind Legacy — bleiben im Enum (Postgres kann nicht schrumpfen), werden aber nicht mehr vergeben.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

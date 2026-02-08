/**
 * RolesManagement — Rollen & Berechtigungen (Zone 1)
 * 
 * Feature Activation Gruppe: Zentrale Übersicht über Rollen und Module
 * 
 * 3 Tabs:
 * 1. Rollen-Katalog: Übersicht aller definierten Rollen
 * 2. Modul-Rollen-Matrix: Welche Rolle sieht welches Modul
 * 3. Governance-Regeln: Superuser-Dokumentation
 */
import { Shield, Check, X, AlertTriangle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  ROLES_CATALOG, 
  MODULES_CATALOG, 
  MODULE_ROLE_MATRIX,
  hasModuleAccess 
} from '@/constants/rolesMatrix';

export default function RolesManagement() {
  // Nur die Rollen für die Matrix-Header (ohne platform_admin für Übersichtlichkeit in Spalten)
  const matrixRoles = ROLES_CATALOG.filter(r => r.code !== 'platform_admin');
  
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
            Zentrale Übersicht über Rollen, Module und Zugriffsrechte
          </p>
        </div>
      </div>

      {/* Development Mode Warning */}
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Entwicklungs-Account</AlertTitle>
        <AlertDescription className="text-warning/80">
          Im Entwicklungsmodus (<code className="text-xs bg-muted px-1 rounded">isDevelopmentMode = true</code>) und 
          für Platform Admins sind <strong>ALLE Module sichtbar</strong>, unabhängig von Rollen-Zuweisungen.
          Die Rollen-Steuerung greift erst bei echten Tenant-Nutzern in Produktion.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Rollen-Katalog</TabsTrigger>
          <TabsTrigger value="matrix">Modul-Rollen-Matrix</TabsTrigger>
          <TabsTrigger value="governance">Governance-Regeln</TabsTrigger>
        </TabsList>

        {/* Tab 1: Rollen-Katalog */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Definierte Rollen</CardTitle>
              <CardDescription>
                Alle im System definierten Rollen mit Zonen und Modul-Zugriff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ROLES_CATALOG.map((role) => (
                  <Card key={role.code} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{role.label}</CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            {role.code}
                          </Badge>
                        </div>
                        <Badge 
                          variant={role.zone.includes('Zone 1') ? 'default' : 'secondary'}
                        >
                          {role.zone}
                        </Badge>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {role.dbNote && (
                        <Alert className="mb-3 border-primary/50 bg-primary/10">
                          <Info className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-primary/80 text-sm">
                            {role.dbNote}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {role.modules.map((mod, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {mod}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Modul-Rollen-Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modul-Rollen-Matrix</CardTitle>
              <CardDescription>
                Visualisierung: Welche Rolle hat Zugriff auf welches Modul (Read-Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] sticky left-0 bg-background z-10">Modul</TableHead>
                        <TableHead className="text-center w-[80px]">
                          <div className="text-xs">Platform</div>
                          <div className="text-xs text-muted-foreground">Admin</div>
                        </TableHead>
                        {matrixRoles.map((role) => (
                          <TableHead key={role.code} className="text-center w-[80px]">
                            <div className="text-xs">{role.label.split(' ')[0]}</div>
                            <div className="text-xs text-muted-foreground">
                              {role.label.split(' ').slice(1).join(' ') || '—'}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MODULES_CATALOG.map((mod) => (
                        <TableRow key={mod.code}>
                          <TableCell className="font-medium sticky left-0 bg-background z-10">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-muted-foreground">{mod.code}</span>
                              <span>{mod.name}</span>
                            </div>
                          </TableCell>
                          {/* Platform Admin hat immer Zugriff */}
                          <TableCell className="text-center">
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          </TableCell>
                          {matrixRoles.map((role) => (
                            <TableCell key={role.code} className="text-center">
                              {hasModuleAccess(role.code, mod.code) ? (
                                <Check className="h-4 w-4 text-primary mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legende */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Zugriff erlaubt</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-muted-foreground/30" />
                  <span className="text-muted-foreground">Kein Zugriff</span>
                </div>
                <div className="text-muted-foreground">
                  Hinweis: Platform Admin hat immer vollen Zugriff (God Mode)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Governance-Regeln */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Superuser-Regeln */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Superuser-Regeln
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Platform Admin (God Mode)</h4>
                  <p className="text-sm text-muted-foreground">
                    Die Rolle <code className="text-xs bg-muted px-1 rounded">platform_admin</code> hat 
                    uneingeschränkten Zugriff auf alle Tenants und Module. Diese Rolle ist reserviert 
                    für System-Administratoren der <code className="text-xs bg-muted px-1 rounded">internal</code>-Organisation.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">isDevelopmentMode</h4>
                  <p className="text-sm text-muted-foreground">
                    Wenn <code className="text-xs bg-muted px-1 rounded">isDevelopmentMode = true</code>, 
                    werden alle Module angezeigt, unabhängig von der Rollen-Zuweisung. Dies ermöglicht 
                    vollständige Entwicklung im Test-Account.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Zone 2 als Entwicklungs-Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Entwicklungs-Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Der aktuelle Tenant fungiert als <strong>Entwicklungs-Account</strong>. 
                  Hier gelten besondere Regeln:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Alle Module sind sichtbar (kein Tile-Gating)</li>
                  <li><code className="text-xs bg-muted px-1 rounded">tenant_tile_activation</code> wird ignoriert</li>
                  <li>Rollen-Beschränkungen sind dokumentiert, aber nicht enforced</li>
                  <li>Erst bei echtem Tenant-Onboarding (Phase 11) greifen Rollen</li>
                </ul>
              </CardContent>
            </Card>

            {/* Rollen-Vergabe */}
            <Card>
              <CardHeader>
                <CardTitle>Rollen-Vergabe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Rollen werden über die <code className="text-xs bg-muted px-1 rounded">memberships</code>-Tabelle 
                  vergeben. Jede Membership verbindet:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="text-xs bg-muted px-1 rounded">user_id</code> — Der Benutzer</li>
                  <li><code className="text-xs bg-muted px-1 rounded">tenant_id</code> — Die Organisation</li>
                  <li><code className="text-xs bg-muted px-1 rounded">role</code> — Die zugewiesene Rolle</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Ein Benutzer kann mehrere Memberships in verschiedenen Organisationen haben.
                </p>
              </CardContent>
            </Card>

            {/* DB-Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle>Datenbank-Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">membership_role Enum</h4>
                  <div className="flex flex-wrap gap-1">
                    {['platform_admin', 'org_admin', 'internal_ops', 'sales_partner', 'renter_user', 'finance_manager', 'akquise_manager', 'future_room_web_user_lite'].map(role => (
                      <Badge key={role} variant="outline" className="text-xs font-mono">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Alert className="border-warning/50 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning/80 text-sm">
                    <strong>Ausstehende Umbenennungen (Phase 11):</strong><br />
                    • <code className="text-xs">internal_ops</code> → <code className="text-xs">internal_user</code><br />
                    • <code className="text-xs">renter_user</code> → <code className="text-xs">tenant_renter_lite</code>
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

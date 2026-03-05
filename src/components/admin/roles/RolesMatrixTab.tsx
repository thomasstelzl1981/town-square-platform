/**
 * RolesMatrixTab — Module-role matrix for RolesManagement
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Check, X, Info } from 'lucide-react';
import { ROLES_CATALOG, MODULES_CATALOG, hasModuleAccess, isBaseTile } from '@/constants/rolesMatrix';

export function RolesMatrixTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Modul-Rollen-Matrix</CardTitle>
          <CardDescription>{MODULES_CATALOG.length} Module × {ROLES_CATALOG.length} Rollen — Grün = Basis (alle Rollen), Blau = Zusatz (rollenspezifisch)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sticky left-0 bg-background z-10">Modul</TableHead>
                    {ROLES_CATALOG.map(role => (
                      <TableHead key={role.code} className="text-center w-[90px]">
                        <div className="text-xs font-medium">{role.label}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{role.totalModules}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES_CATALOG.map(mod => {
                    const isBasis = isBaseTile(mod.code);
                    return (
                      <TableRow key={mod.code} className={isBasis ? '' : 'bg-muted/30'}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{mod.code}</span>
                              {!isBasis && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-chart-2 border-chart-2/30">Spezial</Badge>}
                            </div>
                            <span className="text-sm">{mod.name}</span>
                          </div>
                        </TableCell>
                        {ROLES_CATALOG.map(role => (
                          <TableCell key={role.code} className="text-center">
                            {hasModuleAccess(role.code, mod.code) ? <Check className={`h-4 w-4 mx-auto ${isBasis ? 'text-primary' : 'text-chart-2'}`} /> : <X className="h-4 w-4 text-muted-foreground/20 mx-auto" />}
                          </TableCell>
                        ))}
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>Basis-Modul (alle Rollen)</span></div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-chart-2" /><span>Zusatz-Modul (rollenspezifisch)</span></div>
              <div className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground/20" /><span className="text-muted-foreground">Kein Zugriff</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div><p className="font-medium">Monitoring-Modul (geplant)</p><p className="text-xs mt-1">Zukünftig erhalten akquise_manager, finance_manager und sales_partner ein zusätzliches Monitoring-Modul.</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

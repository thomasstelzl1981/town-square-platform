/**
 * TileRoleActivation — Role-based tile sync + tenant debug view
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Check, X, Plus, UserCheck, Settings, LayoutGrid, Building2, ShoppingCart, Users, FolderOpen, Mail, Wrench } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { ROLES_CATALOG, getTilesForRole, MODULES_CATALOG } from '@/constants/rolesMatrix';

type TileCatalog = Tables<'tile_catalog'>;
type TenantTileActivation = Tables<'tenant_tile_activation'>;
type Organization = Tables<'organizations'>;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'building-2': Building2, 'shopping-cart': ShoppingCart, 'users': Users,
  'folder-open': FolderOpen, 'mail': Mail, 'wrench': Wrench,
  'settings': Settings, 'layout-grid': LayoutGrid,
};

function getIcon(iconKey: string) {
  const Icon = ICON_MAP[iconKey] || LayoutGrid;
  return <Icon className="h-5 w-5" />;
}

interface TileRoleActivationProps {
  tiles: TileCatalog[];
  activations: TenantTileActivation[];
  organizations: Organization[];
  tenantRoles: Record<string, { membershipRole: string; appRole?: string; effectiveRole: string; orgName: string }>;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  selectedTenant: string;
  onSelectTenant: (tenant: string) => void;
  syncing: boolean;
  onSyncRole: (role: string) => void;
  onToggleTile: (tileCode: string, tenantId: string, active: boolean) => void;
  onActivateAll: (tenantId: string) => void;
  isActivatedForTenant: (tileCode: string, tenantId: string) => boolean;
}

export function TileRoleActivation({
  tiles, activations, organizations, tenantRoles,
  selectedRole, onSelectRole, selectedTenant, onSelectTenant,
  syncing, onSyncRole, onToggleTile, onActivateAll, isActivatedForTenant,
}: TileRoleActivationProps) {
  return (
    <div className="space-y-6">
      {/* Role sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5" />Rollenbezogene Tile-Steuerung</CardTitle>
          <CardDescription>Tiles werden automatisch aus der Rolle abgeleitet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedRole} onValueChange={onSelectRole}>
              <SelectTrigger className="w-80"><SelectValue placeholder="Rolle auswählen..." /></SelectTrigger>
              <SelectContent>
                {ROLES_CATALOG.filter(r => !r.isLegacy).map(role => (
                  <SelectItem key={role.code} value={role.code}>{role.label} ({role.totalModules} Module)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <Button variant="default" onClick={() => onSyncRole(selectedRole)} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Alle Tenants synchronisieren
              </Button>
            )}
          </div>

          {selectedRole && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Module für Rolle "{ROLES_CATALOG.find(r => r.code === selectedRole)?.label}":</h4>
                <div className="flex flex-wrap gap-1.5">
                  {getTilesForRole(selectedRole).sort().map(tileCode => {
                    const mod = MODULES_CATALOG.find(m => m.code === tileCode);
                    return <Badge key={tileCode} variant="secondary" className="text-xs">{tileCode} {mod ? `— ${mod.name}` : ''}</Badge>;
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tenants mit dieser Rolle:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>membership_role</TableHead>
                      <TableHead>app_role</TableHead>
                      <TableHead>Effektiv</TableHead>
                      <TableHead className="text-center">Ist-Tiles</TableHead>
                      <TableHead className="text-center">Soll-Tiles</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(tenantRoles)
                      .filter(([_, info]) => info.effectiveRole === selectedRole)
                      .map(([tenantId, info]) => {
                        const currentCount = activations.filter(a => a.tenant_id === tenantId && a.status === 'active').length;
                        const targetCount = getTilesForRole(selectedRole).length;
                        return (
                          <TableRow key={tenantId}>
                            <TableCell className="font-medium">{info.orgName}</TableCell>
                            <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{info.membershipRole}</code></TableCell>
                            <TableCell>{info.appRole ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{info.appRole}</code> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{info.effectiveRole}</Badge></TableCell>
                            <TableCell className="text-center">{currentCount}</TableCell>
                            <TableCell className="text-center">{targetCount}</TableCell>
                            <TableCell className="text-center">{currentCount === targetCount ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-destructive mx-auto" />}</TableCell>
                          </TableRow>
                        );
                      })}
                    {Object.entries(tenantRoles).filter(([_, info]) => info.effectiveRole === selectedRole).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Keine Tenants mit dieser Rolle gefunden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tenant debug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" />Tenant-Einzelansicht (Debug)</CardTitle>
          <CardDescription>Manuelle Tile-Steuerung für einzelne Tenants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedTenant} onValueChange={onSelectTenant}>
              <SelectTrigger className="w-80"><SelectValue placeholder="Tenant auswählen..." /></SelectTrigger>
              <SelectContent>
                {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedTenant && (
              <Button variant="outline" onClick={() => onActivateAll(selectedTenant)}>
                <Plus className="h-4 w-4 mr-2" />Alle aktivieren
              </Button>
            )}
          </div>

          {selectedTenant ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modul</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-24 text-center">Aktiv</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiles.map(tile => {
                  const isActive = isActivatedForTenant(tile.tile_code, selectedTenant);
                  return (
                    <TableRow key={tile.id}>
                      <TableCell><div className="flex items-center gap-2">{getIcon(tile.icon_key)}<span className="font-medium">{tile.title}</span></div></TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{tile.main_tile_route}</code></TableCell>
                      <TableCell className="text-center">{isActive ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                      <TableCell className="text-center"><Switch checked={isActive} onCheckedChange={() => onToggleTile(tile.tile_code, selectedTenant, isActive)} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Wähle einen Tenant aus, um Module manuell zu steuern</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

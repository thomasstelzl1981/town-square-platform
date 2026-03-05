/**
 * RolesManagement — Orchestrator
 * R-35: 419 → ~30 lines
 */
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RolesCatalogTab } from '@/components/admin/roles/RolesCatalogTab';
import { RolesMatrixTab } from '@/components/admin/roles/RolesMatrixTab';
import { RolesGovernanceTab } from '@/components/admin/roles/RolesGovernanceTab';

export default function RolesManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><Shield className="h-5 w-5 text-primary-foreground" /></div>
        <div><h1 className="text-2xl font-bold">Rollen & Berechtigungen</h1><p className="text-muted-foreground">Zentrale Übersicht — membership_role steuert Tile-Aktivierung, app_role steuert Zone-1-Zugang</p></div>
      </div>
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Rollen-Katalog</TabsTrigger>
          <TabsTrigger value="matrix">Modul-Rollen-Matrix</TabsTrigger>
          <TabsTrigger value="governance">Governance & Eröffnung</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog"><RolesCatalogTab /></TabsContent>
        <TabsContent value="matrix"><RolesMatrixTab /></TabsContent>
        <TabsContent value="governance"><RolesGovernanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * ArmstrongDataRoomSection — Full-page Datenraum for MOD-00
 * Section 3 of the Dashboard: Shows the Armstrong workspace file tree
 */
import { useAuth } from '@/contexts/AuthContext';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { Card } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

export function ArmstrongDataRoomSection() {
  const { activeTenantId } = useAuth();

  if (!activeTenantId) {
    return (
      <Card className="flex-1 flex items-center justify-center bg-card/80 backdrop-blur-sm border-border/40">
        <p className="text-sm text-muted-foreground">Kein Mandant aktiv</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col flex-1 overflow-hidden bg-card/80 backdrop-blur-sm border-border/40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2 shrink-0">
        <FolderOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/90">
          Armstrong Datenraum
        </h2>
      </div>

      {/* Tree */}
      <div className="flex-1 min-h-0">
        <EntityStorageTree
          tenantId={activeTenantId}
          entityType="armstrong_project"
          entityId={`armstrong_root_${activeTenantId}`}
          moduleCode="MOD_00"
        />
      </div>
    </Card>
  );
}

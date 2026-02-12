import { toast } from 'sonner';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { GitBranch, Plus } from 'lucide-react';

export default function SzenarienTile() {
  return (
    <ModuleTilePage
      title="Szenarien"
      description="Was-wäre-wenn-Analysen durchführen"
      icon={GitBranch}
      moduleBase="finanzanalyse"
      status="empty"
      emptyTitle="Keine Szenarien"
      emptyDescription="Erstellen Sie Szenarien, um verschiedene Optionen zu vergleichen."
      emptyIcon={GitBranch}
      primaryAction={{
        label: 'Szenario erstellen',
        icon: Plus,
        onClick: () => toast.info('Szenario-Editor wird vorbereitet…'),
      }}
    />
  );
}

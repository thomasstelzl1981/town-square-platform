import { toast } from 'sonner';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { FileBarChart, Plus } from 'lucide-react';

export default function ReportsTile() {
  return (
    <ModuleTilePage
      title="Reports"
      description="Finanzberichte generieren und exportieren"
      icon={FileBarChart}
      moduleBase="finanzanalyse"
      status="empty"
      emptyTitle="Keine Reports"
      emptyDescription="Erstellen Sie Ihren ersten Finanzbericht."
      emptyIcon={FileBarChart}
      primaryAction={{
        label: 'Report erstellen',
        icon: Plus,
        onClick: () => toast.info('Report-Generator wird vorbereitet…'),
      }}
    />
  );
}

import { toast } from 'sonner';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { LineChart, LayoutDashboard } from 'lucide-react';

export default function DashboardTile() {
  return (
    <ModuleTilePage
      title="Dashboard"
      description="Finanzielle Kennzahlen im Überblick"
      icon={LayoutDashboard}
      moduleBase="finanzanalyse"
      status="empty"
      emptyTitle="Keine Daten"
      emptyDescription="Fügen Sie Immobilien hinzu, um Finanzanalysen zu erstellen."
      emptyIcon={LineChart}
      primaryAction={{
        label: 'Analyse starten',
        icon: LineChart,
        onClick: () => toast.info('Finanzanalyse wird vorbereitet…'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/finanzanalyse',
      }}
    />
  );
}

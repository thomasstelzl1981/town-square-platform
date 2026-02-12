import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Settings } from 'lucide-react';

export default function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="Analyse-Einstellungen konfigurieren"
      icon={Settings}
      moduleBase="finanzanalyse"
      status="empty"
      emptyTitle="Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Analyse-Parameter."
      emptyIcon={Settings}
    />
  );
}

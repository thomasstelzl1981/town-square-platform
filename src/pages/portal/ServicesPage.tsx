/**
 * Services Page (MOD-16) - Blueprint Ready
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { WorkflowSubbar, SERVICES_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { ShoppingBag, FileQuestion, ClipboardList, Settings, Plus } from 'lucide-react';

function KatalogTile() {
  return (
    <ModuleTilePage
      title="Katalog"
      description="Verfügbare Services durchsuchen"
      icon={ShoppingBag}
      moduleBase="services"
      status="empty"
      emptyTitle="Service-Katalog"
      emptyDescription="Entdecken Sie unsere verfügbaren Services für Ihre Immobilien."
      emptyIcon={ShoppingBag}
      primaryAction={{
        label: 'Katalog ansehen',
        icon: ShoppingBag,
        onClick: () => console.log('Katalog'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/services',
      }}
    />
  );
}

function AnfragenTile() {
  return (
    <ModuleTilePage
      title="Anfragen"
      description="Ihre Service-Anfragen verwalten"
      icon={FileQuestion}
      moduleBase="services"
      status="empty"
      emptyTitle="Keine Anfragen"
      emptyDescription="Sie haben noch keine Service-Anfragen gestellt."
      emptyIcon={FileQuestion}
      primaryAction={{
        label: 'Service anfragen',
        icon: Plus,
        onClick: () => console.log('Anfrage'),
      }}
    />
  );
}

function AuftraegeTile() {
  return (
    <ModuleTilePage
      title="Aufträge"
      description="Laufende und abgeschlossene Aufträge"
      icon={ClipboardList}
      moduleBase="services"
      status="empty"
      emptyTitle="Keine Aufträge"
      emptyDescription="Stellen Sie eine Service-Anfrage, um einen Auftrag zu starten."
      emptyIcon={ClipboardList}
    />
  );
}

function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="Service-Einstellungen konfigurieren"
      icon={Settings}
      moduleBase="services"
      status="empty"
      emptyTitle="Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Service-Präferenzen."
      emptyIcon={Settings}
    />
  );
}

export default function ServicesPage() {
  const content = moduleContents['MOD-16'];

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={SERVICES_WORKFLOW_STEPS} moduleBase="services" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ModuleHowItWorks content={content} />} />
          <Route path="katalog" element={<KatalogTile />} />
          <Route path="anfragen" element={<AnfragenTile />} />
          <Route path="auftraege" element={<AuftraegeTile />} />
          <Route path="settings" element={<EinstellungenTile />} />
          <Route path="*" element={<Navigate to="/portal/services" replace />} />
        </Routes>
      </div>
    </div>
  );
}

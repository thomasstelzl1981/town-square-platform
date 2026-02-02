/**
 * Photovoltaik Page (MOD-19) - Blueprint Ready
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { WorkflowSubbar, PV_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { Sun, FileText, CheckSquare, FolderKanban, Settings, Plus } from 'lucide-react';

function AngebotTile() {
  return (
    <ModuleTilePage
      title="Angebot"
      description="PV-Angebot anfordern"
      icon={FileText}
      moduleBase="photovoltaik"
      status="empty"
      emptyTitle="Kein Angebot"
      emptyDescription="Fordern Sie ein individuelles Photovoltaik-Angebot für Ihre Immobilie an."
      emptyIcon={Sun}
      primaryAction={{
        label: 'Angebot anfordern',
        icon: Plus,
        onClick: () => console.log('Angebot'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/photovoltaik',
      }}
    />
  );
}

function ChecklisteTile() {
  return (
    <ModuleTilePage
      title="Checkliste"
      description="Voraussetzungen prüfen"
      icon={CheckSquare}
      moduleBase="photovoltaik"
      status="empty"
      emptyTitle="Checkliste"
      emptyDescription="Prüfen Sie die Voraussetzungen für Ihre PV-Anlage."
      emptyIcon={CheckSquare}
    />
  );
}

function ProjektTile() {
  return (
    <ModuleTilePage
      title="Projekt"
      description="Ihr PV-Projekt verfolgen"
      icon={FolderKanban}
      moduleBase="photovoltaik"
      status="empty"
      emptyTitle="Kein Projekt"
      emptyDescription="Sie haben noch kein aktives PV-Projekt."
      emptyIcon={FolderKanban}
    />
  );
}

function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="PV-Einstellungen"
      icon={Settings}
      moduleBase="photovoltaik"
      status="empty"
      emptyTitle="Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre PV-Präferenzen."
      emptyIcon={Settings}
    />
  );
}

export default function PhotovoltaikPage() {
  const content = moduleContents['MOD-19'];

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={PV_WORKFLOW_STEPS} moduleBase="photovoltaik" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ModuleHowItWorks content={content} />} />
          <Route path="angebot" element={<AngebotTile />} />
          <Route path="checkliste" element={<ChecklisteTile />} />
          <Route path="projekt" element={<ProjektTile />} />
          <Route path="settings" element={<EinstellungenTile />} />
          <Route path="*" element={<Navigate to="/portal/photovoltaik" replace />} />
        </Routes>
      </div>
    </div>
  );
}

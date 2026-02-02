/**
 * Akquise-Manager Page (MOD-12)
 * Blueprint-ready with EmptyState, Loading, Error patterns
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { WorkflowSubbar, AKQUISE_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { Briefcase, Users, FileText, Wrench, Plus } from 'lucide-react';

// Tile: Dashboard
function AkquiseDashboard() {
  return (
    <ModuleTilePage
      title="Dashboard"
      description="Übersicht Ihrer aktuellen Akquise-Aktivitäten"
      icon={Briefcase}
      moduleBase="akquise-manager"
      status="empty"
      emptyTitle="Keine aktiven Mandate"
      emptyDescription="Starten Sie Ihre erste Akquise-Aktivität um Kunden zu gewinnen."
      emptyIcon={Briefcase}
      primaryAction={{
        label: 'Neues Mandat starten',
        icon: Plus,
        onClick: () => console.log('Neues Mandat'),
      }}
      secondaryAction={{
        label: 'So funktioniert\'s',
        href: '/portal/akquise-manager',
      }}
    />
  );
}

// Tile: Kunden
function AkquiseKunden() {
  return (
    <ModuleTilePage
      title="Kunden"
      description="Verwalten Sie Ihre Kundenbeziehungen"
      icon={Users}
      moduleBase="akquise-manager"
      status="empty"
      emptyTitle="Keine Kunden"
      emptyDescription="Fügen Sie Ihren ersten Kunden hinzu, um mit der Betreuung zu beginnen."
      emptyIcon={Users}
      primaryAction={{
        label: 'Kunde hinzufügen',
        icon: Plus,
        onClick: () => console.log('Kunde hinzufügen'),
      }}
      secondaryAction={{
        label: 'So funktioniert\'s',
        href: '/portal/akquise-manager',
      }}
    />
  );
}

// Tile: Mandate
function AkquiseMandate() {
  return (
    <ModuleTilePage
      title="Mandate"
      description="Übersicht Ihrer laufenden Beratungsmandate"
      icon={FileText}
      moduleBase="akquise-manager"
      status="empty"
      emptyTitle="Keine Mandate"
      emptyDescription="Erstellen Sie Ihr erstes Mandat für einen Kunden."
      emptyIcon={FileText}
      primaryAction={{
        label: 'Mandat erstellen',
        icon: Plus,
        onClick: () => console.log('Mandat erstellen'),
      }}
      secondaryAction={{
        label: 'So funktioniert\'s',
        href: '/portal/akquise-manager',
      }}
    />
  );
}

// Tile: Tools
function AkquiseTools() {
  return (
    <ModuleTilePage
      title="Tools"
      description="Werkzeuge für Ihre Akquise-Arbeit"
      icon={Wrench}
      moduleBase="akquise-manager"
      status="empty"
      emptyTitle="Tools entdecken"
      emptyDescription="Nutzen Sie unsere Tools zur Unterstützung Ihrer Akquise."
      emptyIcon={Wrench}
      primaryAction={{
        label: 'Tools erkunden',
        onClick: () => console.log('Tools'),
      }}
      secondaryAction={{
        label: 'So funktioniert\'s',
        href: '/portal/akquise-manager',
      }}
    />
  );
}

export default function AkquiseManagerPage() {
  const content = moduleContents['MOD-12'];

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={AKQUISE_WORKFLOW_STEPS} moduleBase="akquise-manager" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ModuleHowItWorks content={content} />} />
          <Route path="dashboard" element={<AkquiseDashboard />} />
          <Route path="kunden" element={<AkquiseKunden />} />
          <Route path="mandate" element={<AkquiseMandate />} />
          <Route path="tools" element={<AkquiseTools />} />
          <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
        </Routes>
      </div>
    </div>
  );
}

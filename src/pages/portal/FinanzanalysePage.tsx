/**
 * Finanzanalyse Page (MOD-18) - Blueprint Ready
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { LineChart, LayoutDashboard, FileBarChart, GitBranch, Settings, Plus } from 'lucide-react';

function DashboardTile() {
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
        onClick: () => console.log('Analyse'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/finanzanalyse',
      }}
    />
  );
}

function ReportsTile() {
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
        onClick: () => console.log('Report'),
      }}
    />
  );
}

function SzenarienTile() {
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
        onClick: () => console.log('Szenario'),
      }}
    />
  );
}

function EinstellungenTile() {
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

export default function FinanzanalysePage() {
  const content = moduleContents['MOD-18'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="dashboard" element={<DashboardTile />} />
      <Route path="reports" element={<ReportsTile />} />
      <Route path="szenarien" element={<SzenarienTile />} />
      <Route path="settings" element={<EinstellungenTile />} />
      <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
    </Routes>
  );
}

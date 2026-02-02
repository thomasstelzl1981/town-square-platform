/**
 * Miety Portal Page (MOD-20) - Blueprint Ready
 * Exception: 6 tiles instead of 4 (renter portal)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { 
  Home, 
  FileText, 
  MessageCircle, 
  Gauge, 
  Zap, 
  Shield,
  Upload
} from 'lucide-react';

function UebersichtTile() {
  return (
    <ModuleTilePage
      title="Übersicht"
      description="Ihr Mieter-Dashboard"
      icon={Home}
      moduleBase="miety"
      status="empty"
      emptyTitle="Willkommen bei Miety"
      emptyDescription="Ihr zentraler Ort für alle Mieter-Angelegenheiten."
      emptyIcon={Home}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/miety',
      }}
    />
  );
}

function DokumenteTile() {
  return (
    <ModuleTilePage
      title="Dokumente"
      description="Mietvertrag und wichtige Dokumente"
      icon={FileText}
      moduleBase="miety"
      status="empty"
      emptyTitle="Keine Dokumente"
      emptyDescription="Ihr Vermieter hat noch keine Dokumente freigegeben."
      emptyIcon={FileText}
    />
  );
}

function KommunikationTile() {
  return (
    <ModuleTilePage
      title="Kommunikation"
      description="Nachrichten mit Ihrem Vermieter"
      icon={MessageCircle}
      moduleBase="miety"
      status="empty"
      emptyTitle="Keine Nachrichten"
      emptyDescription="Starten Sie eine Konversation mit Ihrem Vermieter."
      emptyIcon={MessageCircle}
      primaryAction={{
        label: 'Nachricht senden',
        icon: MessageCircle,
        onClick: () => console.log('Nachricht'),
      }}
    />
  );
}

function ZaehlerstaendeTile() {
  return (
    <ModuleTilePage
      title="Zählerstände"
      description="Zählerstände erfassen und einsehen"
      icon={Gauge}
      moduleBase="miety"
      status="empty"
      emptyTitle="Keine Zählerstände"
      emptyDescription="Erfassen Sie Ihre Zählerstände für die Nebenkostenabrechnung."
      emptyIcon={Gauge}
      primaryAction={{
        label: 'Zählerstand erfassen',
        icon: Upload,
        onClick: () => console.log('Zählerstand'),
      }}
    />
  );
}

function VersorgungTile() {
  return (
    <ModuleTilePage
      title="Versorgung"
      description="Strom, Gas, Wasser verwalten"
      icon={Zap}
      moduleBase="miety"
      status="empty"
      emptyTitle="Keine Versorgungsdaten"
      emptyDescription="Versorgungs-Informationen werden hier angezeigt."
      emptyIcon={Zap}
    />
  );
}

function VersicherungenTile() {
  return (
    <ModuleTilePage
      title="Versicherungen"
      description="Ihre Versicherungen im Überblick"
      icon={Shield}
      moduleBase="miety"
      status="empty"
      emptyTitle="Keine Versicherungen"
      emptyDescription="Verwalten Sie hier Ihre Hausrat- und Haftpflichtversicherung."
      emptyIcon={Shield}
    />
  );
}

export default function MietyPortalPage() {
  const content = moduleContents['MOD-20'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<UebersichtTile />} />
      <Route path="dokumente" element={<DokumenteTile />} />
      <Route path="kommunikation" element={<KommunikationTile />} />
      <Route path="zaehlerstaende" element={<ZaehlerstaendeTile />} />
      <Route path="versorgung" element={<VersorgungTile />} />
      <Route path="versicherungen" element={<VersicherungenTile />} />
      <Route path="*" element={<Navigate to="/portal/miety" replace />} />
    </Routes>
  );
}

/**
 * Fortbildung Page (MOD-15) - Blueprint Ready
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { BookOpen, GraduationCap, Award, Settings, Play } from 'lucide-react';

function KatalogTile() {
  return (
    <ModuleTilePage
      title="Katalog"
      description="Durchsuchen Sie verfügbare Fortbildungen"
      icon={BookOpen}
      moduleBase="fortbildung"
      status="empty"
      emptyTitle="Kurskatalog"
      emptyDescription="Entdecken Sie unsere Fortbildungsangebote und erweitern Sie Ihr Wissen."
      emptyIcon={BookOpen}
      primaryAction={{
        label: 'Katalog durchsuchen',
        icon: BookOpen,
        onClick: () => console.log('Katalog'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/fortbildung',
      }}
    />
  );
}

function MeineKurseTile() {
  return (
    <ModuleTilePage
      title="Meine Kurse"
      description="Ihre laufenden und abgeschlossenen Kurse"
      icon={GraduationCap}
      moduleBase="fortbildung"
      status="empty"
      emptyTitle="Keine Kurse"
      emptyDescription="Sie haben noch keine Kurse begonnen. Stöbern Sie im Katalog!"
      emptyIcon={GraduationCap}
      primaryAction={{
        label: 'Kurs starten',
        icon: Play,
        onClick: () => console.log('Kurs starten'),
      }}
    />
  );
}

function ZertifikateTile() {
  return (
    <ModuleTilePage
      title="Zertifikate"
      description="Ihre erworbenen Zertifikate"
      icon={Award}
      moduleBase="fortbildung"
      status="empty"
      emptyTitle="Keine Zertifikate"
      emptyDescription="Schließen Sie Kurse ab, um Zertifikate zu erhalten."
      emptyIcon={Award}
    />
  );
}

function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="Fortbildungs-Einstellungen verwalten"
      icon={Settings}
      moduleBase="fortbildung"
      status="empty"
      emptyTitle="Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Fortbildungs-Präferenzen."
      emptyIcon={Settings}
    />
  );
}

export default function FortbildungPage() {
  const content = moduleContents['MOD-15'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="katalog" element={<KatalogTile />} />
      <Route path="meine-kurse" element={<MeineKurseTile />} />
      <Route path="zertifikate" element={<ZertifikateTile />} />
      <Route path="settings" element={<EinstellungenTile />} />
      <Route path="*" element={<Navigate to="/portal/fortbildung" replace />} />
    </Routes>
  );
}

/**
 * Car-Management Page (MOD-17) - Blueprint Ready
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Car, LayoutGrid, Wrench, Settings, Plus } from 'lucide-react';

function UebersichtTile() {
  return (
    <ModuleTilePage
      title="Übersicht"
      description="Ihr Fuhrpark auf einen Blick"
      icon={LayoutGrid}
      moduleBase="cars"
      status="empty"
      emptyTitle="Keine Fahrzeuge"
      emptyDescription="Fügen Sie Ihr erstes Fahrzeug hinzu, um den Fuhrpark zu verwalten."
      emptyIcon={Car}
      primaryAction={{
        label: 'Fahrzeug hinzufügen',
        icon: Plus,
        onClick: () => console.log('Fahrzeug'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/cars',
      }}
    />
  );
}

function FahrzeugeTile() {
  return (
    <ModuleTilePage
      title="Fahrzeuge"
      description="Alle Fahrzeuge verwalten"
      icon={Car}
      moduleBase="cars"
      status="empty"
      emptyTitle="Keine Fahrzeuge"
      emptyDescription="Ihr Fuhrpark ist noch leer."
      emptyIcon={Car}
      primaryAction={{
        label: 'Fahrzeug hinzufügen',
        icon: Plus,
        onClick: () => console.log('Fahrzeug'),
      }}
    />
  );
}

function ServiceTile() {
  return (
    <ModuleTilePage
      title="Service"
      description="Wartungen und Termine"
      icon={Wrench}
      moduleBase="cars"
      status="empty"
      emptyTitle="Keine Termine"
      emptyDescription="Keine anstehenden Wartungstermine."
      emptyIcon={Wrench}
    />
  );
}

function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="Fuhrpark-Einstellungen"
      icon={Settings}
      moduleBase="cars"
      status="empty"
      emptyTitle="Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Fuhrpark-Einstellungen."
      emptyIcon={Settings}
    />
  );
}

export default function CarsPage() {
  const content = moduleContents['MOD-17'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<UebersichtTile />} />
      <Route path="fahrzeuge" element={<FahrzeugeTile />} />
      <Route path="service" element={<ServiceTile />} />
      <Route path="settings" element={<EinstellungenTile />} />
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}

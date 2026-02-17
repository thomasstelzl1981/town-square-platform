/**
 * SoT Energy — Energie transparent steuern
 */
import { Zap, Sun, Activity } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';

const blocks = [
  { icon: Zap, title: 'Energieverträge', description: 'Strom- und Gasverträge zentral verwalten. Laufzeiten, Tarife und Kündigungsfristen immer im Blick.' },
  { icon: Sun, title: 'Photovoltaik-Dashboard', description: 'Echtzeit-Monitoring Ihrer PV-Anlagen. Ertragsdaten, Eigenverbrauch und Einspeisevergütung transparent dargestellt.' },
  { icon: Activity, title: 'Verbrauchsmonitoring', description: 'Energieverbrauch analysieren und optimieren. Historische Daten, Trends und intelligente Einsparempfehlungen.' },
];

export default function SotEnergy() {
  return (
    <SotDetailPage
      title="Energy"
      subtitle="Verbrauch, Verträge und Photovoltaik transparent steuern."
      blocks={blocks}
    />
  );
}

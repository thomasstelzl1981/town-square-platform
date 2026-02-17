/**
 * SoT Finance — Private Finanzen
 */
import { Wallet, FileCheck, HeartPulse } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';

const blocks = [
  { icon: Wallet, title: 'Kontenübersicht', description: 'Girokonten, Depots und Sparkonten auf einen Blick. Automatische Synchronisation und Kategorisierung aller Transaktionen.' },
  { icon: FileCheck, title: 'Versicherungen & Verträge', description: 'Alle Policen und Verträge digital verwalten. Automatische Laufzeitüberwachung und Kündigungserinnerungen.' },
  { icon: HeartPulse, title: 'Vorsorge', description: 'Rentenübersicht, private Altersvorsorge und Vermögensplanung. Simulation verschiedener Szenarien für Ihre Zukunft.' },
];

export default function SotFinance() {
  return (
    <SotDetailPage
      title="Finance"
      subtitle="Private Finanzen transparent und digital."
      blocks={blocks}
    />
  );
}

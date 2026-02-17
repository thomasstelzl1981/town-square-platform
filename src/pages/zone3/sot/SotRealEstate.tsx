/**
 * SoT Real Estate — Immobilienportfolio
 */
import { Building2, FolderOpen, Database, BarChart3 } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';

const blocks = [
  { icon: Building2, title: 'Portfolio-Übersicht', description: 'Alle Immobilien auf einen Blick. Standort, Wertentwicklung, Mietrendite und Belegungsstatus in Echtzeit.' },
  { icon: FolderOpen, title: 'Objektakte', description: 'Digitale Akte für jedes Objekt. Verträge, Grundbuchauszüge, Fotos und Korrespondenz strukturiert abgelegt.' },
  { icon: Database, title: 'Datenraum', description: 'Sicherer Datenraum für Due Diligence, Verkaufsprozesse und Behördenkommunikation mit granularen Zugriffsrechten.' },
  { icon: BarChart3, title: 'Analyse', description: 'Wertentwicklung, Mietrendite und Cashflow-Prognosen. Vergleichen Sie Objekte und treffen Sie fundierte Entscheidungen.' },
];

export default function SotRealEstate() {
  return (
    <SotDetailPage
      title="Real Estate"
      subtitle="Ihr Immobilienportfolio im Griff."
      blocks={blocks}
    />
  );
}

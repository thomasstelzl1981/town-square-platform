/**
 * SoT Karriere — Partner werden
 */
import { Handshake, Users, ArrowRight } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';

const blocks = [
  { icon: Handshake, title: 'Warum Partner werden?', description: 'Profitieren Sie von einer etablierten Plattform, digitalen Prozessen und einem wachsenden Ökosystem für Immobilien und Finanzen.' },
  { icon: Users, title: 'Wer kann Partner werden?', description: 'Immobilienmakler, Finanzberater und Dienstleister — wir bieten maßgeschneiderte Partnerprogramme für verschiedene Branchen.' },
  { icon: ArrowRight, title: 'Nächste Schritte', description: 'Registrieren Sie sich, durchlaufen Sie den Onboarding-Prozess und starten Sie innerhalb weniger Tage mit Ihrem eigenen Portal.' },
];

export default function SotKarriere() {
  return (
    <SotDetailPage
      title="Career"
      subtitle="Wachsen Sie mit uns."
      blocks={blocks}
    />
  );
}

/**
 * SoT Management — KI-gestützte Organisation
 */
import { Brain, Mail, FileText, Workflow } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';

const blocks = [
  { icon: Brain, title: 'Aufgabenmanagement', description: 'KI-gesteuerte Aufgabenverteilung und Nachverfolgung. Automatische Priorisierung und Erinnerungen für alle Prozesse.' },
  { icon: Mail, title: 'E-Mail-Integration', description: 'Verbinden Sie Ihre E-Mail-Konten und verwalten Sie alle Kommunikation zentral. KI-Klassifizierung und automatische Zuordnung.' },
  { icon: FileText, title: 'Dokumentenverwaltung', description: 'Strukturierter Datenraum mit intelligenter Ablage. OCR-Erkennung und automatische Verschlagwortung aller Dokumente.' },
  { icon: Workflow, title: 'Automatisierung', description: 'Wiederkehrende Prozesse automatisieren. Von der Vertragswarnung bis zur Nebenkostenabrechnung — alles regelbasiert.' },
];

export default function SotManagement() {
  return (
    <SotDetailPage
      title="Management"
      subtitle="KI-gestützte Organisation für Ihren Alltag."
      blocks={blocks}
    />
  );
}

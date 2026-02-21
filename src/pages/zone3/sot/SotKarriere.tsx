/**
 * SoT Karriere — Partner werden (Hub für alle Manager-Rollen)
 */
import { Handshake, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SotDetailPage } from '@/components/zone3/sot/SotDetailPage';
import { ManagerApplicationForm } from '@/components/zone3/shared/ManagerApplicationForm';

const blocks = [
  { icon: Handshake, title: 'Warum Partner werden?', description: 'Profitieren Sie von einer etablierten Plattform, digitalen Prozessen und einem wachsenden Ökosystem für Immobilien und Finanzen.' },
  { icon: Users, title: 'Wer kann Partner werden?', description: 'Immobilienmakler, Finanzberater und Dienstleister — wir bieten maßgeschneiderte Partnerprogramme für verschiedene Branchen.' },
  { icon: ArrowRight, title: 'Nächste Schritte', description: 'Füllen Sie unten das Bewerbungsformular aus. Wir prüfen Ihre Qualifikation und melden uns innerhalb von 48 Stunden.' },
];

const roleOptions = [
  { value: 'sales_partner', label: 'Vertriebspartner (Immobilien)' },
  { value: 'finance_manager', label: 'Finanzierungsmanager' },
  { value: 'akquise_manager', label: 'Akquise-Manager' },
  { value: 'project_manager', label: 'Projektmanager' },
];

export default function SotKarriere() {
  return (
    <div>
      <SotDetailPage
        title="Career"
        subtitle="Wachsen Sie mit uns."
        blocks={blocks}
      />

      {/* Application Form Section */}
      <section id="bewerbungsformular" className="max-w-2xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold mb-2 text-center">Bewerbung</h2>
        <p className="text-muted-foreground text-center mb-8">
          Wählen Sie Ihre gewünschte Rolle und senden Sie uns Ihre Bewerbung.
        </p>
        <ManagerApplicationForm
          brand="sot"
          requestedRoles={['sales_partner']}
          roleSelector={roleOptions}
        />
      </section>
    </div>
  );
}

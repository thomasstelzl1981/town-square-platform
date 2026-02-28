/**
 * FutureRoomKarriere — Finanzierungsmanager Recruiting Page
 * 
 * Fokus: Rolle im System, fertiges Tooling, Orchestrierung
 * Keine klassische Vermittlung, sondern Systemarbeit
 */
import { 
  ChevronRight, Users, Building2, 
  FolderCheck, Workflow, Laptop, ShieldCheck, 
  CheckCircle2,
} from 'lucide-react';
import { ManagerApplicationForm } from '@/components/zone3/shared/ManagerApplicationForm';
import type { QualificationField } from '@/components/zone3/shared/ManagerApplicationForm';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const ACCENT = 'hsl(165, 70%, 36%)';

const qualificationFields: QualificationField[] = [
  {
    key: 'has_34i',
    label: '§34i GewO Zulassung',
    type: 'select',
    required: true,
    options: [
      { value: 'yes', label: 'Ja, vorhanden' },
      { value: 'in_progress', label: 'In Beantragung' },
      { value: 'no', label: 'Nein, nicht vorhanden' },
    ],
  },
  {
    key: 'experience',
    label: 'Erfahrung in der Baufinanzierung',
    type: 'select',
    options: [
      { value: 'none', label: 'Keine / Quereinsteiger' },
      { value: '1-3', label: '1–3 Jahre' },
      { value: '3-5', label: '3–5 Jahre' },
      { value: '5+', label: 'Mehr als 5 Jahre' },
    ],
  },
];

export default function FutureRoomKarriere() {
  const benefits = [
    { icon: <FolderCheck className="h-6 w-6" />, title: 'Fertige Finanzierungsordner', description: 'Übernehmen Sie Fälle mit vollständig aufbereiteten Unterlagen — Selbstauskunft, Dokumente, alles geprüft.' },
    { icon: <Building2 className="h-6 w-6" />, title: 'Direkter Bankzugang', description: 'Arbeiten Sie in unserem System mit direkten Schnittstellen zu über 400 Bankpartnern.' },
    { icon: <Laptop className="h-6 w-6" />, title: 'Modernes Tooling', description: 'Unser Portal unterstützt Sie bei Einreichung, Tracking und Kommunikation — alles an einem Ort.' },
    { icon: <Workflow className="h-6 w-6" />, title: 'Orchestrierte Prozesse', description: 'Keine Medienbrüche. Von der Anfrage bis zur Auszahlung — durchgängig digital.' },
  ];

  const roleDetails = [
    { title: 'Was Sie tun', items: ['Finanzierungsfälle aus dem FutureRoom-System übernehmen', 'Bankfertige Unterlagen bei passenden Instituten einreichen', 'Kunden während des Prozesses begleiten und beraten', 'Status und Fortschritt im Portal dokumentieren'] },
    { title: 'Was Sie bekommen', items: ['Fälle mit vollständig aufbereiteten Unterlagen', 'KI-gestützte Unterstützung bei der Bankauswahl', 'Transparentes Provisionsmodell', 'Flexibles Arbeiten — Sie entscheiden, welche Fälle Sie übernehmen'] },
  ];

  const requirements = [
    'IHK-Zulassung als Immobiliardarlehensvermittler (§34i GewO)',
    'Erfahrung in der Baufinanzierung oder Bereitschaft zur Einarbeitung',
    'Affinität zu digitalen Tools und Prozessen',
    'Kundenorientierte, eigenständige Arbeitsweise',
  ];

  const scrollToForm = () => {
    document.getElementById('bewerbungsformular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <SEOHead
        brand="futureroom"
        page={{
          title: 'Finanzierungsmanager werden — Karriere',
          description: 'Werden Sie Finanzierungsmanager bei FutureRoom. Fertiges Tooling, vorbereitete Bankzugänge und digitale Orchestrierung. §34i GewO.',
          path: '/karriere',
        }}
      />
      {/* Hero */}
      <section className="fr-hero">
        <div className="fr-hero-content">
          <div className="fr-hero-badge">
            <Users className="h-4 w-4" />
            Karriere bei FutureRoom
          </div>
          <h1 className="fr-hero-title">
            Werden Sie{' '}
            <span className="highlight">Finanzierungsmanager</span>
          </h1>
          <p className="fr-hero-subtitle">
            Übernehmen Sie vorbereitete Finanzierungsfälle aus unserem System. 
            Profitieren Sie von fertigen Unterlagen, direkten Bankzugängen und modernem Tooling.
          </p>
          <button onClick={scrollToForm} className="fr-btn fr-btn-primary text-lg">
            Jetzt bewerben
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Ihre Vorteile</h2>
          <p className="fr-section-subtitle">
            Als Finanzierungsmanager bei FutureRoom arbeiten Sie nicht wie bei klassischen Vermittlern.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="fr-card">
              <div className="fr-card-icon">{benefit.icon}</div>
              <h3 className="fr-card-title">{benefit.title}</h3>
              <p className="fr-card-text">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Details */}
      <section className="fr-process">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Die Rolle im Detail</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {roleDetails.map((section, index) => (
            <div key={index} className="fr-card">
              <h3 className="text-lg font-bold mb-4" style={{ color: ACCENT }}>{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* System Preview */}
      <section className="fr-section">
        <div className="fr-card" style={{ background: 'linear-gradient(135deg, hsl(210 35% 8%) 0%, hsl(210 30% 15%) 100%)', borderColor: 'transparent' }}>
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold text-white mb-4">Arbeiten im FutureRoom-System</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Unser Portal bietet Ihnen alles, was Sie brauchen: Fallübersicht, Dokumenten-Viewer, 
              Bank-Schnittstellen, Kundenkommunikation und Status-Tracking — integriert und effizient.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['📋 Fallmanagement', '📁 Dokumente', '🏦 Bankzugang', '💬 Kommunikation', '📊 Reporting'].map(tag => (
                <div key={tag} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">{tag}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="fr-process">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Anforderungen</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="fr-card">
            <ul className="space-y-4">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}1a` }}>
                    <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} />
                  </div>
                  <span className="text-gray-700 pt-1">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="bewerbungsformular" className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Bewerbungsformular</h2>
          <p className="fr-section-subtitle">
            Füllen Sie das Formular aus — wir melden uns innerhalb von 48 Stunden.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <ManagerApplicationForm
            brand="futureroom"
            requestedRoles={['finance_manager']}
            qualificationFields={qualificationFields}
            accentColor={ACCENT}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="fr-cta">
        <div className="fr-cta-content">
          <h2 className="fr-cta-title">Bereit für den nächsten Schritt?</h2>
          <p className="fr-cta-text">
            Bewerben Sie sich als Finanzierungsmanager und werden Sie Teil des FutureRoom-Netzwerks.
          </p>
          <button onClick={scrollToForm} className="fr-btn fr-btn-primary">
            Bewerbung starten
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

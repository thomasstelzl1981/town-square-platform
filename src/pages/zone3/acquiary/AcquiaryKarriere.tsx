/**
 * AcquiaryKarriere — Akquisemanager Recruiting Page
 */
import {
  ChevronRight, MapPin, Euro, Laptop, Clock,
  TrendingUp, Users, Award, CheckCircle
} from 'lucide-react';
import { ManagerApplicationForm } from '@/components/zone3/shared/ManagerApplicationForm';
import type { QualificationField } from '@/components/zone3/shared/ManagerApplicationForm';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const qualificationFields: QualificationField[] = [
  {
    key: 'immobilien_erfahrung',
    label: 'Erfahrung im Immobilienmarkt',
    type: 'select',
    required: true,
    options: [
      { value: 'makler', label: 'Makler' },
      { value: 'verwalter', label: 'Verwalter' },
      { value: 'projektentwickler', label: 'Projektentwickler' },
      { value: 'sonstige', label: 'Sonstige Erfahrung' },
      { value: 'keine', label: 'Quereinsteiger' },
    ],
  },
  {
    key: 'region',
    label: 'Regionales Netzwerk / Region',
    type: 'text',
    required: true,
    placeholder: 'z.B. München, Rhein-Main, Hamburg',
  },
];

export default function AcquiaryKarriere() {
  const scrollToForm = () => {
    document.getElementById('bewerbungsformular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead
        brand="acquiary"
        page={{
          title: 'Karriere — Akquisemanager werden',
          description: 'Werden Sie Akquisemanager bei ACQUIARY. Ortsunabhängig arbeiten, attraktive Provisionen und Zugang zu einem exklusiven Investorennetzwerk.',
          path: '/karriere',
        }}
      />
      {/* Hero */}
      <section className="aq-hero" style={{ padding: '6rem 1.5rem 7rem' }}>
        <div className="aq-hero-content">
          <span className="aq-hero-eyebrow">Karriere</span>
          <h1 className="aq-hero-title">
            Akquisemanager<br />werden.
          </h1>
          <p className="aq-hero-subtitle">
            Werden Sie Teil unseres Netzwerks und akquirieren Sie Immobilien — 
            selbstständig, leistungsbasiert und mit modernster Technologie.
          </p>
          <button className="aq-btn aq-btn-primary" onClick={scrollToForm}>
            Jetzt bewerben
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Was Sie tun */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Ihre Aufgabe</div>
          <h2 className="aq-section-title">Was Sie als Akquisemanager tun</h2>
        </div>
        <div className="aq-grid-3">
          {[
            { icon: MapPin, title: 'Objekte identifizieren', text: 'Sie nutzen Ihre lokalen Kontakte und Ihr Marktwissen, um passende Investmentobjekte zu finden — off-market und diskret.' },
            { icon: Users, title: 'Kontakte pflegen', text: 'Sie bauen langfristige Beziehungen zu Eigentümern, Verwaltern und lokalen Marktteilnehmern auf.' },
            { icon: Laptop, title: 'Digital arbeiten', text: 'Unsere Plattform liefert Ihnen Mandate, Analysewerkzeuge und ein CRM — alles an einem Ort.' },
          ].map((item) => (
            <div key={item.title} className="aq-card">
              <div className="aq-card-icon"><item.icon className="h-5 w-5" /></div>
              <h3 className="aq-card-title">{item.title}</h3>
              <p className="aq-card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Was Sie bekommen */}
      <div className="aq-section-alt">
        <section className="aq-section">
          <div className="aq-section-header">
            <div className="aq-section-eyebrow">Ihre Vorteile</div>
            <h2 className="aq-section-title">Was Sie bekommen</h2>
          </div>
          <div className="aq-grid-4">
            {[
              { icon: Euro, title: 'Faire Provision', text: 'Transparente Provisionsteilung bei jeder erfolgreichen Transaktion.' },
              { icon: Clock, title: 'Flexibilität', text: 'Arbeiten Sie wann und wo Sie wollen — als selbstständiger Partner.' },
              { icon: TrendingUp, title: 'Technologie', text: 'KI-Analysewerkzeuge, Mandantenportal und digitales CRM inklusive.' },
              { icon: Award, title: 'Exklusivität', text: 'Zugang zu institutionellen Mandaten, die dem freien Markt nicht zugänglich sind.' },
            ].map((item) => (
              <div key={item.title} className="aq-card">
                <div className="aq-card-icon"><item.icon className="h-5 w-5" /></div>
                <h3 className="aq-card-title">{item.title}</h3>
                <p className="aq-card-text">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Wen wir suchen */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Profil</div>
          <h2 className="aq-section-title">Wen wir suchen</h2>
        </div>
        <div className="max-w-[640px] mx-auto">
          <div className="aq-card">
            <ul className="space-y-4">
              {[
                'Erfahrung im Immobilienmarkt (Makler, Verwalter, Projektentwickler)',
                'Regionales Netzwerk und lokale Marktkenntnis',
                'Selbstständige Arbeitsweise und unternehmerisches Denken',
                'Affinität für digitale Werkzeuge und Prozesse',
                'Diskretion und Professionalität im Umgang mit institutionellen Mandanten',
              ].map((req) => (
                <li key={req} className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'hsl(207 90% 54%)' }} />
                  <span className="aq-card-text">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="bewerbungsformular" className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Bewerbung</div>
          <h2 className="aq-section-title">Jetzt bewerben</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <ManagerApplicationForm
            brand="acquiary"
            requestedRoles={['akquise_manager']}
            qualificationFields={qualificationFields}
            accentColor="hsl(207, 90%, 54%)"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="aq-cta">
        <div className="aq-cta-content">
          <h2 className="aq-cta-title">Bereit für den nächsten Schritt?</h2>
          <p className="aq-cta-text">
            Bewerben Sie sich als Akquisemanager und werden Sie Teil 
            eines wachsenden Netzwerks.
          </p>
          <button className="aq-btn aq-btn-primary" onClick={scrollToForm}>
            Jetzt bewerben
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );
}

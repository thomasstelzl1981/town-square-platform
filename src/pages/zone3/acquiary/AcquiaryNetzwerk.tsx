/**
 * AcquiaryNetzwerk — Consolidated: Zusammenarbeit + Partnerkreis
 */
import { Link } from 'react-router-dom';
import {
  ChevronRight, Users, Building2, Briefcase, Globe,
  UserCheck, Shield, Handshake
} from 'lucide-react';

export default function AcquiaryNetzwerk() {
  return (
    <>
      {/* Hero */}
      <section className="aq-hero" style={{ padding: '6rem 1.5rem 7rem' }}>
        <div className="aq-hero-content">
          <span className="aq-hero-eyebrow">Netzwerk & Partner</span>
          <h1 className="aq-hero-title">
            Zugang durch<br />Vertrauen.
          </h1>
          <p className="aq-hero-subtitle">
            Unser Netzwerk aus erfahrenen Akquisemanagern und Branchenpartnern 
            schafft Off-Market-Zugang in ganz Deutschland.
          </p>
        </div>
      </section>

      {/* Kooperationsmodell */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Kooperation</div>
          <h2 className="aq-section-title">So arbeiten wir zusammen</h2>
          <p className="aq-section-subtitle">
            ACQUIARY agiert als zentraler Knotenpunkt zwischen Mandanten, Akquisemanagern 
            und dem Markt — transparent, provisionsklar und digital dokumentiert.
          </p>
        </div>
        <div className="aq-grid-3">
          {[
            { icon: Briefcase, title: 'Mandanten', text: 'Family Offices, institutionelle Investoren und Bestandshalter definieren ihre Suchkriterien. ACQUIARY orchestriert die Akquise.' },
            { icon: Users, title: 'Akquisemanager', text: 'Selbstständige Marktkenner vor Ort identifizieren und qualifizieren Objekte. Leistungsbasierte Vergütung, faire Provisionsteilung.' },
            { icon: Handshake, title: 'ACQUIARY', text: 'Plattform, Technologie und Prozesssteuerung. Wir verbinden Angebot und Nachfrage — digital, schnell und vertraulich.' },
          ].map((item) => (
            <div key={item.title} className="aq-card">
              <div className="aq-card-icon"><item.icon className="h-5 w-5" /></div>
              <h3 className="aq-card-title">{item.title}</h3>
              <p className="aq-card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partnerkreis */}
      <div className="aq-section-alt">
        <section className="aq-section">
          <div className="aq-section-header">
            <div className="aq-section-eyebrow">Partnerkreis</div>
            <h2 className="aq-section-title">Wer in unserem Netzwerk ist</h2>
          </div>
          <div className="aq-grid-4">
            {[
              { icon: Building2, title: 'Makler', text: 'Regionale und überregionale Immobilienmakler mit off-market Zugang.' },
              { icon: UserCheck, title: 'Akquisemanager', text: 'Selbstständige Sourcing-Spezialisten mit lokalem Marktwissen.' },
              { icon: Globe, title: 'Institutionelle', text: 'Family Offices, Versicherungen, Pensionskassen als Ankäufer.' },
              { icon: Shield, title: 'Berater', text: 'Steuerberater, Anwälte und Gutachter für die Transaktionsbegleitung.' },
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

      {/* Stats */}
      <div className="aq-stats">
        <div className="aq-stat">
          <div className="aq-stat-value">380+</div>
          <div className="aq-stat-label">Netzwerk-Partner</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">42</div>
          <div className="aq-stat-label">Regionen</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">120+</div>
          <div className="aq-stat-label">Akquisemanager</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">85%</div>
          <div className="aq-stat-label">Off-Market Anteil</div>
        </div>
      </div>

      {/* CTA */}
      <section className="aq-cta">
        <div className="aq-cta-content">
          <h2 className="aq-cta-title">Teil des Netzwerks werden</h2>
          <p className="aq-cta-text">
            Sie sind Makler, Akquise-Spezialist oder institutioneller Investor? 
            Wir freuen uns auf Ihre Kontaktaufnahme.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/acquiary/karriere">
              <button className="aq-btn aq-btn-primary">
                Als Akquisemanager bewerben
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/acquiary/objekt">
              <button className="aq-btn aq-btn-ghost">
                Objekt anbieten
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * AcquiaryHome — Landing Page
 * Investment-House Hero + Compact Process + Stats + CTA
 */
import { Link } from 'react-router-dom';
import { ChevronRight, Search, BarChart3, Handshake, Brain } from 'lucide-react';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function AcquiaryHome() {
  return (
    <>
      <SEOHead
        brand="acquiary"
        page={{
          title: 'Institutionelle Immobilienakquise — KI-gestützt',
          description: 'ACQUIARY verbindet KI-gestützte Marktanalyse mit einem exklusiven Netzwerk erfahrener Akquisemanager für systematische und vertrauliche Objektbeschaffung.',
          path: '/',
        }}
      />
      {/* Hero */}
      <section className="aq-hero">
        <div className="aq-hero-content">
          <span className="aq-hero-eyebrow">Institutionelle Immobilienakquise</span>
          <h1 className="aq-hero-title">
            Präzise Analyse.<br />
            Diskrete Akquise.
          </h1>
          <p className="aq-hero-subtitle">
            ACQUIARY verbindet KI-gestützte Marktanalyse mit einem exklusiven Netzwerk 
            erfahrener Akquisemanager — für eine systematische und vertrauliche Objektbeschaffung.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/acquiary/objekt">
              <button className="aq-btn aq-btn-primary">
                Objekt anbieten
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/acquiary/methodik">
              <button className="aq-btn aq-btn-ghost">
                Methodik entdecken
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="aq-stats">
        <div className="aq-stat">
          <div className="aq-stat-value">2.400+</div>
          <div className="aq-stat-label">Analysierte Objekte</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">380</div>
          <div className="aq-stat-label">Netzwerk-Partner</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">94%</div>
          <div className="aq-stat-label">Trefferquote</div>
        </div>
        <div className="aq-stat">
          <div className="aq-stat-value">&lt;48h</div>
          <div className="aq-stat-label">Erstanalyse</div>
        </div>
      </div>

      {/* Compact Process */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Prozess</div>
          <h2 className="aq-section-title">Drei Schritte zur Transaktion</h2>
          <p className="aq-section-subtitle">
            Vom Objekteingang bis zur Mandantenvorlage — vollständig digital, 
            NDA-geschützt und in unter 48 Stunden.
          </p>
        </div>
        <div className="aq-process-grid">
          <div className="aq-process-step">
            <div className="aq-process-number">SCHRITT 01</div>
            <h3 className="aq-process-title">Objekt-Identifikation</h3>
            <p className="aq-process-text">
              Unser Netzwerk aus Akquisemanagern identifiziert passende 
              Objekte — off-market und diskret.
            </p>
          </div>
          <div className="aq-process-step">
            <div className="aq-process-number">SCHRITT 02</div>
            <h3 className="aq-process-title">KI-Analyse</h3>
            <p className="aq-process-text">
              Automatisierte Renditeberechnung, Standortanalyse und 
              Risikoeinschätzung in Minuten statt Tagen.
            </p>
          </div>
          <div className="aq-process-step">
            <div className="aq-process-number">SCHRITT 03</div>
            <h3 className="aq-process-title">Mandantenvorlage</h3>
            <p className="aq-process-text">
              Aufbereitete Entscheidungsvorlage im Mandantenportal — 
              mit allen relevanten Kennzahlen.
            </p>
          </div>
        </div>
      </section>

      {/* USP Cards */}
      <div className="aq-section-alt">
        <section className="aq-section">
          <div className="aq-section-header">
            <div className="aq-section-eyebrow">Warum ACQUIARY</div>
            <h2 className="aq-section-title">Technologie trifft Expertise</h2>
          </div>
          <div className="aq-grid-4">
            {[
              { icon: Search, title: 'Off-Market Zugang', text: 'Exklusiver Zugang zu nicht-öffentlichen Objekten durch unser deutschlandweites Netzwerk.' },
              { icon: Brain, title: 'KI-Analyse', text: 'Automatisierte Bewertung und Renditeberechnung reduziert die Analysezeit um 85%.' },
              { icon: BarChart3, title: 'Mandantenportal', text: 'Digitaler Datenraum mit strukturierten Entscheidungsvorlagen für Ihre Ankaufskomitees.' },
              { icon: Handshake, title: 'Diskret & NDA', text: 'Höchste Vertraulichkeit bei jeder Transaktion. NDA-geschützte Prozesse ab Tag eins.' },
            ].map((usp) => (
              <div key={usp.title} className="aq-card">
                <div className="aq-card-icon">
                  <usp.icon className="h-5 w-5" />
                </div>
                <h3 className="aq-card-title">{usp.title}</h3>
                <p className="aq-card-text">{usp.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="aq-cta">
        <div className="aq-cta-content">
          <h2 className="aq-cta-title">Sie haben ein Objekt?</h2>
          <p className="aq-cta-text">
            Reichen Sie Ihr Objekt vertraulich ein. Unsere Analyse erhalten Sie 
            innerhalb von 48 Stunden — kostenfrei und unverbindlich.
          </p>
          <Link to="/acquiary/objekt">
            <button className="aq-btn aq-btn-primary">
              Objekt anbieten
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}

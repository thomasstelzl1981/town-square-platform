/**
 * AcquiaryMethodik — Consolidated: Methodik + So funktioniert's + Leistungen + Portal/KI
 */
import { Link } from 'react-router-dom';
import {
  ChevronRight, Brain, FileSearch, BarChart3, Shield,
  Zap, Target, TrendingUp, MonitorSmartphone, Lock, Database
} from 'lucide-react';

export default function AcquiaryMethodik() {
  return (
    <>
      {/* Hero */}
      <section className="aq-hero" style={{ padding: '6rem 1.5rem 7rem' }}>
        <div className="aq-hero-content">
          <span className="aq-hero-eyebrow">Methodik & Technologie</span>
          <h1 className="aq-hero-title">
            Systematisch.<br />Technologiegestützt.
          </h1>
          <p className="aq-hero-subtitle">
            Unsere Methodik verbindet algorithmische Marktanalyse mit der 
            Erfahrung und dem Zugang lokaler Akquise-Experten.
          </p>
        </div>
      </section>

      {/* Section 1: Methodik-Grundlagen */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Grundlagen</div>
          <h2 className="aq-section-title">Der ACQUIARY-Ansatz</h2>
          <p className="aq-section-subtitle">
            Drei Säulen bilden das Fundament unserer Akquise-Methodik — 
            jede einzelne optimiert für Geschwindigkeit und Präzision.
          </p>
        </div>
        <div className="aq-grid-3">
          {[
            { icon: Target, title: 'Mandatsbasiert', text: 'Jeder Ankaufsprozess beginnt mit einem klar definierten Suchmandat — Assetklasse, Region, Renditeerwartung, Volumen.' },
            { icon: Brain, title: 'KI-First', text: 'Unsere Engine analysiert eingehende Objekte in Minuten: Renditeberechnung, Standortscoring, Risikoklassifikation.' },
            { icon: Shield, title: 'Compliance-Ready', text: 'NDA-geschützte Prozesse, DSGVO-konforme Datenverarbeitung, strukturierte Audit-Trails für jede Transaktion.' },
          ].map((item) => (
            <div key={item.title} className="aq-card">
              <div className="aq-card-icon"><item.icon className="h-5 w-5" /></div>
              <h3 className="aq-card-title">{item.title}</h3>
              <p className="aq-card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: 3-Schritt-Prozess */}
      <div className="aq-section-alt">
        <section className="aq-section">
          <div className="aq-section-header">
            <div className="aq-section-eyebrow">Prozess</div>
            <h2 className="aq-section-title">So funktioniert's</h2>
          </div>
          <div className="aq-process-grid">
            {[
              { step: '01', title: 'Objekteingang', text: 'Objekte erreichen uns über unser Akquisemanager-Netzwerk, direkte Einreichungen oder automatisierte Marktscans.' },
              { step: '02', title: 'Analyse & Bewertung', text: 'Die KI-Engine extrahiert relevante Daten, berechnet Kennzahlen und erstellt ein standardisiertes Analyseprofil.' },
              { step: '03', title: 'Entscheidungsvorlage', text: 'Das Ergebnis wird als strukturierte Vorlage im Mandantenportal bereitgestellt — ready für das Ankaufskomitee.' },
            ].map((s) => (
              <div key={s.step} className="aq-process-step">
                <div className="aq-process-number">SCHRITT {s.step}</div>
                <h3 className="aq-process-title">{s.title}</h3>
                <p className="aq-process-text">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section 3: Leistungskatalog */}
      <section className="aq-section">
        <div className="aq-section-header">
          <div className="aq-section-eyebrow">Leistungen</div>
          <h2 className="aq-section-title">Was wir liefern</h2>
        </div>
        <div className="aq-grid-3">
          {[
            { icon: FileSearch, title: 'Objektrecherche', text: 'Aktive Suche und Identifikation passender Objekte über unser deutschlandweites Netzwerk.' },
            { icon: BarChart3, title: 'Renditeanalyse', text: 'Vollständige Bestandsrechnung und Aufteilungsrechnung mit 30-Jahres-Cashflow-Projektion.' },
            { icon: Zap, title: 'Datenextraktion', text: 'Automatische Extraktion aller relevanten Kennzahlen aus Exposés, Gutachten und Wirtschaftlichkeitsberechnungen.' },
            { icon: TrendingUp, title: 'Standortscoring', text: 'KI-basierte Bewertung von Mikro- und Makrolage mit über 200 Datenpunkten.' },
            { icon: Database, title: 'Datenraum', text: 'Strukturierter digitaler Datenraum für die sichere Ablage und den Austausch von Transaktionsdokumenten.' },
            { icon: Lock, title: 'Due Diligence Support', text: 'Unterstützung bei der technischen und kaufmännischen Prüfung durch standardisierte Checklisten.' },
          ].map((item) => (
            <div key={item.title} className="aq-card">
              <div className="aq-card-icon"><item.icon className="h-5 w-5" /></div>
              <h3 className="aq-card-title">{item.title}</h3>
              <p className="aq-card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Portal & KI */}
      <div className="aq-section-alt">
        <section className="aq-section">
          <div className="aq-section-header">
            <div className="aq-section-eyebrow">Technologie</div>
            <h2 className="aq-section-title">Mandantenportal & KI-Engine</h2>
            <p className="aq-section-subtitle">
              Ihr digitaler Zugang zu allen Analysen, Objekten und Transaktionsdaten — 
              in Echtzeit, sicher und übersichtlich.
            </p>
          </div>
          <div className="aq-grid-2">
            <div className="aq-card">
              <div className="aq-card-icon"><MonitorSmartphone className="h-5 w-5" /></div>
              <h3 className="aq-card-title">Mandantenportal</h3>
              <p className="aq-card-text">
                Zentrale Übersicht über alle laufenden Mandate, eingegangene Objekte, 
                Analyseergebnisse und den Status jeder Transaktion. Zugriffssteuerung 
                auf Projektebene für Ihr Team.
              </p>
            </div>
            <div className="aq-card">
              <div className="aq-card-icon"><Brain className="h-5 w-5" /></div>
              <h3 className="aq-card-title">KI-Analyse-Engine</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'hsl(207 90% 54% / 0.1)', color: 'hsl(207 90% 54%)' }}>Gemini 2.5 Pro</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'hsl(207 90% 54% / 0.1)', color: 'hsl(207 90% 54%)' }}>GPT-5</span>
              </div>
              <p className="aq-card-text">
                32.000 Token Context — liest komplette Datenräume und Exposés. 
                Automatische Extraktion aller Kennzahlen, Hold- und Flip-Kalkulationen 
                in Sekunden. Multi-Dokument-Analyse für Due-Diligence-Pakete.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="aq-cta">
        <div className="aq-cta-content">
          <h2 className="aq-cta-title">Mandat besprechen</h2>
          <p className="aq-cta-text">
            Lassen Sie uns Ihre Ankaufskriterien besprechen. 
            Vertraulich und unverbindlich.
          </p>
          <Link to="/acquiary/objekt">
            <button className="aq-btn aq-btn-primary">
              Kontakt aufnehmen
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}

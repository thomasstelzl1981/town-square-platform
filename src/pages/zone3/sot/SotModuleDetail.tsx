import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Database, Bot, FileText, Building2, Home, TrendingUp, Wallet, Search } from 'lucide-react';

const moduleData: Record<string, {
  name: string;
  icon: React.ElementType;
  headline: string;
  description: string;
  features: string[];
  result: string;
}> = {
  'mod-01': {
    name: 'Stammdaten',
    icon: Database,
    headline: 'Struktur für alle Ihre Daten',
    description: 'Zentrale Verwaltung von Profilen, Kontakten und Organisationsstrukturen.',
    features: [
      'Persönliches Profil verwalten',
      'Firmendaten und Adressen pflegen',
      'Kontakte kategorisieren und verknüpfen',
      'Team-Mitglieder einladen',
      'Rollen und Berechtigungen zuweisen'
    ],
    result: 'Alle Stammdaten an einem Ort – übersichtlich und jederzeit aktuell.'
  },
  'mod-02': {
    name: 'KI Office',
    icon: Bot,
    headline: 'Ihr digitaler Assistent',
    description: 'Künstliche Intelligenz unterstützt bei alltäglichen Aufgaben.',
    features: [
      'Briefe und E-Mails generieren',
      'Aufgaben erstellen und priorisieren',
      'Termine koordinieren',
      'Notizen schnell erfassen',
      'Kontextbezogene Vorschläge erhalten'
    ],
    result: 'Weniger Routinearbeit, schnellere Ergebnisse.'
  },
  'mod-03': {
    name: 'DMS',
    icon: FileText,
    headline: 'Dokumente zentral verwalten',
    description: 'Digitaler Posteingang, Ablage und Dokumentenmanagement.',
    features: [
      'Automatischer Posteingang',
      'Intelligente Kategorisierung',
      'Volltextsuche in allen Dokumenten',
      'Sichere Freigabe für Dritte',
      'Versionierung und Archivierung'
    ],
    result: 'Nie wieder Dokumente suchen – alles griffbereit.'
  },
  'mod-04': {
    name: 'Immobilien',
    icon: Building2,
    headline: 'Ihr Portfolio im Überblick',
    description: 'Objekte, Einheiten und alle zugehörigen Daten strukturiert verwalten.',
    features: [
      'Objektstammdaten anlegen',
      'Einheiten und Mieter zuordnen',
      'Grundbuchdaten dokumentieren',
      'Finanzierungsübersicht pro Objekt',
      'Exposé automatisch erstellen'
    ],
    result: 'Vollständige Transparenz über Ihr Immobilienportfolio.'
  },
  'mod-05': {
    name: 'MSV',
    icon: Home,
    headline: 'Mietthemen organisiert',
    description: 'Mietsonderverwaltung und Mietprozesse effizient abwickeln.',
    features: [
      'Mieterübersicht und Vertragsdaten',
      'Zahlungseingänge verfolgen',
      'Nebenkostenabrechnung vorbereiten',
      'Kommunikation mit Mietern',
      'Mahnwesen und Erinnerungen'
    ],
    result: 'Mietverwaltung ohne Chaos.'
  },
  'mod-06': {
    name: 'Verkauf',
    icon: TrendingUp,
    headline: 'Vermarktung vorbereiten',
    description: 'Verkaufsprozesse strukturiert vorbereiten und steuern.',
    features: [
      'Inserate erstellen und verwalten',
      'Anfragen zentral sammeln',
      'Reservierungen dokumentieren',
      'Verkaufsunterlagen bündeln',
      'Vorgänge nachverfolgen'
    ],
    result: 'Vom ersten Gedanken bis zum Verkauf – alles dokumentiert.'
  },
  'mod-07': {
    name: 'Finanzierung',
    icon: Wallet,
    headline: 'Finanzierungsfälle vorbereiten',
    description: 'Strukturierte Dokumentenbündel für Finanzierungsanfragen.',
    features: [
      'Finanzierungsfall anlegen',
      'Dokumentencheckliste abarbeiten',
      'Vollständigkeitsprüfung',
      'Export für Finanzierungspartner',
      'Status-Tracking'
    ],
    result: 'Professionelle Finanzierungsunterlagen in Minuten.'
  },
  'mod-08': {
    name: 'Investment-Suche',
    icon: Search,
    headline: 'Investments entdecken',
    description: 'Suchen, vergleichen und favorisieren Sie passende Objekte.',
    features: [
      'Multi-Source-Suche',
      'Filterbare Suchergebnisse',
      'Merkliste und Favoriten',
      'Renditeberechnung',
      'Alerts für neue Angebote'
    ],
    result: 'Die besten Investmentchancen auf einen Blick.'
  }
};

export default function SotModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const mod = moduleId ? moduleData[moduleId] : null;

  if (!mod) {
    return (
      <div className="sot-theme zone3-section">
        <div className="zone3-container text-center">
          <h1 className="zone3-heading-1 mb-4">Modul nicht gefunden</h1>
          <Link to="/sot/module" className="zone3-btn-primary">
            Zur Modulübersicht
          </Link>
        </div>
      </div>
    );
  }

  const Icon = mod.icon;

  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <Link to="/sot/module" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Alle Module
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
              <Icon className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <div>
              <span className="text-sm font-mono opacity-60">{moduleId?.toUpperCase()}</span>
              <h1 className="zone3-heading-1">{mod.name}</h1>
            </div>
          </div>
          <p className="zone3-text-large max-w-2xl">{mod.headline}</p>
        </div>
      </section>

      {/* Content */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="zone3-heading-2 mb-4">Wofür</h2>
              <p className="zone3-text-large mb-8">{mod.description}</p>
              
              <h3 className="zone3-heading-3 mb-4">Funktionen</h3>
              <ul className="space-y-3">
                {mod.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="zone3-card p-8">
                <h3 className="zone3-heading-3 mb-4">Ergebnis</h3>
                <p className="zone3-text-large mb-8">{mod.result}</p>
                <Link to="/auth?source=sot" className="zone3-btn-primary w-full text-center block">
                  Im Portal ansehen
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Bereit für den Start?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und nutzen Sie alle 8 Module.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary">
            Jetzt starten
          </Link>
        </div>
      </section>
    </div>
  );
}

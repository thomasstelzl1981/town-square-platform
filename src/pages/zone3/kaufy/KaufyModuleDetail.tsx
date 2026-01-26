import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Database, Bot, FileText, Building2, Home, TrendingUp, Wallet, Search, Users, Target } from 'lucide-react';

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
    description: 'Zentrale Verwaltung von Profilen, Kontakten und Unternehmensstrukturen.',
    features: [
      'Persönliches Profil und Firmendaten',
      'Kontaktverwaltung mit Kategorisierung',
      'Rollenbasierte Zugriffssteuerung',
      'Team-Einladungen und Rechtevergabe',
      'Adressbuch mit Verknüpfungen'
    ],
    result: 'Alle Stammdaten an einem Ort – übersichtlich und jederzeit aktuell.'
  },
  'mod-02': {
    name: 'KI Office',
    icon: Bot,
    headline: 'Ihr digitaler Assistent',
    description: 'Künstliche Intelligenz unterstützt bei Texten, Aufgaben und Entscheidungen.',
    features: [
      'Textgenerierung für Briefe und E-Mails',
      'Aufgabenmanagement mit Priorisierung',
      'Terminkoordination und Kalender',
      'Notizen und Schnellzugriff',
      'Kontextbezogene Vorschläge'
    ],
    result: 'Weniger manuelle Arbeit, schnellere Ergebnisse.'
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
      'Sichere Freigabe und Teilen',
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
      'Objektstammdaten und Einheiten',
      'Grundbuchdaten und Flurstücke',
      'Energieausweise und Dokumente',
      'Finanzierungsübersicht pro Objekt',
      'Exposé-Erstellung'
    ],
    result: 'Vollständige Transparenz über Ihr Immobilienportfolio.'
  },
  'mod-05': {
    name: 'MSV',
    icon: Home,
    headline: 'Mietthemen organisiert',
    description: 'Mietsonderverwaltung und Mietprozesse effizient abwickeln.',
    features: [
      'Mieterübersicht und Verträge',
      'Zahlungseingänge verfolgen',
      'Nebenkostenabrechnung',
      'Kommunikation mit Mietern',
      'Mahnwesen und Erinnerungen'
    ],
    result: 'Mietverwaltung ohne Chaos.'
  },
  'mod-06': {
    name: 'Verkauf',
    icon: TrendingUp,
    headline: 'Vermarktung steuern',
    description: 'Listings erstellen, Anfragen verwalten und Verkaufsprozesse abwickeln.',
    features: [
      'Inserate erstellen und verwalten',
      'Multi-Channel-Veröffentlichung',
      'Anfragenmanagement',
      'Reservierungen und Vorgänge',
      'Provisionsvereinbarungen'
    ],
    result: 'Vom Listing bis zum Abschluss – alles unter Kontrolle.'
  },
  'mod-07': {
    name: 'Finanzierung',
    icon: Wallet,
    headline: 'Finanzierungsfälle vorbereiten',
    description: 'Strukturierte Dokumentenbündel für Finanzierungsanfragen.',
    features: [
      'Finanzierungsfall anlegen',
      'Dokumentencheckliste',
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
    description: 'Suchen, vergleichen und favorisieren Sie passende Kapitalanlagen.',
    features: [
      'Multi-Source-Suche',
      'Filterbare Suchergebnisse',
      'Merkliste und Favoriten',
      'Renditeberechnung',
      'Alerts für neue Angebote'
    ],
    result: 'Die besten Investmentchancen auf einen Blick.'
  },
  'mod-09': {
    name: 'Vertriebspartner',
    icon: Users,
    headline: 'Partnernetzwerk nutzen',
    description: 'Zugang zum Objektkatalog, Beratungstools und Partnerprozesse.',
    features: [
      'Objektkatalog mit Provisionen',
      'Beratungsrechner und Simulation',
      'Kundenauswahl und Matching',
      'Team- und Netzwerkverwaltung',
      'Verifizierung und Status'
    ],
    result: 'Professioneller Vertrieb mit vollem Support.'
  },
  'mod-10': {
    name: 'Leadgenerierung',
    icon: Target,
    headline: 'Leads und Deals managen',
    description: 'Lead-Inbox, Pipeline-Management und Kampagnensteuerung.',
    features: [
      'Lead-Inbox mit Qualifizierung',
      'Deal-Pipeline (Kanban)',
      'Aktivitätenprotokoll',
      'Kampagnen-Integration',
      'Conversion-Statistiken'
    ],
    result: 'Vom Lead zum Abschluss – durchgängig dokumentiert.'
  }
};

export default function KaufyModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const mod = moduleId ? moduleData[moduleId] : null;

  if (!mod) {
    return (
      <div className="kaufy-theme zone3-section">
        <div className="zone3-container text-center">
          <h1 className="zone3-heading-1 mb-4">Modul nicht gefunden</h1>
          <Link to="/kaufy/module" className="zone3-btn-primary">
            Zur Modulübersicht
          </Link>
        </div>
      </div>
    );
  }

  const Icon = mod.icon;

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <Link to="/kaufy/module" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Alle Module
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-black/10 flex items-center justify-center">
              <Icon className="w-8 h-8" />
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
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-black" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="zone3-card p-8">
                <h3 className="zone3-heading-3 mb-4">Ergebnis</h3>
                <p className="zone3-text-large mb-8">{mod.result}</p>
                <Link to="/auth?source=kaufy" className="zone3-btn-primary w-full text-center block">
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
            Registrieren Sie sich kostenlos und nutzen Sie alle 10 Module.
          </p>
          <Link to="/auth?source=kaufy" className="zone3-btn-primary">
            Jetzt starten
          </Link>
        </div>
      </section>
    </div>
  );
}

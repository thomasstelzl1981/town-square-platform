import { Link } from 'react-router-dom';
import { ArrowRight, Database, Bot, FileText, Building2, Home, TrendingUp, Wallet, Search } from 'lucide-react';

const modules = [
  { 
    id: '01', 
    name: 'Stammdaten', 
    icon: Database, 
    desc: 'Struktur für Personen, Rollen, Kontexte.',
    features: ['Profil & Firmendaten', 'Kontaktverwaltung', 'Rollenzuweisung', 'Team-Einladungen'],
    route: '/sot/module/mod-01' 
  },
  { 
    id: '02', 
    name: 'KI Office', 
    icon: Bot, 
    desc: 'Assistent für Aufgaben, Texte, Auswertungen.',
    features: ['Textgenerierung', 'Aufgabenmanagement', 'Kalender', 'Notizen'],
    route: '/sot/module/mod-02' 
  },
  { 
    id: '03', 
    name: 'DMS', 
    icon: FileText, 
    desc: 'Dokumente und Post zentral, auffindbar, teilbar.',
    features: ['Posteingang', 'Kategorisierung', 'Volltextsuche', 'Freigaben'],
    route: '/sot/module/mod-03' 
  },
  { 
    id: '04', 
    name: 'Immobilien', 
    icon: Building2, 
    desc: 'Objekte/Portfolio, Exposé, Datenraum.',
    features: ['Objektstammdaten', 'Einheiten', 'Grundbuch', 'Exposé-Erstellung'],
    route: '/sot/module/mod-04' 
  },
  { 
    id: '05', 
    name: 'MSV', 
    icon: Home, 
    desc: 'Mietthemen/Prozesse (Freemium), optional ausbaubar.',
    features: ['Mieterübersicht', 'Verträge', 'Zahlungen', 'Nebenkostenabrechnung'],
    route: '/sot/module/mod-05' 
  },
  { 
    id: '06', 
    name: 'Verkauf', 
    icon: TrendingUp, 
    desc: 'Verkaufsvorbereitung und Vermarktungssteuerung.',
    features: ['Inserate', 'Anfragen', 'Reservierungen', 'Dokumentation'],
    route: '/sot/module/mod-06' 
  },
  { 
    id: '07', 
    name: 'Finanzierung', 
    icon: Wallet, 
    desc: 'Finanzierungsfälle strukturiert bündeln und vorbereiten.',
    features: ['Finanzierungsfall', 'Dokumentencheckliste', 'Vollständigkeit', 'Export'],
    route: '/sot/module/mod-07' 
  },
  { 
    id: '08', 
    name: 'Investment-Suche', 
    icon: Search, 
    desc: 'Suche/Watchlist/Entscheidungsunterstützung.',
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Alerts'],
    route: '/sot/module/mod-08' 
  },
];

export default function SotModule() {
  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">8 Module für Ihre Verwaltung</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Von Stammdaten über Dokumentenmanagement bis zur Finanzierung – alles in einem System.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Module Grid */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid md:grid-cols-2 gap-6">
            {modules.map((mod) => (
              <Link
                key={mod.id}
                to={mod.route}
                className="zone3-card p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <mod.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono opacity-40">MOD-{mod.id}</span>
                    </div>
                    <h3 className="zone3-heading-3 mb-2">{mod.name}</h3>
                    <p className="zone3-text-small mb-3">{mod.desc}</p>
                    <ul className="grid grid-cols-2 gap-1">
                      {mod.features.map((f, i) => (
                        <li key={i} className="text-xs text-black/50">• {f}</li>
                      ))}
                    </ul>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Alle Module in einem Portal</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu allen 8 Modulen.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary">
            Jetzt starten
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Database, Bot, FileText, Building2, Home, TrendingUp, Wallet, Search, Users, Target } from 'lucide-react';

const modules = [
  { id: '01', name: 'Stammdaten', icon: Database, desc: 'Profile, Kontakte, Struktur.', route: '/kaufy/module/mod-01' },
  { id: '02', name: 'KI Office', icon: Bot, desc: 'Assistenz für Text, Aufgaben, Entscheidungen.', route: '/kaufy/module/mod-02' },
  { id: '03', name: 'DMS', icon: FileText, desc: 'Dokumente und Post im Griff.', route: '/kaufy/module/mod-03' },
  { id: '04', name: 'Immobilien', icon: Building2, desc: 'Portfolio und Objekte sauber strukturiert.', route: '/kaufy/module/mod-04' },
  { id: '05', name: 'MSV', icon: Home, desc: 'Mietthemen und Sonderverwaltung organisiert.', route: '/kaufy/module/mod-05' },
  { id: '06', name: 'Verkauf', icon: TrendingUp, desc: 'Listings erstellen und Vermarktung steuern.', route: '/kaufy/module/mod-06' },
  { id: '07', name: 'Finanzierung', icon: Wallet, desc: 'Finanzierungsfälle strukturiert vorbereiten.', route: '/kaufy/module/mod-07' },
  { id: '08', name: 'Investment-Suche', icon: Search, desc: 'Investments finden, merken, vergleichen.', route: '/kaufy/module/mod-08' },
  { id: '09', name: 'Vertriebspartner', icon: Users, desc: 'Partnerprozesse, Auswahl, Beratung, Netzwerk.', route: '/kaufy/module/mod-09' },
  { id: '10', name: 'Leadgenerierung', icon: Target, desc: 'Lead-Inbox, Pipeline, Kampagnen, Abschluss.', route: '/kaufy/module/mod-10' },
];

export default function KaufyModule() {
  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">10 Module, ein System</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Von Stammdaten bis Lead-Management – Kaufy bietet Ihnen eine vollständige Suite für professionelle Kapitalanlage.
          </p>
          <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Module Grid */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <Link
                key={mod.id}
                to={mod.route}
                className="zone3-card p-6 hover:border-black/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-black/40">MOD-{mod.id}</span>
                    </div>
                    <h3 className="zone3-heading-3 mb-2">{mod.name}</h3>
                    <p className="zone3-text-small">{mod.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu allen 10 Modulen.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?source=kaufy" className="zone3-btn-primary">
              Kostenlos starten
            </Link>
            <Link to="/kaufy/immobilien" className="zone3-btn-secondary">
              Angebote ansehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

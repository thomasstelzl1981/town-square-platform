/**
 * KaufyModule — Phase 4 Update
 * Modul-IDs entfernt, Gruppierung nach Zielgruppe
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Home, TrendingUp, Wallet, Search, Users, FileText, Bot, Target } from 'lucide-react';

interface ModuleGroup {
  title: string;
  description: string;
  modules: {
    name: string;
    icon: React.ElementType;
    desc: string;
  }[];
}

const moduleGroups: ModuleGroup[] = [
  {
    title: 'Für Eigentümer & Vermieter',
    description: 'Verwalten Sie Ihr Portfolio professionell',
    modules: [
      { name: 'Immobilienverwaltung', icon: Building2, desc: 'Alle Objekte, Einheiten und Kennzahlen zentral verwalten.' },
      { name: 'Mietmanagement', icon: Home, desc: 'Mietverträge, Zahlungen und Nebenkostenabrechnungen.' },
      { name: 'Dokumentenablage', icon: FileText, desc: 'Alle Unterlagen sicher und strukturiert archivieren.' },
    ],
  },
  {
    title: 'Für Kapitalanleger',
    description: 'Finden und analysieren Sie Investmentchancen',
    modules: [
      { name: 'Investment-Suche', icon: Search, desc: 'Rendite-Immobilien finden, vergleichen und simulieren.' },
      { name: 'Finanzierungsplaner', icon: Wallet, desc: 'Finanzierungsfälle vorbereiten und optimieren.' },
      { name: 'KI-Assistent', icon: Bot, desc: 'Armstrong beantwortet Ihre Fragen zur Kapitalanlage.' },
    ],
  },
  {
    title: 'Für Vertriebspartner',
    description: 'Werkzeuge für professionelle Beratung',
    modules: [
      { name: 'Objektkatalog', icon: Building2, desc: 'Exklusiver Zugang zu geprüften Rendite-Immobilien.' },
      { name: 'Kundenberatung', icon: Users, desc: 'Investment-Rechner und Simulationen für Ihre Kunden.' },
      { name: 'Lead-Management', icon: Target, desc: 'Pipeline verwalten und Abschlüsse tracken.' },
    ],
  },
  {
    title: 'Für Verkäufer & Bauträger',
    description: 'Vermarkten Sie Ihre Immobilien erfolgreich',
    modules: [
      { name: 'Exposé-Erstellung', icon: FileText, desc: 'Professionelle Objektpräsentation erstellen.' },
      { name: 'Verkaufsmanagement', icon: TrendingUp, desc: 'Von der Anfrage bis zum Notar digital begleitet.' },
      { name: 'Partner-Vertrieb', icon: Users, desc: 'Ihr Objekt erreicht 500+ qualifizierte Partner.' },
    ],
  },
];

export default function KaufyModule() {
  return (
    <div>
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Eine Plattform, alle Funktionen</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            KAUFY bietet für jede Rolle die passenden Werkzeuge – von der Verwaltung bis zum Vertrieb.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Module Groups */}
      {moduleGroups.map((group, groupIdx) => (
        <section 
          key={group.title}
          className="zone3-section"
          style={{ 
            backgroundColor: groupIdx % 2 === 0 
              ? 'hsl(var(--z3-background))' 
              : 'hsl(var(--z3-secondary))' 
          }}
        >
          <div className="zone3-container">
            <div className="text-center mb-12">
              <h2 className="zone3-heading-2 mb-3">{group.title}</h2>
              <p className="zone3-text-large">{group.description}</p>
            </div>
            
            <div className="zone3-grid-3">
              {group.modules.map((mod) => (
                <div
                  key={mod.name}
                  className="zone3-card p-6"
                >
                  <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" 
                    style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
                  >
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{mod.name}</h3>
                  <p className="zone3-text-small">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für professionelle Immobilienverwaltung?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu allen Funktionen.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              to="/auth?mode=register&source=kaufy" 
              className="zone3-btn-primary inline-flex items-center gap-2"
              style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}
            >
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/kaufy" 
              className="zone3-btn-secondary"
              style={{ borderColor: 'hsl(var(--z3-background) / 0.3)', color: 'hsl(var(--z3-background))' }}
            >
              Immobilien entdecken
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

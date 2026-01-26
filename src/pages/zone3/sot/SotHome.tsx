import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, Mail, Building2, Wallet, TrendingUp, Search, Users, BarChart3 } from 'lucide-react';

const modules = [
  { num: '01', name: 'Stammdaten', icon: Users, desc: 'Kontakte & Organisationen' },
  { num: '02', name: 'KI Office', icon: Mail, desc: 'E-Mails, Aufgaben, Kalender' },
  { num: '03', name: 'DMS', icon: FileText, desc: 'Dokumentenmanagement' },
  { num: '04', name: 'Immobilien', icon: Building2, desc: 'Portfolio-Management' },
  { num: '05', name: 'MSV', icon: BarChart3, desc: 'Mietmanagement' },
  { num: '06', name: 'Verkauf', icon: TrendingUp, desc: 'Objektvermarktung' },
  { num: '07', name: 'Finanzierung', icon: Wallet, desc: 'Finanzierungsfälle' },
  { num: '08', name: 'Investment-Suche', icon: Search, desc: 'Neue Objekte finden' },
];

export default function SotHome() {
  return (
    <div>
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Ihre Immobilien. Intelligent verwaltet.</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            System of a Town ist die KI-gestützte Software für Vermieter und Portfoliohalter.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth?mode=register&source=sot" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>
              Kostenlos starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/sot/produkt" className="zone3-btn-secondary">Demo ansehen</Link>
          </div>
        </div>
      </section>

      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Das Ergebnis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">80% weniger Verwaltungsaufwand</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Voller Überblick über Ihr Portfolio</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Mehr Zeit für das Wesentliche</p>
            </div>
          </div>
        </div>
      </section>

      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">8 Module für vollständige Kontrolle</h2>
          <div className="zone3-grid-4">
            {modules.map((mod) => (
              <div key={mod.num} className="zone3-card p-6 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <mod.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <div className="text-xs font-bold mb-1" style={{ color: 'hsl(var(--z3-accent))' }}>MOD-{mod.num}</div>
                <h3 className="font-semibold mb-1">{mod.name}</h3>
                <p className="zone3-text-small">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für die Digitalisierung?</h2>
          <p className="text-lg opacity-80 mb-8">14 Tage kostenlos testen. Keine Kreditkarte erforderlich.</p>
          <Link to="/auth?mode=register&source=sot" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}>
            Jetzt starten <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Briefcase, Target, Wallet, Wrench, Check, ArrowRight, TrendingUp, Shield } from 'lucide-react';

export default function KaufyVertrieb() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Exklusive Objekte für Ihren Vertrieb
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Werden Sie KAUFY-Partner und erhalten Sie Zugang zu geprüften Rendite-Immobilien mit transparenten Provisionen.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Partnerantrag stellen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Vorteile als Partner</h2>
          <div className="zone3-grid-4">
            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Exklusiver Objektkatalog</h3>
              <p className="zone3-text-small">Zugang zu geprüften Rendite-Immobilien, die nicht auf öffentlichen Portalen inseriert sind.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Qualifizierte Leads</h3>
              <p className="zone3-text-small">Erhalten Sie vorqualifizierte Interessenten mit nachgewiesener Bonität und Finanzierungsnachweis.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Transparente Provisionen</h3>
              <p className="zone3-text-small">Klare Vergütungsstruktur bei jedem Abschluss. Keine versteckten Kosten oder Gebühren.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Digitale Vertriebstools</h3>
              <p className="zone3-text-small">Investment-Rechner, Exposé-Generator und Kundenverwaltung für Ihre Beratung.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-12">So werden Sie Partner</h2>
            <div className="space-y-6">
              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Partnerantrag stellen</h3>
                  <p className="zone3-text-small">
                    Registrieren Sie sich kostenlos und laden Sie Ihre Unterlagen hoch. Die Prüfung dauert in der Regel 2-3 Werktage.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Onboarding & Schulung</h3>
                  <p className="zone3-text-small">
                    Nach der Freischaltung erhalten Sie eine Einführung in die Plattform und lernen die Investment-Tools kennen.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Objekte vermitteln & verdienen</h3>
                  <p className="zone3-text-small">
                    Greifen Sie auf den Objektkatalog zu, beraten Sie Ihre Kunden mit unseren Tools und verdienen Sie attraktive Provisionen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="max-w-2xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-8">Voraussetzungen</h2>
            <div className="zone3-card p-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Gewerbeanmeldung nach §34c GewO</h4>
                    <p className="zone3-text-small">Nachweis der gewerberechtlichen Erlaubnis zur Immobilienvermittlung.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Vermögensschadenhaftpflicht</h4>
                    <p className="zone3-text-small">Gültige Versicherungspolice für Ihre Beratungstätigkeit.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Branchenerfahrung</h4>
                    <p className="zone3-text-small">Mindestens 2 Jahre Erfahrung in der Immobilienvermittlung oder Finanzberatung.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="zone3-section-sm">
        <div className="zone3-container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold mb-2">5-15%</p>
              <p className="zone3-text-small">Provision pro Abschluss</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">200+</p>
              <p className="zone3-text-small">Aktive Partner</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">50+</p>
              <p className="zone3-text-small">Objekte im Katalog</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">0 €</p>
              <p className="zone3-text-small">Partnergebühren</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Werden Sie KAUFY-Partner</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Kostenlose Registrierung. Exklusiver Objektkatalog. Attraktive Provisionen.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}>
            Partnerantrag stellen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

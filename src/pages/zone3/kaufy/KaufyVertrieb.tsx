import { Link } from 'react-router-dom';
import { Briefcase, Target, Wallet, Wrench, Check, ArrowRight } from 'lucide-react';

export default function KaufyVertrieb() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Ihr Partnernetzwerk für Rendite-Immobilien
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Werden Sie Teil des KAUFY-Netzwerks und profitieren Sie von exklusiven Objekten.
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
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Partner-Vorteile</h2>
          <div className="zone3-grid-4">
            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Objektkatalog</h3>
              <p className="zone3-text-small">Exklusiver Zugang zu geprüften Rendite-Immobilien.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Lead-Management</h3>
              <p className="zone3-text-small">Qualifizierte Interessenten für Ihre Beratung.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Provisionen</h3>
              <p className="zone3-text-small">Transparente Vergütungsmodelle bei jedem Abschluss.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Digitale Tools</h3>
              <p className="zone3-text-small">Software-Unterstützung für Ihren Vertrieb.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="max-w-2xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-12">Partner-Anforderungen</h2>
            <div className="zone3-card p-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Gewerbeanmeldung (§34c GewO)</h4>
                    <p className="zone3-text-small">Nachweis der gewerberechtlichen Erlaubnis zur Immobilienvermittlung.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Vermögensschadenhaftpflicht</h4>
                    <p className="zone3-text-small">Aktuelle Versicherungspolice für Ihre Beratungstätigkeit.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <div>
                    <h4 className="font-semibold">Nachweisbare Erfahrung</h4>
                    <p className="zone3-text-small">Mindestens 2 Jahre Erfahrung in der Immobilienvermittlung.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Module Preview */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Partner-Module</h2>
          <div className="zone3-grid-2 max-w-4xl mx-auto">
            <div className="zone3-card p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                09
              </div>
              <div>
                <h3 className="font-semibold">Vertriebspartner</h3>
                <p className="zone3-text-small">Objektkatalog und Partnernetzwerk.</p>
              </div>
            </div>

            <div className="zone3-card p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                10
              </div>
              <div>
                <h3 className="font-semibold">Leadgenerierung</h3>
                <p className="zone3-text-small">Pipeline und Kampagnensteuerung.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Werden Sie KAUFY-Partner</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Stellen Sie jetzt Ihren Partnerantrag und erhalten Sie Zugang zum exklusiven Objektkatalog.
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

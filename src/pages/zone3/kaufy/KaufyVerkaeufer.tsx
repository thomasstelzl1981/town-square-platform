import { Link } from 'react-router-dom';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';

export default function KaufyVerkaeufer() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Projektplatzierung mit System
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Erreichen Sie qualifizierte Käufer über unser Partnernetzwerk.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Objekt anmelden
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-2 items-center">
            {/* Problem */}
            <div className="zone3-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6" style={{ color: 'hsl(0 84% 60%)' }} />
                <h3 className="zone3-heading-3">Das Problem</h3>
              </div>
              <ul className="space-y-4 zone3-text-small">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Aufwendige Vermarktung mit vielen manuellen Schritten</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Unqualifizierte Interessenten, die Zeit kosten</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Lange Verkaufszyklen ohne Planungssicherheit</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="zone3-card p-8" style={{ borderColor: 'hsl(142 71% 45%)', borderWidth: '2px' }}>
              <div className="flex items-center gap-3 mb-6">
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
                <h3 className="zone3-heading-3">Die Lösung</h3>
              </div>
              <ul className="space-y-4 zone3-text-small">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>KAUFY verbindet Sie mit geprüften Kapitalanlegern</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Professionelles Partnernetzwerk für schnelle Abschlüsse</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Digitale Transaktionsabwicklung spart Zeit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vorteile */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Vorteile</h2>
          <div className="zone3-grid-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Professionelle Aufbereitung</h3>
              <p className="zone3-text-small">Objektdaten werden für maximale Wirkung präsentiert.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">500+ Vertriebspartner</h3>
              <p className="zone3-text-small">Zugang zu einem bundesweiten Partnernetzwerk.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Transparente Provisionen</h3>
              <p className="zone3-text-small">Klare Vereinbarungen vor jeder Transaktion.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Digitale Abwicklung</h3>
              <p className="zone3-text-small">Von der Anfrage bis zum Notar vollständig digital.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Projekt platzieren</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Melden Sie Ihr Objekt an und profitieren Sie von unserem Netzwerk.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}>
            Objekt anmelden
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

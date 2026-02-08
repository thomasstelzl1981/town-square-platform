import { Link } from 'react-router-dom';
import { Check, ArrowRight, AlertCircle, Users, Shield, Zap, FileText } from 'lucide-react';

export default function KaufyVerkaeufer() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Verkaufen Sie an qualifizierte Käufer
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Erreichen Sie über 500 Vertriebspartner und geprüfte Kapitalanleger – ohne Streuverluste.
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
          <div className="zone3-grid-2 items-stretch">
            {/* Problem */}
            <div className="zone3-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6" style={{ color: 'hsl(0 84% 60%)' }} />
                <h3 className="zone3-heading-3">Die Herausforderung</h3>
              </div>
              <ul className="space-y-4 zone3-text-small">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Aufwendige Vermarktung über mehrere Portale mit unterschiedlichen Formaten</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Viele Anfragen von unqualifizierten Interessenten ohne Finanzierungsnachweis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>Lange Verkaufszyklen durch fehlende Käuferqualifizierung</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="zone3-card p-8" style={{ borderColor: 'hsl(142 71% 45%)', borderWidth: '2px' }}>
              <div className="flex items-center gap-3 mb-6">
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
                <h3 className="zone3-heading-3">Die KAUFY-Lösung</h3>
              </div>
              <ul className="space-y-4 zone3-text-small">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Direkter Zugang zu geprüften Kapitalanlegern mit nachgewiesener Bonität</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Professionelles Partnernetzwerk für schnelle, sichere Abschlüsse</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Digitale Transaktionsabwicklung von der Anfrage bis zum Notar</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">So funktioniert's</h2>
          <div className="zone3-grid-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">1. Objekt anmelden</h3>
              <p className="zone3-text-small">Erfassen Sie Ihr Objekt mit allen relevanten Daten und Dokumenten.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">2. Qualitätsprüfung</h3>
              <p className="zone3-text-small">Wir prüfen und bereiten Ihr Exposé professionell auf.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">3. Partner-Vertrieb</h3>
              <p className="zone3-text-small">Ihr Objekt erreicht 500+ qualifizierte Vertriebspartner.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">4. Schneller Abschluss</h3>
              <p className="zone3-text-small">Digitale Abwicklung von Besichtigung bis Notartermin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold mb-2">0 €</p>
              <p className="zone3-text-small">Anmeldegebühr</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">500+</p>
              <p className="zone3-text-small">Vertriebspartner</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">Ø 45</p>
              <p className="zone3-text-small">Tage bis Verkauf</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Objekt jetzt anmelden</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Kostenlose Objektanmeldung. Provision nur bei erfolgreichem Verkauf.
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

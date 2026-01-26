import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, Check, ArrowRight } from 'lucide-react';

export default function KaufyHome() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Finden Sie Ihre Rendite-Immobilie
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Der Marktplatz für Kapitalanleger, Verkäufer und Vertriebspartner.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/kaufy/immobilien" className="zone3-btn-primary inline-flex items-center gap-2">
              Immobilien entdecken
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-secondary">
              Kostenlos registrieren
            </Link>
          </div>
        </div>
      </section>

      {/* Investment Calculator Teaser */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-card p-8 max-w-2xl mx-auto text-center">
            <h2 className="zone3-heading-3 mb-4">
              Wie viel können Sie investieren?
            </h2>
            <p className="zone3-text-small mb-6">
              Berechnen Sie Ihre monatliche Belastung basierend auf Ihrem zu versteuernden Einkommen.
            </p>
            <Link to="/kaufy/beratung" className="zone3-btn-primary inline-flex items-center gap-2">
              Zum Rechner
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="zone3-grid-3">
            {/* Kapitalanleger */}
            <div className="zone3-card p-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Für Kapitalanleger</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Geprüfte Rendite-Immobilien</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Transparente Unterlagen</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Finanzierungsunterstützung</span>
                </li>
              </ul>
              <Link to="/kaufy/beratung" className="zone3-btn-secondary inline-block">
                Mehr erfahren
              </Link>
            </div>

            {/* Verkäufer */}
            <div className="zone3-card p-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Für Verkäufer</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Kostenlose Objektbewertung</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Zugang zu qualifizierten Käufern</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Professionelle Vermarktung</span>
                </li>
              </ul>
              <Link to="/kaufy/verkaeufer" className="zone3-btn-secondary inline-block">
                Mehr erfahren
              </Link>
            </div>

            {/* Vertriebspartner */}
            <div className="zone3-card p-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Users className="w-6 h-6" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Für Vertriebspartner</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Attraktive Provisionen</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Exklusive Objektauswahl</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span>Digitale Tools für den Vertrieb</span>
                </li>
              </ul>
              <Link to="/kaufy/vertrieb" className="zone3-btn-primary inline-block">
                Partner werden
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-12">Warum KAUFY?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <p className="font-medium">Geprüfte Immobilien</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <p className="font-medium">Transparente Prozesse</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <p className="font-medium">Persönliche Beratung</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <p className="font-medium">Digitale Abwicklung</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für Ihre Investition?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu exklusiven Rendite-Immobilien.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Jetzt kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

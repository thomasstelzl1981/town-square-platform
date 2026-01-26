import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Kostenlos',
    description: 'Für den Einstieg',
    features: [
      'Bis zu 3 Objekte',
      'Stammdaten & Kontakte',
      'Basis-DMS (100 MB)',
      'KI Office (Grundfunktionen)',
      'E-Mail-Support'
    ],
    cta: 'Kostenlos starten',
    featured: false
  },
  {
    name: 'Professional',
    price: 'Auf Anfrage',
    description: 'Für wachsende Portfolios',
    features: [
      'Unbegrenzte Objekte',
      'Alle Starter-Features',
      'Vollständiges DMS',
      'MSV-Modul',
      'Finanzierungsmodul',
      'Investment-Suche',
      'Team-Zugang (bis 5 Nutzer)',
      'Prioritäts-Support'
    ],
    cta: 'Kontakt aufnehmen',
    featured: true
  },
  {
    name: 'Enterprise',
    price: 'Individuell',
    description: 'Für professionelle Verwalter',
    features: [
      'Alle Professional-Features',
      'Unbegrenzte Nutzer',
      'Verkaufsmodul',
      'Erweiterte Integrationen',
      'Dedizierter Support',
      'Onboarding-Begleitung'
    ],
    cta: 'Kontakt aufnehmen',
    featured: false
  }
];

export default function SotPreise() {
  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Transparente Preise</h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Starten Sie kostenlos – und wählen Sie später das passende Paket für Ihre Anforderungen.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="zone3-card p-8"
                style={plan.featured ? { borderColor: 'hsl(var(--z3-accent))', borderWidth: '2px' } : undefined}
              >
                {plan.featured && (
                  <div className="text-center mb-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
                    >
                      Empfohlen
                    </span>
                  </div>
                )}
                <h3 className="zone3-heading-3 text-center mb-2">{plan.name}</h3>
                <p className="zone3-text-small text-center mb-4">{plan.description}</p>
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Starter' ? '/auth?source=sot' : '/sot/kontakt'}
                  className={`w-full text-center block py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.featured 
                      ? 'text-white hover:opacity-90' 
                      : 'bg-black/5 hover:bg-black/10'
                  }`}
                  style={plan.featured ? { backgroundColor: 'hsl(var(--z3-accent))' } : undefined}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="zone3-section">
        <div className="zone3-container max-w-2xl">
          <h2 className="zone3-heading-2 text-center mb-8">Häufige Fragen zu Preisen</h2>
          <div className="space-y-4">
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Kann ich jederzeit upgraden?</h3>
              <p className="zone3-text-small">Ja, Sie können jederzeit in ein höheres Paket wechseln. Ihre Daten bleiben erhalten.</p>
            </div>
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Gibt es eine Mindestlaufzeit?</h3>
              <p className="zone3-text-small">Nein, alle Pakete sind monatlich kündbar.</p>
            </div>
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Was passiert mit meinen Daten bei Kündigung?</h3>
              <p className="zone3-text-small">Sie können Ihre Daten jederzeit exportieren. Nach Kündigung werden sie nach 30 Tagen gelöscht.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Noch unsicher?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und überzeugen Sie sich selbst.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

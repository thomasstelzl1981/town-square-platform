import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export default function MietyPreise() {
  const plans = [
    {
      name: 'Basis',
      price: 'Kostenlos',
      description: 'Für den Einstieg',
      features: [
        'Bis zu 3 Einheiten',
        'Dokumentenablage',
        'Mieterkommunikation',
        'E-Mail-Support',
      ],
      cta: 'Kostenlos starten',
      featured: false,
    },
    {
      name: 'Verwaltung',
      price: '29€',
      period: '/Monat',
      description: 'Für wachsende Portfolios',
      features: [
        'Bis zu 20 Einheiten',
        'Alle Basis-Features',
        'Nebenkostenabrechnungen',
        'Team-Zugang (2 Nutzer)',
      ],
      cta: 'Jetzt upgraden',
      featured: true,
    },
    {
      name: 'Mietsonderverwaltung',
      price: '79€',
      period: '/Monat',
      description: 'Für professionelle Verwalter',
      features: [
        'Unbegrenzte Einheiten',
        'Alle Verwaltung-Features',
        'Vollständige MSV-Funktionen',
        'Team-Zugang (unbegrenzt)',
        'Prioritäts-Support',
      ],
      cta: 'Kontakt aufnehmen',
      featured: false,
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Faire Preise für jede Portfoliogröße
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Wählen Sie das passende Paket für Ihre Bedürfnisse.
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
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
                    >
                      Beliebt
                    </span>
                  </div>
                )}
                <h3 className="zone3-heading-3 text-center mb-2">{plan.name}</h3>
                <p className="zone3-text-small text-center mb-4">{plan.description}</p>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="zone3-text-small">{plan.period}</span>}
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
                  to="/miety/registrieren"
                  className={`zone3-btn-${plan.featured ? 'primary' : 'secondary'} w-full text-center block`}
                  style={plan.featured ? { backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' } : undefined}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

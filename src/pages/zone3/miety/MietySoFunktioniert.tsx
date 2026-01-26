import { Link } from 'react-router-dom';
import { UserPlus, Building2, Mail, Laptop, ArrowRight } from 'lucide-react';

export default function MietySoFunktioniert() {
  const steps = [
    {
      icon: UserPlus,
      step: '1',
      title: 'Registrieren',
      description: 'Erstellen Sie Ihr Vermieter-Konto in wenigen Minuten.',
    },
    {
      icon: Building2,
      step: '2',
      title: 'Objekte anlegen',
      description: 'Fügen Sie Ihre Immobilien und Mieteinheiten hinzu.',
    },
    {
      icon: Mail,
      step: '3',
      title: 'Mieter einladen',
      description: 'Versenden Sie Einladungen an Ihre Mieter per E-Mail.',
    },
    {
      icon: Laptop,
      step: '4',
      title: 'Digital verwalten',
      description: 'Nutzen Sie alle Features für eine effiziente Verwaltung.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            So funktioniert Miety
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            In vier einfachen Schritten zur digitalen Immobilienverwaltung.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="max-w-3xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <div key={step.step} className="zone3-card p-8 flex items-start gap-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
                >
                  <span className="text-2xl font-bold">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="zone3-heading-3 mb-2">{step.title}</h3>
                  <p className="zone3-text-small">{step.description}</p>
                </div>
                <div className="hidden md:block w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <step.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für den Start?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich jetzt und erleben Sie Miety.
          </p>
          <Link
            to="/miety/registrieren"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
          >
            Jetzt starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

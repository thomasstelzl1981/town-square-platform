import { Link } from 'react-router-dom';
import { FileText, MessageCircle, Wrench, BarChart3, Bell, ArrowRight } from 'lucide-react';

export default function MietyApp() {
  const features = [
    { icon: FileText, label: 'Dokumente einsehen' },
    { icon: MessageCircle, label: 'Mit dem Vermieter kommunizieren' },
    { icon: Wrench, label: 'Service-Anfragen stellen' },
    { icon: BarChart3, label: 'Abrechnungen prüfen' },
    { icon: Bell, label: 'Benachrichtigungen erhalten' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Die Miety-App für Mieter
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Alles rund um Ihr Mietverhältnis in einer App.
          </p>
        </div>
      </section>

      {/* App Features */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone Mockup Placeholder */}
            <div className="order-2 lg:order-1">
              <div className="zone3-card p-8 aspect-[9/16] max-w-xs mx-auto flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-foreground))' }}>
                <div className="text-center" style={{ color: 'hsl(var(--z3-background))' }}>
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-sm opacity-60">App Mockup</p>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="order-1 lg:order-2">
              <h2 className="zone3-heading-2 mb-8">Funktionen für Mieter</h2>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                      <feature.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                    </div>
                    <span className="font-medium">{feature.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Jetzt die Miety-App nutzen</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Verfügbar im Web und optimiert für alle Geräte.
          </p>
          <Link
            to="/miety/registrieren"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
          >
            Als Mieter eingeladen werden
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

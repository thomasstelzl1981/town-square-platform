import { Link } from 'react-router-dom';
import { ArrowRight, Check, Users, Target, TrendingUp, Shield } from 'lucide-react';

export default function KaufyBerater() {
  const benefits = [
    {
      icon: Target,
      title: 'Qualifizierte Leads',
      description: 'Erhalten Sie vorqualifizierte Interessenten aus dem Kaufy-Ökosystem.'
    },
    {
      icon: TrendingUp,
      title: 'Objektkatalog',
      description: 'Zugriff auf exklusive Kapitalanlage-Immobilien mit transparenten Konditionen.'
    },
    {
      icon: Users,
      title: 'Beratungstools',
      description: 'Investmentrechner, Simulationen und Beratungspräsentationen.'
    },
    {
      icon: Shield,
      title: 'Compliance',
      description: 'Integrierte Dokumentation für §34c-konforme Beratungsprozesse.'
    }
  ];

  const features = [
    'Lead-Inbox mit Qualifizierung',
    'Deal-Pipeline und Aktivitäten',
    'Investmentrechner mit Steuereffekten',
    'Objektauswahl und Matching',
    'Provisionsübersicht',
    'Team- und Netzwerkverwaltung',
    'Kampagnen-Integration',
    'Conversion-Statistiken'
  ];

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <span className="inline-block px-3 py-1 bg-black/10 rounded-full text-sm mb-6">
            Für Kapitalanlageberater & Vertrieb
          </span>
          <h1 className="zone3-heading-1 mb-6">
            Ihre Plattform für professionellen Vertrieb
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Kaufy bietet Ihnen alle Werkzeuge für Lead-Management, Objektauswahl und Kundenberatung – in einem System.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?source=kaufy&role=partner" className="zone3-btn-primary inline-flex items-center gap-2">
              Jetzt Partner werden
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/kaufy/module" className="zone3-btn-secondary">
              Module ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Vorteile</h2>
          <div className="zone3-grid-2">
            {benefits.map((benefit, i) => (
              <div key={i} className="zone3-card p-8">
                <div className="w-12 h-12 rounded-lg bg-black/5 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="zone3-heading-3 mb-2">{benefit.title}</h3>
                <p className="zone3-text-small">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="zone3-heading-2 mb-6">Alles in einer Suite</h2>
              <p className="zone3-text-large mb-8">
                Mit Kaufy erhalten Sie Zugang zu allen 10 Modulen – von Stammdaten bis Leadgenerierung.
              </p>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="zone3-card p-8 bg-black text-white">
              <h3 className="text-xl font-bold mb-4">Voraussetzungen</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>§34c GewO Nachweis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Vermögensschadenhaftpflicht (VSH)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Gewerbeanmeldung</span>
                </li>
              </ul>
              <Link 
                to="/auth?source=kaufy&role=partner" 
                className="mt-8 w-full block text-center py-3 px-6 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                Verifizierung starten
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Bereit für den nächsten Schritt?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich als Partner und erhalten Sie nach erfolgreicher Verifizierung vollen Zugang.
          </p>
          <Link to="/auth?source=kaufy&role=partner" className="zone3-btn-primary">
            Jetzt Partner werden
          </Link>
        </div>
      </section>
    </div>
  );
}

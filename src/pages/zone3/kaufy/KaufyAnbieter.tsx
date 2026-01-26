import { Link } from 'react-router-dom';
import { ArrowRight, Check, Building2, Users, TrendingUp, Shield } from 'lucide-react';

export default function KaufyAnbieter() {
  const benefits = [
    {
      icon: Users,
      title: 'Partnernetzwerk',
      description: 'Erreichen Sie qualifizierte Vertriebspartner und Kapitalanlageberater.'
    },
    {
      icon: TrendingUp,
      title: 'Effiziente Vermarktung',
      description: 'Zentrales Listing-Management mit Multi-Channel-Veröffentlichung.'
    },
    {
      icon: Building2,
      title: 'Professionelle Präsentation',
      description: 'Exposés, Datenräume und Unterlagen strukturiert bereitstellen.'
    },
    {
      icon: Shield,
      title: 'Transparente Prozesse',
      description: 'Reservierungen, Anfragen und Provisionen nachvollziehbar dokumentiert.'
    }
  ];

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <span className="inline-block px-3 py-1 bg-black/10 rounded-full text-sm mb-6">
            Für Aufteiler, Bauträger & Anbieter
          </span>
          <h1 className="zone3-heading-1 mb-6">
            Ihre Objekte. Unser Netzwerk.
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Nutzen Sie Kaufy, um Ihre Kapitalanlage-Immobilien professionell zu vermarkten und qualifizierte Abnehmer zu finden.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?source=kaufy&role=anbieter" className="zone3-btn-primary inline-flex items-center gap-2">
              Anbieter werden
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/kaufy/module/mod-06" className="zone3-btn-secondary">
              Verkaufsmodul ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Warum Kaufy?</h2>
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

      {/* Process */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">So funktioniert es</h2>
          <div className="zone3-grid-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="zone3-heading-3 mb-2">Registrieren</h3>
              <p className="zone3-text-small">Erstellen Sie Ihr Anbieterprofil und verifizieren Sie Ihr Unternehmen.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="zone3-heading-3 mb-2">Objekte einstellen</h3>
              <p className="zone3-text-small">Laden Sie Objektdaten, Dokumente und Medien hoch. Wir unterstützen Sie bei der Aufbereitung.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="zone3-heading-3 mb-2">Vertrieb starten</h3>
              <p className="zone3-text-small">Geben Sie Objekte für das Partnernetzwerk frei und verfolgen Sie Anfragen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="zone3-heading-2 mb-6">Ihre Werkzeuge</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Objektverwaltung</strong>
                    <p className="zone3-text-small">Stammdaten, Einheiten, Dokumente zentral pflegen.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Exposé-Erstellung</strong>
                    <p className="zone3-text-small">Professionelle Unterlagen automatisch generieren.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Partner-Freigabe</strong>
                    <p className="zone3-text-small">Objekte für das Vertriebsnetzwerk freischalten.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Anfragen & Reservierungen</strong>
                    <p className="zone3-text-small">Alle Vorgänge an einem Ort verfolgen.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="zone3-card p-8">
              <h3 className="zone3-heading-3 mb-4">Bereit für mehr Reichweite?</h3>
              <p className="zone3-text-small mb-6">
                Registrieren Sie sich als Anbieter und starten Sie mit der Vermarktung Ihrer Objekte.
              </p>
              <Link to="/auth?source=kaufy&role=anbieter" className="zone3-btn-primary w-full text-center block">
                Anbieter werden
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

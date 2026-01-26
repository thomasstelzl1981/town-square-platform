import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function MietyVermieter() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Mehr Zeit für das Wesentliche
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Miety entlastet Ihre Immobilienverwaltung.
          </p>
          <Link
            to="/miety/registrieren"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
          >
            Kostenlos registrieren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Portfolio Types */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Für jede Portfoliogröße</h2>
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Building2 className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Kleines Portfolio</h3>
              <p className="zone3-text-small mb-4">1–5 Einheiten</p>
              <ul className="text-left space-y-2 zone3-text-small">
                <li>• Einfache Mieterkommunikation</li>
                <li>• Digitale Dokumentenablage</li>
                <li>• Grundfunktionen kostenlos</li>
              </ul>
            </div>

            <div className="zone3-card p-8 text-center" style={{ borderColor: 'hsl(var(--z3-accent))', borderWidth: '2px' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                <Users className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Mittleres Portfolio</h3>
              <p className="zone3-text-small mb-4">6–20 Einheiten</p>
              <ul className="text-left space-y-2 zone3-text-small">
                <li>• Erweiterte Verwaltungsfunktionen</li>
                <li>• Team-Zugang</li>
                <li>• Automatisierte Abrechnungen</li>
              </ul>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <TrendingUp className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Großes Portfolio</h3>
              <p className="zone3-text-small mb-4">20+ Einheiten</p>
              <ul className="text-left space-y-2 zone3-text-small">
                <li>• Vollständige Mietsonderverwaltung</li>
                <li>• API-Anbindungen</li>
                <li>• Dedizierter Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für digitale Verwaltung?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und erleben Sie, wie einfach Immobilienverwaltung sein kann.
          </p>
          <Link
            to="/miety/registrieren"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
          >
            Kostenlos registrieren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

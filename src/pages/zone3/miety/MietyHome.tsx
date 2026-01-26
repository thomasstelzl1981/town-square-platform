import { Link } from 'react-router-dom';
import { FileText, MessageCircle, Wrench, Check, ArrowRight } from 'lucide-react';

export default function MietyHome() {
  return (
    <div>
      {/* Hero Section (Dark) */}
      <section className="zone3-hero" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Ihre Immobilien. Digital verwaltet.
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto mb-8">
            Miety vereinfacht die Kommunikation zwischen Vermietern und Mietern.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/miety/registrieren"
              className="zone3-btn-primary inline-flex items-center gap-2"
              style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
            >
              Jetzt starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/miety/leistungen"
              className="zone3-btn-secondary"
              style={{ borderColor: 'hsl(var(--z3-border))', color: 'hsl(var(--z3-background))' }}
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <FileText className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Digitale Dokumente</h3>
              <p className="zone3-text-small">
                Mietverträge, Abrechnungen und Protokolle immer griffbereit.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <MessageCircle className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Direkte Kommunikation</h3>
              <p className="zone3-text-small">
                Nachrichten und Anfragen zentral verwalten.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Service-Anfragen</h3>
              <p className="zone3-text-small">
                Reparaturen und Anliegen einfach melden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-12">Warum Miety?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Einfache Bedienung</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Sichere Datenhaltung</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Für Vermieter und Mieter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für digitale Verwaltung?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und starten Sie mit der modernen Immobilienverwaltung.
          </p>
          <Link
            to="/miety/registrieren"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
          >
            Jetzt kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

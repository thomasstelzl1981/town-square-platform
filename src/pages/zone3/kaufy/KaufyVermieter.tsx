import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function KaufyVermieter() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Ihr Bestandsobjekt. Unsere Expertise.
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Verwalten, finanzieren oder verkaufen Sie Ihre Immobilie mit System of a Town.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Jetzt starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Portfolio-Überblick</h3>
              <p className="zone3-text-small">
                Alle Objekte auf einen Blick mit wichtigen Kennzahlen und Dokumenten.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Users className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Mieterservice</h3>
              <p className="zone3-text-small">
                Digitale Kommunikation mit Mietern über das Miety-Portal.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Verkaufsoption</h3>
              <p className="zone3-text-small">
                Nahtloser Übergang zum Verkauf mit allen vorhandenen Unterlagen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module Preview */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Module</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="zone3-card p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                04
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Immobilienverwaltung</h3>
                <p className="zone3-text-small">Portfolio-Management mit allen Objektdaten und Dokumenten.</p>
              </div>
            </div>

            <div className="zone3-card p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                05
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Mietmanagement (MSV)</h3>
                <p className="zone3-text-small">Mietverträge, Zahlungen und Nebenkostenabrechnungen.</p>
              </div>
            </div>

            <div className="zone3-card p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                06
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Verkauf</h3>
                <p className="zone3-text-small">Objektvermarktung über KAUFY und externe Portale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für digitale Verwaltung?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und erleben Sie, wie einfach Immobilienverwaltung sein kann.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}>
            Jetzt starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

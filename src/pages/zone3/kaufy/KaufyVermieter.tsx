import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, ArrowRight, Shield, LineChart, FileCheck } from 'lucide-react';

export default function KaufyVermieter() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Ihre Immobilie. Unser Know-how.
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Verwalten Sie Ihr Portfolio digital, optimieren Sie Ihre Rendite und behalten Sie alle Kennzahlen im Blick.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Warum KAUFY für Vermieter?</h2>
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Vollständiger Überblick</h3>
              <p className="zone3-text-small">
                Alle Objekte, Dokumente und Kennzahlen zentral an einem Ort. Keine verstreuten Excel-Listen mehr.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Users className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Digitaler Mieterservice</h3>
              <p className="zone3-text-small">
                Kommunizieren Sie direkt mit Ihren Mietern über das Miety-Portal. Anfragen, Dokumente und Termine an einem Ort.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Rendite optimieren</h3>
              <p className="zone3-text-small">
                Analysieren Sie die Wirtschaftlichkeit Ihrer Immobilien mit 40-Jahres-Projektionen und Steuervorteilen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-12">Was Sie erwartet</h2>
            <div className="space-y-6">
              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Immobilienverwaltung</h3>
                  <p className="zone3-text-small">
                    Erfassen Sie alle Objektdaten, Einheiten und Mietverträge. Automatische Berechnung von Kennzahlen wie Rendite, Cashflow und Wertsteigerung.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <LineChart className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Mietmanagement</h3>
                  <p className="zone3-text-small">
                    Behalten Sie Mieteingänge im Blick, erstellen Sie Nebenkostenabrechnungen und verwalten Sie Mieterhöhungen digital.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Verkaufsoption</h3>
                  <p className="zone3-text-small">
                    Entscheiden Sie sich für einen Verkauf? Alle Unterlagen sind bereits digital vorhanden. Nahtloser Übergang zum Verkaufsprozess.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Elements */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold mb-2">500+</p>
              <p className="zone3-text-small">Verwaltete Objekte</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">98%</p>
              <p className="zone3-text-small">Zufriedene Vermieter</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">24/7</p>
              <p className="zone3-text-small">Online-Zugriff</p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">DSGVO</p>
              <p className="zone3-text-small">Konform & sicher</p>
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
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

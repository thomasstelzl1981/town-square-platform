import { Link } from 'react-router-dom';
import { FileText, MessageCircle, Wrench, Check, ArrowRight, Mail, Shield, Home } from 'lucide-react';

export default function MietyHome() {
  return (
    <div>
      {/* Hero Section (Dark) */}
      <section className="zone3-hero" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Dein Mieterzugang – einfach und sicher.
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto mb-8">
            Einladung annehmen, Dokumente einsehen, direkt kommunizieren.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/miety/invite"
              className="zone3-btn-primary inline-flex items-center gap-2"
              style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
            >
              Einladung annehmen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/auth?mode=login&source=miety"
              className="zone3-btn-secondary"
              style={{ borderColor: 'hsl(var(--z3-border))', color: 'hsl(var(--z3-background))' }}
            >
              Einloggen
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihr digitales Mieterportal</h2>
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <FileText className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Dokumente einsehen</h3>
              <p className="zone3-text-small">
                Mietvertrag, Nebenkostenabrechnungen und wichtige Unterlagen jederzeit griffbereit.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <MessageCircle className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Direkte Kommunikation</h3>
              <p className="zone3-text-small">
                Nachrichten an Ihre Hausverwaltung senden und Antworten erhalten.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-4">Anliegen melden</h3>
              <p className="zone3-text-small">
                Reparaturen, Fragen oder Wünsche einfach digital einreichen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">So funktioniert Miety</h2>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}>
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Einladung erhalten</h3>
                  <p className="zone3-text-small">Sie bekommen eine E-Mail mit Ihrem persönlichen Einladungscode.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}>
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Konto erstellen</h3>
                  <p className="zone3-text-small">Code eingeben und mit E-Mail-Adresse registrieren.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}>
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Loslegen</h3>
                  <p className="zone3-text-small">Zugang zu Dokumenten, Nachrichten und Services.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-12">Warum Miety?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Check className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Einfache Bedienung</p>
              <p className="zone3-text-small mt-2">Kein technisches Wissen erforderlich</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Shield className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Sichere Daten</p>
              <p className="zone3-text-small mt-2">Nur Sie und Ihre Verwaltung haben Zugriff</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
                <Mail className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <p className="font-medium">Kostenlos für Mieter</p>
              <p className="zone3-text-small mt-2">Keine versteckten Kosten</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Haben Sie eine Einladung?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Geben Sie Ihren Einladungscode ein und starten Sie mit Miety.
          </p>
          <Link
            to="/miety/invite"
            className="zone3-btn-primary inline-flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}
          >
            Einladung annehmen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Check, Home, FileText, MessageCircle, Shield } from 'lucide-react';
import { useState } from 'react';

export default function MietyInvite() {
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would validate the invite code and redirect
    window.location.href = `/auth?source=miety&invite=${inviteCode}`;
  };

  return (
    <div className="miety-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Home className="w-10 h-10" style={{ color: 'hsl(var(--z3-accent))' }} />
            <span className="text-2xl font-bold">Miety</span>
          </div>
          <h1 className="zone3-heading-1 mb-6">Einladung annehmen</h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Sie haben eine Einladung zu Miety erhalten? Geben Sie Ihren Code ein, um Zugang zu Ihrem Mieterportal zu erhalten.
          </p>
        </div>
      </section>

      {/* Invite Form */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container max-w-md">
          <div className="zone3-card p-8">
            <h2 className="zone3-heading-3 mb-6 text-center">Einladungscode eingeben</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium mb-2">
                  Ihr Einladungscode
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="z.B. MIETY-ABC123"
                  className="w-full px-4 py-3 rounded-lg border border-black/10 focus:border-[hsl(var(--z3-accent))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--z3-accent))]/20"
                  required
                />
                <p className="text-xs text-black/50 mt-2">
                  Den Code finden Sie in der E-Mail Ihrer Verwaltung.
                </p>
              </div>
              <button
                type="submit"
                className="zone3-btn-primary w-full"
                style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
              >
                Einladung annehmen
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="zone3-text-small">
                Bereits registriert?{' '}
                <Link to="/auth?source=miety" className="underline hover:no-underline" style={{ color: 'hsl(var(--z3-accent))' }}>
                  Einloggen
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Was Sie erwartet</h2>
          <div className="zone3-grid-3">
            <div className="zone3-card p-6 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                <FileText className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Dokumente</h3>
              <p className="zone3-text-small">Mietvertrag, Nebenkostenabrechnung und alle wichtigen Unterlagen.</p>
            </div>
            <div className="zone3-card p-6 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                <MessageCircle className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Kommunikation</h3>
              <p className="zone3-text-small">Direkte Nachrichten an Ihre Verwaltung.</p>
            </div>
            <div className="zone3-card p-6 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                <Shield className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Sicherheit</h3>
              <p className="zone3-text-small">Ihre Daten sind geschützt und nur für Sie sichtbar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container max-w-2xl">
          <h2 className="zone3-heading-2 text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-4">
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Wo finde ich meinen Einladungscode?</h3>
              <p className="zone3-text-small">Den Code erhalten Sie per E-Mail von Ihrer Hausverwaltung oder Ihrem Vermieter.</p>
            </div>
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Was passiert mit meinen Daten?</h3>
              <p className="zone3-text-small">Ihre Daten sind geschützt und werden nur für die Kommunikation mit Ihrer Verwaltung verwendet.</p>
            </div>
            <div className="zone3-card p-6">
              <h3 className="font-medium mb-2">Ist die Nutzung kostenlos?</h3>
              <p className="zone3-text-small">Ja, für Mieter ist Miety komplett kostenlos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

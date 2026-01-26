import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type UserType = 'vermieter' | 'hausverwaltung' | 'mieter';

export default function MietyRegistrieren() {
  const [userType, setUserType] = useState<UserType | null>(null);

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Bei Miety registrieren
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Starten Sie mit der digitalen Immobilienverwaltung.
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="max-w-xl mx-auto">
            <div className="zone3-card p-8">
              <h2 className="zone3-heading-3 text-center mb-8">Ich bin...</h2>

              {/* User Type Selection */}
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => setUserType('vermieter')}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    userType === 'vermieter'
                      ? 'border-2'
                      : ''
                  }`}
                  style={{
                    borderColor: userType === 'vermieter' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))',
                    backgroundColor: userType === 'vermieter' ? 'hsl(var(--z3-accent) / 0.05)' : 'hsl(var(--z3-card))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
                      style={{ borderColor: userType === 'vermieter' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))' }}
                    >
                      {userType === 'vermieter' && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--z3-accent))' }} />
                      )}
                    </div>
                    <span className="font-medium">Vermieter (Privatperson)</span>
                  </div>
                </button>

                <button
                  onClick={() => setUserType('hausverwaltung')}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    userType === 'hausverwaltung'
                      ? 'border-2'
                      : ''
                  }`}
                  style={{
                    borderColor: userType === 'hausverwaltung' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))',
                    backgroundColor: userType === 'hausverwaltung' ? 'hsl(var(--z3-accent) / 0.05)' : 'hsl(var(--z3-card))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
                      style={{ borderColor: userType === 'hausverwaltung' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))' }}
                    >
                      {userType === 'hausverwaltung' && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--z3-accent))' }} />
                      )}
                    </div>
                    <span className="font-medium">Hausverwaltung</span>
                  </div>
                </button>

                <button
                  onClick={() => setUserType('mieter')}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    userType === 'mieter'
                      ? 'border-2'
                      : ''
                  }`}
                  style={{
                    borderColor: userType === 'mieter' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))',
                    backgroundColor: userType === 'mieter' ? 'hsl(var(--z3-accent) / 0.05)' : 'hsl(var(--z3-card))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
                      style={{ borderColor: userType === 'mieter' ? 'hsl(var(--z3-accent))' : 'hsl(var(--z3-border))' }}
                    >
                      {userType === 'mieter' && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--z3-accent))' }} />
                      )}
                    </div>
                    <span className="font-medium">Mieter (mit Einladungscode)</span>
                  </div>
                </button>
              </div>

              {/* Form Fields */}
              {userType && (
                <form className="space-y-4">
                  {userType === 'mieter' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Einladungscode</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-lg border"
                        style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                        placeholder="Code eingeben"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Vorname</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-lg border"
                        style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                        placeholder="Vorname"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nachname</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-lg border"
                        style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                        placeholder="Nachname"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">E-Mail</label>
                    <input
                      type="email"
                      className="w-full p-3 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                      placeholder="ihre@email.de"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Passwort</label>
                    <input
                      type="password"
                      className="w-full p-3 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex items-start gap-3 pt-2">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm">
                      Ich akzeptiere die <Link to="/miety/datenschutz" className="underline">AGB und Datenschutzbestimmungen</Link>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="zone3-btn-primary w-full flex items-center justify-center gap-2 mt-6"
                    style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
                  >
                    Registrieren
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <p className="text-center mt-6 zone3-text-small">
                Bereits registriert?{' '}
                <Link to="/auth?mode=login" className="underline">
                  Jetzt anmelden
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

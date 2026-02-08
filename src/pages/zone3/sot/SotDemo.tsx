/**
 * SoT Demo — Portal Preview & Demo Account Access
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, Monitor, Smartphone, Sparkles, Lock, Eye, Building2, FileText, Landmark } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

const demoModules = [
  {
    icon: Building2,
    name: 'Immobilienakte',
    description: 'Sehen Sie, wie ein vollständiges Objektdossier aussieht.',
  },
  {
    icon: FileText,
    name: 'DMS',
    description: 'Erkunden Sie die Dokumentenstruktur und Kategorisierung.',
  },
  {
    icon: Sparkles,
    name: 'KI Office',
    description: 'Erleben Sie Armstrong in Aktion bei der Texterstellung.',
  },
  {
    icon: Landmark,
    name: 'Finanzierung',
    description: 'Sehen Sie, wie bankfertige Unterlagen zusammengestellt werden.',
  },
];

export default function SotDemo() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { ref: modulesRef, isVisible: modulesVisible } = useSotScrollAnimation();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div 
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            Demo
          </span>
          <h1 className="sot-display mb-6">Erleben Sie das Portal.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto mb-10">
            Erkunden Sie einen vollständig vorbefüllten Demo-Account. 
            Keine Registrierung erforderlich.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/portal?demo=true" 
              className="sot-btn-primary text-lg px-8 py-4"
            >
              <Play className="w-5 h-5" />
              Demo starten
            </Link>
            <Link 
              to="/auth?mode=register&source=sot" 
              className="sot-btn-secondary text-lg px-8 py-4"
            >
              Eigenen Account erstellen
            </Link>
          </div>
        </div>
      </section>

      {/* Preview Window */}
      <section className="py-16 -mt-8">
        <div className="zone3-container">
          {/* View Mode Toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setViewMode('desktop')}
              className={`sot-btn-ghost ${viewMode === 'desktop' ? 'bg-[hsl(var(--z3-secondary))]' : ''}`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`sot-btn-ghost ${viewMode === 'mobile' ? 'bg-[hsl(var(--z3-secondary))]' : ''}`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>

          {/* Preview Frame */}
          <div 
            className={`mx-auto transition-all duration-500 ${
              viewMode === 'desktop' ? 'max-w-5xl' : 'max-w-sm'
            }`}
          >
            <div 
              className="sot-glass-card overflow-hidden"
              style={{ 
                aspectRatio: viewMode === 'desktop' ? '16/10' : '9/16',
              }}
            >
              {/* Browser Chrome */}
              <div 
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ 
                  backgroundColor: 'hsl(var(--z3-secondary))',
                  borderColor: 'hsl(var(--z3-border))'
                }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div 
                  className="flex-1 mx-4 px-4 py-1.5 rounded-lg text-xs text-center"
                  style={{ backgroundColor: 'hsl(var(--z3-card))' }}
                >
                  <Lock className="w-3 h-3 inline mr-1 opacity-50" />
                  systemofatown.app/portal
                </div>
              </div>
              
              {/* Content Preview */}
              <div 
                className="w-full h-full flex items-center justify-center p-8"
                style={{ backgroundColor: 'hsl(var(--z3-background))' }}
              >
                <div className="text-center">
                  <div 
                    className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                  >
                    <Eye className="w-10 h-10" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Demo-Vorschau</h3>
                  <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                    Klicken Sie "Demo starten" für den interaktiven Rundgang.
                  </p>
                  <Link to="/portal?demo=true" className="sot-btn-primary">
                    <Play className="w-4 h-4" />
                    Jetzt starten
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll See */}
      <section className="py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div 
            ref={modulesRef}
            className={`text-center mb-16 sot-fade-in ${modulesVisible ? 'visible' : ''}`}
          >
            <h2 className="sot-headline mb-4">Was Sie in der Demo sehen</h2>
            <p className="sot-subheadline max-w-2xl mx-auto">
              Ein vollständiger Account mit echten Beispieldaten.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoModules.map((module, index) => (
              <div
                key={module.name}
                className={`sot-glass-card p-6 text-center sot-fade-in ${modulesVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <module.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="font-bold mb-2">{module.name}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="zone3-container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="sot-headline mb-6">Demo-Modus</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Keine Registrierung</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Sofort starten ohne Account-Erstellung
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Echte Beispieldaten</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Vorbefüllte Objekte, Dokumente und Kontakte
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Read-Only Modus</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Erkunden ohne Risiko — Daten bleiben unverändert
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="sot-headline mb-6">Eigener Account</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">14 Tage kostenlos</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Voller Funktionsumfang zum Testen
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Eigene Daten</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Importieren Sie Ihre Objekte und Dokumente
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Armstrong Full</span>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      Voller KI-Assistent für alle Aufgaben
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        title="Bereit für Ihre eigenen Daten?"
        subtitle="Starten Sie jetzt mit Ihrem kostenlosen Account."
        variant="gradient"
      />
    </div>
  );
}
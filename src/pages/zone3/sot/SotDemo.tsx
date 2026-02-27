/**
 * SoT Demo — Portal Preview & Demo Account Access
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, Monitor, Smartphone, Sparkles, Lock, Eye, Building2, FileText, Landmark, FolderOpen, TrendingUp, Users } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

const demoModules = [
  {
    icon: Building2,
    name: 'Immobilienakte',
    description: 'Sehen Sie, wie ein vollständiges Objektdossier aussieht.',
    link: '/portal/immobilien',
  },
  {
    icon: FolderOpen,
    name: 'DMS',
    description: 'Erkunden Sie die Dokumentenstruktur und Kategorisierung.',
    link: '/portal/dms',
  },
  {
    icon: Sparkles,
    name: 'KI Office',
    description: 'Erleben Sie Armstrong in Aktion bei der Texterstellung.',
    link: '/portal/office',
  },
  {
    icon: TrendingUp,
    name: 'Finanzanalyse',
    description: 'Behalten Sie den Überblick über Ihr Vermögen.',
    link: '/portal/finanzanalyse',
  },
  {
    icon: Users,
    name: 'Stammdaten',
    description: 'Kontakte und Profile zentral verwalten.',
    link: '/portal/stammdaten',
  },
  {
    icon: Landmark,
    name: 'Finanzierung',
    description: 'Sehen Sie, wie bankfertige Unterlagen zusammengestellt werden.',
    link: '/portal/finanzierung',
  },
];

const benefits = {
  demo: [
    { title: 'Keine Registrierung', description: 'Sofort starten ohne Account-Erstellung' },
    { title: 'Echte Beispieldaten', description: 'Vorbefüllte Objekte, Dokumente und Kontakte' },
    { title: 'Voller Funktionsumfang', description: 'Alle Module und Features erkunden' },
  ],
  account: [
    { title: 'Dauerhaft kostenfrei', description: 'Die Plattform selbst kostet nichts' },
    { title: 'Eigene Daten', description: 'Importieren Sie Ihre Objekte und Dokumente' },
    { title: 'Armstrong Full', description: 'Voller KI-Assistent für alle Aufgaben' },
  ],
};

export default function SotDemo() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { ref: modulesRef, isVisible: modulesVisible } = useSotScrollAnimation();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div 
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            Demo
          </span>
          <h1 className="sot-display mb-6">Erleben Sie die Plattform.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto mb-6">
            Erkunden Sie einen vollständig vorbefüllten Demo-Account mit echten Beispieldaten. 
            Keine Registrierung erforderlich.
          </p>
          
          {/* KI Highlights */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { label: 'Armstrong KI testen', icon: Sparkles },
              { label: 'Dokument-Upload ausprobieren', icon: FileText },
              { label: 'Gemini 2.5 Pro erleben', icon: Eye },
            ].map((h) => (
              <span key={h.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" 
                style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)', color: 'hsl(var(--z3-accent))' }}>
                <h.icon className="w-3 h-3" />
                {h.label}
              </span>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/portal?mode=demo" 
              className="sot-btn-primary text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4"
            >
              <Play className="w-5 h-5" />
              Demo starten
            </Link>
            <Link 
              to="/auth?mode=register&source=sot" 
              className="sot-btn-secondary text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4"
            >
              Eigenen Account erstellen
            </Link>
          </div>
        </div>
      </section>

      {/* Preview Window */}
      <section className="py-12 lg:py-16 -mt-8">
        <div className="zone3-container">
          {/* View Mode Toggle */}
          <div className="flex justify-center gap-2 mb-6 lg:mb-8">
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
                className="w-full h-full flex items-center justify-center p-6 lg:p-8"
                style={{ backgroundColor: 'hsl(var(--z3-background))' }}
              >
                <div className="text-center">
                  <div 
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                  >
                    <Eye className="w-8 h-8 lg:w-10 lg:h-10" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold mb-2">Demo-Vorschau</h3>
                  <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                    Klicken Sie "Demo starten" für den interaktiven Rundgang.
                  </p>
                  <Link to="/portal?mode=demo" className="sot-btn-primary">
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
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div 
            ref={modulesRef}
            className={`text-center mb-12 lg:mb-16 sot-fade-in ${modulesVisible ? 'visible' : ''}`}
          >
            <h2 className="sot-headline mb-4">Was Sie in der Demo sehen</h2>
            <p className="sot-subheadline max-w-2xl mx-auto">
              Ein vollständiger Account mit echten Beispieldaten — erkunden Sie alle Bereiche.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {demoModules.map((module, index) => (
              <Link
                key={module.name}
                to={`${module.link}?mode=demo`}
                className={`sot-glass-card p-6 text-center hover:scale-[1.02] transition-transform sot-fade-in ${modulesVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 80}ms` }}
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <h3 className="sot-headline mb-6">Demo-Modus</h3>
              <ul className="space-y-4">
                {benefits.demo.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                      <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                    </div>
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/portal?mode=demo" className="sot-btn-primary w-full justify-center">
                  <Play className="w-4 h-4" />
                  Demo starten
                </Link>
              </div>
            </div>

            <div>
              <h3 className="sot-headline mb-6">Eigener Account</h3>
              <ul className="space-y-4">
                {benefits.account.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                      <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>✓</span>
                    </div>
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/auth?mode=register&source=sot" className="sot-btn-secondary w-full justify-center">
                  Kostenlos registrieren
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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

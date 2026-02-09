/**
 * SoT Home — Private Finanz- & Immobilien-Management-Plattform
 * KI-gestütztes Vermögensmanagement
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Building2, Sparkles, FolderOpen, AlertCircle, Clock, FileQuestion, Calculator, Users, TrendingUp, Wallet, Shield } from 'lucide-react';
import { SotHeroSection, SotStats, SotModuleShowcase, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { getFeaturedModules, getModuleCount } from '@/data/sotWebsiteModules';

const painPoints = [
  {
    icon: Clock,
    problem: 'Stunden für Papierkram',
    solution: 'KI-Assistent erledigt Korrespondenz in Sekunden.',
  },
  {
    icon: FileQuestion,
    problem: 'Dokumente nicht auffindbar',
    solution: 'Volltextsuche und intelligente Kategorisierung.',
  },
  {
    icon: TrendingUp,
    problem: 'Kein Vermögensüberblick',
    solution: 'Alle Assets, Finanzen und Projekte an einem Ort.',
  },
  {
    icon: Users,
    problem: 'Kontakte überall verstreut',
    solution: 'Ein System — synchronisiert mit Gmail & Outlook.',
  },
];

const platformHighlights = [
  {
    icon: Sparkles,
    title: 'KI-Assistenz',
    description: 'Armstrong schreibt Briefe, beantwortet Fragen und erledigt Recherchen.',
  },
  {
    icon: Building2,
    title: 'Immobilien-Management',
    description: 'Portfolio, Mietverwaltung, Projekte — alles digital dokumentiert.',
  },
  {
    icon: Wallet,
    title: 'Finanzübersicht',
    description: 'Finanzierung, Buchhaltung, Cashflow — Ihr Vermögen im Blick.',
  },
  {
    icon: Shield,
    title: 'DSGVO-konform',
    description: 'Deutsche Server, verschlüsselte Daten, regelmäßige Backups.',
  },
];

const trustedFeatures = [
  'DSGVO-konform',
  'Deutsche Server',
  'Verschlüsselte Daten',
  'Regelmäßige Backups',
];

export default function SotHome() {
  const { ref: problemsRef, isVisible: problemsVisible } = useSotScrollAnimation();
  const { ref: highlightsRef, isVisible: highlightsVisible } = useSotScrollAnimation();
  const { ref: featuredRef, isVisible: featuredVisible } = useSotScrollAnimation();
  const moduleCount = getModuleCount();

  return (
    <div>
      {/* Hero Section */}
      <SotHeroSection
        title="Vermögen managen. Mit KI-Unterstützung."
        subtitle="Die private Finanz- und Immobilien-Plattform für Selbstständige, Vermieter und Unternehmer. Dokumente, Objekte, Finanzen — alles an einem Ort. Mit Armstrong, Ihrem persönlichen KI-Assistenten."
        showDemo={true}
      />

      {/* Stats Section */}
      <SotStats />

      {/* Platform Highlights */}
      <section className="py-20 lg:py-28">
        <div className="zone3-container">
          <div className="text-center mb-12 lg:mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Was ist System of a Town?
            </span>
            <h2 className="sot-headline mt-4">Mehr als eine Immobiliensoftware.</h2>
            <p className="sot-subheadline mt-4 max-w-3xl mx-auto">
              Eine vollständige Plattform für Ihr privates Vermögensmanagement — mit KI-Office, 
              Dokumenten-Management, Immobilienverwaltung und Finanzübersicht.
            </p>
          </div>

          <div 
            ref={highlightsRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {platformHighlights.map((item, index) => (
              <div
                key={item.title}
                className={`sot-glass-card p-6 text-center sot-fade-in ${highlightsVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <item.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="zone3-container">
        <div className="sot-divider" />
      </div>

      {/* Problem → Solution Section */}
      <section className="py-20 lg:py-28">
        <div className="zone3-container">
          <div className="text-center mb-12 lg:mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Das kennen Sie
            </span>
            <h2 className="sot-headline mt-4">Probleme, die wir lösen.</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Zeitfresser, die jeder kennt. Wir haben sie automatisiert.
            </p>
          </div>

          <div 
            ref={problemsRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {painPoints.map((item, index) => (
              <div
                key={item.problem}
                className={`sot-glass-card p-6 sot-fade-in ${problemsVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <item.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(0 70% 60%)' }} />
                  <span className="text-sm font-medium line-through" style={{ color: 'hsl(0 70% 60%)' }}>{item.problem}</span>
                </div>
                
                <p className="text-sm" style={{ color: 'hsl(var(--z3-foreground))' }}>
                  <Check className="w-4 h-4 inline mr-1.5" style={{ color: 'hsl(var(--z3-accent))' }} />
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="zone3-container">
        <div className="sot-divider" />
      </div>

      {/* Armstrong Highlight */}
      <section className="py-20 lg:py-28">
        <div className="zone3-container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
                Ihr KI-Assistent
              </span>
              <h2 className="sot-headline mb-6">
                Lernen Sie Armstrong kennen.
              </h2>
              <p className="text-base lg:text-lg mb-8" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Armstrong schreibt Ihre Korrespondenz, beantwortet Fragen zu Finanzen und Recht, 
                recherchiert Marktdaten und erstellt professionelle Dokumente. Angetrieben von 
                den besten KI-Modellen der Welt.
              </p>
              
              <ul className="space-y-3 lg:space-y-4 mb-8">
                {[
                  'E-Mails und Briefe in Sekunden generieren',
                  'Dokumente analysieren und zusammenfassen',
                  'Recherche mit aktuellen Daten',
                  'Berechnungen für Rendite, Finanzierung, AfA',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--z3-accent))' }} />
                    </div>
                    <span className="text-sm lg:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/sot/module" className="sot-btn-primary">
                Alle Funktionen entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Armstrong Visual */}
            <div className="relative">
              <div 
                className="sot-glass-card p-6 lg:p-8 rounded-3xl"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--z3-card)) 0%, hsl(var(--z3-secondary)) 100%)',
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.15)' }}
                  >
                    <Sparkles className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Armstrong</h4>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      KI-Assistent
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'hsl(var(--z3-background) / 0.5)' }}
                  >
                    <p className="text-sm font-medium mb-2">Sie:</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      "Erstelle mir einen Überblick über meine Mieteinnahmen und offenen Positionen."
                    </p>
                  </div>
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                  >
                    <p className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>Armstrong:</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      "Basierend auf Ihren 3 Objekten mit 8 Einheiten: Aktuelle Monatsmiete 6.240€, davon 5.890€ eingegangen. Offene Position: Müller (2. OG links), Rückstand seit 14 Tagen..."
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">Details anzeigen</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">Mahnung erstellen</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div 
                className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-30"
                style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="zone3-container">
        <div className="sot-divider" />
      </div>

      {/* Featured Modules */}
      <section className="py-20 lg:py-28">
        <div className="zone3-container">
          <div className="text-center mb-12 lg:mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Die Highlights
            </span>
            <h2 className="sot-headline mt-4">Beliebte Module</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Von KI-Office bis Finanzierung — unsere meistgenutzten Funktionen.
            </p>
          </div>

          <div ref={featuredRef}>
            <SotModuleShowcase highlightOnly showCategories={false} />
          </div>

          <div className="text-center mt-10 lg:mt-12">
            <Link to="/sot/module" className="sot-btn-secondary">
              Alle {moduleCount} Module entdecken
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 lg:py-16" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-16">
            {trustedFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <SotCTA
        variant="gradient"
        title="Bereit für mehr Überblick?"
        subtitle="Kostenfrei nutzen. Nur für KI-Aktionen zahlen — transparent und fair."
        secondaryCta={{ label: 'Demo ansehen', to: '/sot/demo' }}
      />
    </div>
  );
}

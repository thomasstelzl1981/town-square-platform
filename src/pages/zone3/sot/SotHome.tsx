/**
 * SoT Home — SpaceX-Inspired Hero Landing Page
 * Problem-lösungsorientiert mit echten Pain Points
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Building2, Sparkles, FolderOpen, AlertCircle, Clock, FileQuestion, Calculator, Users } from 'lucide-react';
import { SotHeroSection, SotStats, SotModuleShowcase, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { getFeaturedModules } from '@/data/sotWebsiteModules';

const painPoints = [
  {
    icon: Clock,
    problem: 'Stunden für Papierkram',
    solution: 'Automatisierte Workflows und KI-Texte in Sekunden.',
  },
  {
    icon: FileQuestion,
    problem: 'Dokumente nicht auffindbar',
    solution: 'Volltextsuche und intelligente Kategorisierung.',
  },
  {
    icon: Calculator,
    problem: 'Mieteingänge manuell prüfen',
    solution: 'Automatisches Matching mit Kontoauszügen.',
  },
  {
    icon: Users,
    problem: 'Kontakte überall verstreut',
    solution: 'Ein System — synchronisiert mit Gmail & Outlook.',
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
  const { ref: featuredRef, isVisible: featuredVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero Section */}
      <SotHeroSection
        title="Immobilienverwaltung. Ohne den Wahnsinn."
        subtitle="Schluss mit Excel-Chaos, Papierstapeln und verlorenen Dokumenten. System of a Town digitalisiert Ihre Immobilien — mit Armstrong, Ihrem KI-Assistenten."
        showDemo={true}
      />

      {/* Stats Section */}
      <SotStats />

      {/* Problem → Solution Section */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Das kennen Sie
            </span>
            <h2 className="sot-headline mt-4">Probleme, die wir lösen.</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Jeder Vermieter kennt diese Zeitfresser. Wir haben sie eliminiert.
            </p>
          </div>

          <div 
            ref={problemsRef}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  <AlertCircle className="w-4 h-4" style={{ color: 'hsl(0 70% 60%)' }} />
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
      <section className="py-24">
        <div className="zone3-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
                Ihr KI-Assistent
              </span>
              <h2 className="sot-headline mb-6">
                Lernen Sie Armstrong kennen.
              </h2>
              <p className="text-lg mb-8" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Armstrong schreibt Ihre Mieterbriefe, beantwortet Fragen zu Immobilienrecht, 
                recherchiert Marktdaten und erstellt professionelle Dokumente. Angetrieben von 
                den besten KI-Modellen der Welt — Google Gemini und OpenAI GPT.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  'E-Mails und Briefe in Sekunden generieren',
                  'Mietverträge und Dokumente analysieren',
                  'Marktrecherche mit aktuellen Daten',
                  'Berechnungen für Rendite, Finanzierung, AfA',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--z3-accent))' }} />
                    </div>
                    <span>{feature}</span>
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
                className="sot-glass-card p-8 rounded-3xl"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--z3-card)) 0%, hsl(var(--z3-secondary)) 100%)',
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.15)' }}
                  >
                    <Sparkles className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
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
                      "Schreibe eine freundliche Mahnung für Mieter Müller, der seit 2 Wochen im Rückstand ist."
                    </p>
                  </div>
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                  >
                    <p className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>Armstrong:</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      "Sehr geehrter Herr Müller, ich hoffe, es geht Ihnen gut. Mir ist aufgefallen, dass die Miete für den laufenden Monat noch nicht eingegangen ist..."
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">Kopieren</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">Bearbeiten</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">Senden</span>
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
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
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

          <div className="text-center mt-12">
            <Link to="/sot/module" className="sot-btn-secondary">
              Alle 13 Module entdecken
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
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
        title="Bereit für weniger Chaos?"
        subtitle="14 Tage kostenlos testen. Keine Kreditkarte. Keine Verpflichtung."
        secondaryCta={{ label: 'Demo ansehen', to: '/sot/demo' }}
      />
    </div>
  );
}

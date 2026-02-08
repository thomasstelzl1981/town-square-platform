/**
 * SoT Home — SpaceX-Inspired Hero Landing Page
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Building2, Sparkles, FolderOpen, Landmark, BarChart } from 'lucide-react';
import { SotHeroSection, SotStats, SotModuleShowcase, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { getFeaturedModules } from '@/data/sotWebsiteModules';

const benefits = [
  {
    icon: BarChart,
    title: '80% weniger Aufwand',
    description: 'Automatisierte Workflows und KI-Unterstützung reduzieren manuelle Arbeit drastisch.',
  },
  {
    icon: Building2,
    title: 'Voller Überblick',
    description: 'Alle Objekte, Mieter, Dokumente und Finanzen an einem Ort — strukturiert und auffindbar.',
  },
  {
    icon: Sparkles,
    title: 'KI-First',
    description: 'Armstrong, Ihr KI-Assistent, unterstützt bei Texten, Analysen und Entscheidungen.',
  },
];

const trustedFeatures = [
  'DSGVO-konform',
  'Deutsche Server',
  'Verschlüsselte Daten',
  'Regelmäßige Backups',
];

export default function SotHome() {
  const { ref: benefitsRef, isVisible: benefitsVisible } = useSotScrollAnimation();
  const { ref: featuredRef, isVisible: featuredVisible } = useSotScrollAnimation();
  const featuredModules = getFeaturedModules();

  return (
    <div>
      {/* Hero Section */}
      <SotHeroSection
        title="Immobilienverwaltung. Neu gedacht."
        subtitle="Die KI-Software für Vermieter und Portfoliohalter. Verwalten Sie Objekte, Mieter und Dokumente — mit Armstrong, Ihrem intelligenten Assistenten."
        showDemo={true}
      />

      {/* Stats Section */}
      <SotStats />

      {/* Benefits Section */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Warum System of a Town?
            </span>
            <h2 className="sot-headline mt-4">Mehr Kontrolle. Weniger Chaos.</h2>
          </div>

          <div 
            ref={benefitsRef}
            className="grid md:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className={`sot-glass-card p-8 text-center sot-fade-in ${benefitsVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <benefit.icon className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {benefit.description}
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

      {/* Featured Modules */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Die Highlights
            </span>
            <h2 className="sot-headline mt-4">Beliebte Module</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Unsere leistungsstärksten Module — von KI-Office bis Finanzierung.
            </p>
          </div>

          <div ref={featuredRef}>
            <SotModuleShowcase highlightOnly showCategories={false} />
          </div>

          <div className="text-center mt-12">
            <Link to="/sot/module" className="sot-btn-secondary">
              Alle Module entdecken
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
        title="Bereit für den Start?"
        subtitle="14 Tage kostenlos testen. Keine Kreditkarte erforderlich."
        secondaryCta={{ label: 'Demo ansehen', to: '/sot/demo' }}
      />
    </div>
  );
}
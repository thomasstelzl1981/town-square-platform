/**
 * SoT Module — All Modules Showcase Page
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SotModuleShowcase, SotCTA } from '@/components/zone3/sot';
import { SOT_WEBSITE_MODULES } from '@/data/sotWebsiteModules';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

export default function SotModule() {
  const { ref, isVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div className="zone3-container relative z-10 text-center">
          <div className={`sot-fade-in ${isVisible ? 'visible' : ''}`} ref={ref}>
            <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
              Alle Module
            </span>
            <h1 className="sot-display mb-6">{SOT_WEBSITE_MODULES.length} Module.</h1>
            <h2 className="sot-headline mb-8" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              Ein System.
            </h2>
            <p className="sot-subheadline max-w-2xl mx-auto mb-10">
              Von Stammdaten über Dokumentenmanagement bis zur Finanzierung — 
              alles in einem Portal, intelligent verknüpft.
            </p>
            <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Module Categories Grid */}
      <section className="py-24">
        <div className="zone3-container">
          <SotModuleShowcase showCategories />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="sot-headline mb-6">Alle Module arbeiten zusammen</h3>
            <p className="sot-subheadline mb-8">
              Daten fließen automatisch zwischen Modulen. Ein Dokument im DMS ist automatisch 
              bei der richtigen Immobilie. Ein Kontakt erscheint in allen relevanten Kontexten. 
              Armstrong kennt alles.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/sot/demo" className="sot-btn-secondary">
                Demo erleben
              </Link>
              <Link to="/sot/preise" className="sot-btn-ghost">
                Preise ansehen →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA variant="minimal" />
    </div>
  );
}
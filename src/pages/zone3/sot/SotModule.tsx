/**
 * SoT Module Page — Full Module Overview
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { SotModuleShowcase, SotCTA } from '@/components/zone3/sot';
import { SOT_WEBSITE_MODULES, getModuleCount } from '@/data/sotWebsiteModules';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

export default function SotModule() {
  const { ref, isVisible } = useSotScrollAnimation();
  const moduleCount = getModuleCount();

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div className="zone3-container relative z-10 text-center">
          <div className={`sot-fade-in ${isVisible ? 'visible' : ''}`} ref={ref}>
            <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
              {moduleCount} Module
            </span>
            <h1 className="sot-display mb-6">
              Alles, was Sie brauchen.
            </h1>
            <p className="sot-subheadline max-w-3xl mx-auto mb-10">
              Von KI-Assistenz über Dokumentenmanagement bis Finanzübersicht — jedes Modul 
              löst ein echtes Problem. Wählen Sie, was Sie brauchen. Ignorieren Sie den Rest.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/sot/demo" className="sot-btn-secondary">
                <Play className="w-4 h-4" />
                Demo ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Module Showcase - Detailed */}
      <section className="py-12 lg:py-24">
        <div className="zone3-container">
          <SotModuleShowcase 
            showCategories={true} 
            variant="detailed"
          />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 lg:py-16" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
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
                <Play className="w-4 h-4" />
                Demo erleben
              </Link>
              <Link to="/sot/preise" className="sot-btn-ghost">
                Preise ansehen →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <SotCTA
        title="Welches Modul passt zu Ihnen?"
        subtitle="Starten Sie kostenlos und aktivieren Sie nur die Module, die Sie wirklich brauchen."
        variant="gradient"
      />
    </div>
  );
}

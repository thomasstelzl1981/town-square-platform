import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Box,
  Users, Sparkles, FolderOpen, Building2, FileText, Tag, Landmark,
  Search, FolderKanban, Mail, GraduationCap, ShoppingCart, Car,
  TrendingUp, Sun, Home, Handshake, Target, LineChart
} from 'lucide-react';
import { SOT_WEBSITE_MODULES } from '@/data/sotWebsiteModules';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Sparkles, FolderOpen, Building2, FileText, Tag, Landmark,
  Search, FolderKanban, Mail, GraduationCap, ShoppingCart, Car,
  TrendingUp, Sun, Home, Handshake, Target, LineChart, Box,
};

export default function SotModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();

  // Find module by code (e.g., "mod-01" → "MOD-01")
  const mod = SOT_WEBSITE_MODULES.find(
    m => m.code.toLowerCase() === moduleId?.toLowerCase()
  );

  if (!mod) {
    return (
      <div className="py-32">
        <div className="zone3-container text-center">
          <h1 className="sot-headline mb-4">Modul nicht gefunden</h1>
          <p className="sot-subheadline mb-8">Das gesuchte Modul existiert nicht.</p>
          <Link to="/website/sot/module" className="sot-btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Zur Modulübersicht
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic icon lookup
  const IconComponent = ICON_MAP[mod.icon] || Box;

  // Find adjacent modules for navigation
  const currentIndex = SOT_WEBSITE_MODULES.findIndex(m => m.code === mod.code);
  const prevModule = currentIndex > 0 ? SOT_WEBSITE_MODULES[currentIndex - 1] : null;
  const nextModule = currentIndex < SOT_WEBSITE_MODULES.length - 1 ? SOT_WEBSITE_MODULES[currentIndex + 1] : null;

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div 
          ref={heroRef}
          className={`zone3-container relative z-10 sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <Link to="/website/sot/module" className="inline-flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            <ArrowLeft className="w-4 h-4" />
            Alle Module
          </Link>
          
          <div className="flex items-center gap-5 mb-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
            >
              <IconComponent className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <div>
              <span className="text-sm font-mono" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {mod.category === 'client' ? 'Vermögen' : mod.category === 'service' ? 'Betrieb' : 'Fundament'}
              </span>
              <h1 className="sot-display text-3xl lg:text-4xl">{mod.name}</h1>
            </div>
          </div>
          
          <p className="sot-subheadline max-w-2xl text-lg lg:text-xl">
            {mod.tagline}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <p className="text-base lg:text-lg mb-10" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {mod.description}
              </p>
              
              {/* Pain Points */}
              <div className="mb-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'hsl(0 70% 60%)' }}>
                  Probleme, die wir lösen
                </h3>
                <ul className="space-y-3">
                  {mod.painPoints.map((pain, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">×</span>
                      <span className="text-sm line-through" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                        {pain}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>
                  Funktionen
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {mod.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--z3-accent))' }} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="sot-glass-card p-8 rounded-2xl sticky top-8">
                <h3 className="font-bold text-lg mb-4">Jetzt starten</h3>
                <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {mod.name} ist Teil der kostenlosen Plattform. Registrieren Sie sich und nutzen Sie alle Funktionen sofort.
                </p>
                <Link to="/auth?mode=register&source=sot" className="sot-btn-primary w-full justify-center mb-3">
                  Kostenlos registrieren
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/website/sot/demo" className="sot-btn-secondary w-full justify-center">
                  Demo ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module Navigation */}
      <section className="py-8 border-t" style={{ borderColor: 'hsl(var(--z3-border))' }}>
        <div className="zone3-container">
          <div className="flex justify-between items-center">
            {prevModule ? (
              <Link 
                to={`/website/sot/module/${prevModule.code.toLowerCase()}`}
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: 'hsl(var(--z3-muted-foreground))' }}
              >
                <ArrowLeft className="w-4 h-4" />
                {prevModule.name}
              </Link>
            ) : <div />}
            {nextModule ? (
              <Link 
                to={`/website/sot/module/${nextModule.code.toLowerCase()}`}
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: 'hsl(var(--z3-muted-foreground))' }}
              >
                {nextModule.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        variant="gradient"
        title="Bereit für den Start?"
        subtitle="Alle Module kostenlos. Credits nur für KI-Aktionen."
      />
    </div>
  );
}

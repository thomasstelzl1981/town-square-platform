/**
 * SoT Home — Marketplace (Investment Engine + Werbeinhalt + Demo Login)
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Search, Upload, Calculator } from 'lucide-react';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { SotDemoLogin } from '@/components/zone3/sot/SotDemoLogin';
import { useSotTransition } from '@/components/zone3/sot/SotLoginTransition';

const threeWays = [
  {
    icon: Search,
    title: 'Investment finden',
    description: 'Durchsuchen Sie den Marktplatz nach renditestarken Kapitalanlagen.',
    cta: 'Suche starten',
    href: '/website/sot/capital',
  },
  {
    icon: Upload,
    title: 'Objekt einreichen',
    description: 'Laden Sie Ihr Exposé hoch und starten Sie den Vertrieb.',
    cta: 'Einreichen',
    href: '/website/sot/projects',
  },
  {
    icon: Calculator,
    title: 'Finanzierung starten',
    description: 'Berechnen Sie Ihre Finanzierung und stellen Sie direkt eine Anfrage.',
    cta: 'Berechnen',
    href: '/website/sot/capital',
  },
];

const trustBadges = [
  'DSGVO-konform',
  'Deutsche Server',
  'Verschlüsselte Daten',
  'KI-gestützt',
];

export default function SotHome() {
  const { ref: waysRef, isVisible: waysVisible } = useSotScrollAnimation();
  const { triggerTransition } = useSotTransition();

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Hero */}
      <section className="pt-8 lg:pt-16 text-center">
        <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
          Marketplace
        </span>
        <h1 className="sot-display mt-4">Investments finden.</h1>
        <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
          Die Plattform für Kapitalanlage, Projekte und Finanzierung.
        </p>

        {/* Investment Engine Placeholder */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="sot-glass-card p-6 lg:p-8 rounded-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {['Ort', 'Budget', 'Rendite', 'Objektart'].map((field) => (
                <div key={field} className="text-left">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                    {field}
                  </label>
                  <div 
                    className="h-10 rounded-lg px-3 flex items-center text-sm"
                    style={{ 
                      backgroundColor: 'hsl(var(--z3-background)/0.5)',
                      border: '1px solid hsl(var(--z3-border)/0.5)',
                      color: 'hsl(var(--z3-muted-foreground))'
                    }}
                  >
                    Alle
                  </div>
                </div>
              ))}
            </div>
            <button className="sot-btn-primary w-full justify-center">
              <Search className="w-4 h-4" />
              Investments durchsuchen
            </button>
          </div>
        </div>
      </section>

      {/* Drei Wege */}
      <section>
        <div className="text-center mb-10">
          <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
            Drei Wege
          </span>
          <h2 className="sot-headline mt-4">So starten Sie.</h2>
        </div>

        <div 
          ref={waysRef}
          className="grid sm:grid-cols-3 gap-4 lg:gap-6"
        >
          {threeWays.map((item, index) => (
            <Link
              key={item.title}
              to={item.href}
              className={`sot-glass-card p-6 sot-fade-in group ${waysVisible ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div 
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--z3-accent)/0.1)' }}
              >
                <item.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {item.description}
              </p>
              <span className="text-sm font-semibold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all" style={{ color: 'hsl(var(--z3-accent))' }}>
                {item.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Demo Login — "Testen Sie unser System" */}
      <section>
        <SotDemoLogin onLoginSuccess={triggerTransition} />
      </section>

      {/* Trust */}
      <section 
        className="py-8 rounded-2xl"
        style={{ backgroundColor: 'hsl(var(--z3-card)/0.5)' }}
      >
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12">
          {trustBadges.map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
              <span className="text-sm font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

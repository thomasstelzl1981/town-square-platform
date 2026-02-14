/**
 * SoT Home — Portal-Clone Startseite
 * SubBar + Welcome on Board + Widget-Kacheln + Investment Engine (3-col breit)
 */
import { Link } from 'react-router-dom';
import { Search, Upload, Calculator, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card } from '@/components/ui/card';
import { CONTAINER, HEADER } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const subBarItems = [
  { label: 'Real Estate', href: '/website/sot/real-estate' },
  { label: 'Capital', href: '/website/sot/capital' },
  { label: 'Projects', href: '/website/sot/projects' },
  { label: 'Mgmt', href: '/website/sot/mgmt' },
  { label: 'Energy', href: '/website/sot/energy' },
  { label: 'Career', href: '/website/sot/career' },
];

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

export default function SotHome() {
  return (
    <div className="flex flex-col h-full">
      {/* SubBar — Pill Tabs */}
      <div className="flex items-center justify-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none bg-background/50 border-y border-border/50">
        {subBarItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="px-3 py-1.5 rounded-xl text-sm uppercase tracking-wide whitespace-nowrap nav-tab-glass text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Centered Content */}
      <div className={cn('flex-1 overflow-y-auto flex items-center justify-center', CONTAINER.PADDING)}>
        <div className={cn(CONTAINER.MAX_WIDTH, 'mx-auto flex flex-col items-center gap-8')}>
          {/* Headline */}
          <h1 className={cn(HEADER.PAGE_TITLE, 'text-center w-full')}>Investment Engine</h1>

          {/* Investment Engine — EK + zvE inputs */}
          <div className="w-full flex justify-center">
            <Card className="glass-card border-primary/20 px-3 py-3 inline-flex items-center gap-2">
              <button
                className="h-10 w-10 rounded-xl flex items-center justify-center nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all shrink-0"
                title="Erweiterte Suche"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
              </button>
              <input
                type="number"
                placeholder="Eigenkapital €"
                className="h-10 w-40 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="number"
                placeholder="zvE €"
                className="h-10 w-40 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                className="h-10 w-10 rounded-xl flex items-center justify-center nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all shrink-0"
                title="Investments durchsuchen"
              >
                <Search className="w-4 h-4 text-primary" />
              </button>
            </Card>
          </div>

          {/* Widget Tiles — square, blue border, dashboard style */}
          <WidgetGrid variant="widget" className="w-full">
            {threeWays.map((item) => (
              <WidgetCell key={item.title}>
                <Link to={item.href} className="block h-full">
                  <Card className="glass-card border-primary/30 hover:border-primary/60 transition-all h-full p-6 flex flex-col justify-between group cursor-pointer">
                    <div>
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mb-4">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all mt-4">
                      {item.cta}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Card>
                </Link>
              </WidgetCell>
            ))}
          </WidgetGrid>
        </div>
      </div>
    </div>
  );
}

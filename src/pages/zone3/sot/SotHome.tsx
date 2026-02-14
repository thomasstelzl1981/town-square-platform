/**
 * SoT Home — 5 Scroll-Snap Sektionen
 * Screen 1: Investment Engine (Hero)
 * Screen 2: Drei Wege (Widget-Kacheln)
 * Screen 3: Plattform-Vorteile
 * Screen 4: Social Proof / KPIs
 * Screen 5: CTA / Login
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Upload, Calculator, SlidersHorizontal, ArrowRight,
  ChevronDown, Brain, Shield, ShoppingBag, Landmark, Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ── SubBar Items ── */
const subBarItems = [
  { label: 'Real Estate', href: '/website/sot/real-estate' },
  { label: 'Capital', href: '/website/sot/capital' },
  { label: 'Projects', href: '/website/sot/projects' },
  { label: 'Mgmt', href: '/website/sot/mgmt' },
  { label: 'Energy', href: '/website/sot/energy' },
  { label: 'Career', href: '/website/sot/career' },
];

/* ── Three Ways Data ── */
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

/* ── Features Data ── */
const features = [
  {
    icon: Brain,
    title: 'KI-gestützte Analyse',
    description: 'Armstrong analysiert Exposés, bewertet Cashflows und erkennt Risiken automatisch.',
  },
  {
    icon: Shield,
    title: 'Steueroptimiert',
    description: 'AfA, zvE-Hebel und Abschreibungsmodelle direkt in der Investment Engine integriert.',
  },
  {
    icon: ShoppingBag,
    title: 'Marktplatz',
    description: 'Über 1.000 geprüfte Objekte von Partnern und Maklern deutschlandweit.',
  },
  {
    icon: Landmark,
    title: 'End-to-End Finanzierung',
    description: 'Von der Anfrage bis zur Auszahlung — alles in einer Plattform.',
  },
];

/* ── KPI Counter Hook ── */
function useCountUp(target: number, duration = 2000, trigger = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return value;
}

/* ── Intersection Observer Hook ── */
function useInView() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ── Shared snap-section wrapper ── */
function SnapSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('sot-snap-section', className)}>
      {children}
    </section>
  );
}

/* ── Scroll Indicator ── */
function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
      <ChevronDown className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function SotHome() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');

  // KPI section
  const kpiSection = useInView();
  const kpi1 = useCountUp(1200, 2000, kpiSection.inView);
  const kpi2 = useCountUp(85, 2000, kpiSection.inView);
  const kpi3 = useCountUp(48, 2000, kpiSection.inView);

  return (
    <>
      {/* ── SubBar (sticky inside scroll container) ── */}
      <div className="sticky top-0 z-20 flex items-center justify-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none bg-background/80 backdrop-blur-md border-y border-border/50">
        {subBarItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="px-3 py-1.5 rounded-xl text-sm uppercase tracking-wide whitespace-nowrap nav-tab-glass text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
          SCREEN 1 — Investment Engine (Hero)
          ════════════════════════════════════════════════ */}
      <SnapSection>
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 px-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center">
            Investment Engine
          </h1>

          <Card className="glass-card border-primary/20 px-4 py-4 w-full">
            {/* Input Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-10 w-10 rounded-xl flex items-center justify-center nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all shrink-0 self-start sm:self-auto"
                title="Erweiterte Parameter"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
              </button>

              <input
                type="number"
                placeholder="Eigenkapital"
                className="h-10 flex-1 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="number"
                placeholder="zu versteuerndes Einkommen"
                className="h-10 flex-1 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />

              <button
                className="h-10 w-10 rounded-xl flex items-center justify-center nav-tab-glass border border-primary/20 hover:border-primary/50 transition-all shrink-0 self-end sm:self-auto"
                title="Investments durchsuchen"
              >
                <Search className="w-4 h-4 text-primary" />
              </button>
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Kaufpreis €', ph: '250.000' },
                  { label: 'Monatsmiete €', ph: '800' },
                  { label: 'Laufzeit (Jahre)', ph: '10' },
                  { label: 'Tilgungsrate %', ph: '2' },
                  { label: 'Gebäudeanteil %', ph: '80' },
                  { label: 'Verwaltung €/Monat', ph: '25' },
                  { label: 'Wertzuwachs %/Jahr', ph: '1.5' },
                  { label: 'Mietsteigerung %/Jahr', ph: '1.5' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input
                      type="number"
                      placeholder={f.ph}
                      className="h-9 rounded-lg px-3 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <ScrollIndicator />
      </SnapSection>

      {/* ════════════════════════════════════════════════
          SCREEN 2 — Drei Wege
          ════════════════════════════════════════════════ */}
      <SnapSection>
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8 px-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center">
            Drei Wege zur Kapitalanlage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {threeWays.map((item) => (
              <Link key={item.title} to={item.href} className="block">
                <Card className="glass-card border-primary/30 hover:border-primary/60 transition-all p-6 flex flex-col justify-between h-full group cursor-pointer hover:scale-[1.02]">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
            ))}
          </div>
        </div>
        <ScrollIndicator />
      </SnapSection>

      {/* ════════════════════════════════════════════════
          SCREEN 3 — Plattform-Vorteile
          ════════════════════════════════════════════════ */}
      <SnapSection>
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8 px-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center">
            Warum System of a Town?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {features.map((f) => (
              <Card key={f.title} className="glass-card border-border/40 p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
        <ScrollIndicator />
      </SnapSection>

      {/* ════════════════════════════════════════════════
          SCREEN 4 — Social Proof / KPIs
          ════════════════════════════════════════════════ */}
      <SnapSection>
        <section ref={kpiSection.ref as React.RefObject<HTMLElement>} className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10 px-4">
          <div className="grid grid-cols-3 gap-8 w-full text-center">
            <div>
              <div className="sot-stat-value">{kpi1.toLocaleString('de-DE')}+</div>
              <div className="sot-stat-label">Nutzer</div>
            </div>
            <div>
              <div className="sot-stat-value">{kpi2} Mio €</div>
              <div className="sot-stat-label">Volumen</div>
            </div>
            <div>
              <div className="sot-stat-value">{kpi3 / 10}</div>
              <div className="sot-stat-label">Bewertung</div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground text-center max-w-lg">
            Vertrauen Sie auf Deutschlands modernste Investment-Plattform.
          </p>
        </section>
        <ScrollIndicator />
      </SnapSection>

      {/* ════════════════════════════════════════════════
          SCREEN 5 — CTA / Login
          ════════════════════════════════════════════════ */}
      <SnapSection>
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8 px-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center">
            Bereit für Ihr erstes Investment?
          </h2>

          <div className="flex w-full gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail eingeben"
              className="h-12 flex-1 rounded-full px-5 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button className="sot-btn-primary h-12 px-6 rounded-full flex items-center gap-2">
              Starten
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/website/sot/demo" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              Demo ansehen
            </Link>
            <span className="opacity-30">|</span>
            <Link to="/website/sot/contact" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              Kontakt
            </Link>
          </div>
        </div>
      </SnapSection>
    </>
  );
}

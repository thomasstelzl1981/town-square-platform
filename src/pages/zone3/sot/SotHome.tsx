/**
 * SoT Home — Digitalisierung greifbar machen
 * Aurora Borealis aesthetic, Marketing-fokussiert
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Wallet, Zap, Brain, Car,
  ArrowRight, Sparkles, Globe, Lock, Shield,
  CheckCircle2, ChevronRight, Cpu, Eye, Workflow,
  GraduationCap, ShoppingCart, Sun, Users, FolderOpen,
  MessageSquare, Landmark, Search, Tag, Mail, PawPrint,
  Clock, AlertTriangle, TrendingDown, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSotTheme } from '@/hooks/useSotTheme';

/* ── Hero Feature Pills ── */
const heroPills = [
  { icon: Building2, label: 'Immobilien' },
  { icon: Wallet, label: 'Finanzen' },
  { icon: FileText, label: 'Dokumente' },
  { icon: Car, label: 'Fuhrpark' },
  { icon: Sun, label: 'Energie' },
  { icon: Brain, label: 'KI-Assistent' },
];

/* ── Pain Points ── */
const painPoints = [
  {
    icon: Clock,
    stat: '12h',
    unit: '/ Woche',
    title: 'Zeitverlust',
    desc: 'verbringen Unternehmer mit Suchen, Sortieren und manueller Verwaltung.',
  },
  {
    icon: AlertTriangle,
    stat: '5+',
    unit: 'Tools',
    title: 'Tool-Chaos',
    desc: 'nutzen KMU durchschnittlich — ohne Verbindung zueinander.',
  },
  {
    icon: TrendingDown,
    stat: '3.200€',
    unit: '/ Jahr',
    title: 'Versteckte Kosten',
    desc: 'gehen durch ineffiziente Prozesse und fehlende Übersicht verloren.',
  },
];

/* ── 3 Areas ── */
const areas = [
  {
    key: 'client',
    label: 'CLIENT',
    title: 'Ihr Vermögen',
    desc: 'Finanzen, Immobilien, Finanzierung und Investments — alles, was mit Ihrem Vermögen zu tun hat. Übersicht statt Zettelwirtschaft.',
    color: 'from-blue-500/20 to-blue-600/5',
    accentHsl: '217 91% 60%',
    modules: [
      { icon: Wallet, name: 'Finanzanalyse', desc: 'Vermögen, Cashflow, Szenarien' },
      { icon: Building2, name: 'Immobilien', desc: 'Portfolio, Objektakten, Mietverträge' },
      { icon: Landmark, name: 'Finanzierung', desc: 'Selbstauskunft, bankfertige Unterlagen' },
      { icon: Search, name: 'Investment-Suche', desc: 'Kapitalanlagen finden & bewerten' },
      { icon: Tag, name: 'Verkauf', desc: 'Ohne Makler verkaufen — 6% sparen' },
      { icon: Sparkles, name: 'KI Office', desc: 'E-Mails, Briefe, Termine, WhatsApp' },
    ],
  },
  {
    key: 'service',
    label: 'SERVICE',
    title: 'Ihr Betrieb',
    desc: 'Fuhrpark, Energie, Kommunikation, Fortbildung und Einkauf — alles, was Ihr Unternehmen am Laufen hält. Digital statt Papierchaos.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    accentHsl: '160 60% 45%',
    modules: [
      { icon: Car, name: 'Fahrzeuge', desc: 'Fuhrpark, TÜV, Fahrtenbuch, Kosten' },
      { icon: Sun, name: 'Photovoltaik', desc: 'PV-Erträge, Wartung, Amortisation' },
      { icon: Mail, name: 'Kommunikation Pro', desc: 'E-Mail-Serien, Tracking, KI-Agenten' },
      { icon: GraduationCap, name: 'Fortbildung', desc: 'Kurse, Bücher, Zertifikate' },
      { icon: ShoppingCart, name: 'Shops', desc: 'Amazon Business, OTTO, Bestellungen' },
      { icon: PawPrint, name: 'Haustiere & mehr', desc: 'Tierakten, Smart Home, Mieterportal' },
    ],
  },
  {
    key: 'base',
    label: 'BASE',
    title: 'Ihr Fundament',
    desc: 'Dokumente, Kontakte und KI-Intelligenz — das digitale Rückgrat Ihres Unternehmens. Einmal aufgebaut, immer verfügbar.',
    color: 'from-violet-500/20 to-violet-600/5',
    accentHsl: '275 45% 50%',
    modules: [
      { icon: FolderOpen, name: 'DMS', desc: 'Datenraum, Posteingang, KI-Sortierung' },
      { icon: Users, name: 'Stammdaten', desc: 'Profile, Kontakte, Verträge, Sync' },
      { icon: Brain, name: 'Armstrong', desc: 'KI-Co-Pilot für Ihren gesamten Datenraum' },
    ],
  },
];

/* ── Armstrong Highlights ── */
const armstrongHighlights = [
  { icon: Eye, title: 'Kein Upload nötig', desc: 'Armstrong liest Ihren gesamten Datenraum — einmal aktivieren, dauerhaft nutzen.' },
  { icon: Cpu, title: 'Pay per Use', desc: 'Keine monatliche Gebühr für KI. Sie zahlen nur, wenn Armstrong wirklich für Sie arbeitet.' },
  { icon: Shield, title: 'Volle Kontrolle', desc: 'Sie sehen den Preis vorher. Keine versteckten Kosten, keine Überraschungen.' },
];

/* ── Steps ── */
const steps = [
  { num: '01', title: 'Registrieren', desc: 'Kostenfrei in 30 Sekunden. Keine Kreditkarte.' },
  { num: '02', title: 'Module aktivieren', desc: 'Wählen Sie, was Sie brauchen — vom Fuhrpark bis zur Immobilie.' },
  { num: '03', title: 'Datenraum befüllen', desc: 'Importieren, scannen oder manuell — Magic Intake hilft.' },
  { num: '04', title: 'KI arbeiten lassen', desc: 'Armstrong organisiert, analysiert und automatisiert für Sie.' },
];

/* ── Stats ── */
const stats = [
  { value: '15+', label: 'Module' },
  { value: 'DSGVO', label: 'Konform' },
  { value: '24/7', label: 'KI-Assistenz' },
  { value: '0 €', label: 'Grundgebühr' },
];

/* ── Replaced-By Badges ── */
const replacedTools = [
  'Excel-Listen', 'Papierordner', 'WhatsApp-Gruppen', 'E-Mail-Chaos',
  'Separate Buchhaltung', 'Makler-Portale', 'Post-Its', 'Cloud-Wirrwarr',
];

/* ── Scroll animation hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn('transition-all duration-700 ease-out', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function SotHome() {
  const [email, setEmail] = useState('');
  const { isDark } = useSotTheme();

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── AURORA BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-20 -right-20 w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{
            background: isDark
              ? 'radial-gradient(circle, hsl(275 60% 30% / 0.4) 0%, hsl(275 50% 20% / 0.1) 60%, transparent 80%)'
              : 'radial-gradient(circle, hsl(275 40% 88% / 0.5) 0%, transparent 70%)',
            animation: 'sot-aurora-pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/4 -left-32 w-[500px] h-[600px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? 'radial-gradient(circle, hsl(340 50% 25% / 0.3) 0%, hsl(340 40% 15% / 0.1) 60%, transparent 80%)'
              : 'radial-gradient(circle, hsl(340 30% 92% / 0.4) 0%, transparent 70%)',
            animation: 'sot-aurora-drift 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background: isDark
              ? 'radial-gradient(circle, hsl(180 60% 22% / 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(180 40% 92% / 0.3) 0%, transparent 70%)',
            animation: 'sot-aurora-pulse 10s ease-in-out infinite 2s',
          }}
        />
        {isDark && (
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(1px 1px at 15% 25%, hsl(275 60% 70% / 0.5) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 35% 65%, hsl(340 50% 70% / 0.4) 1px, transparent 0),
              radial-gradient(1px 1px at 55% 15%, hsl(217 80% 75% / 0.5) 1px, transparent 0),
              radial-gradient(2px 2px at 75% 45%, hsl(180 60% 65% / 0.3) 1px, transparent 0),
              radial-gradient(1px 1px at 10% 75%, hsl(275 50% 60% / 0.3) 1px, transparent 0),
              radial-gradient(1px 1px at 85% 10%, hsl(340 40% 65% / 0.4) 1px, transparent 0)`,
          }} />
        )}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] rounded-[50%] rotate-12"
          style={{ border: `1px solid ${isDark ? 'hsl(275 50% 50% / 0.06)' : 'hsl(217 50% 80% / 0.15)'}` }}
        />
      </div>

      <div className="relative z-10">
        {/* ── HERO ── */}
        <section className="relative py-28 sm:py-36 lg:py-44">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[120px]"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse, hsl(275 50% 35% / 0.12) 0%, hsl(217 80% 50% / 0.08) 40%, transparent 70%)'
                : 'radial-gradient(ellipse, hsl(217 60% 90% / 0.4) 0%, transparent 70%)',
            }}
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm mb-8 text-xs font-medium text-muted-foreground">
              <Rocket className="w-3.5 h-3.5 text-primary" />
              Digitalisierung — greifbar, buchbar, umsetzbar
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                Chaos beseitigen.
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent/80 bg-clip-text text-transparent">
                Digitalisierung leben.
              </span>
            </h1>

            <h2 className="mt-6 text-lg sm:text-xl lg:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Eine Plattform für Immobilien, Finanzen, Fuhrpark, Dokumente und mehr — 
              mit KI-Assistent. Ohne große Investitionen. Sofort einsatzbereit.
            </h2>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {heroPills.map((pill) => (
                <div
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm text-xs font-medium text-muted-foreground"
                >
                  <pill.icon className="w-3 h-3 text-primary/70" />
                  {pill.label}
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth?mode=register&source=sot"
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/website/sot/plattform"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/40 transition-all duration-300"
              >
                Plattform entdecken
              </Link>
            </div>
          </div>
        </section>

        {/* ── PAIN POINTS ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">Das Problem</h2>
                <p className="text-2xl sm:text-3xl font-bold">Was kostet Sie fehlendes System?</p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {painPoints.map((pp, i) => (
                <RevealSection key={pp.title} delay={i * 100}>
                  <div className={cn(
                    'rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-7 text-center',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <pp.icon className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {pp.stat}<span className="text-lg text-muted-foreground ml-1">{pp.unit}</span>
                    </div>
                    <h3 className="text-sm font-semibold mt-2 mb-1">{pp.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{pp.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT WE REPLACE ── */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-muted-foreground">Was Sie mit System of a Town nicht mehr brauchen:</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {replacedTools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-destructive/20 bg-destructive/5 text-xs font-medium text-muted-foreground line-through decoration-destructive/40"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── 3 AREAS ── */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <h2 className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">Eine Plattform — 3 Bereiche</h2>
                <p className="text-2xl sm:text-3xl font-bold">15+ Module. Ein System. Null Chaos.</p>
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                  Client für Ihr Vermögen, Service für Ihren Betrieb, Base für Ihr digitales Fundament.
                </p>
              </div>
            </RevealSection>

            <div className="space-y-8">
              {areas.map((area, areaIdx) => (
                <RevealSection key={area.key} delay={areaIdx * 150}>
                  <div className={cn(
                    'rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6 sm:p-8',
                    'hover:border-primary/20 transition-colors duration-300',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.15em] uppercase">
                        {area.label}
                      </span>
                      <h3 className="text-lg font-semibold">{area.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{area.desc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {area.modules.map((mod) => (
                        <div key={mod.name} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <mod.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{mod.name}</p>
                            <p className="text-xs text-muted-foreground">{mod.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/website/sot/plattform"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Alle Module im Detail
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── ARMSTRONG INTELLIGENCE HIGHLIGHT ── */}
        <section className="py-20 sm:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <RevealSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6 text-xs font-medium text-primary">
                  <Brain className="w-3.5 h-3.5" />
                  Armstrong Intelligence
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Ihre KI kennt Ihr<br />gesamtes Unternehmen.
                </h2>
                <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Kein manuelles Hochladen. Kein Copy-Paste. Armstrong liest Ihren gesamten Datenraum — 
                  Dokumente, Verträge, E-Mails, Finanzen. Fragen Sie einfach.
                </p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {armstrongHighlights.map((f, i) => (
                <RevealSection key={f.title} delay={i * 100}>
                  <div className={cn(
                    'group rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-7 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 text-center',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>

            {/* Example queries */}
            <RevealSection delay={300}>
              <div className={cn(
                'mt-8 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6 sm:p-8',
                !isDark && 'shadow-sm'
              )}>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Beispiel-Anfragen an Armstrong</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Welche Fahrzeuge brauchen bald TÜV?',
                    'Fasse alle Mietverträge zusammen',
                    'Erstelle eine Übersicht offener Rechnungen',
                    'Was kostet mich mein Fuhrpark pro Monat?',
                    'Vergleiche die Nebenkostenabrechnungen 2024 und 2025',
                  ].map((q) => (
                    <div key={q} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm text-foreground">
                      <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>

            <div className="text-center mt-8">
              <Link
                to="/website/sot/intelligenz"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                Mehr über Armstrong Intelligence
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── SO FUNKTIONIERT ES ── */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">In 4 Schritten digital</h2>
                <p className="mt-4 text-muted-foreground">Keine langen Einführungsprojekte. Kein IT-Budget nötig.</p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <RevealSection key={s.num} delay={i * 100}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary/20 mb-3">{s.num}</div>
                    <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className={cn(
                'rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-8 sm:p-12',
                !isDark && 'shadow-sm'
              )}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                        {s.value}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] to-transparent" />
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <RevealSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/40 mb-6 text-xs font-medium text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Jetzt Digitalisierung starten
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Bereit für Ordnung?
              </h2>
              <p className="text-muted-foreground mb-10 leading-relaxed">
                Starten Sie kostenlos — keine Kreditkarte, kein Abo, keine Grundgebühr. 
                Digitalisierung, die Sie sofort nutzen können.
              </p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail eingeben"
                  className="h-12 flex-1 rounded-full px-5 text-sm bg-card/60 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm transition-all"
                />
                <button className="h-12 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 inline-flex items-center gap-2">
                  Starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <Link to="/website/sot/demo" className="hover:text-foreground transition-colors">
                  Demo ansehen
                </Link>
                <span className="w-1 h-1 rounded-full bg-border" />
                <Link to="/website/sot/karriere" className="hover:text-foreground transition-colors">
                  Kontakt
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>
      </div>
    </div>
  );
}

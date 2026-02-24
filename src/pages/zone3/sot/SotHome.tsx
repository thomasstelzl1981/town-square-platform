/**
 * SoT Home — Anthropic/Revolut-inspired Premium Design
 * Bold gradients, hero images, vibrant colors, strong visual hierarchy
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Wallet, Zap, Brain, Car,
  ArrowRight, Sparkles, Globe, Shield,
  CheckCircle2, ChevronRight, Cpu, Eye,
  GraduationCap, ShoppingCart, Sun, Users, FolderOpen,
  MessageSquare, Landmark, Search, Tag, Mail, PawPrint,
  Clock, AlertTriangle, TrendingDown, Rocket, Play,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSotTheme } from '@/hooks/useSotTheme';
import { Brand } from '@/components/ui/brand';
import sotHeroDashboard from '@/assets/sot-hero-dashboard.jpg';
import sotAiIntelligence from '@/assets/sot-ai-intelligence.jpg';
import sotWorkspace from '@/assets/sot-workspace.jpg';

/* ── Hero Feature Pills ── */
const heroPills = [
  { icon: Building2, label: 'Immobilien', color: 'from-blue-500 to-blue-600' },
  { icon: Wallet, label: 'Finanzen', color: 'from-emerald-500 to-emerald-600' },
  { icon: FileText, label: 'Dokumente', color: 'from-violet-500 to-violet-600' },
  { icon: Car, label: 'Fuhrpark', color: 'from-amber-500 to-amber-600' },
  { icon: Sun, label: 'Energie', color: 'from-orange-500 to-orange-600' },
  { icon: Brain, label: 'KI-Assistent', color: 'from-pink-500 to-pink-600' },
];

/* ── Pain Points ── */
const painPoints = [
  {
    icon: Clock,
    stat: '12h',
    unit: '/ Woche',
    title: 'Zeitverlust',
    desc: 'verbringen Unternehmer mit Suchen, Sortieren und manueller Verwaltung.',
    gradient: 'from-red-500/20 to-orange-500/10',
  },
  {
    icon: AlertTriangle,
    stat: '5+',
    unit: 'Tools',
    title: 'Tool-Chaos',
    desc: 'nutzen KMU durchschnittlich — ohne Verbindung zueinander.',
    gradient: 'from-amber-500/20 to-yellow-500/10',
  },
  {
    icon: TrendingDown,
    stat: '3.200€',
    unit: '/ Jahr',
    title: 'Versteckte Kosten',
    desc: 'gehen durch ineffiziente Prozesse und fehlende Übersicht verloren.',
    gradient: 'from-rose-500/20 to-red-500/10',
  },
];

/* ── 3 Areas ── */
const areas = [
  {
    key: 'client',
    label: 'CLIENT',
    title: 'Ihr Vermögen',
    desc: 'Finanzen, Immobilien, Finanzierung und Investments — alles, was mit Ihrem Vermögen zu tun hat.',
    gradient: 'from-blue-600 to-indigo-600',
    bgGlow: 'bg-blue-500/10',
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
    desc: 'Fuhrpark, Energie, Kommunikation, Fortbildung und Einkauf — alles digital.',
    gradient: 'from-emerald-600 to-teal-600',
    bgGlow: 'bg-emerald-500/10',
    modules: [
      { icon: Car, name: 'Fahrzeuge', desc: 'Fuhrpark, TÜV, Fahrtenbuch, Kosten' },
      { icon: Sun, name: 'Photovoltaik', desc: 'PV-Erträge, Wartung, Amortisation' },
      { icon: Mail, name: 'Kommunikation', desc: 'E-Mail-Serien, Tracking, KI-Agenten' },
      { icon: GraduationCap, name: 'Fortbildung', desc: 'Kurse, Bücher, Zertifikate' },
      { icon: ShoppingCart, name: 'Shops', desc: 'Amazon Business, OTTO, Bestellungen' },
      { icon: PawPrint, name: 'Haustiere', desc: 'Tierakten, Pension, Smart Home' },
    ],
  },
  {
    key: 'base',
    label: 'BASE',
    title: 'Ihr Fundament',
    desc: 'Dokumente, Kontakte und KI-Intelligenz — das digitale Rückgrat.',
    gradient: 'from-violet-600 to-purple-600',
    bgGlow: 'bg-violet-500/10',
    modules: [
      { icon: FolderOpen, name: 'DMS', desc: 'Datenraum, Posteingang, KI-Sortierung' },
      { icon: Users, name: 'Stammdaten', desc: 'Profile, Kontakte, Verträge, Sync' },
      { icon: Brain, name: <Brand>Armstrong</Brand>, desc: 'KI-Co-Pilot für Ihren gesamten Datenraum' },
    ],
  },
];

/* ── Stats ── */
const stats = [
  { value: '15+', label: 'Module', color: 'text-blue-400' },
  { value: 'DSGVO', label: 'Konform', color: 'text-emerald-400' },
  { value: '24/7', label: 'KI-Assistenz', color: 'text-violet-400' },
  { value: '0 €', label: 'Grundgebühr', color: 'text-amber-400' },
];

/* ── Replaced ── */
const replacedTools = [
  'Excel-Listen', 'Papierordner', 'WhatsApp-Gruppen', 'E-Mail-Chaos',
  'Separate Buchhaltung', 'Makler-Portale', 'Post-Its', 'Cloud-Wirrwarr',
];

/* ── Steps ── */
const steps = [
  { num: '01', title: 'Registrieren', desc: 'Kostenfrei in 30 Sekunden. Keine Kreditkarte.', icon: Rocket },
  { num: '02', title: 'Module aktivieren', desc: 'Wählen Sie, was Sie brauchen.', icon: Zap },
  { num: '03', title: 'Datenraum befüllen', desc: 'Importieren, scannen oder Magic Intake.', icon: FileText },
  { num: '04', title: 'KI arbeiten lassen', desc: <><Brand>Armstrong</Brand> organisiert und automatisiert.</>, icon: Brain },
];

/* ── Scroll animation ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn('transition-all duration-700 ease-out', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10', className)}
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
      {/* ── HERO — Full-width cinematic ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={sotHeroDashboard} 
            alt="SoT Platform Dashboard" 
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-xs font-semibold text-white/90 tracking-wider uppercase">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Jetzt verfügbar — Digitalisierung für Unternehmer
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">
              Chaos beseitigen.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Digitalisierung leben.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl">
              Eine Plattform für Immobilien, Finanzen, Fuhrpark, Dokumente und mehr — 
              mit KI-Assistent. Ohne große Investitionen.
            </p>

            {/* Hero Pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {heroPills.map((pill) => (
                <div
                  key={pill.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/80"
                >
                  <pill.icon className="w-3.5 h-3.5" />
                  {pill.label}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth?mode=register&source=sot"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-black text-sm font-bold hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/website/sot/demo"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                Demo ansehen
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR — Anthropic-style minimal ── */}
      <section className="py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s) => (
              <Reveal key={s.label}>
                <div className="text-center">
                  <div className={cn('text-4xl sm:text-5xl font-black tracking-tight', s.color)}>
                    {s.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 uppercase tracking-[0.2em] font-semibold">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS — Bold gradient cards ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold tracking-wider uppercase mb-4">
                Das Problem
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Was kostet Sie<br />fehlendes System?
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {painPoints.map((pp, i) => (
              <Reveal key={pp.title} delay={i * 120}>
                <div className={cn(
                  'relative rounded-3xl border border-border/30 p-8 overflow-hidden group hover:-translate-y-1 transition-all duration-300',
                  isDark ? 'bg-card/60' : 'bg-card shadow-lg shadow-black/5'
                )}>
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', pp.gradient)} />
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
                      <pp.icon className="w-7 h-7 text-destructive" />
                    </div>
                    <div className="text-4xl font-black text-foreground tracking-tight">
                      {pp.stat}<span className="text-lg text-muted-foreground ml-1 font-medium">{pp.unit}</span>
                    </div>
                    <h3 className="text-base font-bold mt-2 mb-2">{pp.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pp.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPLACED TOOLS — Scrolling banner ── */}
      <section className="py-12 overflow-hidden border-y border-border/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Was Sie nicht mehr brauchen</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto px-4">
          {replacedTools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-destructive/20 bg-destructive/5 text-sm font-medium text-muted-foreground line-through decoration-destructive/40 decoration-2"
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* ── 3 AREAS — Vibrant gradient headers ── */}
      <section className="py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                Eine Plattform — 3 Bereiche
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                15+ Module. Ein System.
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent">
                  Null Chaos.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="space-y-12">
            {areas.map((area, areaIdx) => (
              <Reveal key={area.key} delay={areaIdx * 100}>
                <div className={cn(
                  'rounded-3xl overflow-hidden border border-border/20',
                  isDark ? 'bg-card/40' : 'bg-card shadow-xl shadow-black/5'
                )}>
                  {/* Area header with gradient */}
                  <div className={cn('bg-gradient-to-r p-6 sm:p-8', area.gradient)}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-sm">
                        {area.label}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">{area.title}</h3>
                    <p className="text-sm text-white/75 mt-2 max-w-xl">{area.desc}</p>
                  </div>

                  {/* Modules grid */}
                  <div className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {area.modules.map((mod, modIdx) => (
                        <div 
                          key={modIdx} 
                          className={cn(
                            'flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-200 group cursor-default',
                            isDark ? 'hover:bg-muted/30' : 'hover:bg-muted/50'
                          )}
                        >
                          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', area.bgGlow)}>
                            <mod.icon className="w-5 h-5 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{mod.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/website/sot/plattform"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              Alle Module im Detail
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ARMSTRONG — Full-width image section ── */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative min-h-[70vh] flex items-center">
          {/* Background */}
          <div className="absolute inset-0">
            <img 
              src={sotAiIntelligence} 
              alt="Armstrong AI Intelligence" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-400/30 mb-6 text-xs font-bold text-violet-300 tracking-wider uppercase">
                <Brain className="w-3.5 h-3.5" />
                <Brand>Armstrong</Brand> Intelligence
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                Ihre KI kennt Ihr
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  gesamtes Unternehmen.
                </span>
              </h2>

              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Kein manuelles Hochladen. Kein Copy-Paste. <Brand>Armstrong</Brand> liest Ihren gesamten Datenraum — 
                Dokumente, Verträge, E-Mails, Finanzen.
              </p>

              {/* Highlight Cards */}
              <div className="mt-10 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Eye, title: 'Kein Upload nötig', desc: 'Einmal aktivieren, dauerhaft nutzen.' },
                  { icon: Cpu, title: 'Pay per Use', desc: <span>Nur zahlen, wenn <Brand>Armstrong</Brand> arbeitet.</span> },
                  { icon: Shield, title: 'Volle Kontrolle', desc: 'Preis vorher sehen. Keine Überraschungen.' },
                ].map((h) => (
                  <div key={h.title} className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-5">
                    <h.icon className="w-5 h-5 text-violet-400 mb-3" />
                    <h4 className="text-sm font-bold text-white">{h.title}</h4>
                    <p className="text-xs text-white/50 mt-1">{h.desc}</p>
                  </div>
                ))}
              </div>

              {/* Example queries */}
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  'Welche Fahrzeuge brauchen TÜV?',
                  'Fasse alle Mietverträge zusammen',
                  'Offene Rechnungen anzeigen',
                ].map((q) => (
                  <div key={q} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                    <MessageSquare className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    {q}
                  </div>
                ))}
              </div>

              <Link
                to="/website/sot/intelligenz"
                className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-bold hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Brand>Armstrong</Brand> Intelligence entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Steps with workspace image ── */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                So funktioniert's
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">In 4 Schritten digital</h2>
              <p className="mt-4 text-muted-foreground text-lg">Keine langen Einführungsprojekte. Kein IT-Budget nötig.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {steps.map((s, i) => (
                <Reveal key={s.num} delay={i * 100}>
                  <div className={cn(
                    'flex items-start gap-5 p-5 rounded-2xl transition-all duration-200',
                    isDark ? 'hover:bg-card/60' : 'hover:bg-muted/50'
                  )}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black tracking-widest text-primary">{s.num}</span>
                        <h3 className="text-base font-bold">{s.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={200}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
                <img 
                  src={sotWorkspace} 
                  alt="System of a Town Workspace" translate="no" 
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA — Bold gradient ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-8 text-xs font-bold text-white tracking-wider uppercase">
              <Globe className="w-3.5 h-3.5" />
              Jetzt Digitalisierung starten
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Bereit für Ordnung?
            </h2>

            <p className="mt-5 text-lg text-white/70 leading-relaxed">
              Starten Sie kostenlos — keine Kreditkarte, kein Abo, keine Grundgebühr. 
              Digitalisierung, die Sie sofort nutzen können.
            </p>

            <div className="mt-10 flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail eingeben"
                className="h-14 flex-1 rounded-2xl px-5 text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              <button className="h-14 px-8 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 inline-flex items-center gap-2 flex-shrink-0">
                Starten
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/50">
              <Link to="/website/sot/demo" className="hover:text-white/80 transition-colors flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Demo
              </Link>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <Link to="/website/sot/preise" className="hover:text-white/80 transition-colors">
                Preise
              </Link>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <Link to="/website/sot/karriere" className="hover:text-white/80 transition-colors">
                Kontakt
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

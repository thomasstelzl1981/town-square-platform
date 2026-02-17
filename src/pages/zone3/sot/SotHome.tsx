/**
 * SoT Home — Premium Software Presentation
 * Aurora Borealis aesthetic with orbital visuals, deep feature sections, KI storytelling
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Wallet, Zap, Brain, Mail, BarChart3, Shield,
  ArrowRight, Layers, Bot, TrendingUp, Sparkles, Globe, Lock,
  CheckCircle2, ChevronRight, Cpu, Eye, Workflow, Database,
  BellRing, PieChart, Search, Settings, Home, Car, Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSotTheme } from '@/hooks/useSotTheme';

/* ── 8 Feature Widgets ── */
const widgets = [
  { icon: Building2, title: 'Immobilien', description: 'Portfolio, Akten und Dokumente zentral verwalten.', href: '/website/sot/real-estate', color: 'from-blue-500/20 to-blue-600/5' },
  { icon: FileText, title: 'Dokumente', description: 'Digitaler Datenraum mit Struktur und KI-Unterstützung.', href: '/website/sot/management', color: 'from-violet-500/20 to-violet-600/5' },
  { icon: Wallet, title: 'Finanzen', description: 'Konten, Verträge und Vorsorge im Überblick.', href: '/website/sot/finance', color: 'from-emerald-500/20 to-emerald-600/5' },
  { icon: Zap, title: 'Energie', description: 'Verbrauch, Verträge und Photovoltaik transparent steuern.', href: '/website/sot/energy', color: 'from-amber-500/20 to-amber-600/5' },
  { icon: Brain, title: 'KI Office', description: 'Intelligente Assistenz für Organisation und Aufgaben.', href: '/website/sot/management', color: 'from-pink-500/20 to-pink-600/5' },
  { icon: Mail, title: 'E-Mail & Kommunikation', description: 'Posteingang, Kommunikation und Prozesse bündeln.', href: '/website/sot/management', color: 'from-cyan-500/20 to-cyan-600/5' },
  { icon: BarChart3, title: 'Reports & Analyse', description: 'Kennzahlen, Auswertungen und Performance im Blick.', href: '/website/sot/finance', color: 'from-orange-500/20 to-orange-600/5' },
  { icon: Shield, title: 'Sicherheit & Struktur', description: 'Zentrale Verwaltung mit klaren Rollen und Zugriffen.', href: '/website/sot/management', color: 'from-slate-500/20 to-slate-600/5' },
];

/* ── Hero Feature Pills ── */
const heroPills = [
  { icon: Building2, label: 'Immobilien' },
  { icon: Wallet, label: 'Finanzen' },
  { icon: Zap, label: 'Energie' },
  { icon: FileText, label: 'Dokumente' },
  { icon: Car, label: 'Fahrzeuge' },
  { icon: Brain, label: 'KI-Assistenz' },
];

/* ── KI Feature Highlights ── */
const kiFeatures = [
  { icon: Sparkles, title: 'Armstrong KI', desc: 'Ihr persönlicher Co-Pilot analysiert, empfiehlt und automatisiert – direkt in jedem Modul.' },
  { icon: Eye, title: 'Smart Recognition', desc: 'Dokumente werden automatisch erkannt, klassifiziert und den richtigen Akten zugeordnet.' },
  { icon: Workflow, title: 'Automatisierte Workflows', desc: 'Von der Belegerfassung bis zur Vertragsanalyse – KI reduziert manuelle Arbeit auf ein Minimum.' },
  { icon: Search, title: 'Intelligente Suche', desc: 'Durchsuchen Sie alle Dokumente, Verträge und Objekte mit natürlicher Sprache.' },
];

/* ── Platform Stats ── */
const stats = [
  { value: '12+', label: 'Module' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'DSGVO', label: 'Konform' },
  { value: '24/7', label: 'KI-Assistenz' },
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
        {/* Aurora glow orbs - visible in dark, pastel in light */}
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
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{
            background: isDark
              ? 'radial-gradient(circle, hsl(217 80% 30% / 0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(217 50% 90% / 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Star field - dark mode only */}
        {isDark && (
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(1px 1px at 15% 25%, hsl(275 60% 70% / 0.5) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 35% 65%, hsl(340 50% 70% / 0.4) 1px, transparent 0),
              radial-gradient(1px 1px at 55% 15%, hsl(217 80% 75% / 0.5) 1px, transparent 0),
              radial-gradient(2px 2px at 75% 45%, hsl(180 60% 65% / 0.3) 1px, transparent 0),
              radial-gradient(1px 1px at 10% 75%, hsl(275 50% 60% / 0.3) 1px, transparent 0),
              radial-gradient(1px 1px at 85% 10%, hsl(340 40% 65% / 0.4) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 45% 85%, hsl(217 70% 70% / 0.35) 1px, transparent 0),
              radial-gradient(1px 1px at 65% 35%, hsl(180 50% 60% / 0.25) 1px, transparent 0),
              radial-gradient(1px 1px at 25% 50%, hsl(275 55% 75% / 0.3) 1px, transparent 0),
              radial-gradient(2px 2px at 90% 70%, hsl(217 90% 80% / 0.35) 1px, transparent 0),
              radial-gradient(1px 1px at 5% 40%, hsl(340 45% 70% / 0.3) 1px, transparent 0),
              radial-gradient(1.5px 1.5px at 50% 5%, hsl(275 60% 65% / 0.4) 1px, transparent 0)`,
          }} />
        )}

        {/* Orbital rings - subtle */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] rounded-[50%] rotate-12"
          style={{ border: `1px solid ${isDark ? 'hsl(275 50% 50% / 0.06)' : 'hsl(217 50% 80% / 0.15)'}` }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] rounded-[50%] -rotate-6"
          style={{ border: `1px solid ${isDark ? 'hsl(340 40% 50% / 0.04)' : 'hsl(275 30% 85% / 0.1)'}` }}
        />
      </div>

      <div className="relative z-10">
        {/* ── HERO ── */}
        <section className="relative py-28 sm:py-36 lg:py-44">
          {/* Hero glow - aurora-colored */}
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
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              KI-gestützte Plattform für private Vermögensverwaltung
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                Ihr gesamtes Vermögen.
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent/80 bg-clip-text text-transparent">
                Eine Plattform.
              </span>
            </h1>

            <h2 className="mt-6 text-lg sm:text-xl lg:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Immobilien, Finanzen, Energie, Dokumente und KI-Assistenz — alles zentral verwaltet, analysiert und automatisiert.
            </h2>

            {/* Feature Pills */}
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

            <p className="mt-6 text-xs sm:text-sm text-muted-foreground/50 tracking-[0.2em] uppercase font-light">
              System of a Town
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/website/sot/management"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/40 transition-all duration-300"
              >
                Plattform entdecken
              </Link>
            </div>
          </div>
        </section>

        {/* ── 8-WIDGET GRID ── */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <h2 className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">Module</h2>
                <p className="text-2xl sm:text-3xl font-bold">Alles, was Sie brauchen. An einem Ort.</p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {widgets.map((w, i) => (
                <RevealSection key={w.title} delay={i * 80}>
                  <Link to={w.href} className="group block h-full">
                    <div className={cn(
                      'relative rounded-2xl border border-border/30 p-6 h-full',
                      'bg-card/50 backdrop-blur-sm',
                      'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5',
                      'hover:-translate-y-1 transition-all duration-300 ease-out',
                      'overflow-hidden',
                      !isDark && 'shadow-sm'
                    )}>
                      {/* Gradient overlay */}
                      <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500', w.color)} />

                      <div className="relative z-10">
                        <div className="h-11 w-11 rounded-xl bg-muted/50 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-300">
                          <w.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm font-semibold mb-2">{w.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{w.description}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 mt-4" />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── KI SECTION — Armstrong Highlight ── */}
        <section className="py-20 sm:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <RevealSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6 text-xs font-medium text-primary">
                  <Brain className="w-3.5 h-3.5" />
                  Künstliche Intelligenz
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Armstrong — Ihr KI Co-Pilot
                </h2>
                <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Jedes Modul wird von Armstrong unterstützt — Ihrer persönlichen KI, die mitdenkt, automatisiert und Ihnen Zeit zurückgibt.
                </p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {kiFeatures.map((f, i) => (
                <RevealSection key={f.title} delay={i * 100}>
                  <div className={cn(
                    'group rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-7 hover:border-primary/30 hover:bg-card/60 transition-all duration-300',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
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

        {/* ── WARUM SYSTEM OF A TOWN? ── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Warum System of a Town?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Eine Plattform, die mit Ihrem Vermögen wächst.
                </p>
              </div>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Layers,
                  title: 'Zentralisiert',
                  desc: 'Immobilien, Finanzen, Dokumente, E-Mails und Verträge — alles an einem Ort. Keine verstreuten Daten, kein Tool-Chaos.',
                  features: ['Multi-Objekt-Portfolio', 'Digitaler Datenraum', 'Kontenverwaltung'],
                },
                {
                  icon: Bot,
                  title: 'Automatisiert',
                  desc: 'KI-gestützte Workflows übernehmen repetitive Aufgaben. Von der Belegerfassung bis zur Vertragsanalyse.',
                  features: ['Dokumentenerkennung', 'Automatische Zuordnung', 'Smart Alerts'],
                },
                {
                  icon: TrendingUp,
                  title: 'Skalierbar',
                  desc: 'Vom ersten Objekt bis zum großen Portfolio — die Plattform wächst mit Ihren Anforderungen.',
                  features: ['Rollenmanagement', 'Multi-Tenant-Architektur', 'Enterprise-Ready'],
                },
              ].map((b, i) => (
                <RevealSection key={b.title} delay={i * 120}>
                  <div className={cn(
                    'rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-8 h-full hover:border-primary/20 transition-colors duration-300',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{b.desc}</p>
                    <ul className="space-y-2">
                      {b.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORM FEATURES (Deep Dive) ── */}
        <section className="py-20 sm:py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Eine Plattform. Unendliche Möglichkeiten.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Entdecken Sie die Kernfunktionen, die System of a Town einzigartig machen.
                </p>
              </div>
            </RevealSection>

            <div className="space-y-6">
              {[
                {
                  icon: Database,
                  title: 'Digitaler Datenraum',
                  desc: 'Jedes Objekt, jeder Vertrag, jede Versicherung bekommt einen eigenen, strukturierten Datenraum. KI sortiert, taggt und verknüpft automatisch.',
                  tag: 'Dokumente',
                },
                {
                  icon: PieChart,
                  title: 'Vermögensübersicht',
                  desc: 'Sehen Sie auf einen Blick, wie Ihr Vermögen verteilt ist — Immobilien, Depots, Versicherungen, Energieanlagen. Alles in Echtzeit.',
                  tag: 'Finanzen',
                },
                {
                  icon: BellRing,
                  title: 'Proaktive Benachrichtigungen',
                  desc: 'Armstrong erinnert Sie an Fristen, erkennt Anomalien in Ihren Konten und schlägt Handlungen vor, bevor Probleme entstehen.',
                  tag: 'KI',
                },
                {
                  icon: Lock,
                  title: 'Banken-Level Sicherheit',
                  desc: 'Ende-zu-Ende-Verschlüsselung, DSGVO-konform, gehostet in deutschen Rechenzentren. Ihre Daten gehören Ihnen.',
                  tag: 'Sicherheit',
                },
              ].map((f, i) => (
                <RevealSection key={f.title} delay={i * 80}>
                  <div className={cn(
                    'group rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-8 hover:border-primary/20 transition-all duration-300 flex flex-col sm:flex-row items-start gap-6',
                    !isDark && 'shadow-sm'
                  )}>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold">{f.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-muted/60 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {f.tag}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] to-transparent" />
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <RevealSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/40 mb-6 text-xs font-medium text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Kostenlos starten
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Bereit loszulegen?
              </h2>
              <p className="text-muted-foreground mb-10 leading-relaxed">
                Starten Sie kostenlos und erleben Sie die Zukunft der Immobilien- und Finanzverwaltung.
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
                <Link to="/website/sot/management" className="hover:text-foreground transition-colors">
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

/**
 * SoT Home — Software Presentation with 8-Widget Grid
 * Zone-2 / SpaceX aesthetic: dark cards, negative space, big headlines
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Wallet, Zap, Brain, Mail, BarChart3, Shield,
  ArrowRight, Layers, Bot, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── 8 Feature Widgets ── */
const widgets = [
  { icon: Building2, title: 'Immobilien', description: 'Portfolio, Akten und Dokumente zentral verwalten.', href: '/website/sot/real-estate' },
  { icon: FileText, title: 'Dokumente', description: 'Digitaler Datenraum mit Struktur und KI-Unterstützung.', href: '/website/sot/management' },
  { icon: Wallet, title: 'Finanzen', description: 'Konten, Verträge und Vorsorge im Überblick.', href: '/website/sot/finance' },
  { icon: Zap, title: 'Energie', description: 'Verbrauch, Verträge und Photovoltaik transparent steuern.', href: '/website/sot/energy' },
  { icon: Brain, title: 'KI Office', description: 'Intelligente Assistenz für Organisation und Aufgaben.', href: '/website/sot/management' },
  { icon: Mail, title: 'E-Mail & Kommunikation', description: 'Posteingang, Kommunikation und Prozesse bündeln.', href: '/website/sot/management' },
  { icon: BarChart3, title: 'Reports & Analyse', description: 'Kennzahlen, Auswertungen und Performance im Blick.', href: '/website/sot/finance' },
  { icon: Shield, title: 'Sicherheit & Struktur', description: 'Zentrale Verwaltung mit klaren Rollen und Zugriffen.', href: '/website/sot/management' },
];

/* ── Why SoT ── */
const whyBlocks = [
  { icon: Layers, title: 'Zentralisiert', description: 'Alle Ihre Immobilien, Finanzen und Dokumente an einem Ort.' },
  { icon: Bot, title: 'Automatisiert', description: 'KI-gestützte Workflows reduzieren manuelle Arbeit auf ein Minimum.' },
  { icon: TrendingUp, title: 'Skalierbar', description: 'Vom ersten Objekt bis zum großen Portfolio — die Plattform wächst mit.' },
];

export default function SotHome() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            System of a Town
          </h1>
          <h2 className="mt-6 text-xl sm:text-2xl font-medium text-muted-foreground leading-relaxed">
            Der digitale Manager für Immobilien und private Finanzen.
          </h2>
          <p className="mt-4 text-base text-muted-foreground/70 tracking-wide">
            Organisieren. Verwalten. Analysieren. Automatisieren.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/website/sot/management"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Demo ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8-WIDGET GRID ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map((w) => (
              <Link key={w.title} to={w.href} className="group block">
                <div className={cn(
                  'relative rounded-xl border border-border/30 p-6 h-full',
                  'bg-card/60 backdrop-blur-sm',
                  'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                  'hover:scale-[1.02] transition-all duration-300 ease-out'
                )}>
                  <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center mb-4">
                    <w.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{w.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{w.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WARUM SYSTEM OF A TOWN? ── */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16">
            Warum System of a Town?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {whyBlocks.map((b) => (
              <div key={b.title} className="text-center">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Bereit loszulegen?
          </h2>
          <p className="text-muted-foreground mb-8">
            Starten Sie kostenlos und erleben Sie die Zukunft der Immobilien- und Finanzverwaltung.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail eingeben"
              className="h-11 flex-1 rounded-lg px-4 text-sm bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
              Starten
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <Link to="/website/sot/management" className="hover:text-foreground transition-colors">
              Demo ansehen
            </Link>
            <span className="opacity-30">|</span>
            <Link to="/website/sot/karriere" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Kontakt
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

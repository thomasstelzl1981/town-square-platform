/**
 * OTTO² ADVISORY HOME — Zone 3
 * SEO: Finanzberatung München, Immobilienfinanzierung, Vorsorge
 * JSON-LD: FinancialService
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight, CheckCircle2, Building2, Users, Home,
  TrendingUp, Shield, Wallet, FileText, Target,
  Settings, ClipboardCheck, RefreshCw, Heart
} from 'lucide-react';

const unternehmerServices = [
  { icon: FileText, title: 'Finanzanalyse', desc: 'Bestandsaufnahme der aktuellen Situation' },
  { icon: Target, title: 'Auswertung & Zielbild', desc: 'Potenziale erkennen, Ziele definieren' },
  { icon: TrendingUp, title: 'Nachfolgeplanung', desc: 'Unternehmensnachfolge strukturiert vorbereiten' },
  { icon: Wallet, title: 'Finanzierung & Fördermittel', desc: 'Optimale Finanzierungslösungen' },
  { icon: Shield, title: 'Risikostruktur', desc: 'Gewerbe-Risiken absichern' },
  { icon: Users, title: 'Betriebliche Altersvorsorge', desc: 'Mitarbeiterbindung durch Vorsorge' },
];

const privatSystemSteps = [
  { icon: FileText, title: 'Finanzanalyse', desc: 'Detaillierte Aufnahme Ihrer finanziellen Situation' },
  { icon: ClipboardCheck, title: 'Finanzgutachten', desc: 'Auswertung im unabhängigen Rechencenter' },
  { icon: Target, title: 'Individuelle Beratung', desc: 'Kosten sparen – Erträge erhöhen' },
  { icon: Settings, title: 'Ordnung & Struktur', desc: 'Serviceordner und Mandantenportal einrichten' },
  { icon: RefreshCw, title: 'Vertragsmanagement', desc: 'Nie wieder Fristen verpassen' },
  { icon: Heart, title: 'Laufende Betreuung', desc: 'Spätestens alle 24 Monate Aktualisierung' },
];

export default function OttoHome() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Otto² Advisory',
    alternateName: 'Komplett ZL Finanzdienstleistungen GmbH',
    description: 'Ganzheitliche Finanzberatung für Unternehmer und Privathaushalte — Finanzierung, Vorsorge, Vermögensaufbau.',
    url: 'https://otto2advisory.com',
    areaServed: { '@type': 'Country', name: 'DE' },
    serviceType: ['Finanzberatung', 'Immobilienfinanzierung', 'Vorsorge', 'Vermögensaufbau'],
    knowsAbout: ['Baufinanzierung', 'Altersvorsorge', 'Gewerbeversicherung', 'Nachfolgeplanung', 'betriebliche Altersvorsorge'],
  };

  return (
    <>
      <Helmet>
        <title>Otto² Advisory — Finanzberatung für Unternehmer & Privathaushalte</title>
        <meta name="description" content="Erst Analyse, dann Zielbild. Otto² Advisory bietet ganzheitliche Finanzberatung: Immobilienfinanzierung, Vorsorge und Vermögensaufbau — strukturiert und transparent." />
        <link rel="canonical" href="https://otto2advisory.com" />
        <meta property="og:title" content="Otto² Advisory — Ganzheitliche Finanzberatung" />
        <meta property="og:description" content="Finanzberatung für Unternehmer und Privathaushalte. Finanzierung, Vorsorge und Vermögensaufbau — alles aus einer Hand." />
        <meta property="og:url" content="https://otto2advisory.com" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/8 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
            <Wallet className="h-3.5 w-3.5" /> Ganzheitliche Finanzberatung
          </div>
          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl">
            Otto²<span className="text-blue-400">Advisory</span>
          </h1>
          <p className="mx-auto mb-3 max-w-xl text-xl font-medium text-white/80 md:text-2xl">
            Erst Analyse. Dann Zielbild. Strukturiert umsetzen.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-white/50">
            Finanzberatung für Unternehmer und Privathaushalte. Finanzierung, Vorsorge und Vermögensaufbau — alles aus einer Hand.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/otto-advisory/finanzierung"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-all"
            >
              Finanzierung beantragen <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/otto-advisory/kontakt"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-sm text-white/70 hover:border-white/40 hover:text-white transition-all"
            >
              Beratung anfragen
            </Link>
          </div>
        </div>
      </section>

      {/* Warum Otto² */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: CheckCircle2, title: 'Konzept vor Produkt', desc: 'Erst Analyse und Zielbild, dann passende Umsetzung.' },
              { icon: Shield, title: 'Ordnung + Begleitung', desc: 'Strukturierte Umsetzung mit laufender Betreuung.' },
              { icon: TrendingUp, title: 'Systemgestützt', desc: 'Transparente Beratung mit strukturiertem Service.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                  <item.icon className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Für Unternehmer & Privathaushalte — Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Link
            to="/website/otto-advisory/unternehmer"
            className="group relative overflow-hidden rounded-2xl border border-blue-900/30 bg-blue-950/20 p-10 transition-all hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <Building2 className="mb-5 h-10 w-10 text-blue-400" />
            <h2 className="mb-3 text-2xl font-bold">Für Unternehmer</h2>
            <p className="text-sm text-white/50 mb-6">
              Finanzierung, Absicherung und strategische Beratung für Ihr Unternehmen. Von der Bestandsaufnahme bis zur Umsetzung.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium group-hover:gap-2.5 transition-all">
              Leistungen ansehen <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            to="/website/otto-advisory/private-haushalte"
            className="group relative overflow-hidden rounded-2xl border border-blue-900/30 bg-blue-950/20 p-10 transition-all hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <Users className="mb-5 h-10 w-10 text-blue-400" />
            <h2 className="mb-3 text-2xl font-bold">Für Privathaushalte</h2>
            <p className="text-sm text-white/50 mb-6">
              Immobilienfinanzierung, Altersvorsorge und Vermögensaufbau — maßgeschneidert auf Ihre Lebenssituation.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium group-hover:gap-2.5 transition-all">
              Leistungen ansehen <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Beratungsschwerpunkte Unternehmer */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center justify-center gap-3">
            <Building2 className="h-7 w-7 text-blue-400" />
            <h2 className="text-3xl font-bold">Beratungsschwerpunkte für Unternehmer</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {unternehmerServices.map(s => (
              <div key={s.title} className="group rounded-xl border border-blue-900/30 bg-blue-950/10 p-6 transition-all hover:border-blue-500/30">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <s.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/website/otto-advisory/unternehmer" className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 px-6 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors">
              Alle Unternehmer-Leistungen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* System für Privathaushalte — 6 Steps */}
      <section className="py-20 px-4 bg-blue-950/20 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center justify-center gap-3">
            <Users className="h-7 w-7 text-blue-400" />
            <h2 className="text-3xl font-bold">Unser System für private Haushalte</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {privatSystemSteps.map((step, i) => (
              <div key={step.title} className="relative group rounded-xl border border-blue-900/30 bg-slate-950/60 p-6 transition-all hover:border-blue-500/30 hover:shadow-lg">
                <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-lg">
                  {i + 1}
                </div>
                <div className="mb-4 mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <step.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/website/otto-advisory/private-haushalte" className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 px-6 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors">
              Leistungen für Privathaushalte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Digitale Baufinanzierung — Blue CTA Block */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-950 border-t border-blue-800/30">
        <div className="mx-auto max-w-4xl text-center">
          <Home className="mx-auto mb-6 h-12 w-12 text-blue-300" />
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Digitale Baufinanzierung neu gedacht</h2>
          <p className="mx-auto mb-4 max-w-2xl text-lg text-blue-100">
            Ihre Immobilienfinanzierung — professionell aufbereitet über unser digitales Portal.
          </p>
          <div className="my-10 grid gap-6 text-left md:grid-cols-3">
            {[
              { icon: FileText, title: 'Digitaler Bonitätsordner', desc: 'Alle Unterlagen strukturiert und vollständig — laufend aktuell gehalten.' },
              { icon: Target, title: 'Bessere Kommunikation', desc: 'Professionell aufbereitete Anfragen führen zu schnelleren Zusagen und besseren Konditionen.' },
              { icon: RefreshCw, title: 'Moderierter Prozess', desc: 'Wir begleiten Sie durch den gesamten Finanzierungsprozess — transparent und strukturiert.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <item.icon className="mb-3 h-8 w-8 text-blue-300" />
                <h3 className="mb-2 font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-blue-200">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            to="/website/otto-advisory/finanzierung"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
          >
            Finanzierung beantragen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Termin vereinbaren</h2>
          <p className="mb-8 text-white/50">
            Lassen Sie uns in einem ersten Gespräch über Ihre Situation und Ziele sprechen.
          </p>
          <Link
            to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-all"
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

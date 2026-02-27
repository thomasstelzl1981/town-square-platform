/**
 * NCORE HOME — Cinematic Hero + 3 Pillars + USPs + Network Teaser + CTA
 * SEO: Rich structured data, LLM-optimized semantic content
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, Cpu, Shield, TrendingUp, Network, Users, Sparkles, CheckCircle2, Globe, Zap } from 'lucide-react';

const STATS = [
  { value: '15+', label: 'Jahre Erfahrung' },
  { value: '200+', label: 'Beratungsprojekte' },
  { value: '50+', label: 'Netzwerkpartner' },
  { value: '3', label: 'Kernbereiche' },
];

export default function NcoreHome() {
  return (
    <>
      <Helmet>
        <title>Ncore Business Consulting — Connecting Dots. Connecting People.</title>
        <meta name="description" content="Ganzheitliche Unternehmensberatung für KMU: KI-gestützte Digitalisierung, österreichische Stiftungsmodelle, Vermögensschutz und Geschäftsmodellentwicklung. Operativ. Effizient. Vernetzt." />
        <meta property="og:title" content="Ncore Business Consulting — Connecting Dots. Connecting People." />
        <meta property="og:description" content="Unternehmensberatung mit KI-Kompetenz für den Mittelstand. Digitalisierung, Vermögensschutz und Geschäftsmodelle aus operativer Erfahrung." />
        <meta property="og:url" content="https://ncore.online/" />
        <meta name="keywords" content="Unternehmensberatung, KMU, Digitalisierung, KI, Stiftungen, Vermögensschutz, Geschäftsmodelle, Mittelstand, Beratung, Netzwerk" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Ncore Business Consulting — Startseite",
          "description": "Ganzheitliche Unternehmensberatung für den Mittelstand mit Schwerpunkten Digitalisierung & KI, Stiftungen & Vermögensschutz sowie Geschäftsmodellentwicklung.",
          "url": "https://ncore.online/",
          "mainEntity": { "@id": "https://ncore.online/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Startseite", "item": "https://ncore.online/" }],
          },
        })}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-black to-black" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/3 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-medium text-emerald-400 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Unternehmensberatung mit KI-Kompetenz
          </div>

          <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
            Connecting Dots.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Connecting People.
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-white/50 md:text-xl leading-relaxed">
            Wir betrachten Ihr Unternehmen als Ganzes — nicht als Summe von Teillösungen.
            Digitalisierung, Vermögensschutz und Geschäftsmodellentwicklung aus langjähriger
            operativer Erfahrung.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/ncore/kontakt"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Erstgespräch vereinbaren
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/ncore/digitalisierung"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-4 text-sm text-white/70 transition-all hover:border-white/30 hover:text-white hover:bg-white/5"
            >
              Unsere Leistungen
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-emerald-400 md:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP Banner ── */}
      <section className="border-y border-emerald-900/20 bg-emerald-950/10 py-6">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-white/40">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500/60" /> Keine Teillösungen</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500/60" /> Operativ statt theoretisch</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500/60" /> KI zu günstigen Kosten</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500/60" /> Exzellentes Netzwerk</span>
          </div>
        </div>
      </section>

      {/* ── 3 Pillars ── */}
      <section className="mx-auto max-w-7xl px-4 py-28 lg:px-8">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Unsere Kernbereiche</p>
          <h2 className="mb-5 text-3xl font-bold md:text-5xl">Drei Säulen. Eine Vision.</h2>
          <p className="mx-auto max-w-2xl text-white/45 leading-relaxed">
            Wir verbinden Digitalisierung, Vermögensschutz und Vertrieb zu einer ganzheitlichen
            Strategie — denn isolierte Maßnahmen bringen nur isolierte Ergebnisse.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Cpu,
              title: 'Digitalisierung & KI',
              desc: 'Wir wissen operativ, wie man KI und Automatisierung zu sehr günstigen Kosten in Unternehmen bringt. Keine Theorie — erprobte Lösungen für den Mittelstand.',
              features: ['Prozessautomatisierung', 'KI-Integration', 'Einheitliche Software'],
              link: '/website/ncore/digitalisierung',
            },
            {
              icon: Shield,
              title: 'Stiftungen & Vermögensschutz',
              desc: 'Österreichische Stiftungsmodelle, generationsübergreifende Strukturierung und Wegzugsbesteuerung — koordiniert mit unserem Netzwerk aus RA und StB.',
              features: ['Privatstiftungen (AT)', 'Wegzugsbesteuerung', 'Generationenplanung'],
              link: '/website/ncore/stiftungen',
            },
            {
              icon: TrendingUp,
              title: 'Geschäftsmodelle & Vertrieb',
              desc: 'Von der Idee zum skalierbaren Geschäftsmodell. Businesspläne, Pitch Decks und digitalisierte Vertriebssysteme aus der Praxis.',
              features: ['Business Model Design', 'Pitch Decks', 'Vertriebssysteme'],
              link: '/website/ncore/geschaeftsmodelle',
            },
          ].map(pillar => (
            <Link
              key={pillar.title}
              to={pillar.link}
              className="group relative rounded-2xl border border-emerald-900/30 bg-gradient-to-b from-emerald-950/30 to-transparent p-8 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <pillar.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold">{pillar.title}</h3>
              <p className="mb-6 text-sm text-white/45 leading-relaxed">{pillar.desc}</p>
              <ul className="space-y-2 mb-6">
                {pillar.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/35">
                    <Zap className="h-3 w-3 text-emerald-500/50" /> {f}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-sm text-emerald-400 group-hover:gap-2 transition-all">
                Mehr erfahren <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why Ncore ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-16 md:grid-cols-2 items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Warum Ncore</p>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                Keine reinen Finanzberater.<br/>
                <span className="text-emerald-400">Keine reinen Techniker.</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Viele Berater bieten Teillösungen: entweder IT-Beratung oder Finanzberatung oder Rechtsberatung.
                Wir sind anders. Als langjährig erfahrene Finanz- und Unternehmensberater betrachten wir das
                Unternehmen als Ganzes und wissen operativ, wie Digitalisierung, Automatisierung und künstliche
                Intelligenz zu sehr günstigen Kosten in Unternehmen gebracht werden können.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Ganzheitlicher Blick auf Ihr Unternehmen — nicht nur IT-Abteilung' },
                  { icon: Globe, text: 'Netzwerk aus RA, StB, Banken und KI-Partnern in ganz Deutschland' },
                  { icon: Sparkles, text: 'Operative Erfahrung statt akademischer Theorie' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                      <item.icon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-white/50">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'KI-Kompetenz', desc: 'Wir setzen modernste KI-Modelle ein, wo sie echten Mehrwert bringen — nicht als Marketing-Buzzword.' },
                { title: 'Kosteneffizienz', desc: 'Digitalisierung muss sich rechnen. Unsere Lösungen sind für KMU-Budgets konzipiert.' },
                { title: 'Diskretion', desc: 'Vermögensstrukturierung erfordert Vertraulichkeit. Ihr Vertrauen ist unser höchstes Gut.' },
                { title: 'Ergebnisorientiert', desc: 'Keine PowerPoint-Beratung. Wir liefern umsetzbare Ergebnisse und begleiten die Umsetzung.' },
              ].map(card => (
                <div key={card.title} className="rounded-xl border border-emerald-900/20 bg-emerald-950/20 p-5">
                  <h3 className="mb-2 text-sm font-semibold">{card.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Network Teaser ── */}
      <section className="py-28">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Network className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mb-5 text-3xl font-bold md:text-4xl">Hervorragendes Netzwerk</h2>
          <p className="mx-auto mb-10 max-w-2xl text-white/45 leading-relaxed">
            Banken, Rechtsanwälte, Steuerberater, KI-Partner — wir verfügen über ein exzellentes
            Netzwerk in alle Bereiche der Unternehmens- und Bankenwelt für kleine und
            mittelständische Unternehmen in Deutschland und Österreich.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {['Banken & Finanzierer', 'Rechtsanwälte & Notare', 'Steuerberater & WP', 'KI & Tech-Partner', 'Versicherungen'].map(tag => (
              <span key={tag} className="rounded-full border border-emerald-900/30 bg-emerald-950/20 px-4 py-2 text-xs text-white/40">
                {tag}
              </span>
            ))}
          </div>
          <Link
            to="/website/ncore/netzwerk"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Netzwerk entdecken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-emerald-900/20 py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-5 text-3xl font-bold md:text-4xl">Bereit für den nächsten Schritt?</h2>
          <p className="mx-auto mb-10 max-w-xl text-white/45 leading-relaxed">
            Ob Digitalisierungsprojekt, Vermögensstrukturierung oder Geschäftsmodellentwicklung —
            wir freuen uns auf das Gespräch.
          </p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-10 py-4 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Unverbindliches Erstgespräch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

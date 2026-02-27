/**
 * NCORE HOME — Hero + 3 Pillars + Network Teaser + CTA
 * SEO-optimized with structured data for consulting business
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, Cpu, Shield, TrendingUp, Network } from 'lucide-react';

export default function NcoreHome() {
  return (
    <>
      <Helmet>
        <title>Ncore Business Consulting — Connecting Dots. Connecting People.</title>
        <meta name="description" content="Unternehmensberatung für KMU: Digitalisierung & KI, Stiftungen & Vermögensschutz, Geschäftsmodelle & Vertrieb. Ganzheitliche Beratung aus operativer Erfahrung." />
        <meta property="og:title" content="Ncore Business Consulting — Connecting Dots. Connecting People." />
        <meta property="og:description" content="Ganzheitliche Unternehmensberatung für den Mittelstand. Digitalisierung, Vermögensschutz und Geschäftsmodelle — alles aus einer Hand." />
      </Helmet>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-black to-black" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400">
            <Cpu className="h-3.5 w-3.5" />
            Unternehmensberatung mit KI-Kompetenz
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Connecting Dots.<br />
            <span className="text-emerald-400">Connecting People.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl">
            Wir betrachten Ihr Unternehmen als Ganzes. Digitalisierung, Vermögensschutz und 
            Geschäftsmodellentwicklung — aus langjähriger operativer Erfahrung, nicht aus der Theorie.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/ncore/kontakt"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
            >
              Erstgespräch vereinbaren
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/ncore/netzwerk"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-3 text-sm text-white/70 transition-all hover:border-white/40 hover:text-white"
            >
              Unser Netzwerk
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Drei Kernbereiche. Eine Vision.</h2>
          <p className="mx-auto max-w-2xl text-white/50">
            Keine Teillösungen. Wir verbinden Digitalisierung, Vermögensschutz und Vertrieb zu einer 
            einheitlichen Strategie für Ihren Erfolg.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Cpu,
              title: 'Digitalisierung & KI',
              desc: 'KI-gestützte Verwaltungs- und operative Softwarelösungen für KMU — zu Kosten, die sich jedes Unternehmen leisten kann.',
              link: '/website/ncore/digitalisierung',
            },
            {
              icon: Shield,
              title: 'Stiftungen & Vermögensschutz',
              desc: 'Österreichische Stiftungsmodelle, generationsübergreifende Strukturierung und Wegzugsbesteuerung — mit unserem Netzwerk aus RA und StB.',
              link: '/website/ncore/stiftungen',
            },
            {
              icon: TrendingUp,
              title: 'Geschäftsmodelle & Vertrieb',
              desc: 'Von der Idee zum skalierbaren Geschäftsmodell. Businesspläne, Pitch Decks und Vertriebssysteme aus der Praxis.',
              link: '/website/ncore/geschaeftsmodelle',
            },
          ].map(pillar => (
            <Link
              key={pillar.title}
              to={pillar.link}
              className="group rounded-2xl border border-emerald-900/30 bg-emerald-950/20 p-8 transition-all hover:border-emerald-500/40 hover:bg-emerald-950/40"
            >
              <pillar.icon className="mb-4 h-8 w-8 text-emerald-400" />
              <h3 className="mb-3 text-xl font-semibold">{pillar.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{pillar.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                Mehr erfahren <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Network Teaser */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/10 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <Network className="mx-auto mb-6 h-12 w-12 text-emerald-400/60" />
          <h2 className="mb-4 text-3xl font-bold">Hervorragendes Netzwerk</h2>
          <p className="mx-auto mb-8 max-w-2xl text-white/50">
            Banken, Rechtsanwälte, Steuerberater, KI-Partner — wir verfügen über ein starkes 
            Netzwerk in alle Bereiche der Unternehmens- und Bankenwelt für kleine und 
            mittelständische Unternehmen in Deutschland.
          </p>
          <Link
            to="/website/ncore/netzwerk"
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Netzwerk entdecken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

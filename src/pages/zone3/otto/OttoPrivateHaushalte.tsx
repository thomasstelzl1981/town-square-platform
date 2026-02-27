/**
 * OTTO² ADVISORY — Für Privathaushalte
 * SEO: Finanzberatung privat, Altersvorsorge, Immobilienfinanzierung, Vermögensaufbau
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight, Shield, PiggyBank, Home, Wallet,
  Heart, GraduationCap, TrendingUp, Users
} from 'lucide-react';

const beratungsfelder = [
  { icon: Shield, label: 'Altersvorsorge', desc: 'Frühzeitig vorsorgen für einen sorgenfreien Ruhestand.' },
  { icon: Heart, label: 'Versicherung', desc: 'Risiken richtig absichern. Familie und Vermögen schützen.' },
  { icon: Home, label: 'Finanzierung', desc: 'Eigenheim oder Kapitalanlage — die passende Lösung.' },
  { icon: PiggyBank, label: 'Vermögensaufbau', desc: 'Systematisch Vermögen aufbauen, Schritt für Schritt.' },
  { icon: Wallet, label: 'Kapitalanlage', desc: 'Rendite und Sicherheit in Balance bringen.' },
  { icon: GraduationCap, label: 'Staatliche Förderung', desc: 'Riester, Rürup, VL — alle Fördermöglichkeiten ausschöpfen.' },
  { icon: TrendingUp, label: 'Steuerliche Vorteile', desc: 'Steueroptimierung als Teil der Finanzstrategie.' },
];

export default function OttoPrivateHaushalte() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Otto² Advisory — Private Finanzberatung',
    provider: { '@type': 'Organization', name: 'Komplett ZL Finanzdienstleistungen GmbH' },
    description: 'Ganzheitliche Finanzberatung für Privathaushalte: Altersvorsorge, Versicherung, Immobilienfinanzierung, Vermögensaufbau und staatliche Förderung.',
    serviceType: 'Private Finanzberatung',
    areaServed: { '@type': 'Country', name: 'DE' },
  };

  return (
    <>
      <Helmet>
        <title>Für Privathaushalte — Otto² Advisory | Vorsorge & Finanzierung</title>
        <meta name="description" content="Ganzheitliche Finanzberatung für Familien: Altersvorsorge, Immobilienfinanzierung, Vermögensaufbau und staatliche Förderung — fair, transparent und ehrlich." />
        <link rel="canonical" href="https://otto2advisory.com/private-haushalte" />
        <meta property="og:title" content="Für Privathaushalte — Otto² Advisory" />
        <meta property="og:description" content="Immobilienfinanzierung, Altersvorsorge und Vermögensaufbau — maßgeschneidert auf Ihre Lebenssituation." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="py-20 px-4 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
            <Users className="h-3.5 w-3.5" /> Für Privathaushalte
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Ganzheitliche <span className="text-blue-400">Finanzberatung</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-white/60 leading-relaxed">
            Entscheidungen richtig treffen. Schützen, was lieb und teuer ist. Mit dem richtigen Partner an der Seite
            können Sie das Leben leichter gestalten — wir beraten und begleiten Sie fair, transparent und ehrlich durch alle Lebensphasen.
          </p>
        </div>
      </section>

      {/* Circular Diagram + Legend */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual Circle */}
            <div className="flex items-center justify-center">
              <div className="relative h-72 w-72 md:h-80 md:w-80">
                {/* Rings */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-6 rounded-full border-2 border-blue-500/30" />
                <div className="absolute inset-12 rounded-full border-2 border-blue-500/40" />
                {/* Center */}
                <div className="absolute inset-20 md:inset-24 rounded-full bg-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                {/* Positioned icons */}
                {[
                  { Icon: PiggyBank, pos: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1' },
                  { Icon: Wallet, pos: 'top-[15%] right-[5%]' },
                  { Icon: TrendingUp, pos: 'top-1/2 right-0 translate-x-1 -translate-y-1/2' },
                  { Icon: Home, pos: 'bottom-[15%] right-[5%]' },
                  { Icon: GraduationCap, pos: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1' },
                  { Icon: Heart, pos: 'bottom-[15%] left-[5%]' },
                  { Icon: Shield, pos: 'top-1/2 left-0 -translate-x-1 -translate-y-1/2' },
                ].map(({ Icon, pos }, i) => (
                  <div key={i} className={`absolute ${pos} flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500/40 bg-slate-900 shadow-md`}>
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              <h2 className="mb-6 text-2xl font-bold">Unsere Beratungsfelder</h2>
              {beratungsfelder.map(feld => (
                <div key={feld.label} className="group flex items-center gap-3 cursor-pointer hover:translate-x-1 transition-transform">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <feld.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white/90 group-hover:text-blue-400 transition-colors">{feld.label}</span>
                    <p className="text-xs text-white/40">{feld.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Services Grid */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Unsere Leistungen im Detail</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {beratungsfelder.map(feld => (
              <div key={feld.label} className="rounded-xl border border-blue-900/30 bg-blue-950/10 p-6 hover:border-blue-500/30 transition-colors">
                <feld.icon className="mb-4 h-8 w-8 text-blue-400" />
                <h3 className="mb-2 font-semibold text-lg">{feld.label}</h3>
                <p className="text-sm text-white/50">{feld.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-950 border-t border-blue-800/30">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Lassen Sie uns sprechen</h2>
          <p className="mb-8 text-blue-200 max-w-lg mx-auto">
            In einem ersten Gespräch lernen wir Ihre Situation kennen und zeigen Ihnen, wie unser System funktioniert.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/otto-advisory/finanzierung"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
            >
              Finanzierung beantragen <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/otto-advisory/kontakt"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-8 py-3.5 text-sm text-white/80 hover:border-white/50 transition-colors"
            >
              Termin vereinbaren
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

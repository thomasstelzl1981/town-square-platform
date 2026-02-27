/**
 * OTTO² ADVISORY — Für Unternehmer
 * SEO: Unternehmensberatung, Finanzierung, Nachfolgeplanung, bAV
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight, CheckCircle2, TrendingUp, Wallet,
  Shield, Users, Building2
} from 'lucide-react';

const services = [
  {
    icon: TrendingUp,
    title: 'Nachfolge & Vermögenssicherung',
    description: 'Vermögen sichern, Strukturen schaffen, Übergang planbar gestalten.',
    details: [
      'Analyse Vermögensstruktur (privat/betrieblich)',
      'Risiko-/Schutzarchitektur',
      'Koordination mit StB/RA/Notar',
      'Entscheidungsunterlagen und Fahrplan',
    ],
  },
  {
    icon: Wallet,
    title: 'Finanzierung & Fördermittel',
    description: 'Finanzierungen planbar machen, bankfähig einreichen.',
    details: [
      'Bonitätsaufbereitung (Unterlagenpaket)',
      'Cashflow-/Tragfähigkeitsanalyse',
      'Fördermittel-Check als Prozessbaustein',
      'Moderation zwischen Unternehmen und Bank',
    ],
  },
  {
    icon: Shield,
    title: 'Gewerbe-Risikostruktur',
    description: 'Vollständigkeit, Prioritäten und Kostenoptimierung.',
    details: [
      'Flotten/Fuhrpark (Kostenwirkung, Deckung)',
      'Komplexe Gewerberisiken (Sach/Ertrag/Haftung)',
      'Vollständigkeits-Check & Risikoprofil',
      'Optimierung im Partnernetzwerk',
    ],
  },
  {
    icon: Users,
    title: 'Betriebliche Altersvorsorge',
    description: 'bAV als strategisches Unternehmensinstrument.',
    details: [
      'Arbeitgebermodelle zur Mitarbeiterbindung',
      'Koordination mit Lohnbüro/Steuerberater',
      'Implementierungsfahrplan',
      'Laufende Betreuung',
    ],
  },
];

export default function OttoUnternehmer() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Otto² Advisory — Unternehmensberatung',
    provider: { '@type': 'Organization', name: 'Komplett ZL Finanzdienstleistungen GmbH' },
    description: 'Finanzberatung für Unternehmer: Nachfolgeplanung, Finanzierung, Gewerberisiken und betriebliche Altersvorsorge.',
    serviceType: 'Finanzberatung für Unternehmer',
    areaServed: { '@type': 'Country', name: 'DE' },
  };

  return (
    <>
      <Helmet>
        <title>Für Unternehmer — Otto² Advisory | Finanzierung & Nachfolge</title>
        <meta name="description" content="Beratung für Unternehmer: Nachfolgeplanung, Finanzierung, Fördermittel, Gewerbe-Risikostruktur und betriebliche Altersvorsorge — strukturiert und transparent." />
        <link rel="canonical" href="https://otto2advisory.com/unternehmer" />
        <meta property="og:title" content="Für Unternehmer — Otto² Advisory" />
        <meta property="og:description" content="Finanzierung, Absicherung und strategische Beratung für Ihr Unternehmen." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="py-20 px-4 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
            <Building2 className="h-3.5 w-3.5" /> Für Unternehmer
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Finanzlösungen für <span className="text-blue-400">Unternehmer</span>
          </h1>
          <p className="max-w-3xl text-lg text-white/60 leading-relaxed">
            Beratung für Unternehmer — Struktur, Sicherheit, Finanzierung.
            Wir begleiten Sie von der Analyse bis zur Umsetzung.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-8 px-4 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {services.map(service => (
            <article key={service.title} className="rounded-2xl border border-blue-900/30 bg-blue-950/10 p-8">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <service.icon className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">{service.title}</h2>
                  <p className="text-white/50">{service.description}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 md:ml-[72px]">
                {service.details.map(detail => (
                  <div key={detail} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                    <span className="text-sm text-white/70">{detail}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Vorgehen */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold">Unser Vorgehen</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Bestandsaufnahme', desc: 'Risiko, Finanzen, Struktur — wo stehen Sie heute?' },
              { step: '2', title: 'Zielbild', desc: 'Zeithorizont, Familie, Unternehmen — wohin soll es gehen?' },
              { step: '3', title: 'Umsetzung', desc: 'Koordination, Dokumentation, Reviews — strukturiert zum Ziel.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/25">
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-950 border-t border-blue-800/30">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Bereit für ein Gespräch?</h2>
          <p className="mb-8 text-blue-200">
            Lassen Sie uns über Ihre Situation und Ziele sprechen.
          </p>
          <Link
            to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
          >
            Termin vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

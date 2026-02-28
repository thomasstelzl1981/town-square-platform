/**
 * OTTO² ADVISORY — Für Unternehmer
 * SEO: Unternehmensberatung, Finanzierung, Nachfolgeplanung, bAV
 * Design: Light, warm, Telis-Finanz-Stil
 */
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import {
  ArrowRight, CheckCircle2, TrendingUp, Wallet,
  Shield, Users, Building2
} from 'lucide-react';
import advisoryImg from '@/assets/otto/advisory-session.jpg';

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
    provider: { '@type': 'Organization', name: 'ZL Finanzdienstleistungen GmbH' },
    description: 'Finanzberatung für Unternehmer: Nachfolgeplanung, Finanzierung, Gewerberisiken und betriebliche Altersvorsorge.',
    serviceType: 'Finanzberatung für Unternehmer',
    areaServed: { '@type': 'Country', name: 'DE' },
  };

  return (
    <>
      <SEOHead
        brand="otto"
        page={{
          title: 'Für Unternehmer — Finanzierung & Nachfolge',
          description: 'Beratung für Unternehmer: Nachfolgeplanung, Finanzierung, Fördermittel, Gewerbe-Risikostruktur und betriebliche Altersvorsorge — strukturiert und transparent.',
          path: '/unternehmer',
        }}
        services={[{ name: 'Unternehmensberatung', description: 'Finanzberatung für Unternehmer: Nachfolgeplanung, Finanzierung, Gewerberisiken und bAV.' }]}
      />

      {/* Hero with Image */}
      <section className="relative py-20 px-4 md:py-28 overflow-hidden">
        <img src={advisoryImg} alt="Beratungsgespräch" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/70" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0055A4]/20 bg-white/80 px-4 py-1.5 text-xs text-[#0055A4] font-medium shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> Für Unternehmer
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl text-slate-800">
            Finanzlösungen für <span className="text-[#0055A4]">Unternehmer</span>
          </h1>
          <p className="max-w-3xl text-lg text-slate-600 leading-relaxed">
            Beratung für Unternehmer — Struktur, Sicherheit, Finanzierung.
            Wir begleiten Sie von der Analyse bis zur Umsetzung.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-8 px-4 md:py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl space-y-8">
          {services.map(service => (
            <article key={service.title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#0055A4]/10">
                  <service.icon className="h-7 w-7 text-[#0055A4]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-slate-800">{service.title}</h2>
                  <p className="text-slate-500">{service.description}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 md:ml-[72px]">
                {service.details.map(detail => (
                  <div key={detail} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0055A4]" />
                    <span className="text-sm text-slate-600">{detail}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Vorgehen */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-slate-800">Unser Vorgehen</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Bestandsaufnahme', desc: 'Risiko, Finanzen, Struktur — wo stehen Sie heute?' },
              { step: '2', title: 'Zielbild', desc: 'Zeithorizont, Familie, Unternehmen — wohin soll es gehen?' },
              { step: '3', title: 'Umsetzung', desc: 'Koordination, Dokumentation, Reviews — strukturiert zum Ziel.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0055A4] shadow-md">
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#0055A4]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Bereit für ein Gespräch?</h2>
          <p className="mb-8 text-white/80">
            Lassen Sie uns über Ihre Situation und Ziele sprechen.
          </p>
          <Link
            to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-[#0055A4] hover:bg-slate-50 transition-colors shadow-lg"
          >
            Termin vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

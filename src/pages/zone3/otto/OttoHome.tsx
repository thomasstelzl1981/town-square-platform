/**
 * OTTO² ADVISORY HOME — Zone 3
 * SEO: Finanzberatung München, Immobilienfinanzierung, Vorsorge
 * JSON-LD: FinancialService
 * Design: Light, warm, Telis-Finanz-Stil
 */
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import {
  ArrowRight, CheckCircle2, Building2, Users, Home,
  TrendingUp, Shield, Wallet, FileText, Target,
  Settings, ClipboardCheck, RefreshCw, Heart
} from 'lucide-react';
import heroFamilyImg from '@/assets/otto/hero-family-home.jpg';
import ottoStelzlImg from '@/assets/otto/otto-stelzl.jpg';
import thomasStelzlImg from '@/assets/otto/thomas-stelzl.jpg';
import advisoryImg from '@/assets/otto/advisory-session.jpg';
import natureImg from '@/assets/otto/bavarian-nature.jpg';
import houseImg from '@/assets/otto/modern-house.jpg';

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
    alternateName: 'ZL Finanzdienstleistungen GmbH',
    description: 'Ganzheitliche Finanzberatung für Unternehmer und Privathaushalte — Finanzierung, Vorsorge, Vermögensaufbau.',
    url: 'https://otto2advisory.com',
    areaServed: { '@type': 'Country', name: 'DE' },
    serviceType: ['Finanzberatung', 'Immobilienfinanzierung', 'Vorsorge', 'Vermögensaufbau'],
    knowsAbout: ['Baufinanzierung', 'Altersvorsorge', 'Gewerbeversicherung', 'Nachfolgeplanung', 'betriebliche Altersvorsorge'],
  };

  return (
    <>
      <SEOHead
        brand="otto"
        page={{
          title: 'Finanzberatung für Unternehmer & Privathaushalte',
          description: 'Erst Analyse, dann Zielbild. Otto² Advisory bietet ganzheitliche Finanzberatung: Immobilienfinanzierung, Vorsorge und Vermögensaufbau — strukturiert und transparent.',
          path: '/',
        }}
      />

      {/* Hero with Background Image */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <img src={heroFamilyImg} alt="Familie vor ihrem Eigenheim" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/90" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0055A4]/20 bg-white/80 px-4 py-1.5 text-xs text-[#0055A4] font-medium shadow-sm">
            <Wallet className="h-3.5 w-3.5" /> Ganzheitliche Finanzberatung
          </div>
          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl text-slate-800">
            Otto²<span className="text-[#0055A4]">Advisory</span>
          </h1>
          <p className="mx-auto mb-3 max-w-xl text-xl font-medium text-slate-700 md:text-2xl">
            Erst Analyse. Dann Zielbild. Strukturiert umsetzen.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-slate-500">
            Finanzberatung für Unternehmer und Privathaushalte. Finanzierung, Vorsorge und Vermögensaufbau — alles aus einer Hand.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/otto-advisory/finanzierung"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0055A4] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0055A4]/20 hover:bg-[#004690] transition-all"
            >
              Finanzierung beantragen <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/otto-advisory/kontakt"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-8 py-3.5 text-sm text-slate-600 hover:border-[#0055A4] hover:text-[#0055A4] transition-all"
            >
              Beratung anfragen
            </Link>
          </div>
        </div>
      </section>

      {/* Warum Otto² */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: CheckCircle2, title: 'Konzept vor Produkt', desc: 'Erst Analyse und Zielbild, dann passende Umsetzung.' },
              { icon: Shield, title: 'Ordnung + Begleitung', desc: 'Strukturierte Umsetzung mit laufender Betreuung.' },
              { icon: TrendingUp, title: 'Systemgestützt', desc: 'Transparente Beratung mit strukturiertem Service.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0055A4]/10">
                  <item.icon className="h-7 w-7 text-[#0055A4]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ihre Berater */}
      <section className="py-16 px-4 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-10 text-2xl font-bold text-slate-800">Ihre Berater</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16 mb-8">
            <div className="flex flex-col items-center">
              <img src={ottoStelzlImg} alt="Otto Stelzl — Geschäftsführer" className="h-40 w-40 rounded-full object-cover object-top shadow-md mb-4" />
              <p className="font-semibold text-lg text-slate-800">Otto Stelzl</p>
              <p className="text-sm text-slate-500">Geschäftsführer</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={thomasStelzlImg} alt="Thomas Otto Stelzl — Finanzberater" className="h-40 w-40 rounded-full object-cover object-top shadow-md mb-4" />
              <p className="font-semibold text-lg text-slate-800">Thomas Otto Stelzl</p>
              <p className="text-sm text-slate-500">Finanzberater</p>
            </div>
          </div>
          <p className="mx-auto max-w-xl text-slate-600 italic leading-relaxed mb-8">
            „Herzlich willkommen bei Otto² Advisory! Wir freuen uns darauf, Sie kennenzulernen. Unser Versprechen: Pragmatisch und ehrlich beraten — immer. Wir laden Sie herzlich ein zu einem unverbindlichen Kennenlernen."
          </p>
          <Link
            to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0055A4] hover:underline"
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Für Unternehmer & Privathaushalte — Cards with Images */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Link
            to="/website/otto-advisory/unternehmer"
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-[#0055A4]/30"
          >
            <div className="h-48 overflow-hidden">
              <img src={advisoryImg} alt="Beratungssituation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <Building2 className="mb-4 h-8 w-8 text-[#0055A4]" />
              <h2 className="mb-3 text-2xl font-bold text-slate-800">Für Unternehmer</h2>
              <p className="text-sm text-slate-500 mb-6">
                Finanzierung, Absicherung und strategische Beratung für Ihr Unternehmen. Von der Bestandsaufnahme bis zur Umsetzung.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm text-[#0055A4] font-medium group-hover:gap-2.5 transition-all">
                Leistungen ansehen <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
          <Link
            to="/website/otto-advisory/private-haushalte"
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-[#0055A4]/30"
          >
            <div className="h-48 overflow-hidden">
              <img src={houseImg} alt="Modernes Eigenheim" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <Users className="mb-4 h-8 w-8 text-[#0055A4]" />
              <h2 className="mb-3 text-2xl font-bold text-slate-800">Für Privathaushalte</h2>
              <p className="text-sm text-slate-500 mb-6">
                Immobilienfinanzierung, Altersvorsorge und Vermögensaufbau — maßgeschneidert auf Ihre Lebenssituation.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm text-[#0055A4] font-medium group-hover:gap-2.5 transition-all">
                Leistungen ansehen <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Beratungsschwerpunkte Unternehmer */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center justify-center gap-3">
            <Building2 className="h-7 w-7 text-[#0055A4]" />
            <h2 className="text-3xl font-bold text-slate-800">Beratungsschwerpunkte für Unternehmer</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {unternehmerServices.map(s => (
              <div key={s.title} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#0055A4]/30">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0055A4]/10 group-hover:bg-[#0055A4]/15 transition-colors">
                  <s.icon className="h-6 w-6 text-[#0055A4]" />
                </div>
                <h3 className="mb-2 font-semibold text-lg text-slate-800">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/website/otto-advisory/unternehmer" className="inline-flex items-center gap-2 rounded-lg border border-[#0055A4]/30 px-6 py-2.5 text-sm font-medium text-[#0055A4] hover:bg-[#0055A4]/5 transition-colors">
              Alle Unternehmer-Leistungen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* System für Privathaushalte — 6 Steps */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center justify-center gap-3">
            <Users className="h-7 w-7 text-[#0055A4]" />
            <h2 className="text-3xl font-bold text-slate-800">Unser System für private Haushalte</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {privatSystemSteps.map((step, i) => (
              <div key={step.title} className="relative group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#0055A4]/30">
                <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#0055A4] text-xs font-bold text-white shadow-md">
                  {i + 1}
                </div>
                <div className="mb-4 mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0055A4]/10 group-hover:bg-[#0055A4]/15 transition-colors">
                  <step.icon className="h-6 w-6 text-[#0055A4]" />
                </div>
                <h3 className="mb-2 font-semibold text-lg text-slate-800">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/website/otto-advisory/private-haushalte" className="inline-flex items-center gap-2 rounded-lg border border-[#0055A4]/30 px-6 py-2.5 text-sm font-medium text-[#0055A4] hover:bg-[#0055A4]/5 transition-colors">
              Leistungen für Privathaushalte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bavarian Nature Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <img src={natureImg} alt="Bayerische Landschaft" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0055A4]/80" />
        <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
          <Home className="mx-auto mb-6 h-12 w-12 text-white/90" />
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Digitale Baufinanzierung neu gedacht</h2>
          <p className="mx-auto mb-4 max-w-2xl text-lg text-white/90">
            Ihre Immobilienfinanzierung — professionell aufbereitet über unser digitales Portal.
          </p>
          <div className="my-10 grid gap-6 text-left md:grid-cols-3">
            {[
              { icon: FileText, title: 'Digitaler Bonitätsordner', desc: 'Alle Unterlagen strukturiert und vollständig — laufend aktuell gehalten.' },
              { icon: Target, title: 'Bessere Kommunikation', desc: 'Professionell aufbereitete Anfragen führen zu schnelleren Zusagen und besseren Konditionen.' },
              { icon: RefreshCw, title: 'Moderierter Prozess', desc: 'Wir begleiten Sie durch den gesamten Finanzierungsprozess — transparent und strukturiert.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20">
                <item.icon className="mb-3 h-8 w-8 text-white/90" />
                <h3 className="mb-2 font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            to="/website/otto-advisory/finanzierung"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-[#0055A4] hover:bg-slate-50 transition-colors shadow-lg"
          >
            Finanzierung beantragen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800">Termin vereinbaren</h2>
          <p className="mb-8 text-slate-500">
            Lassen Sie uns in einem ersten Gespräch über Ihre Situation und Ziele sprechen.
          </p>
          <Link
            to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0055A4] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0055A4]/20 hover:bg-[#004690] transition-all"
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

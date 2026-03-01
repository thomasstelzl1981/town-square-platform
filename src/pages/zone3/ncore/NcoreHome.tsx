/**
 * NCORE HOME — Redesign: Alternating dark/light with AI images
 */
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { ArrowRight, Cpu, Shield, TrendingUp, Network, Users, Sparkles, CheckCircle2, Globe, Zap, Lightbulb } from 'lucide-react';
import heroNetworkImg from '@/assets/ncore/hero-network.jpg';
import advisoryImg from '@/assets/ncore/advisory-session.jpg';
import networkImg from '@/assets/ncore/network-handshake.jpg';
import founderImg from '@/assets/ncore/thomas-stelzl.jpg';

const STATS = [
  { value: '15+', label: 'Jahre Erfahrung' },
  { value: '200+', label: 'Beratungsprojekte' },
  { value: '50+', label: 'Netzwerkpartner' },
  { value: '3', label: 'Kernbereiche' },
];

export default function NcoreHome() {
  return (
    <>
      <SEOHead
        brand="ncore"
        page={{
          title: 'Connecting Dots. Connecting People.',
          description: 'Ganzheitliche Unternehmensberatung für KMU: KI-gestützte Digitalisierung, österreichische Stiftungsmodelle, Vermögensschutz und Geschäftsmodellentwicklung.',
          path: '/',
        }}
      />

      {/* ── Hero — Dark with network image ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0">
          <img src={heroNetworkImg} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900" />
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
          <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-300 md:text-xl leading-relaxed">
            Wir betrachten Ihr Unternehmen als Ganzes — nicht als Summe von Teillösungen.
            Digitalisierung, Vermögensschutz und Geschäftsmodellentwicklung aus langjähriger operativer Erfahrung.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/ncore/kontakt"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-sm font-semibold text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/ncore/digitalisierung"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-sm text-slate-200 transition-all hover:border-white/30 hover:text-white hover:bg-white/5"
            >
              Unsere Leistungen
            </Link>
          </div>
          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-emerald-400 md:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP Banner — Transition ── */}
      <section className="border-y border-slate-200 bg-slate-50 py-6">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Keine Teillösungen</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Operativ statt theoretisch</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> KI zu günstigen Kosten</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Exzellentes Netzwerk</span>
          </div>
        </div>
      </section>

      {/* ── 3 Pillars — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Unsere Kernbereiche</p>
            <h2 className="mb-5 text-3xl font-bold text-slate-800 md:text-5xl">Drei Säulen. Eine Vision.</h2>
            <p className="mx-auto max-w-2xl text-slate-500 leading-relaxed">
              Wir verbinden Digitalisierung, Vermögensschutz und Vertrieb zu einer ganzheitlichen
              Strategie — denn isolierte Maßnahmen bringen nur isolierte Ergebnisse.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Cpu, title: 'Digitalisierung & KI',
                desc: 'Wir wissen operativ, wie man KI und Automatisierung zu sehr günstigen Kosten in Unternehmen bringt.',
                features: ['Prozessautomatisierung', 'KI-Integration', 'Einheitliche Software'],
                link: '/website/ncore/digitalisierung',
              },
              {
                icon: Shield, title: 'Stiftungen & Vermögensschutz',
                desc: 'Österreichische Stiftungsmodelle, generationsübergreifende Strukturierung und Wegzugsbesteuerung.',
                features: ['Privatstiftungen (AT)', 'Wegzugsbesteuerung', 'Generationenplanung'],
                link: '/website/ncore/stiftungen',
              },
              {
                icon: TrendingUp, title: 'Geschäftsmodelle & Vertrieb',
                desc: 'Von der Idee zum skalierbaren Geschäftsmodell. Businesspläne, Pitch Decks und Vertriebssysteme.',
                features: ['Business Model Design', 'Pitch Decks', 'Vertriebssysteme'],
                link: '/website/ncore/geschaeftsmodelle',
              },
            ].map(pillar => (
              <Link
                key={pillar.title}
                to={pillar.link}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-800">{pillar.title}</h3>
                <p className="mb-6 text-sm text-slate-500 leading-relaxed">{pillar.desc}</p>
                <ul className="space-y-2 mb-6">
                  {pillar.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <Zap className="h-3 w-3 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 group-hover:gap-2 transition-all">
                  Mehr erfahren <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Ncore — Dark with image ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-16 md:grid-cols-2 items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Warum Ncore</p>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                Anders beraten.<br />
                <span className="text-emerald-400">Besser umsetzen.</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Viele Berater bieten Teillösungen: entweder IT-Beratung oder Finanzberatung. Wir sind anders.
                Als erfahrene Finanz- und Unternehmensberater betrachten wir das Unternehmen als Ganzes und
                wissen operativ, wie KI zu günstigen Kosten eingesetzt werden kann.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lightbulb, text: 'Operativ statt theoretisch — wir setzen selbst um' },
                  { icon: Users, text: 'Netzwerk aus RA, StB, Banken und KI-Partnern' },
                  { icon: Globe, text: 'Ganzheitlicher Blick auf Ihr Unternehmen' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <item.icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img src={advisoryImg} alt="Beratungssituation bei Ncore" className="w-full h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Network Teaser — Light with image ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 items-center md:grid-cols-2">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={networkImg} alt="Ncore Business-Netzwerk" className="w-full h-80 object-cover" />
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Unser Netzwerk</p>
              <h2 className="mb-5 text-3xl font-bold text-slate-800 md:text-4xl">Hervorragendes Netzwerk</h2>
              <p className="mb-6 text-slate-500 leading-relaxed">
                Banken, Rechtsanwälte, Steuerberater, KI-Partner — wir verfügen über ein exzellentes
                Netzwerk in alle Bereiche der Unternehmens- und Bankenwelt für den Mittelstand.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Banken & Finanzierer', 'Rechtsanwälte & Notare', 'Steuerberater & WP', 'KI & Tech-Partner', 'Versicherungen'].map(tag => (
                  <span key={tag} className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to="/website/ncore/netzwerk"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition-all"
              >
                Netzwerk entdecken <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gründer — Light ── */}
      <section className="py-20 px-4 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Der Gründer</p>
          <img
            src={founderImg}
            alt="Thomas Stelzl — Gründer von Ncore Business Consulting"
            className="mx-auto mb-6 h-44 w-44 rounded-full object-cover object-top shadow-lg"
          />
          <h2 className="mb-1 text-2xl font-bold text-slate-800">Thomas Stelzl</h2>
          <p className="mb-6 text-sm text-slate-500">Gründer & Geschäftsführer</p>
          <p className="mx-auto max-w-xl text-slate-600 italic leading-relaxed mb-8">
            „Ich habe Ncore gegründet, weil ich davon überzeugt bin, dass gute Beratung alle Bereiche eines Unternehmens zusammen denken muss — Digitalisierung, Finanzen und Strategie. Operativ, ehrlich und immer mit dem Blick auf das große Ganze."
          </p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline"
          >
            Persönliches Gespräch vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA — Dark ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-5 text-3xl font-bold md:text-4xl">Bereit für den nächsten Schritt?</h2>
          <p className="mx-auto mb-10 max-w-xl text-slate-400 leading-relaxed">
            Ob Digitalisierungsprojekt, Vermögensstrukturierung oder Geschäftsmodellentwicklung — wir freuen uns auf das Gespräch.
          </p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-10 py-4 text-sm font-semibold text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Unverbindliches Erstgespräch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

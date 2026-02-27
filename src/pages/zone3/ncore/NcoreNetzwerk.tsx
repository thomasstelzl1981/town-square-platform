/**
 * NCORE NETZWERK — Connecting People
 * SEO: Organization schema, LLM-optimized
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Network, Building2, Scale, Landmark, Cpu, ArrowRight, Shield, Globe, Users, Handshake } from 'lucide-react';

const NETWORK_CATEGORIES = [
  {
    icon: Landmark,
    title: 'Banken & Finanzierer',
    desc: 'Direkter Zugang zu Entscheidungsträgern bei regionalen und überregionalen Banken. Finanzierungspartner für Unternehmens- und Immobilienfinanzierungen.',
    examples: ['Regionalbanken', 'Privatbanken', 'Förderinstitute', 'Alternative Finanzierer'],
  },
  {
    icon: Scale,
    title: 'Rechtsanwälte & Notare',
    desc: 'Spezialisierte Kanzleien für Gesellschaftsrecht, Stiftungsrecht (AT/DE), internationales Steuerrecht und M&A-Transaktionen.',
    examples: ['Stiftungsrecht', 'Gesellschaftsrecht', 'Steuerrecht', 'Notarielle Beurkundung'],
  },
  {
    icon: Building2,
    title: 'Steuerberater & Wirtschaftsprüfer',
    desc: 'Netzwerk aus Steuerberatern mit Expertise in Unternehmensstrukturierung, grenzüberschreitenden Themen und Wegzugsbesteuerung.',
    examples: ['Internationale Steuergestaltung', 'Betriebsprüfung', 'Holdingstrukturen', 'Transfer Pricing'],
  },
  {
    icon: Cpu,
    title: 'Technologie & KI-Partner',
    desc: 'Partnerschaften mit KI-Entwicklern und Softwarehäusern für maßgeschneiderte Digitalisierungslösungen — von der Prozessautomatisierung bis zum KI-Assistenten.',
    examples: ['KI-Modellentwicklung', 'Cloud-Infrastruktur', 'API-Integration', 'Custom Software'],
  },
  {
    icon: Shield,
    title: 'Versicherungen & Vorsorge',
    desc: 'Versicherungsspezialisten für Gewerbeversicherungen, bAV und Vermögensabsicherung — abgestimmt auf die Gesamtstrategie.',
    examples: ['Gewerbeversicherung', 'bAV', 'D&O-Versicherung', 'Vermögensschadenversicherung'],
  },
  {
    icon: Handshake,
    title: 'Branchenpartner & Verbände',
    desc: 'Zugang zu Branchenverbänden, Wirtschaftsförderungen und strategischen Kooperationspartnern im gesamten DACH-Raum.',
    examples: ['Wirtschaftsförderung', 'IHK-Netzwerke', 'Branchenverbände', 'Kooperationspartner'],
  },
];

export default function NcoreNetzwerk() {
  return (
    <>
      <Helmet>
        <title>Unser Netzwerk — Ncore Business Consulting</title>
        <meta name="description" content="Hervorragendes Netzwerk in der Unternehmens- und Bankenwelt Deutschlands. Rechtsanwälte, Steuerberater, Banken, KI-Partner und Versicherungen — alles für KMU." />
        <meta property="og:title" content="Unser Netzwerk — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/netzwerk" />
        <meta name="keywords" content="Netzwerk, Banken, Rechtsanwälte, Steuerberater, KI Partner, Unternehmensberatung, KMU, Geschäftskontakte" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Network className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl">
            Connecting <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">People</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-white/55 leading-relaxed">
            Wir verfügen über ein hervorragendes Netzwerk in alle Bereiche der Unternehmens-
            und Bankenwelt in Deutschland für kleine und mittelständische Unternehmen.
          </p>
          <p className="mx-auto max-w-2xl text-sm text-white/35 leading-relaxed">
            Unser Netzwerk ist kein Selbstzweck. Es ist das Werkzeug, mit dem wir für unsere
            Mandanten die besten Experten zusammenbringen — effizient koordiniert und zu fairen Kosten.
          </p>
        </div>
      </section>

      {/* ── Network Grid ── */}
      <section className="mx-auto max-w-7xl px-4 pb-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {NETWORK_CATEGORIES.map(item => (
            <div key={item.title} className="rounded-2xl border border-emerald-900/25 bg-gradient-to-b from-emerald-950/20 to-transparent p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <item.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
              <p className="mb-5 text-sm text-white/40 leading-relaxed">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.examples.map(ex => (
                  <span key={ex} className="rounded-full bg-emerald-950/30 border border-emerald-900/20 px-3 py-1 text-xs text-white/30">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Value Prop ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Der Ncore-Vorteil</p>
          <h2 className="mb-6 text-3xl font-bold">Ein Anruf. Alle Experten.</h2>
          <p className="mx-auto mb-12 max-w-2xl text-white/40 leading-relaxed">
            Sie brauchen nicht fünf verschiedene Berater zu koordinieren. Wir sind Ihr
            zentraler Ansprechpartner und orchestrieren das gesamte Expertennetzwerk —
            vom Rechtsanwalt über den Steuerberater bis zum KI-Entwickler.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: '50+ Partner', desc: 'Geprüfte Fachexperten in allen relevanten Disziplinen' },
              { icon: Globe, title: 'DACH-weit', desc: 'Netzwerk in Deutschland, Österreich und der Schweiz' },
              { icon: Shield, title: 'Qualitätsgarantie', desc: 'Jeder Partner wird von uns persönlich empfohlen und überwacht' },
            ].map(v => (
              <div key={v.title} className="rounded-xl border border-emerald-900/20 bg-emerald-950/15 p-6">
                <v.icon className="mx-auto mb-3 h-6 w-6 text-emerald-400/60" />
                <h3 className="mb-2 text-sm font-semibold">{v.title}</h3>
                <p className="text-xs text-white/35">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ins Netzwerk eintreten</h2>
          <p className="mb-8 text-white/45">Erfahren Sie, wie unser Netzwerk Ihrem Unternehmen konkret helfen kann.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-black hover:bg-emerald-400 transition-all"
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

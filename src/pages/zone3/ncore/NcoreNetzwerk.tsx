/**
 * NCORE NETZWERK — Redesign: Alternating dark/light with handshake image
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Network, Building2, Scale, Landmark, Cpu, ArrowRight, Shield, Globe, Users, Handshake } from 'lucide-react';
import networkImg from '@/assets/ncore/network-handshake.jpg';

const NETWORK_CATEGORIES = [
  { icon: Landmark, title: 'Banken & Finanzierer', desc: 'Direkter Zugang zu Entscheidungsträgern bei regionalen und überregionalen Banken.', examples: ['Regionalbanken', 'Privatbanken', 'Förderinstitute', 'Alternative Finanzierer'] },
  { icon: Scale, title: 'Rechtsanwälte & Notare', desc: 'Spezialisierte Kanzleien für Gesellschaftsrecht, Stiftungsrecht und internationales Steuerrecht.', examples: ['Stiftungsrecht', 'Gesellschaftsrecht', 'Steuerrecht', 'Notarielle Beurkundung'] },
  { icon: Building2, title: 'Steuerberater & WP', desc: 'Expertise in Unternehmensstrukturierung und grenzüberschreitenden Themen.', examples: ['Internationale Steuergestaltung', 'Holdingstrukturen', 'Transfer Pricing', 'Betriebsprüfung'] },
  { icon: Cpu, title: 'Technologie & KI-Partner', desc: 'KI-Entwickler und Softwarehäuser für maßgeschneiderte Digitalisierung.', examples: ['KI-Modellentwicklung', 'Cloud-Infrastruktur', 'API-Integration', 'Custom Software'] },
  { icon: Shield, title: 'Versicherungen & Vorsorge', desc: 'Versicherungsspezialisten für Gewerbeversicherungen und bAV.', examples: ['Gewerbeversicherung', 'bAV', 'D&O-Versicherung', 'Vermögensschadenversicherung'] },
  { icon: Handshake, title: 'Branchenpartner & Verbände', desc: 'Zugang zu Branchenverbänden und Wirtschaftsförderungen im DACH-Raum.', examples: ['Wirtschaftsförderung', 'IHK-Netzwerke', 'Branchenverbände', 'Kooperationspartner'] },
];

export default function NcoreNetzwerk() {
  return (
    <>
      <Helmet>
        <title>Unser Netzwerk — Ncore Business Consulting</title>
        <meta name="description" content="Hervorragendes Netzwerk in der Unternehmens- und Bankenwelt. Rechtsanwälte, Steuerberater, Banken, KI-Partner und Versicherungen — alles für KMU." />
        <meta property="og:title" content="Unser Netzwerk — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/netzwerk" />
      </Helmet>

      {/* ── Hero — Dark with image ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src={networkImg} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Network className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl">
            Connecting <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">People</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
            Wir verfügen über ein hervorragendes Netzwerk in alle Bereiche der Unternehmens-
            und Bankenwelt in Deutschland für kleine und mittelständische Unternehmen.
          </p>
        </div>
      </section>

      {/* ── Network Grid — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Netzwerk-Partner</p>
            <h2 className="text-3xl font-bold text-slate-800">Unser Experten-Ökosystem</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {NETWORK_CATEGORIES.map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-slate-800">{item.title}</h3>
                <p className="mb-5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.examples.map(ex => (
                    <span key={ex} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 font-medium">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Prop — Dark ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Der Ncore-Vorteil</p>
          <h2 className="mb-6 text-3xl font-bold">Ein Anruf. Alle Experten.</h2>
          <p className="mx-auto mb-12 max-w-2xl text-slate-400 leading-relaxed">
            Sie brauchen nicht fünf verschiedene Berater zu koordinieren. Wir orchestrieren das gesamte Expertennetzwerk.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: '50+ Partner', desc: 'Geprüfte Fachexperten in allen relevanten Disziplinen' },
              { icon: Globe, title: 'DACH-weit', desc: 'Netzwerk in Deutschland, Österreich und der Schweiz' },
              { icon: Shield, title: 'Qualitätsgarantie', desc: 'Jeder Partner ist persönlich geprüft und empfohlen' },
            ].map(v => (
              <div key={v.title} className="rounded-xl border border-emerald-900/30 bg-slate-800/50 p-6">
                <v.icon className="mx-auto mb-3 h-6 w-6 text-emerald-400" />
                <h3 className="mb-2 text-sm font-semibold">{v.title}</h3>
                <p className="text-xs text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — Light ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-800 md:text-3xl">Ins Netzwerk eintreten</h2>
          <p className="mb-8 text-slate-500">Erfahren Sie, wie unser Netzwerk Ihrem Unternehmen konkret helfen kann.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition-all"
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

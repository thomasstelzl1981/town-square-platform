/**
 * NCORE STIFTUNGEN — Redesign: Alternating dark/light sections
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Shield, Scale, Globe, ArrowRight, Users, Landmark, Lock, Building2, CheckCircle2 } from 'lucide-react';

const FAQ = [
  { q: 'Was ist eine österreichische Privatstiftung?', a: 'Eine österreichische Privatstiftung ist eine rechtlich selbstständige Einheit, die Vermögen nach dem Willen des Stifters verwaltet und an Begünstigte weitergibt.' },
  { q: 'Warum Österreich und nicht Liechtenstein oder Schweiz?', a: 'Österreichische Stiftungen bieten ein ausgewogenes Verhältnis aus steuerlicher Attraktivität, rechtlicher Flexibilität und geringen Verwaltungskosten.' },
  { q: 'Was ist Wegzugsbesteuerung?', a: 'Bei Verlegung des Wohnsitzes ins Ausland besteuert Deutschland unrealisierte Wertzuwächse. Wir entwickeln legale Gestaltungsmodelle.' },
  { q: 'Brauche ich einen eigenen Rechtsanwalt?', a: 'Nein. Wir orchestrieren das gesamte Projekt mit unserem Netzwerk aus spezialisierten Kanzleien und Steuerberatern.' },
];

export default function NcoreStiftungen() {
  return (
    <>
      <Helmet>
        <title>Stiftungen & Vermögensschutz — Ncore Business Consulting</title>
        <meta name="description" content="Österreichische Stiftungsmodelle, generationsübergreifender Vermögensschutz und Wegzugsbesteuerung. Beratung und Orchestrierung mit RA- und StB-Netzwerk." />
        <meta property="og:title" content="Stiftungen & Vermögensschutz — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/stiftungen" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "Service",
          "name": "Stiftungs- und Vermögensstrukturierung",
          "provider": { "@id": "https://ncore.online/#organization" },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": FAQ.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
        })}</script>
      </Helmet>

      {/* ── Hero — Dark ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-medium text-emerald-400">
            <Shield className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Stiftungen &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Vermögensschutz</span>
          </h1>
          <p className="mb-6 text-lg text-slate-300 leading-relaxed max-w-3xl md:text-xl">
            Wir orchestrieren ein exzellentes Netzwerk aus spezialisierten Kanzleien und Steuerberatern
            für Stiftungsstrukturen — günstig und steuerbar umgesetzt.
          </p>
        </div>
      </section>

      {/* ── Services — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { icon: Landmark, title: 'Österreichische Privatstiftungen', desc: 'Von der Konzeption bis zur Gründung — wir koordinieren den gesamten Prozess.', features: ['Stiftungsurkunde', 'Begünstigtenregelung', 'Stiftungsvorstand', 'Laufende Verwaltung'] },
              { icon: Users, title: 'Generationsübergreifende Strukturierung', desc: 'Vermögen über Generationen hinweg schützen und strukturieren.', features: ['Nachfolgeplanung', 'Familiengovernance', 'Steueroptimierung', 'Pflichtteilsvermeidung'] },
              { icon: Globe, title: 'Wegzugsbesteuerung', desc: 'Legale Gestaltungsmodelle bei Verlegung des Wohnsitzes.', features: ['§ 6 AStG Gestaltung', 'Stundungsmodelle', 'Strukturierung vor Wegzug', 'EU-Freizügigkeit'] },
              { icon: Lock, title: 'Asset Protection', desc: 'Schutz vor Haftungsrisiken und Gläubigerzugriffen.', features: ['Haftungsbegrenzung', 'Gläubigerschutz', 'Vermögenstrennung', 'Internationale Strukturen'] },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-800">{item.title}</h3>
                <p className="mb-5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {item.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Network Value — Dark ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Unser Vorteil</p>
            <h2 className="text-3xl font-bold md:text-4xl">Ein Ansprechpartner. Ein Netzwerk.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Scale, label: 'Rechtsanwälte', desc: 'Stiftungsrecht (AT/DE)' },
              { icon: Building2, label: 'Steuerberater', desc: 'Grenzüberschreitende Gestaltung' },
              { icon: Landmark, label: 'Notare', desc: 'Beurkundung & Register' },
              { icon: Shield, label: 'Banken', desc: 'Stiftungskonten & Verwaltung' },
            ].map(n => (
              <div key={n.label} className="rounded-xl border border-emerald-900/30 bg-slate-800/50 p-6 text-center">
                <n.icon className="mx-auto mb-3 h-6 w-6 text-emerald-400" />
                <h3 className="text-sm font-semibold mb-1">{n.label}</h3>
                <p className="text-xs text-slate-400">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">FAQ</p>
            <h2 className="text-3xl font-bold text-slate-800">Häufige Fragen</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map(f => (
              <div key={f.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — Dark ── */}
      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Vertrauliches Erstgespräch</h2>
          <p className="mb-8 text-slate-400">Vermögensstrukturierung erfordert Diskretion. Sprechen Sie uns unverbindlich an.</p>
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

/**
 * NCORE STIFTUNGEN — Österreichische Stiftungsmodelle & Vermögensschutz
 * SEO: Service-Schema, FAQ-Schema, LLM-optimized
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Shield, Scale, Globe, ArrowRight, Users, Landmark, Lock, Building2, CheckCircle2 } from 'lucide-react';

const FAQ = [
  { q: 'Was ist eine österreichische Privatstiftung?', a: 'Eine österreichische Privatstiftung ist eine rechtlich selbstständige Einheit, die Vermögen nach dem Willen des Stifters verwaltet und an Begünstigte weitergibt. Sie bietet steuerliche Vorteile und schützt Vermögen vor unberechtigtem Zugriff.' },
  { q: 'Warum Österreich und nicht Liechtenstein oder Schweiz?', a: 'Österreichische Stiftungen bieten ein ausgewogenes Verhältnis aus steuerlicher Attraktivität, rechtlicher Flexibilität und vergleichsweise geringen Gründungs- und Verwaltungskosten. Zudem besteht innerhalb der EU volle Rechtssicherheit.' },
  { q: 'Was ist Wegzugsbesteuerung und wie kann man sie gestalten?', a: 'Bei Verlegung des Wohnsitzes ins Ausland besteuert Deutschland unrealisierte Wertzuwächse. Gemeinsam mit unseren Steuerberatern und Rechtsanwälten entwickeln wir legale Gestaltungsmodelle, um die Steuerlast zu minimieren.' },
  { q: 'Brauche ich einen eigenen Rechtsanwalt?', a: 'Nein. Wir orchestrieren das gesamte Projekt mit unserem Netzwerk aus spezialisierten Kanzleien, Steuerberatern und Notaren. Sie haben einen Ansprechpartner — wir koordinieren den Rest.' },
];

export default function NcoreStiftungen() {
  return (
    <>
      <Helmet>
        <title>Stiftungen & Vermögensschutz — Ncore Business Consulting</title>
        <meta name="description" content="Österreichische Stiftungsmodelle, generationsübergreifender Vermögensschutz und Wegzugsbesteuerung. Beratung und Orchestrierung mit Netzwerk aus Rechtsanwälten und Steuerberatern zu günstigen Kosten." />
        <meta property="og:title" content="Stiftungen & Vermögensschutz — Ncore Business Consulting" />
        <meta property="og:description" content="Vermögensstrukturierung mit österreichischen Stiftungsmodellen — orchestriert mit RA & StB Netzwerk." />
        <meta property="og:url" content="https://ncore.online/stiftungen" />
        <meta name="keywords" content="Stiftung, Privatstiftung, Österreich, Vermögensschutz, Wegzugsbesteuerung, Vermögensstrukturierung, Generationenplanung, Stiftungsberatung" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Stiftungs- und Vermögensstrukturierung",
          "provider": { "@id": "https://ncore.online/#organization" },
          "description": "Beratung zu österreichischen Privatstiftungen, generationsübergreifendem Vermögensschutz und Wegzugsbesteuerung mit Netzwerk-Orchestrierung.",
          "areaServed": [
            { "@type": "Country", "name": "Germany" },
            { "@type": "Country", "name": "Austria" },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-medium text-emerald-400">
            <Shield className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Stiftungen &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Vermögensschutz</span>
          </h1>
          <p className="mb-6 text-lg text-white/55 leading-relaxed max-w-3xl md:text-xl">
            Wir sind keine reinen Rechtsanwälte oder Steuerberater. Wir sind Orchestratoren
            mit einem exzellenten Netzwerk aus spezialisierten Kanzleien und Steuerberatern,
            die wissen, wie Stiftungsstrukturen günstig und steuerbar umgesetzt werden können.
          </p>
          <p className="text-sm text-white/35 leading-relaxed max-w-3xl">
            Unser Fokus: Österreichische Privatstiftungsmodelle, generationsübergreifende
            Vermögensstrukturierung und legale Gestaltung bei Wegzugsbesteuerung — alles aus
            einer Hand koordiniert, zu Kosten die deutlich unter dem Marktdurchschnitt liegen.
          </p>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="mx-auto max-w-7xl px-4 pb-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Landmark,
              title: 'Österreichische Privatstiftungen',
              desc: 'Privatstiftungen nach österreichischem Recht als bewährtes Instrument für Vermögensschutz und -weitergabe. Von der Konzeption bis zur Gründung — wir koordinieren den gesamten Prozess.',
              features: ['Stiftungsurkunde & Zusatzurkunde', 'Begünstigtenregelung', 'Stiftungsvorstand', 'Laufende Verwaltung'],
            },
            {
              icon: Users,
              title: 'Generationsübergreifende Strukturierung',
              desc: 'Vermögen über Generationen hinweg schützen und strukturieren. Familiengovernance, Nachfolgeplanung und steueroptimierte Übertragung — abgestimmt auf Ihre Familiensituation.',
              features: ['Nachfolgeplanung', 'Familiengovernance', 'Steueroptimierung', 'Pflichtteilsvermeidung'],
            },
            {
              icon: Globe,
              title: 'Wegzugsbesteuerung',
              desc: 'Bei Verlegung des Wohnsitzes ins Ausland droht erhebliche Steuerbelastung. Wir entwickeln gemeinsam mit unseren Steuerberatern und Rechtsanwälten legale Gestaltungsmodelle — zu sehr niedrigen Kosten.',
              features: ['§ 6 AStG Gestaltung', 'Stundungsmodelle', 'Strukturierung vor Wegzug', 'EU-Freizügigkeit'],
            },
            {
              icon: Lock,
              title: 'Vermögensschutz & Asset Protection',
              desc: 'Schützen Sie Ihr Vermögen vor Haftungsrisiken, Gläubigerzugriffen und politischen Risiken. Rechtzeitige Strukturierung ist der Schlüssel.',
              features: ['Haftungsbegrenzung', 'Gläubigerschutz', 'Vermögenstrennung', 'Internationale Strukturen'],
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-emerald-900/25 bg-gradient-to-b from-emerald-950/20 to-transparent p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <item.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="mb-5 text-sm text-white/45 leading-relaxed">{item.desc}</p>
              <ul className="grid grid-cols-2 gap-2">
                {item.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/35">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500/50 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Network Value ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Unser Vorteil</p>
            <h2 className="text-3xl font-bold md:text-4xl">Ein Ansprechpartner. Ein Netzwerk.</h2>
            <p className="mt-4 mx-auto max-w-2xl text-white/40">
              Sie müssen nicht selbst Rechtsanwälte, Steuerberater und Notare koordinieren.
              Wir bringen die richtigen Experten zusammen und steuern den Prozess effizient.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Scale, label: 'Rechtsanwälte', desc: 'Spezialisiert auf Stiftungsrecht (AT/DE)' },
              { icon: Building2, label: 'Steuerberater', desc: 'Experten für grenzüberschreitende Steuergestaltung' },
              { icon: Landmark, label: 'Notare', desc: 'Beurkundung und Registeranmeldung' },
              { icon: Shield, label: 'Banken', desc: 'Stiftungskonten und Vermögensverwaltung' },
            ].map(n => (
              <div key={n.label} className="rounded-xl border border-emerald-900/20 bg-emerald-950/15 p-5 text-center">
                <n.icon className="mx-auto mb-3 h-6 w-6 text-emerald-400/60" />
                <h3 className="text-sm font-semibold mb-1">{n.label}</h3>
                <p className="text-xs text-white/35">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">FAQ</p>
            <h2 className="text-3xl font-bold">Häufige Fragen</h2>
          </div>
          <div className="space-y-6">
            {FAQ.map(f => (
              <div key={f.q} className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-6">
                <h3 className="mb-3 text-sm font-semibold">{f.q}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-emerald-900/20 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Vertrauliches Erstgespräch</h2>
          <p className="mb-8 text-white/45">Vermögensstrukturierung erfordert Diskretion. Sprechen Sie uns unverbindlich an.</p>
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

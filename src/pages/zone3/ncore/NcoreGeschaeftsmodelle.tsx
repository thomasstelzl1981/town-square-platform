/**
 * NCORE GESCHÄFTSMODELLE — Geschäftsmodelle & Vertrieb
 * SEO: Service-Schema, FAQ, LLM-optimized
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { TrendingUp, Lightbulb, Megaphone, ArrowRight, Target, BarChart3, Users, Zap, CheckCircle2 } from 'lucide-react';

const FAQ = [
  { q: 'Was kostet eine Geschäftsmodellberatung?', a: 'Die Kosten hängen vom Umfang ab. Ein Erstgespräch ist kostenlos. Typische Projekte bewegen sich im niedrigen fünfstelligen Bereich — ein Bruchteil dessen, was große Beratungshäuser verlangen.' },
  { q: 'Erstellen Sie auch Finanzierungsunterlagen?', a: 'Ja. Wir erstellen bankfertige Businesspläne und Finanzierungskonzepte und nutzen unser Bankennetzwerk, um optimale Konditionen zu verhandeln.' },
  { q: 'Unterstützen Sie auch bei der Vertriebsdigitalisierung?', a: 'Absolut. Vom CRM-Aufbau über automatisierte Sales-Funnels bis hin zu KI-gestützter Lead-Qualifizierung — wir digitalisieren Ihren Vertrieb von A bis Z.' },
];

export default function NcoreGeschaeftsmodelle() {
  return (
    <>
      <Helmet>
        <title>Geschäftsmodelle & Vertrieb — Ncore Business Consulting</title>
        <meta name="description" content="Von der Geschäftsidee zum skalierbaren Modell. Businesspläne, Pitch Decks, Vertriebssysteme und CRM-Digitalisierung für KMU. Praxisorientierte Beratung." />
        <meta property="og:title" content="Geschäftsmodelle & Vertrieb — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/geschaeftsmodelle" />
        <meta name="keywords" content="Geschäftsmodell, Businessplan, Pitch Deck, Vertrieb, CRM, Sales, KMU Beratung, Skalierung, Vertriebssystem" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Geschäftsmodell- und Vertriebsberatung",
          "provider": { "@id": "https://ncore.online/#organization" },
          "description": "Entwicklung und Weiterentwicklung von Geschäftsmodellen, Businessplänen, Pitch Decks und digitalisierten Vertriebssystemen für KMU.",
          "areaServed": { "@type": "Country", "name": "Germany" },
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
            <TrendingUp className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Geschäftsmodelle &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Vertrieb</span>
          </h1>
          <p className="mb-6 text-lg text-white/55 leading-relaxed max-w-3xl md:text-xl">
            Beratung zur Entwicklung und Weiterentwicklung von Geschäftsmodellen und
            Vertriebssystemen. Von der Idee über den Businessplan bis zum skalierbaren
            Vertrieb — praxisorientiert, nicht akademisch.
          </p>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="mx-auto max-w-7xl px-4 pb-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Lightbulb, title: 'Geschäftsmodellentwicklung', desc: 'Business Model Canvas, Value Proposition Design und Validierung. Wir helfen Ihnen, Ihr Geschäftsmodell zu schärfen und wettbewerbsfähig zu machen.' },
            { icon: Target, title: 'Businesspläne & Pitch Decks', desc: 'Investoren-taugliche und bankfertige Unterlagen, die überzeugen. Inkl. Finanzplanung, Break-Even-Analyse und Marktrecherche.' },
            { icon: Megaphone, title: 'Vertriebssysteme', desc: 'CRM-Aufbau, Sales-Prozesse und Vertriebskanal-Strategie — digitalisiert und wo sinnvoll mit KI automatisiert.' },
            { icon: BarChart3, title: 'Finanzierungsvorbereitung', desc: 'Wir bereiten Ihr Unternehmen auf Finanzierungsrunden vor: Kennzahlen, Dokumentation und Bankgespräche mit unserem Netzwerk.' },
            { icon: Users, title: 'Markteintritt & Skalierung', desc: 'Von der regionalen zur überregionalen Präsenz. Partnerprogramme, Franchisemodelle und digitale Expansionsstrategien.' },
            { icon: Zap, title: 'Vertriebsdigitalisierung', desc: 'Automatisierte Lead-Generierung, KI-gestützte Qualifizierung und digitale Sales-Funnels für messbar mehr Umsatz.' },
          ].map(item => (
            <div key={item.title} className="rounded-xl border border-emerald-900/25 bg-emerald-950/15 p-6 hover:border-emerald-900/40 transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <item.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Different ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Unser Unterschied</p>
              <h2 className="mb-6 text-3xl font-bold">Praxis schlägt Theorie</h2>
              <p className="text-white/45 leading-relaxed mb-6">
                Anders als klassische Strategieberatungen liefern wir keine 200-Seiten-PowerPoint-Decks.
                Wir entwickeln umsetzbare Konzepte und begleiten die Implementierung — vom ersten
                Kundengespräch bis zum funktionierenden Vertriebssystem.
              </p>
              <ul className="space-y-3">
                {[
                  'Operative Begleitung statt reine Strategieempfehlung',
                  'KMU-taugliche Budgets — keine Enterprise-Preise',
                  'Netzwerk aus Banken, Investoren und Vertriebspartnern',
                  'Digitalisierte Prozesse von Anfang an',
                ].map(point => (
                  <li key={point} className="flex items-start gap-2 text-sm text-white/40">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500/60 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/20 p-8">
              <h3 className="mb-6 text-lg font-bold">Typischer Projektverlauf</h3>
              <div className="space-y-5">
                {[
                  { phase: 'Woche 1-2', label: 'Analyse & Zielbild', desc: 'Bestandsaufnahme, Marktanalyse und gemeinsame Zieldefinition.' },
                  { phase: 'Woche 3-4', label: 'Konzeption', desc: 'Geschäftsmodell-Design, Finanzplanung und Vertriebsstrategie.' },
                  { phase: 'Woche 5-8', label: 'Umsetzung', desc: 'Implementierung, Tool-Setup und erste Vertriebsaktivitäten.' },
                  { phase: 'Laufend', label: 'Optimierung', desc: 'Monatliche Reviews, KPI-Tracking und strategische Anpassungen.' },
                ].map(p => (
                  <div key={p.phase} className="flex gap-4">
                    <span className="shrink-0 text-xs text-emerald-400/60 font-mono w-16">{p.phase}</span>
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-white/35">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ihr Geschäftsmodell auf dem Prüfstand</h2>
          <p className="mb-8 text-white/45">Lassen Sie uns gemeinsam Potenziale identifizieren und Wachstum beschleunigen.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-black hover:bg-emerald-400 transition-all"
          >
            Projekt anfragen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

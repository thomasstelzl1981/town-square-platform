/**
 * NCORE GESCHÄFTSMODELLE — Redesign: Alternating dark/light
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { TrendingUp, Lightbulb, Megaphone, ArrowRight, Target, BarChart3, Users, Zap, CheckCircle2 } from 'lucide-react';

const FAQ = [
  { q: 'Was kostet eine Geschäftsmodellberatung?', a: 'Typische Projekte bewegen sich im niedrigen fünfstelligen Bereich — ein Bruchteil dessen, was große Beratungshäuser verlangen.' },
  { q: 'Erstellen Sie auch Finanzierungsunterlagen?', a: 'Ja. Wir erstellen bankfertige Businesspläne und nutzen unser Bankennetzwerk für optimale Konditionen.' },
  { q: 'Unterstützen Sie bei Vertriebsdigitalisierung?', a: 'Vom CRM-Aufbau über automatisierte Sales-Funnels bis hin zu KI-gestützter Lead-Qualifizierung.' },
];

export default function NcoreGeschaeftsmodelle() {
  return (
    <>
      <Helmet>
        <title>Geschäftsmodelle & Vertrieb — Ncore Business Consulting</title>
        <meta name="description" content="Von der Geschäftsidee zum skalierbaren Modell. Businesspläne, Pitch Decks, Vertriebssysteme und CRM-Digitalisierung für KMU." />
        <meta property="og:title" content="Geschäftsmodelle & Vertrieb — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/geschaeftsmodelle" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "Service",
          "name": "Geschäftsmodell- und Vertriebsberatung",
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
            <TrendingUp className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Geschäftsmodelle &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Vertrieb</span>
          </h1>
          <p className="mb-6 text-lg text-slate-300 leading-relaxed max-w-3xl md:text-xl">
            Von der Idee über den Businessplan bis zum skalierbaren Vertrieb — praxisorientiert, nicht akademisch.
          </p>
        </div>
      </section>

      {/* ── Services — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Leistungen</p>
            <h2 className="text-3xl font-bold text-slate-800">Von der Idee zum skalierbaren Geschäft</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lightbulb, title: 'Geschäftsmodellinnovation', desc: 'Business Model Canvas, Value Proposition Design und Validierung.' },
              { icon: Target, title: 'Businesspläne & Pitch Decks', desc: 'Investoren-taugliche und bankfertige Unterlagen, die überzeugen.' },
              { icon: Megaphone, title: 'Vertriebssysteme', desc: 'CRM-Aufbau, Sales-Prozesse und digitalisierte Vertriebskanäle.' },
              { icon: BarChart3, title: 'Finanzierungsvorbereitung', desc: 'Kennzahlen, Dokumentation und Bankgespräche mit unserem Netzwerk.' },
              { icon: Users, title: 'Markteintritt & Skalierung', desc: 'Partnerprogramme, Franchisemodelle und digitale Expansionsstrategien.' },
              { icon: Zap, title: 'Vertriebsdigitalisierung', desc: 'Automatisierte Lead-Generierung und KI-gestützte Qualifizierung.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Different — Dark ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Unser Unterschied</p>
              <h2 className="mb-6 text-3xl font-bold">Praxis schlägt Theorie</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Wir liefern keine 200-Seiten-PowerPoint-Decks. Wir entwickeln umsetzbare Konzepte und begleiten die Implementierung.
              </p>
              <ul className="space-y-3">
                {[
                  'Operative Begleitung statt reine Strategieempfehlung',
                  'KMU-taugliche Budgets — keine Enterprise-Preise',
                  'Netzwerk aus Banken, Investoren und Vertriebspartnern',
                  'Digitalisierte Prozesse von Anfang an',
                ].map(point => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-900/30 bg-slate-800/50 p-8">
              <h3 className="mb-6 text-lg font-bold">Typischer Projektverlauf</h3>
              <div className="space-y-5">
                {[
                  { phase: 'Woche 1-2', label: 'Analyse & Zielbild', desc: 'Bestandsaufnahme, Marktanalyse und Zieldefinition.' },
                  { phase: 'Woche 3-4', label: 'Konzeption', desc: 'Geschäftsmodell-Design und Vertriebsstrategie.' },
                  { phase: 'Woche 5-8', label: 'Umsetzung', desc: 'Implementierung und erste Vertriebsaktivitäten.' },
                  { phase: 'Laufend', label: 'Optimierung', desc: 'Monatliche Reviews und KPI-Tracking.' },
                ].map(p => (
                  <div key={p.phase} className="flex gap-4">
                    <span className="shrink-0 text-xs text-emerald-400 font-mono w-16">{p.phase}</span>
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ihr Geschäftsmodell auf dem Prüfstand</h2>
          <p className="mb-8 text-slate-400">Lassen Sie uns gemeinsam Potenziale identifizieren und Wachstum beschleunigen.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition-all"
          >
            Projekt anfragen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

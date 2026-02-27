/**
 * NCORE DIGITALISIERUNG — KI-gestützte Digitalisierung für KMU
 * SEO: Service-Schema, FAQ-Schema, LLM-optimized content
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Cpu, Zap, BarChart3, ArrowRight, CheckCircle2, Bot, FileSearch, Workflow, Target, Shield } from 'lucide-react';

const PROCESS_STEPS = [
  { step: '01', title: 'Analyse', desc: 'Wir analysieren Ihre bestehenden Prozesse und identifizieren Automatisierungspotenziale mit dem höchsten ROI.' },
  { step: '02', title: 'Konzeption', desc: 'Gemeinsam entwickeln wir eine maßgeschneiderte Digitalisierungsstrategie — abgestimmt auf Ihr Budget und Ihre Ziele.' },
  { step: '03', title: 'Umsetzung', desc: 'Implementierung der KI-gestützten Lösungen mit minimalem Risiko: schrittweise, testbar, messbar.' },
  { step: '04', title: 'Optimierung', desc: 'Kontinuierliche Verbesserung basierend auf realen Daten. KI-Modelle werden laufend an Ihr Unternehmen angepasst.' },
];

const FAQ = [
  { q: 'Für welche Unternehmensgrößen eignet sich die Beratung?', a: 'Unsere Lösungen sind speziell für kleine und mittelständische Unternehmen (5-500 Mitarbeiter) konzipiert. Die Kosten orientieren sich am KMU-Budget.' },
  { q: 'Was unterscheidet Ncore von IT-Beratungen?', a: 'Wir sind keine reinen Techniker. Als erfahrene Finanz- und Unternehmensberater betrachten wir das Unternehmen als Ganzes — Digitalisierung muss zum Geschäftsmodell passen.' },
  { q: 'Wie hoch sind die Kosten für KI-Integration?', a: 'Deutlich geringer als die meisten erwarten. Moderne KI-Modelle sind kosteneffizient einsetzbar. Wir zeigen Ihnen, wie Sie mit minimaler Investition maximalen Nutzen erzielen.' },
  { q: 'Brauche ich technisches Personal?', a: 'Nein. Unsere Lösungen sind so konzipiert, dass Ihre bestehenden Mitarbeiter sie bedienen können. Wir schulen Ihr Team im Rahmen der Einführung.' },
];

export default function NcoreDigitalisierung() {
  return (
    <>
      <Helmet>
        <title>Digitalisierung & KI für KMU — Ncore Business Consulting</title>
        <meta name="description" content="KI-gestützte Digitalisierung für kleine und mittelständische Unternehmen. Prozessautomatisierung, KI-Integration und einheitliche Softwarelösungen — operativ, günstig, ganzheitlich." />
        <meta property="og:title" content="Digitalisierung & KI für KMU — Ncore Business Consulting" />
        <meta property="og:description" content="Wir wissen operativ, wie man Digitalisierung, Automatisierung und KI zu günstigen Kosten in KMU bringt." />
        <meta property="og:url" content="https://ncore.online/digitalisierung" />
        <meta name="keywords" content="KMU Digitalisierung, KI Integration, Prozessautomatisierung, Unternehmensberatung, künstliche Intelligenz, Mittelstand, Softwarelösung" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Digitalisierung & KI-Beratung für KMU",
          "provider": { "@id": "https://ncore.online/#organization" },
          "description": "Ganzheitliche Digitalisierungsberatung mit KI-Integration für kleine und mittelständische Unternehmen. Prozessautomatisierung, einheitliche Softwarelösungen und operative Begleitung.",
          "areaServed": { "@type": "Country", "name": "Germany" },
          "serviceType": "Unternehmensberatung",
          "audience": { "@type": "BusinessAudience", "name": "Kleine und mittelständische Unternehmen" },
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
            <Cpu className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Digitalisierung &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Künstliche Intelligenz</span>
          </h1>
          <p className="mb-6 text-lg text-white/55 leading-relaxed max-w-3xl md:text-xl">
            Wir sind keine Techniker im digitalen Segment. Wir sind erfahrene Finanz- und
            Unternehmensberater, die operativ wissen, wie man Digitalisierung, Automatisierung
            und künstliche Intelligenz zu sehr günstigen Kosten in Unternehmen bringen kann.
          </p>
          <p className="text-sm text-white/35 leading-relaxed max-w-3xl">
            Unser Ansatz: Das Unternehmen als Ganzes betrachten. Keine isolierte IT-Beratung,
            sondern eine einheitliche, KI-gestützte Verwaltungs- und operative Softwarelösung,
            die auf Ihr Geschäftsmodell abgestimmt ist.
          </p>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="mx-auto max-w-7xl px-4 pb-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Zap, title: 'Prozessautomatisierung', desc: 'Manuelle Abläufe identifizieren und mit KI-Workflows automatisieren. Rechnungseingang, Kundenkommunikation, Reporting — alles ohne teure Enterprise-Lizenzen.' },
            { icon: BarChart3, title: 'Einheitliche Softwarelösung', desc: 'Eine zentrale, KI-gestützte Plattform statt 15 verschiedener Tools. Verwaltung, Kommunikation und Analyse aus einem Guss.' },
            { icon: Bot, title: 'KI-Assistenten', desc: 'Intelligente Assistenten für Kundenservice, Dokumentenanalyse und Entscheidungsunterstützung — trainiert auf Ihre Geschäftsprozesse.' },
            { icon: FileSearch, title: 'Dokumenten-KI', desc: 'Automatische Extraktion, Klassifizierung und Verarbeitung von Dokumenten. Von der Rechnung bis zum Vertragsentwurf.' },
            { icon: Workflow, title: 'Workflow-Orchestrierung', desc: 'Komplexe Geschäftsprozesse digital abbilden und automatisieren. Genehmigungen, Eskalationen und Benachrichtigungen — alles regelbasiert.' },
            { icon: Shield, title: 'Datenschutz-konform', desc: 'Alle Lösungen entsprechen den deutschen Datenschutzanforderungen. DSGVO-Konformität ist bei uns kein Nachgedanke, sondern Grundlage.' },
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

      {/* ── Process ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Unser Ansatz</p>
            <h2 className="text-3xl font-bold md:text-4xl">In vier Schritten zur digitalen Transformation</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {PROCESS_STEPS.map(s => (
              <div key={s.step} className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-lg font-bold text-emerald-400">
                  {s.step}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
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
              <div key={f.q} className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-6" itemScope itemType="https://schema.org/Question">
                <h3 className="mb-3 text-sm font-semibold" itemProp="name">{f.q}</h3>
                <p className="text-sm text-white/40 leading-relaxed" itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                  <span itemProp="text">{f.a}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-emerald-900/20 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Bereit für den nächsten Schritt?</h2>
          <p className="mb-8 text-white/45">Lassen Sie uns gemeinsam herausfinden, wie Ihr Unternehmen von KI profitieren kann.</p>
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

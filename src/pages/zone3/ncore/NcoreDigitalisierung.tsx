/**
 * NCORE DIGITALISIERUNG — Redesign: Alternating dark/light with tech-AI image
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { Cpu, Zap, BarChart3, ArrowRight, Bot, FileSearch, Workflow, Shield } from 'lucide-react';
import techAiImg from '@/assets/ncore/tech-ai.jpg';

const PROCESS_STEPS = [
  { step: '01', title: 'Analyse', desc: 'Wir analysieren Ihre bestehenden Prozesse und identifizieren Automatisierungspotenziale mit dem höchsten ROI.' },
  { step: '02', title: 'Konzeption', desc: 'Gemeinsam entwickeln wir eine maßgeschneiderte Digitalisierungsstrategie — abgestimmt auf Ihr Budget und Ihre Ziele.' },
  { step: '03', title: 'Umsetzung', desc: 'Implementierung der KI-gestützten Lösungen mit minimalem Risiko: schrittweise, testbar, messbar.' },
  { step: '04', title: 'Optimierung', desc: 'Kontinuierliche Verbesserung basierend auf realen Daten. KI-Modelle werden laufend an Ihr Unternehmen angepasst.' },
];

const FAQ = [
  { q: 'Für welche Unternehmensgrößen eignet sich die Beratung?', a: 'Unsere Lösungen sind speziell für kleine und mittelständische Unternehmen (5-500 Mitarbeiter) konzipiert.' },
  { q: 'Was unterscheidet Ncore von IT-Beratungen?', a: 'Wir sind keine reinen Techniker. Als erfahrene Finanz- und Unternehmensberater betrachten wir das Unternehmen als Ganzes.' },
  { q: 'Wie hoch sind die Kosten für KI-Integration?', a: 'Deutlich geringer als die meisten erwarten. Moderne KI-Modelle sind kosteneffizient einsetzbar.' },
  { q: 'Brauche ich technisches Personal?', a: 'Nein. Unsere Lösungen sind so konzipiert, dass Ihre bestehenden Mitarbeiter sie bedienen können.' },
];

export default function NcoreDigitalisierung() {
  return (
    <>
      <SEOHead
        brand="ncore"
        page={{
          title: 'Digitalisierung & KI für KMU',
          description: 'KI-gestützte Digitalisierung für kleine und mittelständische Unternehmen. Prozessautomatisierung, KI-Integration und einheitliche Softwarelösungen.',
          path: '/digitalisierung',
        }}
        faq={FAQ.map(f => ({ question: f.q, answer: f.a }))}
        services={[{ name: 'Digitalisierung & KI-Beratung für KMU', description: 'Ganzheitliche Digitalisierungsberatung mit KI-Integration für KMU.' }]}
      />
      

      {/* ── Hero — Dark with tech image ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src={techAiImg} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-medium text-emerald-400">
            <Cpu className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl leading-tight">
            Digitalisierung &<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Künstliche Intelligenz</span>
          </h1>
          <p className="mb-6 text-lg text-slate-300 leading-relaxed max-w-3xl md:text-xl">
            Wir sind erfahrene Finanz- und Unternehmensberater, die operativ wissen, wie man Digitalisierung,
            Automatisierung und künstliche Intelligenz zu sehr günstigen Kosten in Unternehmen bringen kann.
          </p>
        </div>
      </section>

      {/* ── Capabilities — Light ── */}
      <section className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Leistungen</p>
            <h2 className="text-3xl font-bold text-slate-800">Was wir für Sie tun</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: 'Prozessautomatisierung', desc: 'Manuelle Abläufe identifizieren und mit KI-Workflows automatisieren.' },
              { icon: BarChart3, title: 'Einheitliche Softwarelösung', desc: 'Eine zentrale, KI-gestützte Plattform statt 15 verschiedener Tools.' },
              { icon: Bot, title: 'KI-Assistenten', desc: 'Intelligente Assistenten für Kundenservice und Dokumentenanalyse.' },
              { icon: FileSearch, title: 'Dokumenten-KI', desc: 'Automatische Extraktion und Verarbeitung von Geschäftsdokumenten.' },
              { icon: Workflow, title: 'Workflow-Orchestrierung', desc: 'Komplexe Geschäftsprozesse digital abbilden und automatisieren.' },
              { icon: Shield, title: 'Datenschutz-konform', desc: 'Alle Lösungen entsprechen den deutschen Datenschutzanforderungen.' },
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

      {/* ── Process — Dark ── */}
      <section className="bg-slate-900 py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Unser Ansatz</p>
            <h2 className="text-3xl font-bold md:text-4xl">In vier Schritten zur digitalen Transformation</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {PROCESS_STEPS.map(s => (
              <div key={s.step} className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-slate-900">
                  {s.step}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
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
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Bereit für den nächsten Schritt?</h2>
          <p className="mb-8 text-slate-400">Lassen Sie uns gemeinsam herausfinden, wie Ihr Unternehmen von KI profitieren kann.</p>
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

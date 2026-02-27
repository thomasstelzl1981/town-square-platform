/**
 * NCORE GRÜNDER — Redesign: Alternating dark/light with advisory image
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, GraduationCap, Network, Globe, Cpu, Shield } from 'lucide-react';
import advisoryImg from '@/assets/ncore/advisory-session.jpg';

const EXPERTISE_AREAS = [
  { icon: Cpu, label: 'KI & Digitalisierung', desc: 'Operative Implementierung von KI-Lösungen für KMU' },
  { icon: Shield, label: 'Vermögensstrukturierung', desc: 'Stiftungsmodelle und generationsübergreifender Schutz' },
  { icon: Briefcase, label: 'Unternehmensberatung', desc: 'Ganzheitliche Beratung aus operativer Erfahrung' },
  { icon: Network, label: 'Netzwerk-Orchestrierung', desc: 'Zusammenführung der richtigen Experten' },
  { icon: Globe, label: 'Internationale Strukturen', desc: 'Grenzüberschreitende Steuer- und Rechtsgestaltung' },
  { icon: GraduationCap, label: 'Finanzexpertise', desc: 'Langjährige Erfahrung in der Finanzbranche' },
];

export default function NcoreGruender() {
  return (
    <>
      <Helmet>
        <title>Der Gründer — Ncore Business Consulting</title>
        <meta name="description" content="Über den Gründer von Ncore Business Consulting: Langjährige Erfahrung in Finanz- und Unternehmensberatung, operative KI-Kompetenz und ein exzellentes Netzwerk." />
        <meta property="og:title" content="Der Gründer — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/gruender" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
            "@type": "Person",
            "name": "Gründer",
            "jobTitle": "Geschäftsführer",
            "worksFor": { "@id": "https://ncore.online/#organization" },
            "knowsAbout": ["KMU-Digitalisierung", "Künstliche Intelligenz", "Stiftungen", "Vermögensstrukturierung", "Geschäftsmodellentwicklung"],
          },
        })}</script>
      </Helmet>

      {/* ── Hero — Dark ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-4 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
            Über den Gründer
          </p>
          <h1 className="mb-8 text-4xl font-bold md:text-6xl">
            Der <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Gründer</span>
          </h1>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Ncore Business Consulting wurde aus der Überzeugung gegründet, dass Unternehmensberatung
                anders funktionieren muss. Nicht als theoretisches Konstrukt, sondern als operative
                Begleitung — von jemandem, der die Herausforderungen des Mittelstands aus eigener Erfahrung kennt.
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                Mit langjähriger Erfahrung in der Finanz- und Unternehmensberatung und einem tiefen
                Verständnis für Digitalisierung und künstliche Intelligenz verbindet der Gründer
                das Beste aus beiden Welten: strategisches Denken und operative Umsetzungskompetenz.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Das Ergebnis ist ein Beratungsansatz, der Unternehmen als Ganzes betrachtet —
                Digitalisierung, Vermögensschutz und Geschäftsmodellentwicklung nicht als isolierte
                Disziplinen, sondern als verbundenes System. Connecting Dots. Connecting People.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={advisoryImg} alt="Beratungssituation" className="w-full h-48 object-cover" />
              </div>
              <div className="rounded-2xl border border-emerald-900/30 bg-slate-800/50 p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">Philosophie</h3>
                <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                  „Viele Berater bieten Teillösungen an. Wir betrachten das Unternehmen als
                  Ganzes und wissen operativ, wie man Digitalisierung und KI zu günstigen
                  Kosten einsetzen kann."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expertise — Light ── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Expertise</p>
            <h2 className="text-3xl font-bold text-slate-800">Kompetenzbereiche</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {EXPERTISE_AREAS.map(area => (
              <div key={area.label} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <area.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">{area.label}</h3>
                  <p className="text-xs text-slate-500">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values — Dark ── */}
      <section className="bg-slate-900 py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="rounded-2xl border border-emerald-900/30 bg-slate-800/50 p-8 md:p-12">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-emerald-400">Kernwerte</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { label: 'Operativ statt theoretisch', desc: 'Wir setzen selbst um und begleiten operativ.' },
                { label: 'Ganzheitlich statt fragmentiert', desc: 'Alle Bereiche als verbundenes System betrachten.' },
                { label: 'Kosteneffizient statt überteuert', desc: 'Maximale Wirkung bei minimalem Mitteleinsatz.' },
                { label: 'Diskret und vertrauensvoll', desc: 'Absolute Vertraulichkeit in allen Belangen.' },
              ].map(v => (
                <div key={v.label} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold mb-1">{v.label}</p>
                    <p className="text-xs text-slate-400">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — Light ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-800">Persönliches Gespräch</h2>
          <p className="mb-8 text-slate-500">Lernen Sie den Gründer und den Ncore-Ansatz in einem unverbindlichen Erstgespräch kennen.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition-all"
          >
            Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

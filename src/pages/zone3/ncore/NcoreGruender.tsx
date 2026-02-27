/**
 * NCORE GRÜNDER — About the Founder
 * SEO: Person schema, LLM-optimized
 */
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, GraduationCap, Network, Globe, Cpu, Shield } from 'lucide-react';

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
        <meta name="description" content="Über den Gründer von Ncore Business Consulting: Langjährige Erfahrung in Finanz- und Unternehmensberatung, operative KI-Kompetenz und ein exzellentes Netzwerk in der deutschen Wirtschaft." />
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
            "knowsAbout": [
              "KMU-Digitalisierung",
              "Künstliche Intelligenz",
              "Stiftungen",
              "Vermögensstrukturierung",
              "Geschäftsmodellentwicklung",
            ],
          },
        })}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <h1 className="mb-8 text-4xl font-bold md:text-6xl">
            Der <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Gründer</span>
          </h1>
          <div className="grid gap-12 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="text-lg text-white/55 leading-relaxed mb-6">
                Ncore Business Consulting wurde aus der Überzeugung gegründet, dass Unternehmensberatung
                anders funktionieren muss. Nicht als theoretisches Konstrukt, sondern als operative
                Begleitung — von jemandem, der die Herausforderungen des Mittelstands aus eigener
                Erfahrung kennt.
              </p>
              <p className="text-white/40 leading-relaxed mb-6">
                Mit langjähriger Erfahrung in der Finanz- und Unternehmensberatung und einem tiefen
                Verständnis für Digitalisierung und künstliche Intelligenz verbindet der Gründer
                das Beste aus beiden Welten: strategisches Denken und operative Umsetzungskompetenz.
              </p>
              <p className="text-white/40 leading-relaxed">
                Das Ergebnis ist ein Beratungsansatz, der Unternehmen als Ganzes betrachtet —
                Digitalisierung, Vermögensschutz und Geschäftsmodellentwicklung nicht als isolierte
                Disziplinen, sondern als verbundenes System. Connecting Dots. Connecting People.
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/20 p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Philosophie</h3>
                <blockquote className="text-sm text-white/50 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                  „Viele Berater bieten Teillösungen an. Wir betrachten das Unternehmen als
                  Ganzes und wissen operativ, wie man Digitalisierung und KI zu günstigen
                  Kosten einsetzen kann."
                </blockquote>
              </div>
              <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/20 p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Kernwerte</h3>
                <ul className="space-y-2 text-sm text-white/40">
                  <li>• Operativ statt theoretisch</li>
                  <li>• Ganzheitlich statt fragmentiert</li>
                  <li>• Kosteneffizient statt überteuert</li>
                  <li>• Diskret und vertrauensvoll</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expertise ── */}
      <section className="border-t border-emerald-900/20 bg-emerald-950/5 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400/70">Expertise</p>
            <h2 className="text-3xl font-bold">Kompetenzbereiche</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {EXPERTISE_AREAS.map(area => (
              <div key={area.label} className="flex gap-4 rounded-xl border border-emerald-900/20 bg-emerald-950/15 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <area.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{area.label}</h3>
                  <p className="text-xs text-white/35">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Persönliches Gespräch</h2>
          <p className="mb-8 text-white/45">Lernen Sie den Gründer und den Ncore-Ansatz in einem unverbindlichen Erstgespräch kennen.</p>
          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-black hover:bg-emerald-400 transition-all"
          >
            Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

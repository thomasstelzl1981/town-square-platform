import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { TrendingUp, Lightbulb, Megaphone, ArrowRight, Target } from 'lucide-react';

export default function NcoreGeschaeftsmodelle() {
  return (
    <>
      <Helmet>
        <title>Geschäftsmodelle & Vertrieb — Ncore Business Consulting</title>
        <meta name="description" content="Von der Geschäftsidee zum skalierbaren Modell. Businesspläne, Pitch Decks, Vertriebssysteme und Finanzierungsvorbereitung für KMU." />
        <meta property="og:title" content="Geschäftsmodelle & Vertrieb — Ncore" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Geschäftsmodell- und Vertriebsberatung",
          "provider": { "@type": "Organization", "name": "Ncore Business Consulting" },
        })}</script>
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Geschäftsmodelle & <span className="text-emerald-400">Vertrieb</span>
          </h1>
          <p className="mb-12 text-lg text-white/60 leading-relaxed max-w-3xl">
            Beratung zur Entwicklung und Weiterentwicklung von Geschäftsmodellen und Vertriebssystemen. 
            Von der Idee über den Businessplan bis zum skalierbaren Vertrieb.
          </p>

          <div className="grid gap-8 md:grid-cols-2 mb-16">
            {[
              { icon: Lightbulb, title: 'Geschäftsmodellentwicklung', desc: 'Business Model Canvas, Value Proposition Design und Validierung — praxisorientiert, nicht akademisch.' },
              { icon: Target, title: 'Businesspläne & Pitch Decks', desc: 'Investoren-taugliche Unterlagen, die überzeugen. Finanzierungsvorbereitung mit Bankenkontakten.' },
              { icon: Megaphone, title: 'Vertriebssysteme', desc: 'CRM-Aufbau, Sales-Prozesse und Vertriebskanal-Strategie — digitalisiert und automatisiert.' },
              { icon: TrendingUp, title: 'Skalierung', desc: 'Vom ersten Kunden zum skalierbaren Wachstum. Prozesse, Partnerschaften und Finanzierung.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6">
                <item.icon className="mb-3 h-6 w-6 text-emerald-400" />
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Ihr Geschäftsmodell auf dem Prüfstand</h2>
            <p className="mb-6 text-white/50">Lassen Sie uns gemeinsam Potenziale identifizieren.</p>
            <Link
              to="/website/ncore/kontakt"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Projekt anfragen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

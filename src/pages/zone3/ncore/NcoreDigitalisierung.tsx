import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Cpu, Zap, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default function NcoreDigitalisierung() {
  return (
    <>
      <Helmet>
        <title>Digitalisierung & KI für KMU — Ncore Business Consulting</title>
        <meta name="description" content="KI-gestützte Digitalisierung für kleine und mittelständische Unternehmen. Operative Erfahrung statt Theorie — günstige, einheitliche Softwarelösungen für Ihr Unternehmen." />
        <meta property="og:title" content="Digitalisierung & KI für KMU — Ncore" />
        <meta property="og:description" content="Wir wissen operativ, wie man Digitalisierung und KI zu günstigen Kosten in Unternehmen bringt." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Digitalisierung & KI-Beratung",
          "provider": { "@type": "Organization", "name": "Ncore Business Consulting" },
          "description": "Ganzheitliche Digitalisierungsberatung für KMU mit KI-Integration",
          "areaServed": "Deutschland",
        })}</script>
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400">
            <Cpu className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Digitalisierung & <span className="text-emerald-400">Künstliche Intelligenz</span>
          </h1>
          <p className="mb-12 text-lg text-white/60 leading-relaxed max-w-3xl">
            Wir sind keine Techniker im digitalen Segment. Wir sind Finanz- und Unternehmensberater 
            mit langjähriger operativer Erfahrung, die wissen, wie man Digitalisierung, Automatisierung 
            und künstliche Intelligenz zu sehr günstigen Kosten in Unternehmen bringen kann.
          </p>

          <div className="grid gap-8 md:grid-cols-2 mb-16">
            {[
              { icon: Zap, title: 'Prozessautomatisierung', desc: 'Manuelle Abläufe identifizieren und mit KI-gestützten Workflows automatisieren — ohne teure Enterprise-Lizenzen.' },
              { icon: BarChart3, title: 'Einheitliche Softwarelösung', desc: 'Eine zentrale, KI-gestützte Verwaltungs- und operative Plattform statt 15 verschiedener Tools.' },
              { icon: Cpu, title: 'KI-Integration', desc: 'Moderne KI-Modelle sinnvoll einsetzen: Dokumentenanalyse, Kundenkommunikation, Entscheidungsunterstützung.' },
              { icon: CheckCircle, title: 'Ganzheitlicher Ansatz', desc: 'Wir betrachten Ihr Unternehmen als Ganzes — nicht nur die IT-Abteilung. Digitalisierung muss zum Geschäftsmodell passen.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6">
                <item.icon className="mb-3 h-6 w-6 text-emerald-400" />
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Bereit für den nächsten Schritt?</h2>
            <p className="mb-6 text-white/50">Lassen Sie uns gemeinsam herausfinden, wie Ihr Unternehmen von KI profitieren kann.</p>
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

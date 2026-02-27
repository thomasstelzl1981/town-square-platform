import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Shield, Scale, Globe, ArrowRight, Users } from 'lucide-react';

export default function NcoreStiftungen() {
  return (
    <>
      <Helmet>
        <title>Stiftungen & Vermögensschutz — Ncore Business Consulting</title>
        <meta name="description" content="Österreichische Stiftungsmodelle, generationsübergreifender Vermögensschutz und Lösungen zur Wegzugsbesteuerung. Mit Netzwerk aus Rechtsanwälten und Steuerberatern." />
        <meta property="og:title" content="Stiftungen & Vermögensschutz — Ncore" />
        <meta property="og:description" content="Vermögensstrukturierung mit österreichischen Stiftungsmodellen — orchestriert mit RA & StB Netzwerk zu niedrigen Kosten." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Stiftungs- und Vermögensstrukturierung",
          "provider": { "@type": "Organization", "name": "Ncore Business Consulting" },
          "description": "Österreichische Stiftungsmodelle und Wegzugsbesteuerung für generationsübergreifenden Vermögensschutz",
        })}</script>
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400">
            <Shield className="h-3.5 w-3.5" /> Kernbereich
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Stiftungen & <span className="text-emerald-400">Vermögensschutz</span>
          </h1>
          <p className="mb-12 text-lg text-white/60 leading-relaxed max-w-3xl">
            Wir sind keine reinen Rechtsanwälte oder Steuerberater. Wir sind Orchestratoren mit einem 
            Netzwerk aus spezialisierten Kanzleien und Steuerberatern, die wissen, wie Stiftungsstrukturen 
            günstig und steuerbar umgesetzt werden können.
          </p>

          <div className="space-y-8 mb-16">
            {[
              { icon: Shield, title: 'Österreichische Stiftungsmodelle', desc: 'Privatstiftungen nach österreichischem Recht als bewährtes Instrument für Vermögensschutz und -weitergabe. Wir koordinieren die gesamte Umsetzung.' },
              { icon: Users, title: 'Generationsübergreifende Strukturierung', desc: 'Vermögen über Generationen hinweg schützen und strukturieren. Familiengovernance, Nachfolgeplanung und steueroptimierte Weitergabe.' },
              { icon: Globe, title: 'Wegzugsbesteuerung', desc: 'Lösungen zur Wegzugsbesteuerung gemeinsam mit unserem Netzwerk an Steuerberatern und Rechtsanwälten — zu sehr niedrigen Kosten.' },
              { icon: Scale, title: 'Netzwerk-Orchestrierung', desc: 'Wir bringen die richtigen Experten zusammen: Rechtsanwälte, Steuerberater, Notare und Bankberater — effizient koordiniert.' },
            ].map(item => (
              <div key={item.title} className="flex gap-6 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6">
                <item.icon className="h-8 w-8 shrink-0 text-emerald-400" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Vertrauliches Erstgespräch</h2>
            <p className="mb-6 text-white/50">Vermögensstrukturierung erfordert Diskretion. Sprechen Sie uns unverbindlich an.</p>
            <Link
              to="/website/ncore/kontakt"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

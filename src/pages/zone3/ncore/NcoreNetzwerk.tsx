import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Network, Building2, Scale, Landmark, Cpu, ArrowRight } from 'lucide-react';

export default function NcoreNetzwerk() {
  return (
    <>
      <Helmet>
        <title>Unser Netzwerk — Ncore Business Consulting</title>
        <meta name="description" content="Hervorragendes Netzwerk in der Unternehmens- und Bankenwelt Deutschlands. Rechtsanwälte, Steuerberater, Banken und KI-Partner für KMU." />
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Network className="mx-auto mb-6 h-12 w-12 text-emerald-400" />
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Connecting <span className="text-emerald-400">People</span>
          </h1>
          <p className="mx-auto mb-16 max-w-2xl text-lg text-white/60">
            Wir verfügen über ein hervorragendes Netzwerk in alle Bereiche der Unternehmens- und 
            Bankenwelt in Deutschland für kleine und mittelständische Unternehmen.
          </p>

          <div className="grid gap-6 md:grid-cols-2 text-left mb-16">
            {[
              { icon: Landmark, title: 'Banken & Finanzierer', desc: 'Direkter Zugang zu Entscheidungsträgern bei regionalen und überregionalen Banken.' },
              { icon: Scale, title: 'Rechtsanwälte & Notare', desc: 'Spezialisierte Kanzleien für Gesellschaftsrecht, Stiftungsrecht und internationales Steuerrecht.' },
              { icon: Building2, title: 'Steuerberater & WP', desc: 'Netzwerk aus Steuerberatern mit Expertise in Unternehmensstrukturierung und grenzüberschreitenden Themen.' },
              { icon: Cpu, title: 'Technologie & KI', desc: 'Partnerschaften mit KI-Entwicklern und Softwarehäusern für maßgeschneiderte Digitalisierungslösungen.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6">
                <item.icon className="mb-3 h-6 w-6 text-emerald-400" />
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/website/ncore/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            Ins Netzwerk eintreten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

/**
 * ZL WOHNBAU LEISTUNGEN — Zone 3
 */
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import {
  ArrowRight, Building2, Home, Leaf, Handshake,
  Users, Shield, MapPin, CheckCircle2, Wrench
} from 'lucide-react';

const BRAND = '#2D6A4F';

const services = [
  {
    icon: Building2,
    title: 'Ankauf von Bestandsimmobilien',
    desc: 'Wir erwerben gezielt Mehrfamilienhäuser und Doppelhaushälften in der Nähe von Produktionsstätten. Dabei achten wir auf Substanz, Lage und Potenzial.',
  },
  {
    icon: Home,
    title: 'Neubau von Wohnimmobilien',
    desc: 'Wo kein passender Bestand vorhanden ist, bauen wir energieeffiziente Einfamilien- und Zweifamilienhäuser — zugeschnitten auf die Bedürfnisse der Bewohner.',
  },
  {
    icon: Wrench,
    title: 'Energetische Sanierung',
    desc: 'Bestandsobjekte werden umfassend modernisiert: Wärmepumpen, Fußbodenheizung, Dämmung und moderne Haustechnik für nachhaltiges Wohnen.',
  },
  {
    icon: Handshake,
    title: 'Langfristige Firmenmietverträge',
    desc: 'Das Unternehmen sichert die Mietverhältnisse langfristig ab und kümmert sich eigenständig um Belegung und Verwaltung. Ein Ansprechpartner — kein Aufwand für uns.',
  },
  {
    icon: Users,
    title: 'Fachkräftebindung durch Wohnraum',
    desc: 'In Zeiten des Fachkräftemangels bieten attraktive Wohnungen in der Nähe des Arbeitsplatzes einen echten Wettbewerbsvorteil.',
  },
  {
    icon: MapPin,
    title: 'Standortsuche in Bayern',
    desc: 'Wir sind aktiv auf der Suche nach Objekten und Grundstücken in Bayern — insbesondere in Niederbayern und Oberbayern.',
  },
];

const winWin = [
  { for: 'Für Unternehmen', items: ['Fachkräfte binden und unterbringen', 'Mitarbeiter wohnen bezahlbar', 'Ein fester Partner für alle Objekte', 'Selbstständige Belegung und Verwaltung'] },
  { for: 'Für ZL Wohnbau', items: ['Langfristige Mietabsicherung', 'Nur ein Ansprechpartner pro Objekt', 'Planbare Einnahmen', 'Fokus auf Qualität statt Masse'] },
  { for: 'Für Mitarbeiter', items: ['Attraktiver Wohnraum nahe am Arbeitsplatz', 'Faire Mietkonditionen', 'Moderne, energieeffiziente Gebäude', 'Angenehmes Wohnumfeld'] },
];

export default function ZLWohnbauLeistungen() {
  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'Unsere Leistungen — Ankauf, Neubau, Sanierung',
          description: 'ZL Wohnbau investiert in Wohnimmobilien für Unternehmen: Ankauf, Neubau, energetische Sanierung und langfristige Firmenmietverträge in Bayern.',
          path: '/leistungen',
        }}
      />

      {/* Header */}
      <section className="py-20 px-4 bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800 md:text-5xl">Unsere Leistungen</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Von der Standortsuche über den Ankauf bis zur schlüsselfertigen Übergabe — wir decken die gesamte Wertschöpfungskette ab.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(s => (
              <div key={s.title} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md" style={{ borderColor: undefined }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors" style={{ backgroundColor: `${BRAND}15` }}>
                  <s.icon className="h-6 w-6" style={{ color: BRAND }} />
                </div>
                <h3 className="mb-2 font-semibold text-lg text-slate-800">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Win-Win Model */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-3xl font-bold text-slate-800 text-center">Win-Win-Modell</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {winWin.map(col => (
              <div key={col.for} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-lg" style={{ color: BRAND }}>{col.for}</h3>
                <ul className="space-y-3">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800">Objekt anbieten oder Wohnraum anfragen</h2>
          <p className="mb-8 text-slate-500">
            Sie haben ein interessantes Objekt oder benötigen Wohnraum für Ihre Mitarbeiter? Sprechen Sie uns an.
          </p>
          <Link
            to="/website/zl-wohnbau/kontakt"
            className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all"
            style={{ backgroundColor: BRAND }}
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

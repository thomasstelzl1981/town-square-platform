/**
 * ZL WOHNBAU PORTFOLIO — Zone 3
 * Compact portfolio overview with cards per location group
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Building2, MapPin, Calendar, Ruler, Leaf } from 'lucide-react';

const BRAND = '#2D6A4F';

interface PropertyGroup {
  location: string;
  description: string;
  objects: Array<{
    id: string;
    type: string;
    address: string;
    year: number;
    sqm: number;
    energy: string;
    heating: string;
  }>;
}

const portfolio: PropertyGroup[] = [
  {
    location: 'Bogen — Schönthal',
    description: '4 Doppelhaushälften, Neubau 2024. Wärmepumpe und Fußbodenheizung. Langfristig vermietet an die DGS Wohnraum GmbH.',
    objects: [
      { id: 'ZL006', type: 'DHH', address: 'Schönthal 10, 94327 Bogen', year: 2024, sqm: 143.80, energy: 'Wärmepumpe', heating: 'Fußbodenheizung' },
      { id: 'ZL007', type: 'DHH', address: 'Schönthal 10a, 94327 Bogen', year: 2024, sqm: 143.80, energy: 'Wärmepumpe', heating: 'Fußbodenheizung' },
      { id: 'ZL008', type: 'DHH', address: 'Schönthal 12, 94327 Bogen', year: 2024, sqm: 143.80, energy: 'Wärmepumpe', heating: 'Fußbodenheizung' },
      { id: 'ZL009', type: 'DHH', address: 'Schönthal 12a, 94327 Bogen', year: 2024, sqm: 143.80, energy: 'Wärmepumpe', heating: 'Fußbodenheizung' },
    ],
  },
  {
    location: 'Straubing & Umgebung',
    description: 'Mehrfamilienhäuser im Bestand, saniert und langfristig vermietet.',
    objects: [
      { id: 'ZL002', type: 'MFH', address: 'Parkweg 17, 94315 Straubing', year: 1978, sqm: 199.79, energy: 'Gas', heating: 'Gastherme seit 2022' },
      { id: 'ZL005', type: 'MFH', address: 'Hubertusweg 6, 94315 Straubing', year: 1964, sqm: 236.75, energy: 'Gas', heating: 'Gaszentralheizung' },
    ],
  },
  {
    location: 'Bogen — Lessingstraße',
    description: 'Mehrfamilienhaus im Bestand, saniert 2021.',
    objects: [
      { id: 'ZL004', type: 'MFH', address: 'Lessingstr. 8, 94327 Bogen', year: 1966, sqm: 200.40, energy: 'Gas', heating: 'Gastherme seit 2022' },
    ],
  },
  {
    location: 'Leiblfing',
    description: 'Mehrfamilienhaus im Bestand, langfristig vermietet.',
    objects: [
      { id: 'ZL003', type: 'MFH', address: 'Ludwig-Thoma-Str. 5, 94339 Leiblfing', year: 1986, sqm: 213.09, energy: 'Strom / Stückholz', heating: 'Nachtspeicheröfen, Kachelofen' },
    ],
  },
];

export default function ZLWohnbauPortfolio() {
  const totalUnits = portfolio.reduce((sum, g) => sum + g.objects.length, 0);
  const totalSqm = portfolio.reduce((sum, g) => sum + g.objects.reduce((s, o) => s + o.sqm, 0), 0);

  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'Portfolio — Unsere Objekte in Bayern',
          description: `ZL Wohnbau GmbH verwaltet ${totalUnits} Wohneinheiten mit über ${Math.round(totalSqm)} m² in Niederbayern. Doppelhaushälften und Mehrfamilienhäuser.`,
          path: '/portfolio',
        }}
      />

      <section className="py-20 px-4 bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800 md:text-5xl">Unser Portfolio</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {totalUnits} Wohneinheiten · {totalSqm.toLocaleString('de-DE')} m² Wohnfläche · Niederbayern
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl space-y-12">
          {portfolio.map(group => (
            <div key={group.location}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5" style={{ color: BRAND }} />
                  <h2 className="text-2xl font-bold text-slate-800">{group.location}</h2>
                </div>
                <p className="text-sm text-slate-500">{group.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {group.objects.map(obj => (
                  <div key={obj.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4" style={{ color: BRAND }} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                        {obj.type}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{obj.id}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-3">{obj.address}</p>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Baujahr {obj.year}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ruler className="h-3 w-3" /> {obj.sqm.toLocaleString('de-DE')} m²
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Leaf className="h-3 w-3" /> {obj.energy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

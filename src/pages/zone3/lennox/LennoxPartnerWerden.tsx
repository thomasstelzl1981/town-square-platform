/**
 * LennoxPartnerWerden — Bewerbungsformular für neue Pet Manager Partner
 * Submit → manager_applications (source: lennox)
 */
import { ArrowLeft, MapPin, Users, Star, Eye, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { LENNOX as C } from './lennoxTheme';
import { ManagerApplicationForm } from '@/components/zone3/shared/ManagerApplicationForm';
import type { QualificationField } from '@/components/zone3/shared/ManagerApplicationForm';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import partnerHero from '@/assets/lennox/partner_hero.jpg';

const BENEFITS = [
  { icon: MapPin, title: 'Exklusivität für deine Region', desc: 'Werde alleiniger Lennox-Partner in deinem Gebiet — ohne direkte Konkurrenz auf der Plattform.' },
  { icon: ShoppingBag, title: 'Buchungen über die Plattform', desc: 'Erhalte Anfragen und Buchungen direkt über Lennox & Friends, ohne eigene Vermarktung.' },
  { icon: Users, title: 'Teil einer wachsenden Community', desc: 'Wir bauen ein deutschlandweites Netzwerk geprüfter Hundeprofis auf — werde jetzt Teil davon.' },
  { icon: Eye, title: 'Professionelle Sichtbarkeit', desc: 'Dein Profil, deine Leistungen und Bewertungen — professionell dargestellt für Hundehalter in deiner Nähe.' },
  { icon: Star, title: 'Kuratierte Produkttipps', desc: 'Empfehle ausgewählte Produkte aus dem Lennox Shop und profitiere von unserem Partnerprogramm.' },
];

const qualificationFields: QualificationField[] = [
  {
    key: 'region',
    label: 'Region',
    type: 'text',
    required: true,
    placeholder: 'z.B. München-Süd',
  },
  {
    key: 'service_type',
    label: 'Angebotene Leistung(en)',
    type: 'text',
    required: true,
    placeholder: 'z.B. Hundepension, Grooming, Gassi-Service',
  },
];

export default function LennoxPartnerWerden() {
  return (
    <div className="space-y-0">
      <SEOHead
        brand="lennox"
        page={{
          title: 'Partner werden — Exklusiver Hundeprofis-Partner',
          description: 'Werden Sie exklusiver Lennox & Friends Partner in Ihrer Region. Buchungen über die Plattform, professionelle Sichtbarkeit und wachsende Community.',
          path: '/partner-werden',
        }}
      />
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
        <div className="absolute inset-0">
          <img src={partnerHero} alt="Lennox Partner Netzwerk" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5" style={{ minHeight: '50vh' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Werde Partner in deiner Region</h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl">
            Gemeinsam bauen wir das größte Netzwerk für Hunde-Dienstleister in Deutschland.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10 space-y-12">
        <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: C.barkMuted }}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>

        {/* ═══ VISION ═══ */}
        <section className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-bold" style={{ color: C.bark }}>Unsere Vision</h2>
          <p className="leading-relaxed" style={{ color: C.barkMuted }}>
            Unser Ziel ist ein deutschlandweites Netzwerk geprüfter Hundeprofis — eine zentrale Plattform,
            auf der sich jeder Hundehalter Unterstützung holen kann: ob Betreuung während des Urlaubs,
            professionelle Pflege oder einfach einen zuverlässigen Gassi-Service in der Nachbarschaft.
          </p>
          <p className="leading-relaxed" style={{ color: C.barkMuted }}>
            Lennox & Friends ist bereits Teil einer wachsenden Plattform für private Dienstleistungen.
            Gegründet in Bayern, mit langjähriger Erfahrung in der Hundebetreuung, möchten wir sehr bald
            in jeder Region Deutschlands einen exklusiven Partner an unserer Seite haben.
          </p>
          <p className="font-semibold" style={{ color: C.forest }}>
            Werden Sie exklusiver Partner für Ihre Region in unserem Netzwerk.
          </p>
        </section>

        {/* ═══ BENEFITS ═══ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold" style={{ color: C.bark }}>Ihre Vorteile als Partner</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(b => (
              <Card key={b.title} className="border" style={{ borderColor: C.sand, background: 'white' }}>
                <CardContent className="p-5 space-y-2">
                  <b.icon className="h-7 w-7" style={{ color: C.forest }} />
                  <h3 className="font-semibold text-sm" style={{ color: C.bark }}>{b.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.barkMuted }}>{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ FORM ═══ */}
        <section className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-center" style={{ color: C.bark }}>Bewerbungsformular</h2>
          <ManagerApplicationForm
            brand="lennox"
            requestedRoles={['pet_manager']}
            qualificationFields={qualificationFields}
            accentColor={C.forest}
          />
        </section>
      </div>
    </div>
  );
}

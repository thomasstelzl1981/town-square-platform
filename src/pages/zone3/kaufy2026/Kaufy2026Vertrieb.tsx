/**
 * Kaufy2026Vertrieb — Partner Landing Page (Redesigned)
 */
import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, GraduationCap, Wallet, Users,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import { ManagerApplicationForm } from '@/components/zone3/shared/ManagerApplicationForm';
import type { QualificationField } from '@/components/zone3/shared/ManagerApplicationForm';
import { KaufySubpageHero } from '@/components/zone3/kaufy2026/KaufySubpageHero';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import partnerHero from '@/assets/kaufy2026/partner-hero.jpg';

const qualificationFields: QualificationField[] = [
  {
    key: 'has_34c',
    label: '§34c GewO Zulassung',
    type: 'select',
    required: true,
    options: [
      { value: 'yes', label: 'Ja, vorhanden' },
      { value: 'in_progress', label: 'In Beantragung' },
      { value: 'no', label: 'Nein, nicht vorhanden' },
    ],
  },
  {
    key: 'has_vsh',
    label: 'Vermögensschadenhaftpflicht (VSH)',
    type: 'select',
    required: true,
    options: [
      { value: 'yes', label: 'Ja, vorhanden' },
      { value: 'no', label: 'Nein' },
    ],
  },
];

const tracks = [
  {
    icon: GraduationCap,
    title: 'Für Newcomer',
    description: 'Sie sind neu in der Branche? Wir begleiten Sie auf dem Weg zur §34c-Lizenz und bieten Mentoring durch erfahrene Partner.',
    benefits: ['Mentoring-Programm', 'Schulungen & Webinare', 'Lizenz-Unterstützung'],
  },
  {
    icon: Briefcase,
    title: 'Für Profis',
    description: 'Sie haben bereits §34c und VSH? Erhalten Sie sofortigen Zugang zu Premium-Objekten und attraktiven Provisionen.',
    benefits: ['Exklusiver Objektkatalog', 'Bis zu 3% Provision', 'Keine Anbindungsgebühr'],
  },
];

const features = [
  { icon: Wallet, title: 'Attraktive Provisionen', description: 'Verdienen Sie bis zu 3% Käuferprovision bei erfolgreicher Vermittlung.' },
  { icon: Users, title: 'Partner-Netzwerk', description: 'Profitieren Sie vom Wissen und der Erfahrung unserer Community.' },
];

export default function Kaufy2026Vertrieb() {
  const scrollToForm = () => {
    document.getElementById('bewerbungsformular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <SEOHead
        brand="kaufy"
        page={{
          title: 'Vertriebspartner werden — Provisionen bis 3%',
          description: 'Werden Sie KAUFY Vertriebspartner. Vermitteln Sie exklusive Kapitalanlagen mit bis zu 3% Provision. Mentoring, Schulungen und Objektzugang inklusive.',
          path: '/vertrieb',
        }}
        services={[{
          name: 'KAUFY Partnerprogramm',
          description: 'Vertriebspartnerschaft für Kapitalanlageimmobilien mit attraktiven Provisionsmodellen.',
        }]}
      />
      {/* Hero */}
      <KaufySubpageHero
        backgroundImage={partnerHero}
        badge="Für Vertriebspartner"
        title="Werden Sie KAUFY Partner."
        subtitle="Vermitteln Sie exklusive Kapitalanlagen und profitieren Sie von attraktiven Provisionen."
        ctaLabel="Jetzt bewerben"
        onCtaClick={scrollToForm}
      />

      {/* Two Tracks */}
      <section style={{ padding: '64px 40px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tracks.map((track) => (
            <Card key={track.title} style={{ border: '2px solid hsl(210,30%,90%)', transition: 'border-color 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} className="hover:border-[hsl(210,80%,55%)]">
              <CardContent className="p-8">
                <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'hsla(210,80%,55%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <track.icon style={{ width: 28, height: 28, color: 'hsl(210,80%,55%)' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(220,20%,10%)', marginBottom: 12 }}>{track.title}</h3>
                <p style={{ color: 'hsl(215,16%,47%)', marginBottom: 24 }}>{track.description}</p>
                <ul className="space-y-2 mb-6">
                  {track.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 style={{ width: 16, height: 16, color: 'hsl(142,71%,45%)', flexShrink: 0 }} />
                      <span style={{ color: 'hsl(220,20%,10%)' }}>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToForm}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'hsl(220,20%,10%)', color: 'white' }}
                >
                  Jetzt bewerben
                  <ArrowRight className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ margin: '0 40px', padding: '64px 40px', backgroundColor: 'hsl(210,30%,97%)', borderRadius: 20 }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', color: 'hsl(220,20%,10%)', marginBottom: 48 }}>
          Was Sie erwartet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} style={{ border: 'none', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <CardContent className="p-6">
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'hsla(210,80%,55%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <feature.icon style={{ width: 24, height: 24, color: 'hsl(210,80%,55%)' }} />
                </div>
                <h3 style={{ fontWeight: 600, color: 'hsl(220,20%,10%)', marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(215,16%,47%)' }}>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="bewerbungsformular" style={{ padding: '64px 40px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(220,20%,10%)', marginBottom: 16, textAlign: 'center' }}>
          Jetzt als Partner bewerben
        </h2>
        <p style={{ color: 'hsl(215,16%,47%)', marginBottom: 32, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          Füllen Sie das Formular aus — wir melden uns innerhalb von 48 Stunden.
        </p>
        <div className="max-w-2xl mx-auto">
          <ManagerApplicationForm
            brand="kaufy"
            requestedRoles={['sales_partner']}
            qualificationFields={qualificationFields}
            accentColor="hsl(210, 80%, 55%)"
          />
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}

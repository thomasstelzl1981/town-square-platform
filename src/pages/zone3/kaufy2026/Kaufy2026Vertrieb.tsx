/**
 * Kaufy2026Vertrieb — Partner Landing Page
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, 
  GraduationCap, 
  Wallet, 
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const tracks = [
  {
    icon: GraduationCap,
    title: 'Für Newcomer',
    description: 'Sie sind neu in der Branche? Wir begleiten Sie auf dem Weg zur §34c-Lizenz und bieten Mentoring durch erfahrene Partner.',
    benefits: ['Mentoring-Programm', 'Schulungen & Webinare', 'Lizenz-Unterstützung'],
    cta: 'Karriere starten',
  },
  {
    icon: Briefcase,
    title: 'Für Profis',
    description: 'Sie haben bereits §34c und VSH? Erhalten Sie sofortigen Zugang zu Premium-Objekten und attraktiven Provisionen.',
    benefits: ['Exklusiver Objektkatalog', 'Bis zu 3% Provision', 'Keine Anbindungsgebühr'],
    cta: 'Partner werden',
  },
];

const features = [
  {
    icon: Wallet,
    title: 'Attraktive Provisionen',
    description: 'Verdienen Sie bis zu 3% Käuferprovision bei erfolgreicher Vermittlung.',
  },
  {
    icon: Users,
    title: 'Partner-Netzwerk',
    description: 'Profitieren Sie vom Wissen und der Erfahrung unserer Community.',
  },
];

export default function Kaufy2026Vertrieb() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-[hsl(220,20%,10%)] mb-4">
            Werden Sie KAUFY Partner.
          </h1>
          <p className="text-lg text-[hsl(215,16%,47%)] mb-8">
            Vermitteln Sie exklusive Kapitalanlagen und profitieren Sie von attraktiven Provisionen.
            Egal ob Newcomer oder Profi – wir haben das passende Programm für Sie.
          </p>
        </div>
      </section>

      {/* Two Tracks */}
      <section className="py-8 px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tracks.map((track) => (
            <Card key={track.title} className="border-2 border-[hsl(210,30%,90%)] hover:border-[hsl(210,80%,55%)] transition-colors">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center mb-6">
                  <track.icon className="w-7 h-7 text-[hsl(210,80%,55%)]" />
                </div>
                <h3 className="text-xl font-semibold text-[hsl(220,20%,10%)] mb-3">{track.title}</h3>
                <p className="text-[hsl(215,16%,47%)] mb-6">{track.description}</p>
                <ul className="space-y-2 mb-6">
                  {track.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-[hsl(220,20%,10%)]">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full rounded-full">
                    {track.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-6 lg:px-10 bg-[hsl(210,30%,97%)] mx-6 lg:mx-10 rounded-2xl my-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-12">
          Was Sie erwartet
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 bg-white">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[hsl(210,80%,55%)]" />
                </div>
                <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[hsl(215,16%,47%)]">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-10 text-center">
        <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-4">
          Bereit durchzustarten?
        </h2>
        <p className="text-[hsl(215,16%,47%)] mb-8 max-w-xl mx-auto">
          Registrieren Sie sich kostenlos und erhalten Sie Zugang zum Partner-Portal.
        </p>
        <Link to="/auth">
          <Button size="lg" className="rounded-full">
            Jetzt registrieren
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Spacer */}
      <div className="h-8" />
    </div>
  );
}

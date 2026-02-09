/**
 * Kaufy2026Verkaeufer — Seller Landing Page
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, 
  Shield, 
  Zap, 
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Qualifizierte Käufer',
    description: 'Erreichen Sie tausende vorab geprüfte Investoren mit konkretem Kaufinteresse.',
  },
  {
    icon: Shield,
    title: 'Diskret & Sicher',
    description: 'Anonyme Vermarktung möglich. Käufer sehen Details erst nach Freigabe.',
  },
  {
    icon: Zap,
    title: 'Schneller Verkauf',
    description: 'Durchschnittlich 45 Tage bis zur notariellen Beurkundung.',
  },
  {
    icon: Users,
    title: 'Ohne Makler',
    description: 'Direktvertrieb an Investoren. Sie sparen sich die Maklerprovision.',
  },
];

const steps = [
  { number: '1', title: 'Objekt erfassen', description: 'Geben Sie die wichtigsten Daten zu Ihrer Immobilie ein.' },
  { number: '2', title: 'Verkaufsauftrag aktivieren', description: 'Mit einem Klick ist Ihr Objekt für Investoren sichtbar.' },
  { number: '3', title: 'Anfragen erhalten', description: 'Qualifizierte Käufer melden sich direkt bei Ihnen.' },
  { number: '4', title: 'Verkauf abschließen', description: 'Koordinieren Sie Besichtigungen und notariellen Termin.' },
];

export default function Kaufy2026Verkaeufer() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-[hsl(220,20%,10%)] mb-4">
            Verkaufen Sie Ihre Immobilie – provisionsfrei.
          </h1>
          <p className="text-lg text-[hsl(215,16%,47%)] mb-8">
            Erreichen Sie tausende vorqualifizierte Investoren. 
            Kein Makler, keine versteckten Kosten, maximaler Erlös.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full">
              Immobilie inserieren
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 lg:px-10 bg-[hsl(210,30%,97%)] mx-6 lg:mx-10 rounded-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-12">
          Warum über KAUFY verkaufen?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* How it works */}
      <section className="py-16 px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-12">
          So funktioniert's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              <div className="w-12 h-12 rounded-full bg-[hsl(220,20%,10%)] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-2">{step.title}</h3>
              <p className="text-sm text-[hsl(215,16%,47%)]">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-[hsl(210,30%,90%)]" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/auth">
            <Button size="lg" className="rounded-full">
              Jetzt starten
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-16" />
    </div>
  );
}

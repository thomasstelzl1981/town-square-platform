/**
 * Kaufy2026Vermieter — Landlord Landing Page
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  FileText, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import vermieterHero from '@/assets/kaufy2026/vermieter-hero.jpg';

const features = [
  {
    icon: FileText,
    title: 'Digitale Nebenkostenabrechnung',
    description: 'Automatisierte Erstellung und Versand der jährlichen Abrechnung.',
  },
  {
    icon: Users,
    title: 'Mieterkommunikation',
    description: 'KI-gestützte Antworten auf Mieteranfragen. 24/7 erreichbar.',
  },
  {
    icon: TrendingUp,
    title: 'Mieteingang-Tracking',
    description: 'Automatische Überwachung und Mahnung bei Zahlungsverzug.',
  },
  {
    icon: Building2,
    title: 'Objektverwaltung',
    description: 'Alle Dokumente, Verträge und Daten an einem Ort.',
  },
];

const benefits = [
  'Zeitersparnis von 80% bei Verwaltungsaufgaben',
  'Rechtssichere Dokumentenvorlagen',
  'Automatische Indexanpassung',
  'Integrierte Handwerkersuche',
  'Steuerexport für Ihren Berater',
];

export default function Kaufy2026Vermieter() {
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="mx-6 lg:mx-10 rounded-2xl overflow-hidden">
          <div className="relative h-[400px]">
            <img
              src={vermieterHero}
              alt="Vermieter"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,20%,10%)]/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 lg:px-12 max-w-xl">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Vermieten war noch nie so einfach.
                </h1>
                <p className="text-white/80 text-lg mb-6">
                  Die digitale Mietsonderverwaltung für private Vermieter und Bestandshalter.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90">
                    Jetzt starten
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-12">
          Alles, was Sie als Vermieter brauchen.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 bg-[hsl(210,30%,97%)]">
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

      {/* Benefits */}
      <section className="py-16 px-6 lg:px-10 bg-[hsl(210,30%,97%)] mx-6 lg:mx-10 rounded-2xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)] mb-8">
            Ihre Vorteile auf einen Blick
          </h2>
          <ul className="space-y-4 text-left">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-[hsl(220,20%,10%)]">{benefit}</span>
              </li>
            ))}
          </ul>
          <Link to="/auth">
            <Button size="lg" className="mt-8 rounded-full">
              Kostenlos registrieren
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

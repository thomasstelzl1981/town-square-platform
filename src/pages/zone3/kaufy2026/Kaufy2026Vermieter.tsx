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
      {/* Hero — Text-based, consistent with Verkäufer/Partner */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.1)] px-3 py-1 rounded-full mb-6">
            Für Vermieter
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(220,20%,10%)] mb-4">
            Vermieten war noch nie so einfach.
          </h1>
          <p className="text-lg text-[hsl(215,16%,47%)] mb-8 max-w-2xl mx-auto">
            Die digitale Mietsonderverwaltung für private Vermieter und Bestandshalter.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-white">
              Jetzt starten
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
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

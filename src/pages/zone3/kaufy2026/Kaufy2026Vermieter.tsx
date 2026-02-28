/**
 * Kaufy2026Vermieter — Landlord Landing Page (Redesigned)
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, Users, TrendingUp, Building2, 
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import { KaufySubpageHero } from '@/components/zone3/kaufy2026/KaufySubpageHero';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import vermieterHero from '@/assets/kaufy2026/vermieter-hero.jpg';

const features = [
  { icon: FileText, title: 'Digitale Nebenkostenabrechnung', description: 'Automatisierte Erstellung und Versand der jährlichen Abrechnung.' },
  { icon: Users, title: 'Mieterkommunikation', description: 'KI-gestützte Antworten auf Mieteranfragen. 24/7 erreichbar.' },
  { icon: TrendingUp, title: 'Mieteingang-Tracking', description: 'Automatische Überwachung und Mahnung bei Zahlungsverzug.' },
  { icon: Building2, title: 'Objektverwaltung', description: 'Alle Dokumente, Verträge und Daten an einem Ort.' },
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
      <SEOHead
        brand="kaufy"
        page={{
          title: 'Für Vermieter — Digitale Mietverwaltung',
          description: 'Digitale Nebenkostenabrechnung, Mieterkommunikation und Objektverwaltung. Sparen Sie 80% Zeit bei der Vermietung Ihrer Kapitalanlage.',
          path: '/vermieter',
        }}
        services={[{
          name: 'Digitale Mietverwaltung',
          description: 'Automatisierte Nebenkostenabrechnung, Mieteingang-Tracking und Mieterkommunikation für private Vermieter.',
        }]}
      />
      {/* Hero */}
      <KaufySubpageHero
        backgroundImage={vermieterHero}
        badge="Für Vermieter"
        title="Vermieten war noch nie so einfach."
        subtitle="Die digitale Mietsonderverwaltung für private Vermieter und Bestandshalter."
        ctaLabel="Jetzt starten"
        ctaHref="/auth"
      />

      {/* Features */}
      <section style={{ padding: '64px 40px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', color: 'hsl(220,20%,10%)', marginBottom: 48 }}>
          Alles, was Sie als Vermieter brauchen.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} style={{ border: 'none', backgroundColor: 'hsl(210,30%,97%)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
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

      {/* Benefits */}
      <section style={{ margin: '0 40px', padding: '64px 40px', backgroundColor: 'hsl(210,30%,97%)', borderRadius: 20 }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(220,20%,10%)', marginBottom: 32 }}>
            Ihre Vorteile auf einen Blick
          </h2>
          <ul className="space-y-4 text-left max-w-md mx-auto">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckCircle2 style={{ width: 20, height: 20, color: 'hsl(142,71%,45%)', flexShrink: 0 }} />
                <span style={{ color: 'hsl(220,20%,10%)' }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', backgroundColor: 'hsl(220,20%,10%)', borderRadius: 20, padding: '48px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>
            Bereit, Ihre Vermietung zu digitalisieren?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            Kostenlos registrieren und sofort starten.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-8">
              Kostenlos registrieren
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}

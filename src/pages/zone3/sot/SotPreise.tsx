/**
 * SoT Preise — Dark Premium Pricing Page
 */
import { Link } from 'react-router-dom';
import { SotPricingCard, PricingPlan, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';
import { MessageCircle } from 'lucide-react';

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: 'Kostenlos',
    description: 'Für den Einstieg',
    features: [
      'Bis zu 3 Objekte',
      'Stammdaten & Kontakte',
      'Basis-DMS (100 MB)',
      'KI Office (Grundfunktionen)',
      'Armstrong Lite',
      'E-Mail-Support',
    ],
    cta: 'Kostenlos starten',
    ctaLink: '/auth?mode=register&source=sot',
    featured: false,
  },
  {
    name: 'Professional',
    price: 'Auf Anfrage',
    period: '',
    description: 'Für wachsende Portfolios',
    features: [
      'Unbegrenzte Objekte',
      'Alle Starter-Features',
      'Vollständiges DMS',
      'MSV-Modul',
      'Finanzierungsmodul',
      'Investment-Suche',
      'Armstrong Full',
      'Team-Zugang (bis 5 Nutzer)',
      'Prioritäts-Support',
    ],
    cta: 'Kontakt aufnehmen',
    ctaLink: '/sot/kontakt',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Individuell',
    description: 'Für professionelle Verwalter',
    features: [
      'Alle Professional-Features',
      'Unbegrenzte Nutzer',
      'Verkaufsmodul',
      'Erweiterte Integrationen',
      'Dedizierter Support',
      'Onboarding-Begleitung',
      'Custom Branding',
      'SLA verfügbar',
    ],
    cta: 'Kontakt aufnehmen',
    ctaLink: '/sot/kontakt',
    featured: false,
  },
];

const faqs = [
  {
    question: 'Kann ich jederzeit upgraden?',
    answer: 'Ja, Sie können jederzeit in ein höheres Paket wechseln. Ihre Daten bleiben vollständig erhalten.',
  },
  {
    question: 'Gibt es eine Mindestlaufzeit?',
    answer: 'Nein, alle Pakete sind monatlich kündbar. Keine versteckten Kosten.',
  },
  {
    question: 'Was passiert mit meinen Daten bei Kündigung?',
    answer: 'Sie können Ihre Daten jederzeit exportieren. Nach Kündigung werden sie nach 30 Tagen gelöscht.',
  },
  {
    question: 'Bieten Sie Rabatte für gemeinnützige Organisationen?',
    answer: 'Ja, kontaktieren Sie uns für spezielle Konditionen für NGOs und gemeinnützige Organisationen.',
  },
];

export default function SotPreise() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { containerRef: plansRef, visibleItems: plansVisible } = useSotStaggerAnimation(plans.length, 150);
  const { ref: faqRef, isVisible: faqVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div 
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            Preise
          </span>
          <h1 className="sot-display mb-6">Transparent.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto">
            Starten Sie kostenlos — und wählen Sie später das passende Paket für Ihre Anforderungen.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 -mt-12">
        <div className="zone3-container">
          <div 
            ref={plansRef}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start"
          >
            {plans.map((plan, index) => (
              <SotPricingCard
                key={plan.name}
                plan={plan}
                index={index}
                isVisible={plansVisible[index]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container max-w-3xl">
          <div 
            ref={faqRef}
            className={`text-center mb-12 sot-fade-in ${faqVisible ? 'visible' : ''}`}
          >
            <h2 className="sot-headline">Häufige Fragen</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`sot-glass-card p-6 sot-fade-in ${faqVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              Weitere Fragen?
            </p>
            <Link to="/sot/faq" className="sot-btn-secondary">
              <MessageCircle className="w-4 h-4" />
              Alle FAQ ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        title="Starten Sie kostenlos"
        subtitle="Keine Kreditkarte erforderlich. Jederzeit kündbar."
        variant="gradient"
      />
    </div>
  );
}
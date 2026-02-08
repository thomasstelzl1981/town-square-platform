/**
 * SoT Preise — Pay‑Per‑Use (0€ Software)
 */
import { Link } from 'react-router-dom';
import { SotPricingCard, type PricingPlan, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';
import { MessageCircle } from 'lucide-react';

const plans: PricingPlan[] = [
  {
    name: '0€ Software',
    price: '0 €',
    period: '',
    description: 'Kein Abo. Keine Grundgebühr. Die Plattform ist kostenlos.',
    features: [
      'Portfolio & Objekte verwalten',
      'Dokumentenmanagement inkl. digitalem Posteingang',
      'Stammdaten, Verträge & Aufgaben',
      'KI‑Office: E‑Mail, Briefgenerator, Vorlagen',
      'Kontaktverwaltung (inkl. Import/Sync‑Optionen)',
      'E‑Mail‑Support',
    ],
    cta: 'Kostenlos starten',
    ctaLink: '/auth?mode=register&source=sot',
    featured: false,
  },
  {
    name: 'Armstrong Credits',
    price: 'Pay‑Per‑Use',
    period: 'nach Verbrauch',
    description: 'Sie zahlen nur, wenn KI wirklich arbeitet – transparent pro Aktion.',
    features: [
      'Kontaktanreicherung aus E‑Mail‑Signaturen & Post‑Absendern',
      'Dokument‑Extraktion, Zusammenfassung & Klassifizierung',
      'Digitale Post: Zuordnung, Benennung, Ablage‑Vorschläge',
      'Recherche mit Quellenprotokoll',
      'Plan → Confirm → Execute für schreibende Aktionen',
      'Verbrauch & Historie nachvollziehbar',
    ],
    cta: 'Demo ansehen',
    ctaLink: '/sot/demo',
    featured: true,
  },
];

const faqs = [
  {
    question: 'Ist die Software wirklich kostenlos?',
    answer:
      'Ja. Die Nutzung der Plattform ist 0€. Kosten entstehen nur, wenn Sie Armstrong Credits für KI‑Aktionen einsetzen.',
  },
  {
    question: 'Wofür werden Armstrong Credits verwendet?',
    answer:
      'Für echte KI‑Office‑Arbeit wie Kontaktanreicherung, Dokument‑Extraktion, digitale Post‑Zuordnung sowie Recherche‑ und Textaufgaben.',
  },
  {
    question: 'Gibt es Abos oder Mindestlaufzeiten?',
    answer:
      'Nein. Kein Abo und keine Mindestlaufzeit. Sie laden Credits bei Bedarf nach und nutzen sie nach Verbrauch.',
  },
  {
    question: 'Kann ich später erweitern (Team, Integrationen, SLA)?',
    answer:
      'Ja. Für Teams oder spezielle Anforderungen unterstützen wir bei Rollen, Integrationen, Onboarding und optionalen SLAs.',
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
          <h1 className="sot-display mb-6">0€ Software.</h1>
          <p className="sot-subheadline max-w-3xl mx-auto">
            Sie zahlen nur für Armstrong Credits – also nur dann, wenn KI‑Office‑Aufgaben wirklich ausgeführt werden.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 -mt-12">
        <div className="zone3-container">
          <div
            ref={plansRef}
            className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start max-w-5xl mx-auto"
          >
            {plans.map((plan, index) => (
              <SotPricingCard key={plan.name} plan={plan} index={index} isVisible={plansVisible[index]} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container max-w-3xl">
          <div ref={faqRef} className={`text-center mb-12 sot-fade-in ${faqVisible ? 'visible' : ''}`}>
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
        title="Kostenlos starten – Credits nur bei Bedarf"
        subtitle="0€ Software. Pay‑Per‑Use für KI‑Actions (Armstrong Credits)."
        variant="gradient"
      />
    </div>
  );
}

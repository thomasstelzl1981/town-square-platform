/**
 * SoT Preise — Kostenfrei nutzen mit Pay-per-Use
 */
import { Link } from 'react-router-dom';
import { SotPricingCard, type PricingPlan, SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';
import { MessageCircle, Check, Sparkles, Zap } from 'lucide-react';

const plans: PricingPlan[] = [
  {
    name: 'Kostenfrei nutzen',
    price: '0 €',
    period: 'für die Plattform',
    description: 'Kein Abo. Keine Grundgebühr. Die gesamte Plattform ist kostenfrei nutzbar.',
    features: [
      'Portfolio & Objekte verwalten',
      'Dokumentenmanagement mit digitalem Posteingang',
      'Stammdaten, Kontakte & Aufgaben',
      'Finanzübersicht & Buchhaltung',
      'Alle Module ohne Einschränkung',
      'E-Mail-Support',
    ],
    cta: 'Kostenlos starten',
    ctaLink: '/auth?mode=register&source=sot',
    featured: false,
  },
  {
    name: 'Pay-per-Use',
    price: 'Armstrong Credits',
    period: 'nur bei Nutzung',
    description: 'Sie zahlen nur, wenn KI wirklich für Sie arbeitet — transparent pro Aktion.',
    features: [
      'Kontaktanreicherung aus E-Mail-Signaturen',
      'Dokument-Extraktion & Klassifizierung',
      'Digitale Post: Zuordnung & Ablage',
      'Recherche mit Quellenprotokoll',
      'Texte, Briefe, E-Mails generieren',
      'Verbrauch jederzeit einsehbar',
    ],
    cta: 'Demo ansehen',
    ctaLink: '/sot/demo',
    featured: true,
  },
];

const howItWorks = [
  {
    icon: Check,
    title: 'Plattform kostenfrei',
    description: 'Alle Module, alle Funktionen — ohne Abo, ohne Grundgebühr. Einfach nutzen.',
  },
  {
    icon: Sparkles,
    title: 'KI-Aktionen kosten Credits',
    description: 'Wenn Armstrong für Sie arbeitet (Texte, Extraktion, Recherche), werden Credits verbraucht.',
  },
  {
    icon: Zap,
    title: 'Credits bei Bedarf',
    description: 'Keine Mindestabnahme. Laden Sie Credits, wenn Sie sie brauchen. Volle Kostenkontrolle.',
  },
];

const faqs = [
  {
    question: 'Ist die Software wirklich kostenlos?',
    answer:
      'Ja. Die Nutzung aller Module ist kostenfrei. Kosten entstehen nur, wenn Sie Armstrong Credits für KI-Aktionen einsetzen — also wenn KI wirklich für Sie arbeitet.',
  },
  {
    question: 'Was sind Armstrong Credits?',
    answer:
      'Credits sind die Währung für KI-Aktionen: Texte generieren, Dokumente analysieren, Kontakte anreichern, Recherchen durchführen. Jede Aktion hat einen transparenten Credit-Preis.',
  },
  {
    question: 'Gibt es Abos oder Mindestlaufzeiten?',
    answer:
      'Nein. Kein Abo, keine Mindestlaufzeit, keine versteckten Kosten. Sie laden Credits bei Bedarf und nutzen sie, wann Sie wollen.',
  },
  {
    question: 'Kann ich auch ohne KI arbeiten?',
    answer:
      'Absolut. Die Plattform funktioniert vollständig ohne Armstrong. Sie verwalten Dokumente, Objekte und Finanzen — ganz ohne Credits zu verbrauchen.',
  },
  {
    question: 'Für Teams und Unternehmen?',
    answer:
      'Ja. Für Teams bieten wir Rollen, gemeinsame Arbeitsbereiche und optionale SLAs. Sprechen Sie uns an für individuelle Lösungen.',
  },
];

export default function SotPreise() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { containerRef: plansRef, visibleItems: plansVisible } = useSotStaggerAnimation(plans.length, 150);
  const { ref: howRef, isVisible: howVisible } = useSotScrollAnimation();
  const { ref: faqRef, isVisible: faqVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            Preise
          </span>
          <h1 className="sot-display mb-6">Kostenfrei nutzen.</h1>
          <p className="sot-subheadline max-w-3xl mx-auto">
            Die Plattform ist komplett kostenlos. Sie zahlen nur für Armstrong Credits — 
            also nur, wenn KI wirklich für Sie arbeitet.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-24 -mt-8">
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

      {/* How it Works */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div ref={howRef} className={`text-center mb-12 sot-fade-in ${howVisible ? 'visible' : ''}`}>
            <h2 className="sot-headline">So funktioniert's</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Ein einfaches, faires Modell ohne Überraschungen.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, index) => (
              <div
                key={item.title}
                className={`text-center sot-fade-in ${howVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <item.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-3xl">
          <div ref={faqRef} className={`text-center mb-12 sot-fade-in ${faqVisible ? 'visible' : ''}`}>
            <h2 className="sot-headline">Häufige Fragen</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`sot-glass-card p-6 sot-fade-in ${faqVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 80}ms` }}
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
            <Link to="/website/sot/faq" className="sot-btn-secondary">
              <MessageCircle className="w-4 h-4" />
              Alle FAQ ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        title="Jetzt kostenfrei starten"
        subtitle="Alle Module. Keine Grundgebühr. Credits nur bei Bedarf."
        variant="gradient"
      />
    </div>
  );
}

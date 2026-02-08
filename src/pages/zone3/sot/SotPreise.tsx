/**
 * SoT Preise — Pay-Per-Use Pricing (Armstrong Credits)
 * SpaceX/Revolut-inspired dark aesthetic
 */
import { Link } from 'react-router-dom';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';
import { Check, Sparkles, Zap, Calculator, FileText, Search, Brain, ArrowRight } from 'lucide-react';

const includedFeatures = [
  'Unbegrenzte Objekte & Einheiten',
  'Stammdaten & Kontaktverwaltung',
  'Vollständiges DMS mit OCR',
  'KI Office (E-Mails, Briefe, Kalender)',
  'Mietverwaltung & Nebenkostenabrechnung',
  'Buchhaltung mit SKR04',
  'Verkaufsmodul & Interessenten',
  'Finanzierungsmodul',
  'Investment-Suche',
  'Team-Zugang (unbegrenzt)',
  'DSGVO-konform & deutsche Server',
];

const armstrongActions = [
  {
    icon: FileText,
    action: 'Dokument analysieren',
    credits: '5-15',
    description: 'Mietvertrag, Exposé oder Grundbuchauszug verstehen',
  },
  {
    icon: Calculator,
    action: 'Rendite berechnen',
    credits: '2-5',
    description: 'Cashflow, AfA, Finanzierungsvergleich',
  },
  {
    icon: Search,
    action: 'Marktrecherche',
    credits: '10-20',
    description: 'Aktuelle Preise, Vergleichsobjekte, Lageanalyse',
  },
  {
    icon: Brain,
    action: 'E-Mail/Brief generieren',
    credits: '3-8',
    description: 'Professionelle Kommunikation in Sekunden',
  },
];

const faqs = [
  {
    question: 'Was kostet ein Credit?',
    answer: 'Credits starten bei 0,02 € pro Stück. Je mehr Sie kaufen, desto günstiger wird es. 500 Credits kosten z.B. nur 8 €.',
  },
  {
    question: 'Gibt es kostenlose Credits?',
    answer: 'Ja! Jeder neue Account erhält 50 Credits zum Testen. Danach können Sie Credits flexibel nachkaufen.',
  },
  {
    question: 'Was passiert, wenn meine Credits aufgebraucht sind?',
    answer: 'Die Software funktioniert weiter — nur Armstrong-KI-Aktionen werden pausiert, bis Sie Credits aufladen.',
  },
  {
    question: 'Kann ich Credits auch für mein Team kaufen?',
    answer: 'Ja, Credits gelten für den gesamten Account. Alle Teammitglieder nutzen denselben Pool.',
  },
];

export default function SotPreise() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { containerRef: featuresRef, visibleItems: featuresVisible } = useSotStaggerAnimation(includedFeatures.length, 50);
  const { ref: actionsRef, isVisible: actionsVisible } = useSotScrollAnimation();
  const { ref: faqRef, isVisible: faqVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-5" />
        <div 
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            Preismodell
          </span>
          <h1 className="sot-display mb-6">
            Software kostenlos.<br />
            <span style={{ color: 'hsl(var(--z3-accent))' }}>Zahle nur für KI.</span>
          </h1>
          <p className="sot-subheadline max-w-2xl mx-auto mb-8">
            Die komplette Immobilienverwaltung ist gratis. Sie zahlen nur, wenn Armstrong für Sie arbeitet — transparent, nach Verbrauch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
              Kostenlos starten
              <Sparkles className="w-4 h-4" />
            </Link>
            <Link to="/sot/demo" className="sot-btn-secondary">
              Demo ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Included Features */}
            <div>
              <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
                Immer inklusive
              </span>
              <h2 className="sot-headline mb-6">Alles dabei. Ohne Abo.</h2>
              <p className="text-lg mb-8" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Die komplette Software steht Ihnen unbegrenzt zur Verfügung — keine monatlichen Gebühren, keine versteckten Kosten.
              </p>
              
              <div 
                ref={featuresRef}
                className="grid sm:grid-cols-2 gap-3"
              >
                {includedFeatures.map((feature, index) => (
                  <div
                    key={feature}
                    className={`flex items-center gap-3 sot-fade-in ${featuresVisible[index] ? 'visible' : ''}`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.15)' }}
                    >
                      <Check className="w-3 h-3" style={{ color: 'hsl(var(--z3-accent))' }} />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
              <div 
                className="sot-glass-card p-8 rounded-3xl"
                style={{ 
                  background: 'linear-gradient(145deg, hsl(var(--z3-card)) 0%, hsl(var(--z3-secondary)) 100%)',
                }}
              >
                <div className="text-center mb-8">
                  <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>Softwarelizenz</span>
                  <div className="sot-display mt-4" style={{ fontSize: '4rem' }}>0 €</div>
                  <p className="text-sm mt-2" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                    für immer. Keine Abo-Gebühren.
                  </p>
                </div>

                <div className="sot-divider !my-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Objekte</span>
                    <span className="text-sm font-semibold">∞ Unbegrenzt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nutzer</span>
                    <span className="text-sm font-semibold">∞ Unbegrenzt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speicherplatz</span>
                    <span className="text-sm font-semibold">10 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Support</span>
                    <span className="text-sm font-semibold">E-Mail & Chat</span>
                  </div>
                </div>

                <Link 
                  to="/auth?mode=register&source=sot" 
                  className="sot-btn-primary w-full justify-center mt-8"
                >
                  Jetzt starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Glow effect */}
              <div 
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Armstrong Pay-Per-Use */}
      <section className="py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="text-center mb-16">
            <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
              Pay-Per-Use
            </span>
            <h2 className="sot-headline mt-4">Armstrong arbeitet. Sie zahlen.</h2>
            <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
              Jede KI-Aktion verbraucht Credits. Einfach, transparent — keine Überraschungen.
            </p>
          </div>

          <div 
            ref={actionsRef}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {armstrongActions.map((item, index) => (
              <div
                key={item.action}
                className={`sot-glass-card p-6 text-center sot-fade-in ${actionsVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <item.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="font-semibold mb-2">{item.action}</h3>
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Zap className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <span className="font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>{item.credits}</span>
                  <span className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Credits</span>
                </div>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Credit Packages */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="sot-glass-card p-8 rounded-3xl">
              <h3 className="text-center font-semibold mb-8">Credit-Pakete</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <div className="font-bold text-2xl">100</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Credits</div>
                  <div className="font-semibold mt-2">2 €</div>
                </div>
                <div 
                  className="p-4 rounded-xl relative"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-accent) / 0.1)',
                    border: '2px solid hsl(var(--z3-accent))'
                  }}
                >
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'black' }}
                  >
                    BELIEBT
                  </div>
                  <div className="font-bold text-2xl">500</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Credits</div>
                  <div className="font-semibold mt-2">8 €</div>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <div className="font-bold text-2xl">2.000</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Credits</div>
                  <div className="font-semibold mt-2">25 €</div>
                </div>
              </div>
              <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                50 Credits gratis bei Registrierung • Keine Mindestabnahme • Kein Verfall
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
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
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        title="Bereit für den Start?"
        subtitle="Software kostenlos. 50 Credits geschenkt. Kein Risiko."
        variant="gradient"
      />
    </div>
  );
}

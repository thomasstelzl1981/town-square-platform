/**
 * SoT Produkt — Digitalisierung. Greifbar. Buchbar. Umsetzbar.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Zap, Shield, Clock, Ban, Rocket, CreditCard } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';

const promises = [
  {
    icon: Ban,
    title: 'Chaos beseitigen',
    description: 'Schluss mit Excel, Papierordnern und 5 verschiedenen Apps. Eine Plattform für alles — strukturiert, durchsuchbar, intelligent.',
  },
  {
    icon: Rocket,
    title: 'Sofort nutzbar',
    description: 'Keine monatelangen IT-Projekte. Registrieren, Module aktivieren, loslegen. In 10 Minuten startklar.',
  },
  {
    icon: CreditCard,
    title: 'Keine große Investition',
    description: 'Kein Abo. Keine Grundgebühr. Pay per Use — Sie zahlen nur, was Sie tatsächlich nutzen. Digitalisierung, die sich jeder leisten kann.',
  },
  {
    icon: Shield,
    title: 'DSGVO-konform & sicher',
    description: 'Ihre Daten gehören Ihnen. Deutsche Server, verschlüsselt, volle Kontrolle. Keine Weitergabe, kein Tracking.',
  },
];

const beforeAfter = {
  problem: [
    'Dokumente in 10 Ordnern verstreut',
    'Fuhrpark-Kosten? Keine Ahnung.',
    'Mietverträge? Irgendwo im Schrank.',
    'Finanzierung? Unterlagen fehlen.',
    'KI nutzen? Zu komplex, zu teuer.',
  ],
  solution: [
    'Ein Datenraum — alles sofort findbar',
    'Fahrzeug-Modul mit Kostenüberblick',
    'Digitale Objektakte mit allen Verträgen',
    'Bankfertige Unterlagen auf Knopfdruck',
    'Armstrong KI — Pay per Use, ohne Setup',
  ],
  outcome: [
    'Stunden pro Woche eingespart',
    'Volle Kostenkontrolle über den Fuhrpark',
    'Professionelle Verwaltung wie ein Profi',
    'Finanzierungszusage in Tagen statt Wochen',
    'KI-Assistent für den gesamten Datenraum',
  ],
};

const steps = [
  { number: '01', title: 'Registrieren', description: 'Kostenfrei — keine Kreditkarte nötig' },
  { number: '02', title: 'Module wählen', description: 'Immobilien, Fuhrpark, Finanzen — was Sie brauchen' },
  { number: '03', title: 'Daten importieren', description: 'Magic Intake — KI sortiert Ihre Dokumente' },
  { number: '04', title: 'Durchstarten', description: 'Ordnung genießen, KI arbeiten lassen' },
];

export default function SotProdukt() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { containerRef: promisesRef, visibleItems: promisesVisible } = useSotStaggerAnimation(promises.length, 100);
  const { ref: problemRef, isVisible: problemVisible } = useSotScrollAnimation();
  const { containerRef: stepsRef, visibleItems: stepsVisible } = useSotStaggerAnimation(steps.length, 150);

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
            Das Produkt
          </span>
          <h1 className="sot-display mb-6">
            Digitalisierung.<br />
            Greifbar. Buchbar. Umsetzbar.
          </h1>
          <p className="sot-subheadline max-w-2xl mx-auto mb-10">
            System of a Town macht Digitalisierung für Unternehmer, Vermieter und Teams 
            sofort nutzbar — mit 15+ Modulen, KI-Assistent und ohne eigene IT-Investition.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/website/sot/module" className="sot-btn-secondary">
              Module ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <h2 className="sot-headline">Was wir versprechen</h2>
            <p className="sot-subheadline mt-3 max-w-xl mx-auto">
              Digitalisierung muss nicht teuer, kompliziert oder langwierig sein.
            </p>
          </div>
          
          <div 
            ref={promisesRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {promises.map((p, i) => (
              <div 
                key={i} 
                className={`sot-glass-card p-8 text-center sot-fade-in ${promisesVisible[i] ? 'visible' : ''}`}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <p.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution → Outcome */}
      <section className="py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="text-center mb-12">
            <h2 className="sot-headline">Vorher → Nachher → Ergebnis</h2>
            <p className="sot-subheadline mt-3 max-w-xl mx-auto">
              Von der Zettelwirtschaft zur digitalen Ordnung — konkret und messbar.
            </p>
          </div>
          <div 
            ref={problemRef}
            className={`grid md:grid-cols-3 gap-8 sot-fade-in ${problemVisible ? 'visible' : ''}`}
          >
            <div className="sot-glass-card p-8 border-l-4 border-l-red-500/50">
              <h3 className="text-lg font-bold mb-4 text-red-400">Vorher</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {beforeAfter.problem.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="sot-glass-card p-8 border-l-4" style={{ borderLeftColor: 'hsl(var(--z3-accent))' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>System of a Town</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {beforeAfter.solution.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="sot-glass-card p-8 border-l-4 border-l-green-500/50">
              <h3 className="text-lg font-bold mb-4 text-green-400">Ihr Ergebnis</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {beforeAfter.outcome.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <h2 className="sot-headline">4 Schritte zur digitalen Ordnung</h2>
          </div>
          
          <div 
            ref={stepsRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, i) => (
              <div 
                key={i}
                className={`text-center sot-fade-in ${stepsVisible[i] ? 'visible' : ''}`}
              >
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl font-bold"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-accent))',
                    color: 'hsl(var(--z3-background))'
                  }}
                >
                  {step.number}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA 
        variant="gradient"
        title="Digitalisierung starten — ohne Risiko"
        subtitle="Kostenlos registrieren. Keine Kreditkarte. Keine Grundgebühr. Sofort einsatzbereit."
      />
    </div>
  );
}

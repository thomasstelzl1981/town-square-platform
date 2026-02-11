/**
 * SoT Produkt — Dark Premium Product Page
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Zap, Shield, Clock } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';

const principles = [
  {
    icon: Layers,
    title: 'Alles an einem Ort',
    description: 'Dokumente, Objekte, Kontakte und Prozesse – zentral und vernetzt.',
  },
  {
    icon: Zap,
    title: 'KI-unterstützt',
    description: 'Intelligente Automatisierung für wiederkehrende Aufgaben.',
  },
  {
    icon: Shield,
    title: 'Sicher & privat',
    description: 'Ihre Daten bleiben Ihre Daten. Volle Kontrolle, volle Transparenz.',
  },
  {
    icon: Clock,
    title: 'Zeitgewinn',
    description: 'Weniger Suchen, weniger Chaos, mehr Zeit für das Wesentliche.',
  },
];

const steps = [
  { number: '01', title: 'Registrieren', description: 'Kostenloses Konto erstellen' },
  { number: '02', title: 'Einrichten', description: 'Objekte und Kontakte anlegen' },
  { number: '03', title: 'Dokumente', description: 'Posteingang verbinden' },
  { number: '04', title: 'Nutzen', description: 'Ordnung genießen' },
];

export default function SotProdukt() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { containerRef: principlesRef, visibleItems: principlesVisible } = useSotStaggerAnimation(principles.length, 100);
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
            Produkt
          </span>
          <h1 className="sot-display mb-6">Software für Immobilienverwaltung.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto mb-10">
            System of a Town bringt Ordnung in Ihre Immobilienverwaltung — mit über 17 Modulen 
            für Dokumente, Objekte, Finanzen, Projekte und mehr.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/sot/module" className="sot-btn-secondary">
              Module ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <h2 className="sot-headline">Unsere Prinzipien</h2>
          </div>
          
          <div 
            ref={principlesRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {principles.map((p, i) => (
              <div 
                key={i} 
                className={`sot-glass-card p-8 text-center sot-fade-in ${principlesVisible[i] ? 'visible' : ''}`}
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
          <div 
            ref={problemRef}
            className={`grid md:grid-cols-3 gap-8 sot-fade-in ${problemVisible ? 'visible' : ''}`}
          >
            <div className="sot-glass-card p-8 border-l-4 border-l-red-500/50">
              <h3 className="text-lg font-bold mb-4 text-red-400">Das Problem</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">×</span>
                  Dokumente über mehrere Ordner verteilt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">×</span>
                  Posteingang unübersichtlich
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">×</span>
                  Keine Übersicht über Mietverträge
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">×</span>
                  Prozesse nicht nachvollziehbar
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">×</span>
                  Zeitverlust durch Suchen
                </li>
              </ul>
            </div>
            
            <div className="sot-glass-card p-8 border-l-4" style={{ borderLeftColor: 'hsl(var(--z3-accent))' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>Die Lösung</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                  Zentrales Dokumentenmanagement
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                  Automatischer Posteingang
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                  Strukturierte Objektverwaltung
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                  KI-unterstützte Prozesse
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--z3-accent))' }}>→</span>
                  Einheitliches System
                </li>
              </ul>
            </div>
            
            <div className="sot-glass-card p-8 border-l-4 border-l-green-500/50">
              <h3 className="text-lg font-bold mb-4 text-green-400">Das Ergebnis</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  Alles sofort auffindbar
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  Weniger Verwaltungsaufwand
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  Bessere Entscheidungen
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  Mehr Transparenz
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  Zeit für das Wesentliche
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="text-center mb-16">
            <h2 className="sot-headline">So funktioniert es</h2>
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
        title="Bereit für strukturierte Verwaltung?"
        subtitle="Starten Sie kostenlos und bringen Sie Ordnung in Ihre Immobilienverwaltung."
      />
    </div>
  );
}
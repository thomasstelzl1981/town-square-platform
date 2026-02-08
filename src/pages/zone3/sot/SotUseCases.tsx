/**
 * SoT Use Cases — Dark Premium Use Cases Page
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, FileText, Building2, MessageCircle, TrendingUp, Landmark, LucideIcon } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

interface UseCase {
  icon: LucideIcon;
  title: string;
  problem: string;
  solution: string;
  outcome: string;
  modules: string[];
}

const useCases: UseCase[] = [
  {
    icon: Mail,
    title: 'Posteingang digitalisieren',
    problem: 'Post landet auf dem Schreibtisch, geht unter, wird nicht zugeordnet.',
    solution: 'Automatischer digitaler Posteingang mit KI-Kategorisierung und Objektzuordnung.',
    outcome: 'Jedes Dokument ist sofort auffindbar und dem richtigen Objekt zugeordnet.',
    modules: ['DMS'],
  },
  {
    icon: FileText,
    title: 'Dokumente finden',
    problem: 'Wichtige Unterlagen in verschiedenen Ordnern, E-Mails, Cloud-Speichern.',
    solution: 'Zentrales DMS mit Volltextsuche, Tags und automatischer Verknüpfung.',
    outcome: 'Jedes Dokument in Sekunden gefunden — egal wo es ursprünglich war.',
    modules: ['DMS', 'Immobilien'],
  },
  {
    icon: Building2,
    title: 'Portfolio-Überblick',
    problem: 'Objektdaten verteilt in Excel, Ordnern, Notizen und E-Mails.',
    solution: 'Strukturierte Objektverwaltung mit Einheiten, Mietverträgen und Dokumenten.',
    outcome: 'Vollständige Transparenz über jedes Objekt auf einen Blick.',
    modules: ['Immobilien', 'MSV'],
  },
  {
    icon: MessageCircle,
    title: 'Mieterkommunikation',
    problem: 'Anfragen per Telefon, E-Mail, Brief — keine Übersicht.',
    solution: 'Zentrale Kommunikation mit Verlauf, Zuordnung und Aufgabenerstellung.',
    outcome: 'Jede Anfrage dokumentiert, nichts geht verloren.',
    modules: ['MSV', 'KI Office'],
  },
  {
    icon: TrendingUp,
    title: 'Verkaufsvorbereitung',
    problem: 'Bei Verkaufswunsch alle Unterlagen mühsam zusammensuchen.',
    solution: 'Verkaufsmodul mit Exposé-Erstellung, Dokumentenbündelung und Datenraum.',
    outcome: 'Verkaufsreife Unterlagen in Minuten statt Wochen.',
    modules: ['Verkauf', 'Immobilien'],
  },
  {
    icon: Landmark,
    title: 'Finanzierungsfall',
    problem: 'Bank fordert Unterlagen an — langwieriges Zusammenstellen.',
    solution: 'Finanzierungsmodul mit Checkliste, Vollständigkeitsprüfung und Export.',
    outcome: 'Professionelle Finanzierungsunterlagen auf Knopfdruck.',
    modules: ['Finanzierung', 'DMS'],
  },
];

export default function SotUseCases() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();

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
            Anwendungsfälle
          </span>
          <h1 className="sot-display mb-6">Aus dem Alltag.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto">
            Konkrete Situationen aus dem Alltag — und wie System of a Town sie löst.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="zone3-container">
          <div className="space-y-8">
            {useCases.map((uc, i) => {
              const UseCaseCard = () => {
                const { ref, isVisible } = useSotScrollAnimation();
                
                return (
                  <div 
                    ref={ref}
                    className={`sot-glass-card p-8 sot-fade-in ${isVisible ? 'visible' : ''}`}
                  >
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                      >
                        <uc.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-6">{uc.title}</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                              Das Problem
                            </p>
                            <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                              {uc.problem}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>
                              Die Lösung
                            </p>
                            <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                              {uc.solution}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-2">
                              Das Ergebnis
                            </p>
                            <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                              {uc.outcome}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {uc.modules.map((mod, j) => (
                            <span 
                              key={j} 
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: 'hsl(var(--z3-accent) / 0.1)',
                                color: 'hsl(var(--z3-accent))'
                              }}
                            >
                              {mod}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };
              
              return <UseCaseCard key={i} />;
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA
        variant="gradient"
        title="Welches Problem lösen wir für Sie?"
        subtitle="Starten Sie kostenlos und erleben Sie selbst, wie einfach Verwaltung sein kann."
      />
    </div>
  );
}
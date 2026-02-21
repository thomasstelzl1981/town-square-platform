/**
 * SoT Use Cases — Aus dem Alltag: Client, Service & Base
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, FileText, Building2, MessageCircle, TrendingUp, Landmark, Car, Sun, Brain, Users, FolderOpen, LucideIcon } from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

interface UseCase {
  icon: LucideIcon;
  title: string;
  area: 'CLIENT' | 'SERVICE' | 'BASE';
  problem: string;
  solution: string;
  outcome: string;
  modules: string[];
}

const useCases: UseCase[] = [
  // CLIENT
  {
    icon: TrendingUp,
    title: 'Finanzüberblick schaffen',
    area: 'CLIENT',
    problem: 'Keine Ahnung, was das Vermögen wirklich bringt. Einnahmen, Ausgaben, Cashflows — alles in verschiedenen Konten und Excel-Tabellen.',
    solution: 'Finanzanalyse-Modul mit automatischer Kontoauswertung, Cashflow-Darstellung und Szenarien-Simulation.',
    outcome: 'Kompletter Vermögensüberblick auf einen Blick — Entscheidungen auf Datenbasis statt Bauchgefühl.',
    modules: ['Finanzanalyse', 'Immobilien'],
  },
  {
    icon: Building2,
    title: 'Verkauf ohne Makler',
    area: 'CLIENT',
    problem: '6% Maklerprovision bei jedem Verkauf. Unorganisierte Interessenten, fehlende Unterlagen, kein Überblick.',
    solution: 'Verkaufsmodul mit Exposé-Erstellung, Anfragen-Management, Reservierungen und Dokumentenbündelung bis zum Notar.',
    outcome: 'Tausende Euro Provision gespart. Professioneller Verkaufsprozess ohne Mittelsmann.',
    modules: ['Verkauf', 'DMS', 'Immobilien'],
  },
  {
    icon: Landmark,
    title: 'Bankfertige Finanzierung',
    area: 'CLIENT',
    problem: 'Bank fordert 20 Dokumente, Selbstauskunft ist veraltet, alles dauert Wochen.',
    solution: 'Finanzierungsmodul mit digitaler Selbstauskunft, Dokumentenpaket-Generator und strukturierter Bankübergabe.',
    outcome: 'Professionelle Finanzierungsunterlagen in Minuten. Finanzierungszusage in Tagen statt Wochen.',
    modules: ['Finanzierung', 'DMS'],
  },
  // SERVICE
  {
    icon: Car,
    title: 'Fuhrpark unter Kontrolle',
    area: 'SERVICE',
    problem: 'TÜV-Termin verpasst, Versicherungskosten unklar, Fahrtenbuch lückenhaft. Fahrzeugkosten? Keiner weiß es genau.',
    solution: 'Fahrzeug-Modul mit Erinnerungen, Kostenübersicht, Fahrtenbuch und Versicherungsverwaltung.',
    outcome: 'Nie wieder TÜV verpassen. Volle Transparenz über alle Fahrzeugkosten.',
    modules: ['Fahrzeuge'],
  },
  {
    icon: Sun,
    title: 'PV-Erträge monitoren',
    area: 'SERVICE',
    problem: 'Solaranlage produziert — aber bringt sie, was sie soll? Wartung, Einspeisevergütung, Amortisation unklar.',
    solution: 'PV-Modul mit Ertragsmonitoring, Wartungsplanung und Amortisationsrechnung.',
    outcome: 'Maximale Rendite aus der Solaranlage. Kein Ertragsverlust durch vergessene Wartung.',
    modules: ['Photovoltaik'],
  },
  {
    icon: Mail,
    title: 'E-Mail-Automatisierung',
    area: 'SERVICE',
    problem: 'Jede E-Mail manuell schreiben. Wartungserinnerungen vergessen. Kein Tracking, wer was bekommen hat.',
    solution: 'Kommunikation Pro mit E-Mail-Serien, KI-generierten Texten, Tracking und automatischen Erinnerungen.',
    outcome: 'Stunden pro Woche eingespart. Professionelle Kommunikation auf Autopilot.',
    modules: ['Kommunikation Pro', 'KI Office'],
  },
  // BASE
  {
    icon: FolderOpen,
    title: 'Dokumentenchaos beseitigen',
    area: 'BASE',
    problem: 'Verträge in 10 Ordnern. Post auf dem Schreibtisch. Wichtige Unterlagen nicht auffindbar.',
    solution: 'Zentrales DMS mit automatischem Posteingang, KI-Kategorisierung, Volltextsuche und OCR.',
    outcome: 'Jedes Dokument in Sekunden gefunden. Nie wieder etwas verlegen.',
    modules: ['DMS'],
  },
  {
    icon: Brain,
    title: 'KI-Assistent für alles',
    area: 'BASE',
    problem: 'KI-Tools kennen Ihre Daten nicht. Jedes Mal manuell hochladen, Kontext erklären, Copy-Paste.',
    solution: 'Armstrong liest Ihren gesamten Datenraum — Dokumente, Verträge, Finanzen. Fragen Sie einfach.',
    outcome: 'Ein KI-Assistent, der Ihr Unternehmen kennt. Antworten in Sekunden statt Stunden Recherche.',
    modules: ['Armstrong', 'DMS'],
  },
  {
    icon: Users,
    title: 'Kontakte synchronisieren',
    area: 'BASE',
    problem: 'Kontakte in Gmail, Outlook, Excel, Handy — überall anders, nirgends vollständig.',
    solution: 'Stammdaten-Modul mit Sync zu Gmail, Outlook, IMAP. Kontakte zentral, kategorisiert, verknüpft.',
    outcome: 'Ein Kontaktbuch für alles. Immer aktuell, immer vollständig.',
    modules: ['Stammdaten'],
  },
];

const areaColors: Record<string, string> = {
  CLIENT: 'hsl(217 91% 60%)',
  SERVICE: 'hsl(160 60% 45%)',
  BASE: 'hsl(275 45% 50%)',
};

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
          <h1 className="sot-display mb-6">Digitalisierung im Alltag.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto">
            Konkrete Situationen aus dem Unternehmer-Alltag — und wie System of a Town sie löst. 
            Für Immobilien, Fuhrpark, Finanzen und den gesamten Betrieb.
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
                      <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                        >
                          <uc.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                        </div>
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase"
                          style={{ backgroundColor: `${areaColors[uc.area]}20`, color: areaColors[uc.area] }}
                        >
                          {uc.area}
                        </span>
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
        subtitle="Starten Sie kostenlos und erleben Sie, wie einfach Digitalisierung sein kann."
      />
    </div>
  );
}

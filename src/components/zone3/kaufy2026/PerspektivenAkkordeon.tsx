/**
 * PerspektivenAkkordeon — 4-Panel Accordion Section
 * 
 * Design (nach Vorlage):
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  Eine Plattform. Drei Perspektiven.                                   │
 * │  Kaufy passt sich deiner Rolle an – nicht umgekehrt.                  │
 * │                                                                       │
 * │  ┌────────────────────────────────────┐   ┌─────────────────────────┐ │
 * │  │  1  Vermieter            ⌵         │   │                         │ │
 * │  │     Kaufy macht aus Bestand...     │   │   [PERSPEKTIVEN-BILD]   │ │
 * │  ├────────────────────────────────────┤   │                         │ │
 * │  │  2  Anbieter             ⌵         │   │                         │ │
 * │  ├────────────────────────────────────┤   └─────────────────────────┘ │
 * │  │  3  Vertrieb             ⌵         │                               │
 * │  ├────────────────────────────────────┤                               │
 * │  │  4  Automationen & KI    ⌵         │                               │
 * │  └────────────────────────────────────┘                               │
 * └───────────────────────────────────────────────────────────────────────┘
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import perspektivenImg from '@/assets/kaufy2026/perspektiven.png';

interface PerspektivePanel {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  points: string[];
}

const panels: PerspektivePanel[] = [
  {
    id: 'vermieter',
    number: 1,
    title: 'Vermieter',
    subtitle: 'Kaufy macht aus Bestand eine steuerbare Anlage.',
    points: [
      'Digitale Mietsonderverwaltung für jede Einheit',
      'Automatisierte Nebenkostenabrechnungen',
      'KI-gestützte Mieterkommunikation',
      'Echtzeit-Cashflow-Übersicht',
    ],
  },
  {
    id: 'anbieter',
    number: 2,
    title: 'Anbieter',
    subtitle: 'Kapitalanlageobjekte treffen auf den richtigen Markt.',
    points: [
      'Zugang zu qualifizierten Investoren',
      'Automatische Exposé-Erstellung',
      'Marktgerechte Preisanalyse per KI',
      'Transaktionsbegleitung bis zum Notar',
    ],
  },
  {
    id: 'vertrieb',
    number: 3,
    title: 'Vertrieb',
    subtitle: 'Beratung, die sich rechnen lässt – für Kunde und Vertrieb.',
    points: [
      'Exklusiver Objektkatalog mit geprüften Renditen',
      'Investment-Engine für personalisierte Beratung',
      'Provisions- und Courtage-Transparenz',
      'Digitale Finanzierungsvorbereitung',
    ],
  },
  {
    id: 'automation',
    number: 4,
    title: 'Automationen & KI',
    subtitle: 'Im Hintergrund intelligent. Im Alltag spürbar.',
    points: [
      'Automatische Dokumentenerfassung und -analyse',
      'KI-basierte Steueroptimierung',
      'Predictive Maintenance für Immobilien',
      'Smart Matching zwischen Käufern und Objekten',
    ],
  },
];

export function PerspektivenAkkordeon() {
  return (
    <section className="py-16 bg-[hsl(210,30%,97%)]">
      <div className="px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)] mb-3">
            Was KAUFY für Sie tut
          </h2>
          <p className="text-[hsl(215,16%,47%)] max-w-2xl mx-auto">
            Kaufy passt sich deiner Rolle an – nicht umgekehrt.
          </p>
        </div>

        {/* Accordion + Image Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Accordion */}
          <Accordion type="single" collapsible defaultValue="vermieter" className="space-y-2">
            {panels.map((panel) => (
              <AccordionItem
                key={panel.id}
                value={panel.id}
                className="bg-white rounded-xl border-0 overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <span className="text-sm font-bold text-[hsl(210,80%,55%)] w-5">
                      {panel.number}
                    </span>
                    <div>
                      <p className="font-semibold text-[hsl(220,20%,10%)]">
                        {panel.title}
                      </p>
                      <p className="text-sm text-[hsl(215,16%,47%)] mt-0.5">
                        {panel.subtitle}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <ul className="space-y-2 ml-9">
                    {panel.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[hsl(215,16%,47%)]">
                        <span className="text-[hsl(210,80%,55%)] mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Perspektiven Image */}
          <div className="hidden lg:flex items-center justify-center rounded-2xl h-[400px] overflow-hidden">
            <img
              src={perspektivenImg}
              alt="KAUFY Plattform – Drei Perspektiven"
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

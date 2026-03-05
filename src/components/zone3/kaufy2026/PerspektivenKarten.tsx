/**
 * PerspektivenKarten — 3-card grid for target groups
 * 
 * Design: Refined cards with hover effects and improved typography.
 * Uses "Sie" (formal) consistently.
 */
import { useNavigate } from 'react-router-dom';
import { Building2, Tag, Handshake, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerspektiveCard {
  icon: React.ElementType;
  category: string;
  slogan: string[];
  description: string;
  link: string;
}

const perspektiven: PerspektiveCard[] = [
  {
    icon: Building2,
    category: 'VERMIETER',
    slogan: ['Vermieten.', 'Verstehen.', 'Optimieren.'],
    description: 'Digitale Mietsonderverwaltung – alles Wichtige auf einen Blick.',
    link: '/website/kaufy/vermieter',
  },
  {
    icon: Tag,
    category: 'VERKÄUFER',
    slogan: ['Inserieren.', 'Erreichen.', 'Verkaufen.'],
    description: 'Tausende vorab qualifizierte Investoren mit konkretem Kaufinteresse.',
    link: '/website/kaufy/verkaeufer',
  },
  {
    icon: Handshake,
    category: 'PARTNER',
    slogan: ['Beraten.', 'Vermitteln.', 'Wachsen.'],
    description: 'Exklusiver Objektkatalog und digitale Tools für Ihren Vertrieb.',
    link: '/website/kaufy/vertrieb',
  },
];

export function PerspektivenKarten() {
  const navigate = useNavigate();

  return (
    <section className="py-16">
      <div className="px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-4">
          Eine Plattform. Drei Perspektiven.
        </h2>
        <p className="text-center text-[hsl(215,16%,47%)] mb-12 max-w-2xl mx-auto">
          KAUFY passt sich Ihrer Rolle an — nicht umgekehrt.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {perspektiven.map((p) => (
            <div
              key={p.category}
              onClick={() => navigate(p.link)}
              className={cn(
                "relative p-6 rounded-2xl bg-[hsl(210,30%,97%)]",
                "cursor-pointer transition-all duration-200",
                "hover:shadow-lg hover:bg-[hsl(210,30%,95%)]",
                "group"
              )}
            >
              {/* Icon — Top Right */}
              <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center group-hover:bg-[hsl(210,80%,55%,0.15)] transition-colors">
                <p.icon className="w-5 h-5 text-[hsl(210,80%,55%)]" />
              </div>

              {/* Category Label */}
              <p className="text-xs font-semibold tracking-wider text-[hsl(215,16%,55%)] mb-3">
                {p.category}
              </p>

              {/* Slogan — Multi-line */}
              <div className="mb-4">
                {p.slogan.map((line, idx) => (
                  <p 
                    key={idx} 
                    className="text-lg font-semibold text-[hsl(220,20%,10%)] leading-tight"
                  >
                    {line}
                  </p>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-[hsl(215,16%,47%)] mb-3">
                {p.description}
              </p>

              {/* Subtle arrow indicator */}
              <div className="flex items-center gap-1 text-xs font-medium text-[hsl(210,80%,55%)] opacity-0 group-hover:opacity-100 transition-opacity">
                Mehr erfahren <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

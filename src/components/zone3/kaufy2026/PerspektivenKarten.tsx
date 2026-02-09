/**
 * PerspektivenKarten — 3-card grid for target groups
 * 
 * Design (nach Vorlage):
 * ┌─────────────────────────────────────┐
 * │                              [🏠]   │  ← Icon oben rechts
 * │  VERMIETER                          │  ← Kategorie (Großbuchstaben)
 * │                                     │
 * │  Vermieten. Verstehen. Optimieren.  │  ← Slogan
 * │                                     │
 * │  Alles, was zählt –                 │  ← Beschreibung
 * │  auf einen Blick.                   │
 * └─────────────────────────────────────┘
 */
import { useNavigate } from 'react-router-dom';
import { Building2, Tag, Handshake } from 'lucide-react';
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
    description: 'Alles, was zählt – auf einen Blick.',
    link: '/kaufy2026/vermieter',
  },
  {
    icon: Tag,
    category: 'VERKÄUFER',
    slogan: ['Inserieren.', 'Erreichen.', 'Verkaufen.'],
    description: 'Tausende vorab qualifizierte Investoren.',
    link: '/kaufy2026/verkaeufer',
  },
  {
    icon: Handshake,
    category: 'PARTNER',
    slogan: ['Beraten.', 'Vermitteln.', 'Verdienen.'],
    description: 'Zugang zum exklusiven Objektkatalog.',
    link: '/kaufy2026/vertrieb',
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
          Kaufy passt sich deiner Rolle an – nicht umgekehrt.
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
              <p className="text-sm text-[hsl(215,16%,47%)]">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

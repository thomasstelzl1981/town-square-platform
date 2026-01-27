import { useState } from 'react';
import { ChevronRight, Building2, Users, Briefcase, Sparkles } from 'lucide-react';

interface PerspektiveItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

const PERSPEKTIVEN: PerspektiveItem[] = [
  {
    id: 'vermieter',
    icon: <Building2 className="w-5 h-5" />,
    title: 'Für Vermieter',
    subtitle: 'Digitale Mietsonderverwaltung',
    description: 'Verwalten Sie Ihre Immobilien effizient mit automatisierten Mieteingangskontrollen, digitalem Dokumentenmanagement und KI-gestützter Korrespondenz. System of a Town macht Vermietung einfach.',
    imageUrl: '/placeholder.svg',
  },
  {
    id: 'anbieter',
    icon: <Users className="w-5 h-5" />,
    title: 'Für Anbieter',
    subtitle: 'Verkauf mit Reichweite',
    description: 'Erreichen Sie qualifizierte Käufer über den Kaufy Marktplatz. Unsere Partner-Vertriebe unterstützen Sie bei der Vermarktung und Finanzierungsbegleitung Ihrer Objekte.',
    imageUrl: '/placeholder.svg',
  },
  {
    id: 'vertrieb',
    icon: <Briefcase className="w-5 h-5" />,
    title: 'Für Vertriebe',
    subtitle: 'Beratung mit Substanz',
    description: 'Greifen Sie auf exklusive Objekte zu und nutzen Sie unsere Investment-Engine für transparente Beratungsgespräche. Professionelle Tools für professionelle Berater.',
    imageUrl: '/placeholder.svg',
  },
  {
    id: 'automation',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Automationen & KI',
    subtitle: 'Armstrong, der Immobilienberater',
    description: 'Unser KI-Assistent Armstrong unterstützt bei Exposé-Erstellung, Investment-Berechnungen und beantwortet Fragen zu Steuern, Finanzierung und Rendite – rund um die Uhr.',
    imageUrl: '/placeholder.svg',
  },
];

export function PerspektivenAccordion() {
  const [activeId, setActiveId] = useState('vermieter');

  const activePerspektive = PERSPEKTIVEN.find(p => p.id === activeId) || PERSPEKTIVEN[0];

  return (
    <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
      <div className="zone3-container">
        <div className="text-center mb-12">
          <h2 className="zone3-heading-2 mb-4">Eine Plattform. Drei Perspektiven.</h2>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Kaufy passt sich deiner Rolle an – nicht umgekehrt.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Accordion */}
          <div className="space-y-2">
            {PERSPEKTIVEN.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  activeId === item.id 
                    ? 'shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: activeId === item.id 
                    ? 'hsl(var(--z3-card))' 
                    : 'hsl(var(--z3-card) / 0.5)',
                  borderWidth: '1px',
                  borderColor: activeId === item.id 
                    ? 'hsl(var(--z3-primary))' 
                    : 'hsl(var(--z3-border))',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: activeId === item.id 
                          ? 'hsl(var(--z3-primary))' 
                          : 'hsl(var(--z3-secondary))',
                        color: activeId === item.id 
                          ? 'hsl(var(--z3-primary-foreground))' 
                          : 'hsl(var(--z3-foreground))',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'hsl(var(--z3-foreground))' }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform ${activeId === item.id ? 'rotate-90' : ''}`}
                    style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                  />
                </div>

                {/* Expanded Content */}
                {activeId === item.id && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--z3-border))' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl hidden lg:block">
            <img
              src={activePerspektive.imageUrl}
              alt={activePerspektive.title}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div 
              className="absolute inset-0"
              style={{ 
                background: 'linear-gradient(to top, hsl(var(--z3-foreground) / 0.5), transparent)',
              }}
            />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white text-xl font-bold">{activePerspektive.title}</p>
              <p className="text-white/80 text-sm">{activePerspektive.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

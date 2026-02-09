/**
 * PerspektivenKarten — 3-card grid for target groups
 */
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Tag, Handshake, ArrowRight } from 'lucide-react';

interface PerspektiveCard {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

const perspektiven: PerspektiveCard[] = [
  {
    icon: Building2,
    title: 'Für Vermieter',
    description: 'Digitale Mietsonderverwaltung, automatisierte Abrechnung und KI-gestützte Mieterkommunikation.',
    link: '/kaufy2026/vermieter',
    linkLabel: 'Mehr erfahren',
  },
  {
    icon: Tag,
    title: 'Für Verkäufer',
    description: 'Erreichen Sie tausende vorab qualifizierte Investoren. Provisionsfreier Direktverkauf.',
    link: '/kaufy2026/verkaeufer',
    linkLabel: 'Immobilie inserieren',
  },
  {
    icon: Handshake,
    title: 'Für Partner',
    description: 'Zugang zum exklusiven Objektkatalog. Verdienen Sie Provisionen mit geprüften Kapitalanlagen.',
    link: '/kaufy2026/vertrieb',
    linkLabel: 'Partner werden',
  },
];

export function PerspektivenKarten() {
  return (
    <section className="py-16">
      <div className="px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[hsl(220,20%,10%)] mb-4">
          Eine Plattform. Drei Perspektiven.
        </h2>
        <p className="text-center text-[hsl(215,16%,47%)] mb-12 max-w-2xl mx-auto">
          Egal ob Sie vermieten, verkaufen oder vermitteln – KAUFY bietet die passenden Tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {perspektiven.map((p) => (
            <Card key={p.title} className="group hover:shadow-lg transition-shadow border-0 bg-[hsl(210,30%,97%)]">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[hsl(210,80%,55%,0.1)] flex items-center justify-center mb-4">
                  <p.icon className="w-6 h-6 text-[hsl(210,80%,55%)]" />
                </div>
                <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-2">{p.title}</h3>
                <p className="text-sm text-[hsl(215,16%,47%)] mb-4 line-clamp-3">{p.description}</p>
                <Link to={p.link}>
                  <Button variant="ghost" className="p-0 h-auto text-[hsl(210,80%,55%)] hover:text-[hsl(210,80%,45%)] group-hover:underline">
                    {p.linkLabel}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

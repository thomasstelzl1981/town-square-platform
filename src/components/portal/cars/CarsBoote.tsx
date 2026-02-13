/**
 * CarsBoote — Yacht & Boat Charter (Haller Experiences Ibiza)
 * Real data scraped from hallerexperiences.com
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Anchor, ExternalLink, MapPin, Users, Ruler, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

interface BoatOffer {
  id: string;
  name: string;
  type: string;
  image: string;
  priceFrom: string;
  length: string;
  guests: string;
  location: string;
  link: string;
  highlights: string[];
}

const IBIZA_BOATS: BoatOffer[] = [
  {
    id: 'b1', name: 'Baia 70 | Chilli', type: 'Motoryacht',
    image: 'https://hallerexperiences.com/cdn/shop/files/Image00013.jpg?v=1770890812&width=640',
    priceFrom: '5.599', length: '21m', guests: '12', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/baia-italia-70-chilli-2025',
    highlights: ['Skipper inkl.', 'Minibar', 'Schnorchel-Equipment'],
  },
  {
    id: 'b2', name: 'Canados 90 | Funky Town', type: 'Superyacht',
    image: 'https://hallerexperiences.com/cdn/shop/files/MEDIUM_SCI_Watertoys_004.jpg?v=1770890370&width=640',
    priceFrom: '7.999', length: '27m', guests: '12', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/canados-90-funky-town-2025',
    highlights: ['Watertoys inkl.', 'Full Crew', 'VIP-Service'],
  },
  {
    id: 'b3', name: 'Leopard 102 | La Romana', type: 'Superyacht',
    image: 'https://hallerexperiences.com/cdn/shop/files/Screenshot2026-02-11at19.59.42.png?v=1770836730&width=640',
    priceFrom: '12.999', length: '31m', guests: '12', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/leopard-102-la-romana-2025',
    highlights: ['Luxus-Kabinen', 'Full Crew', 'Tender'],
  },
  {
    id: 'b4', name: 'Mangusta 92 | Drift', type: 'Motoryacht',
    image: 'https://hallerexperiences.com/cdn/shop/files/Screenshot2026-02-12at10.37.13.png?v=1770889369&width=640',
    priceFrom: '9.799', length: '28m', guests: '12', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/mangusta-92-five-stars-2025',
    highlights: ['Watertoys', 'Sundeck', 'Crew'],
  },
  {
    id: 'b5', name: 'Predator 68 | Talan', type: 'Sportboot',
    image: 'https://hallerexperiences.com/cdn/shop/files/SCI_High_Exterior_Pictures_Sunseeker_Predator_68_Talan_2024_020.jpg?v=1770890985&width=640',
    priceFrom: '3.999', length: '21m', guests: '10', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/sunseeker-predator-68-talan-2025',
    highlights: ['Sportlich', 'Skipper', 'Snacks & Drinks'],
  },
  {
    id: 'b6', name: 'Evo 43 | Neve', type: 'Daycruiser',
    image: 'https://hallerexperiences.com/cdn/shop/files/EVO_43_NEVE_010.jpg?v=1770893616&width=640',
    priceFrom: '2.399', length: '13m', guests: '8', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/evo-43-neve-2025',
    highlights: ['Innovatives Design', 'Transformierbares Deck', 'Minibar'],
  },
  {
    id: 'b7', name: 'Canados 49 | Grand', type: 'Motoryacht',
    image: 'https://hallerexperiences.com/cdn/shop/files/Photo.smartyachting.Canados.Gladiator.493_15.jpg?v=1770891623&width=640',
    priceFrom: '3.299', length: '15m', guests: '10', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/canados-49-grand-2025',
    highlights: ['All-inclusive', 'Handtücher', 'Schnorchel-Set'],
  },
  {
    id: 'b8', name: 'Princess V58 | Make My Day', type: 'Sportboot',
    image: 'https://hallerexperiences.com/cdn/shop/files/PrincessV58_19.jpg?v=1770891476&width=640',
    priceFrom: '3.299', length: '18m', guests: '10', location: 'Ibiza',
    link: 'https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza/products/princess-v58-make-my-day-2025',
    highlights: ['Elegant', 'Sundeck', 'Drinks'],
  },
];

export default function CarsBoote() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = IBIZA_BOATS.find(b => b.id === selectedId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Boote & Yachten"
        description="Premium Charter — Ibiza · Haller Experiences"
      />

      {/* Provider Header */}
      <Card className="glass-card border-primary/10 overflow-hidden">
        <div className="relative h-40 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200&h=400&fit=crop"
            alt="Ibiza Yacht Charter"
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 flex items-center justify-between px-8">
            <div>
              <Badge className="mb-2 bg-white/20 text-white border-white/30">Ibiza</Badge>
              <h2 className="text-2xl font-bold text-white">Haller Experiences</h2>
              <p className="text-white/80 text-sm mt-1">Premium Yacht Charter · Ibiza & Formentera</p>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
              <a href="https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Website
              </a>
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> 4.9/5 (149 Reviews)</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Ibiza, Formentera</span>
            <span className="flex items-center gap-1"><Anchor className="h-4 w-4" /> {IBIZA_BOATS.length} Boote verfügbar</span>
          </div>
        </CardContent>
      </Card>

      {/* Boat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {IBIZA_BOATS.map((boat) => {
          const isSelected = selectedId === boat.id;
          return (
            <Card
              key={boat.id}
              className={cn(
                "glass-card overflow-hidden cursor-pointer group transition-all",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => setSelectedId(isSelected ? null : boat.id)}
            >
              <div className="relative h-40 overflow-hidden">
                <img src={boat.image} alt={boat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">{boat.type}</Badge>
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="font-bold text-sm text-foreground">{boat.name}</h3>
                </div>
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Ruler className="h-3 w-3" />{boat.length}</span>
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{boat.guests} Gäste</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground">ab</p>
                    <p className="text-sm font-bold">€{boat.priceFrom}<span className="text-[9px] font-normal text-muted-foreground">/Tag</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline Detail */}
      {selected && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Anchor className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <Badge>{selected.type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <a href={selected.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buchen
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><dt className="text-[10px] text-muted-foreground uppercase">Länge</dt><dd className="text-sm font-medium">{selected.length}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Max. Gäste</dt><dd className="text-sm font-medium">{selected.guests}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Standort</dt><dd className="text-sm font-medium">{selected.location}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Preis ab</dt><dd className="text-sm font-bold">€{selected.priceFrom}/Tag</dd></div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2">Inklusive</h3>
              <div className="flex flex-wrap gap-2">
                {selected.highlights.map((h) => (
                  <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

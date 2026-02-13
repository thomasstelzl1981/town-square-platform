/**
 * CarsPrivatjet — NetJets fleet overview
 * Real data scraped from netjets.com/de-de/vergleiche-privatjets
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plane, ExternalLink, Users, Clock, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ContentCard } from '@/components/shared/ContentCard';

interface JetModel {
  id: string;
  category: string;
  name: string;
  manufacturer: string;
  image: string;
  passengers: string;
  range: string;
  typicalRoute: string;
  description: string;
  link: string;
  estimatedHourly: string;
}

const NETJETS_FLEET: JetModel[] = [
  {
    id: 'j1', category: 'Langstrecken-Jet', name: 'Global 6000', manufacturer: 'Bombardier',
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400&h=250&fit=crop',
    passengers: 'bis zu 13', range: 'bis zu 13:30 Std', typicalRoute: 'Dubai → Tokio',
    description: 'Das größte, leiseste und schnellste NetJets-Flugzeugmodell mit der größten Reichweite.',
    link: 'https://www.netjets.com/de-de/bombardier-global-6000', estimatedHourly: 'ab €12.000/Std',
  },
  {
    id: 'j2', category: 'Grosse-Jet', name: 'Challenger 650', manufacturer: 'Bombardier',
    image: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=400&h=250&fit=crop',
    passengers: 'bis zu 11', range: 'bis zu 8:45 Std', typicalRoute: 'Dubai → Paris',
    description: 'Das Beste, was die private Luftfahrt zu bieten hat — mit globaler Reichweite und Flugbegleiterservice.',
    link: 'https://www.netjets.com/de-de/bombardier-challenger-650', estimatedHourly: 'ab €8.500/Std',
  },
  {
    id: 'j3', category: 'Super-Midsize-Jet', name: 'Challenger 350', manufacturer: 'Bombardier',
    image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=400&h=250&fit=crop',
    passengers: 'bis zu 9', range: 'bis zu 7:45 Std', typicalRoute: 'München → Dubai',
    description: 'Komfortabel und bequem reisen mit flexibler Sitzplatzanordnung.',
    link: 'https://www.netjets.com/de-de/bombardier-challenger-350', estimatedHourly: 'ab €6.500/Std',
  },
  {
    id: 'j4', category: 'Midsize-Jet', name: 'Citation Latitude', manufacturer: 'Cessna',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=250&fit=crop',
    passengers: 'bis zu 7', range: 'bis zu 5:30 Std', typicalRoute: 'Genf → Trondheim',
    description: 'Die perfekte Wahl für Flüge, auf denen Sie mehr Platz und eine höhere Reichweite benötigen.',
    link: 'https://www.netjets.com/de-de/cessna-citation-latitude', estimatedHourly: 'ab €4.800/Std',
  },
  {
    id: 'j5', category: 'Midsize-Jet', name: 'Citation XLS', manufacturer: 'Cessna',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop',
    passengers: 'bis zu 7', range: 'bis zu 4:00 Std', typicalRoute: 'München → London',
    description: 'Bewährte Zuverlässigkeit und Komfort für europäische Strecken.',
    link: 'https://www.netjets.com/de-de/cessna-citation-excel-xls', estimatedHourly: 'ab €4.200/Std',
  },
  {
    id: 'j6', category: 'Light-Jet', name: 'Phenom 300/E', manufacturer: 'Embraer',
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=250&fit=crop',
    passengers: 'bis zu 6', range: 'bis zu 3:30 Std', typicalRoute: 'München → Mallorca',
    description: 'Mit der legendären Eleganz und Geschwindigkeit von NetJets praktisch jeden Flughafen anfliegen.',
    link: 'https://www.netjets.com/de-de/embraer-phenom-300', estimatedHourly: 'ab €3.500/Std',
  },
];

export default function CarsPrivatjet() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = NETJETS_FLEET.find(j => j.id === selectedId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Privatjet"
        description="NetJets — Die größte und vielfältigste Privatflotte der Welt"
      />

      {/* NetJets Provider Header */}
      <ContentCard
        icon={Plane}
        title="NETJETS"
        description="Besserer Zugang zu erstklassigen Privatjets"
        headerAction={
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.netjets.com/de-de/vergleiche-privatjets" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> netjets.com
            </a>
          </Button>
        }
      >
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Plane className="h-4 w-4 text-amber-500" /> {NETJETS_FLEET.length} Flugzeugmodelle</span>
          <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> Weltweit verfügbar</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Share, Lease & Jet Card Programme</span>
        </div>
      </ContentCard>

      {/* Fleet Grid — 4 Spalten */}
      <WidgetGrid>
        {NETJETS_FLEET.map((jet) => {
          const isSelected = selectedId === jet.id;
          return (
            <WidgetCell key={jet.id}>
              <Card
                className={cn(
                  "glass-card overflow-hidden cursor-pointer group transition-all h-full",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => setSelectedId(isSelected ? null : jet.id)}
              >
                <div className="relative h-[55%] overflow-hidden">
                  <img src={jet.image} alt={`${jet.manufacturer} ${jet.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">{jet.category}</Badge>
                  <div className="absolute bottom-2 left-3">
                    <p className="text-[10px] text-muted-foreground">{jet.manufacturer}</p>
                    <h3 className="font-bold text-sm text-foreground">{jet.name}</h3>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{jet.passengers}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{jet.range}</span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{jet.estimatedHourly}</p>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Detail */}
      {selected && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{selected.manufacturer} {selected.name}</h2>
                <Badge>{selected.category}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <a href={selected.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Anfrage
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><dt className="text-[10px] text-muted-foreground uppercase">Hersteller</dt><dd className="text-sm font-medium">{selected.manufacturer}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Modell</dt><dd className="text-sm font-medium">{selected.name}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Passagiere</dt><dd className="text-sm font-medium">{selected.passengers}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Reichweite</dt><dd className="text-sm font-medium">{selected.range}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Typische Route</dt><dd className="text-sm font-medium">{selected.typicalRoute}</dd></div>
              <div><dt className="text-[10px] text-muted-foreground uppercase">Geschätzte Kosten</dt><dd className="text-sm font-bold text-primary">{selected.estimatedHourly}</dd></div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2">Programme</h3>
              <div className="flex flex-wrap gap-2">
                {['NetJets Share', 'NetJets Lease', 'Private Jet Card', 'Charter'].map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

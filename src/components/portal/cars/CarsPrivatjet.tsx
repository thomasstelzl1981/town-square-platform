/**
 * CarsPrivatjet — NetJets fleet overview
 * Data loaded from service_shop_products via useActiveServiceProducts
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plane, ExternalLink, Users, Clock, X, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ContentCard } from '@/components/shared/ContentCard';
import { useActiveServiceProducts } from '@/hooks/useServiceShopProducts';

export default function CarsPrivatjet() {
  const { data: jets = [], isLoading } = useActiveServiceProducts('privatjet');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = jets.find(j => j.id === selectedId);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

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
          <span className="flex items-center gap-1"><Plane className="h-4 w-4 text-amber-500" /> {jets.length} Flugzeugmodelle</span>
          <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> Weltweit verfügbar</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Share, Lease & Jet Card Programme</span>
        </div>
      </ContentCard>

      {jets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Noch keine Jets im Service Desk hinterlegt.
        </div>
      )}

      {/* Fleet Grid */}
      <WidgetGrid>
        {jets.map((jet) => {
          const m = (jet.metadata ?? {}) as Record<string, unknown>;
          const passengers = m.passengers as string ?? '';
          const range = m.range as string ?? '';
          const manufacturer = m.manufacturer as string ?? '';
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
                  <img src={jet.image_url ?? ''} alt={`${manufacturer} ${jet.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">{jet.category ?? jet.sub_category ?? ''}</Badge>
                  <div className="absolute bottom-2 left-3">
                    <p className="text-[10px] text-muted-foreground">{manufacturer}</p>
                    <h3 className="font-bold text-sm text-foreground">{jet.name}</h3>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{passengers}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{range}</span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{jet.price_label}</p>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Detail */}
      {selected && (() => {
        const m = (selected.metadata ?? {}) as Record<string, unknown>;
        const manufacturer = m.manufacturer as string ?? '';
        const passengers = m.passengers as string ?? '';
        const range = m.range as string ?? '';
        const typicalRoute = m.typicalRoute as string ?? '';
        return (
          <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">{manufacturer} {selected.name}</h2>
                  <Badge>{selected.category ?? selected.sub_category ?? ''}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" asChild>
                    <a href={selected.external_url ?? '#'} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Anfrage
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><dt className="text-[10px] text-muted-foreground uppercase">Hersteller</dt><dd className="text-sm font-medium">{manufacturer}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Modell</dt><dd className="text-sm font-medium">{selected.name}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Passagiere</dt><dd className="text-sm font-medium">{passengers}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Reichweite</dt><dd className="text-sm font-medium">{range}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Typische Route</dt><dd className="text-sm font-medium">{typicalRoute}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Geschätzte Kosten</dt><dd className="text-sm font-bold text-primary">{selected.price_label}</dd></div>
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
        );
      })()}
    </PageShell>
  );
}

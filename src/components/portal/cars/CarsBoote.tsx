/**
 * CarsBoote — Yacht & Boat Charter (Haller Experiences Ibiza)
 * Data loaded from service_shop_products via useActiveServiceProducts
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Anchor, ExternalLink, MapPin, Users, Ruler, X, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ContentCard } from '@/components/shared/ContentCard';
import { useActiveServiceProducts } from '@/hooks/useServiceShopProducts';

export default function CarsBoote() {
  const { data: boats = [], isLoading } = useActiveServiceProducts('boote');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = boats.find(b => b.id === selectedId);

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
        title="BOOTE"
        description="Premium Charter — Ibiza · Haller Experiences"
      />

      {/* Provider Header */}
      <ContentCard
        icon={Anchor}
        title="Haller Experiences"
        description="Premium Yacht Charter · Ibiza & Formentera"
        headerAction={
          <Button variant="outline" size="sm" asChild>
            <a href="https://hallerexperiences.com/en/collections/yachten-boote-mieten-ibiza" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Website
            </a>
          </Button>
        }
      >
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> 4.9/5 (149 Reviews)</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Ibiza, Formentera</span>
          <span className="flex items-center gap-1"><Anchor className="h-4 w-4" /> {boats.length} Boote verfügbar</span>
        </div>
      </ContentCard>

      {boats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Noch keine Boote im Service Desk hinterlegt.
        </div>
      )}

      {/* Boat Grid */}
      <WidgetGrid>
        {boats.map((boat) => {
          const m = (boat.metadata ?? {}) as Record<string, unknown>;
          const boatType = m.type as string ?? boat.sub_category ?? '';
          const length = m.length as string ?? '';
          const guests = m.guests as string ?? '';
          const isSelected = selectedId === boat.id;
          return (
            <WidgetCell key={boat.id}>
              <Card
                className={cn(
                  "glass-card overflow-hidden cursor-pointer group transition-all h-full",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => setSelectedId(isSelected ? null : boat.id)}
              >
                <div className="relative h-[55%] overflow-hidden">
                  <img src={boat.image_url ?? ''} alt={boat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">{boatType}</Badge>
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="font-bold text-sm text-foreground">{boat.name}</h3>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Ruler className="h-3 w-3" />{length}</span>
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{guests} Gäste</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground">ab</p>
                    <p className="text-sm font-bold">€{boat.price_label}<span className="text-[9px] font-normal text-muted-foreground">/Tag</span></p>
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Detail */}
      {selected && (() => {
        const m = (selected.metadata ?? {}) as Record<string, unknown>;
        const boatType = m.type as string ?? selected.sub_category ?? '';
        const length = m.length as string ?? '';
        const guests = m.guests as string ?? '';
        const location = m.location as string ?? 'Ibiza';
        const highlights = (m.highlights as string[]) ?? [];
        return (
          <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Anchor className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <Badge>{boatType}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" asChild>
                    <a href={selected.external_url ?? '#'} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buchen
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><dt className="text-[10px] text-muted-foreground uppercase">Länge</dt><dd className="text-sm font-medium">{length}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Max. Gäste</dt><dd className="text-sm font-medium">{guests}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Standort</dt><dd className="text-sm font-medium">{location}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground uppercase">Preis ab</dt><dd className="text-sm font-bold">€{selected.price_label}/Tag</dd></div>
              </div>
              <Separator />
              {highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Inklusive</h3>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </PageShell>
  );
}

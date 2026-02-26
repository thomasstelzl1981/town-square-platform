/**
 * CarsPrivatjet — NetJets fleet overview
 * Data loaded from service_shop_products via useActiveServiceProducts
 * Grouped by sub_category: Programme / Fleet / Add-ons
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plane, ExternalLink, Users, Clock, X, Globe, Loader2, FileText, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ContentCard } from '@/components/shared/ContentCard';
import { useActiveServiceProducts, ServiceShopProduct } from '@/hooks/useServiceShopProducts';

const SUB_CATEGORY_ORDER = ['Programme', 'Fleet', 'Add-ons'];
const SUB_CATEGORY_LABELS: Record<string, string> = {
  Programme: 'Programme',
  Fleet: 'Fleet-Klassen',
  'Add-ons': 'Add-ons & Services',
};

export default function CarsPrivatjet() {
  const { data: jets = [], isLoading } = useActiveServiceProducts('privatjet');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = jets.find(j => j.id === selectedId);

  const grouped = useMemo(() => {
    const map: Record<string, ServiceShopProduct[]> = {};
    for (const jet of jets) {
      const cat = jet.sub_category ?? 'Fleet';
      if (!map[cat]) map[cat] = [];
      map[cat].push(jet);
    }
    return SUB_CATEGORY_ORDER
      .filter(cat => map[cat]?.length)
      .map(cat => ({ category: cat, label: SUB_CATEGORY_LABELS[cat] ?? cat, items: map[cat] }));
  }, [jets]);

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
          <span className="flex items-center gap-1"><Plane className="h-4 w-4 text-primary" /> {jets.filter(j => j.sub_category === 'Fleet').length} Fleet-Klassen</span>
          <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> Weltweit verfügbar</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Share, Lease & Jet Card Programme</span>
        </div>
      </ContentCard>

      {jets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Noch keine Jets im Service Desk hinterlegt.
        </div>
      )}

      {/* Grouped Sections */}
      {grouped.map(({ category, label, items }) => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</h2>
          <WidgetGrid>
            {items.map((jet) => (
              <WidgetCell key={jet.id}>
                {category === 'Programme' ? (
                  <ProgrammeCard jet={jet} isSelected={selectedId === jet.id} onSelect={() => setSelectedId(selectedId === jet.id ? null : jet.id)} />
                ) : category === 'Add-ons' ? (
                  <AddonCard jet={jet} isSelected={selectedId === jet.id} onSelect={() => setSelectedId(selectedId === jet.id ? null : jet.id)} />
                ) : (
                  <FleetCard jet={jet} isSelected={selectedId === jet.id} onSelect={() => setSelectedId(selectedId === jet.id ? null : jet.id)} />
                )}
              </WidgetCell>
            ))}
          </WidgetGrid>
        </div>
      ))}

      {/* Inline Detail */}
      {selected && <InlineDetail product={selected} onClose={() => setSelectedId(null)} />}
    </PageShell>
  );
}

/* ── Programme Card (NetJets Logo + CTA) ── */
function ProgrammeCard({ jet, isSelected, onSelect }: { jet: ServiceShopProduct; isSelected: boolean; onSelect: () => void }) {
  const m = (jet.metadata ?? {}) as Record<string, unknown>;
  return (
    <Card
      className={cn(
        "glass-card overflow-hidden cursor-pointer group transition-all h-full",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="p-4 flex items-center gap-4 h-full">
        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
          {jet.image_url ? (
            <img src={jet.image_url} alt="NetJets" className="w-12 h-12 object-contain" />
          ) : (
            <Plane className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{jet.name}</h3>
            {jet.badge && <Badge variant="outline" className="text-[9px] shrink-0">{jet.badge}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{jet.description}</p>
          {m.cta && (
            <span className="text-xs font-medium text-primary">{m.cta as string} →</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── Fleet Card (Flugzeugbild + Specs) ── */
function FleetCard({ jet, isSelected, onSelect }: { jet: ServiceShopProduct; isSelected: boolean; onSelect: () => void }) {
  const m = (jet.metadata ?? {}) as Record<string, unknown>;
  const passengers = m.passengers as string ?? '';
  const range = m.range as string ?? '';
  const manufacturer = m.manufacturer as string ?? '';
  const fleetClass = m.fleet_class as string ?? '';
  return (
    <Card
      className={cn(
        "glass-card overflow-hidden cursor-pointer group transition-all h-full",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="relative h-[55%] overflow-hidden">
        <img src={jet.image_url ?? ''} alt={`${manufacturer} ${jet.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        {fleetClass && <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">{fleetClass}</Badge>}
        <div className="absolute bottom-2 left-3">
          <p className="text-[10px] text-muted-foreground">{manufacturer}</p>
          <h3 className="font-bold text-sm text-foreground">{jet.name}</h3>
        </div>
      </div>
      <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {passengers && <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{passengers} Pax</span>}
          {range && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{range}</span>}
        </div>
        <p className="text-xs font-semibold text-primary">{jet.price_label ?? 'auf Anfrage'}</p>
      </CardContent>
    </Card>
  );
}

/* ── Add-on Card (Icon-based, no image) ── */
function AddonCard({ jet, isSelected, onSelect }: { jet: ServiceShopProduct; isSelected: boolean; onSelect: () => void }) {
  const m = (jet.metadata ?? {}) as Record<string, unknown>;
  const addon = m.addon as string ?? '';
  const IconComp = addon === 'partner_qualification' ? ShieldCheck : FileText;
  return (
    <Card
      className={cn(
        "glass-card overflow-hidden cursor-pointer group transition-all h-full",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="p-4 flex items-center gap-4 h-full">
        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
          <IconComp className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{jet.name}</h3>
            <Badge variant="secondary" className="text-[9px] shrink-0">Add-on</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{jet.description}</p>
        </div>
      </div>
    </Card>
  );
}

/* ── Inline Detail (adapts to sub_category) ── */
function InlineDetail({ product, onClose }: { product: ServiceShopProduct; onClose: () => void }) {
  const m = (product.metadata ?? {}) as Record<string, unknown>;
  const subCat = product.sub_category ?? 'Fleet';

  return (
    <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{product.name}</h2>
            {product.badge && <Badge>{product.badge}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {product.external_url && (
              <Button size="sm" asChild>
                <a href={product.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> {subCat === 'Programme' ? 'Info anfordern' : subCat === 'Add-ons' ? 'Details' : 'Anfrage'}
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <Separator />

        {subCat === 'Fleet' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailField label="Hersteller" value={m.manufacturer as string} />
            <DetailField label="Fleet-Klasse" value={m.fleet_class as string} />
            <DetailField label="Passagiere" value={m.passengers as string} />
            <DetailField label="Reichweite" value={m.range as string} />
            <DetailField label="Typische Route" value={m.typicalRoute as string} />
            <DetailField label="Kosten" value={product.price_label ?? 'auf Anfrage'} highlight />
          </div>
        )}

        {subCat === 'Programme' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailField label="Anbieter" value={m.vendor as string} />
            <DetailField label="Programm" value={m.program as string} />
            <DetailField label="Region" value={m.region as string} />
            <DetailField label="Kosten" value={product.price_label ?? 'auf Anfrage'} highlight />
          </div>
        )}

        {subCat === 'Add-ons' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{product.description}</p>
            {m.notes && <p className="text-xs text-muted-foreground/70 italic">{m.notes as string}</p>}
          </div>
        )}

        {product.description && subCat !== 'Add-ons' && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("text-sm font-medium", highlight && "font-bold text-primary")}>{value}</dd>
    </div>
  );
}

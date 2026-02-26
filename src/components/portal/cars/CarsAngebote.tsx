/**
 * CarsAngebote — Miete24 Auto-Abos + BMW/MINI Fokusmodelle (Helming & Sohn)
 * Data loaded from service_shop_products via useActiveServiceProducts
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Car, ShoppingCart, Zap, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ContentCard } from '@/components/shared/ContentCard';
import { useActiveServiceProducts, ServiceShopProduct } from '@/hooks/useServiceShopProducts';

export default function CarsAngebote() {
  const { data: miete24 = [], isLoading: loadingM } = useActiveServiceProducts('miete24-autos');
  const { data: bmwFokus = [], isLoading: loadingF } = useActiveServiceProducts('bmw-fokus');

  const isLoading = loadingM || loadingF;

  const miete24Groups = useMemo(() => {
    const order = ['SUV', 'Mittelklasse', 'Sport'];
    const groups: Record<string, ServiceShopProduct[]> = {};
    for (const p of miete24) {
      const key = p.sub_category || 'Sonstige';
      (groups[key] ??= []).push(p);
    }
    return order.filter((k) => groups[k]?.length).map((k) => ({ label: k, items: groups[k] }));
  }, [miete24]);

  return (
    <PageShell>
      <ModulePageHeader
        title="Angebote"
        description="Auto-Abos und Großkunden-Sonderleasing"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── SECTION 1: Miete24 ──────────────────────────────────────────── */}
      {!isLoading && miete24.length > 0 && (
        <>
          <ContentCard
            icon={ShoppingCart}
            title="miete24"
            description="Auto Abo Vergleich — die besten & günstigsten Angebote · Versicherung, KFZ-Steuer, Wartung & TÜV inklusive"
            headerAction={
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.miete24.com/auto-abos" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> miete24.com
                </a>
              </Button>
            }
          >
            <div />
          </ContentCard>

          {miete24Groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{group.label}</h3>
              <WidgetGrid>
                {group.items.map((p) => {
                  const meta = (p.metadata ?? {}) as Record<string, unknown>;
                  const badges = (meta.badges as string[]) ?? [];
                  return (
                    <WidgetCell key={p.id}>
                      <Card className="glass-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden h-full">
                        <div className="relative h-[50%] bg-muted/20 flex items-center justify-center overflow-hidden p-4">
                          <img src={p.image_url ?? ''} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                          {p.badge && (
                            <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">
                              {p.badge}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-2 h-[50%] flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{p.name}</h3>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {badges.map((b) => (
                                <Badge key={b} variant="outline" className="text-[9px]">{b}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div>
                              <span className="text-lg font-bold">{p.price_label}</span>
                            </div>
                            <Button size="sm" className="gap-1 text-xs" asChild>
                              <a href={p.external_url ?? '#'} target="_blank" rel="noopener noreferrer">
                                <ShoppingCart className="h-3 w-3" /> Abo
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </WidgetCell>
                  );
                })}
              </WidgetGrid>
            </div>
          ))}

          <Separator className="my-2" />
        </>
      )}

      {/* ── SECTION 2: BMW & MINI Fokusmodelle ─────────────────────────── */}
      {!isLoading && bmwFokus.length > 0 && (
        <>
          <ContentCard
            icon={Car}
            title="BMW & MINI Fokusmodelle"
            description="Großkunden-Sonderleasing · Gültig 01.01.2026 – 31.03.2026"
            headerAction={
              <Button variant="outline" size="sm" asChild>
                <a href="https://helming-sohn.de/kundengruppen/grosskunden-fokusmodelle/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Helming & Sohn
                </a>
              </Button>
            }
          >
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Nur für Partner</Badge>
          </ContentCard>

          <WidgetGrid>
            {bmwFokus.map((p) => {
              const m = (p.metadata ?? {}) as Record<string, unknown>;
              const fuel = m.fuel as string ?? '';
              const brand = m.brand as string ?? 'BMW';
              const code = m.code as string ?? '';
              const power = m.power as string ?? '';
              const term = m.term as string ?? '';
              const kmPerYear = m.kmPerYear as string ?? '';
              const upe = m.upe as string ?? '—';
              const configLink = m.configLink as string ?? '#';

              return (
                <WidgetCell key={p.id}>
                  <Card className="glass-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden h-full">
                    <div className="relative h-[50%] bg-muted/20 flex items-center justify-center overflow-hidden p-4">
                      <img src={p.image_url ?? ''} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      <Badge variant="outline" className="absolute top-2 left-3 text-[9px] bg-background/80 backdrop-blur-sm">
                        {brand}
                      </Badge>
                      {fuel === 'Elektro' && (
                        <Badge className="absolute top-2 right-3 text-[9px] gap-0.5 bg-green-500/20 text-green-600 border-green-500/30">
                          <Zap className="h-2.5 w-2.5" /> Elektro
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-2 h-[50%] flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{p.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{code} · {power}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Laufzeit</p>
                          <p className="text-[11px] font-medium">{term}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">KM/Jahr</p>
                          <p className="text-[11px] font-medium">{kmPerYear}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">UPE</p>
                          <p className="text-[11px] font-medium">{upe !== '—' ? `${upe} €` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <div>
                          <span className="text-[9px] text-muted-foreground">ab </span>
                          <span className="text-lg font-bold">{p.price_label},– €</span>
                          <span className="text-[10px] text-muted-foreground"> /Mo.</span>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                          <a href={configLink} target="_blank" rel="noopener noreferrer">
                            <Car className="h-3 w-3" /> Konfig.
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </WidgetCell>
              );
            })}
          </WidgetGrid>

          <p className="text-[10px] text-muted-foreground max-w-3xl">
            ¹ Unverbindliche Leasingbeispiele. Alle Preise zzgl. MwSt. Kosten für Überführung und Zulassung nicht enthalten. 
            Vollkaskoversicherung erforderlich. Weitere Laufzeiten und Laufleistungen möglich. Stand 01/2026. Helming & Sohn GmbH.
          </p>
        </>
      )}

      {!isLoading && miete24.length === 0 && bmwFokus.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Noch keine Angebote im Service Desk hinterlegt.
        </div>
      )}
    </PageShell>
  );
}

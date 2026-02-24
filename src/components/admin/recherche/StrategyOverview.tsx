/**
 * StrategyOverview — Visualisiert CATEGORY_SOURCE_STRATEGIES aus spec.ts
 * Gruppiert nach strategyCode, zeigt Pipeline-Steps, Kosten, Kategorien
 */
import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import {
  CATEGORY_SOURCE_STRATEGIES,
  CATEGORY_REGISTRY,
  type CategorySourceStrategy,
  type SourceProvider,
  type StrategyDifficulty,
} from '@/engines/marketDirectory/spec';
import {
  Database, Globe, Search, FileText, Building2, ArrowRight,
  Landmark, ShieldCheck, Users,
} from 'lucide-react';

const PROVIDER_ICONS: Record<SourceProvider, { icon: typeof Globe; label: string }> = {
  google_places: { icon: Globe, label: 'Google Places' },
  apify_maps: { icon: Globe, label: 'Apify Maps' },
  apify_portal: { icon: Building2, label: 'Apify Portal' },
  apify_linkedin: { icon: Users, label: 'Apify LinkedIn' },
  firecrawl: { icon: Search, label: 'Firecrawl' },
  bafin_csv: { icon: Landmark, label: 'BaFin CSV' },
  ihk_register: { icon: ShieldCheck, label: 'IHK Register' },
  netrows: { icon: Database, label: 'Netrows' },
  manual: { icon: FileText, label: 'Manuell' },
};

const DIFFICULTY_BADGE: Record<StrategyDifficulty, { label: string; className: string }> = {
  easy: { label: 'Einfach', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  medium: { label: 'Mittel', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  hard: { label: 'Schwer', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

interface StrategyGroup {
  strategyCode: string;
  difficulty: StrategyDifficulty;
  strategies: CategorySourceStrategy[];
  categoryLabels: string[];
  totalCostPerContact: number;
  steps: CategorySourceStrategy['steps'];
}

export const StrategyOverview = memo(function StrategyOverview() {
  const grouped = useMemo(() => {
    const map = new Map<string, StrategyGroup>();
    for (const s of CATEGORY_SOURCE_STRATEGIES) {
      const existing = map.get(s.strategyCode);
      const catDef = CATEGORY_REGISTRY.find(c => c.code === s.categoryCode);
      const label = catDef?.label || s.categoryCode;
      if (existing) {
        existing.strategies.push(s);
        existing.categoryLabels.push(label);
      } else {
        map.set(s.strategyCode, {
          strategyCode: s.strategyCode,
          difficulty: s.difficulty,
          strategies: [s],
          categoryLabels: [label],
          totalCostPerContact: s.steps.reduce((sum, st) => sum + st.estimatedCostEur, 0),
          steps: s.steps,
        });
      }
    }
    return Array.from(map.values());
  }, []);

  return (
    <Card className={DESIGN.CARD.SECTION}>
      <div className="flex items-center gap-2 mb-4">
        <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
          <Database className="h-4 w-4 text-primary" />
        </div>
        <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Recherche-Strategien</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grouped.map(g => (
          <Card key={g.strategyCode} className="p-4 space-y-3 border border-border/40">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-wide">{g.strategyCode}</span>
              <Badge variant="outline" className={`text-xs ${DIFFICULTY_BADGE[g.difficulty].className}`}>
                {DIFFICULTY_BADGE[g.difficulty].label}
              </Badge>
            </div>

            {/* Pipeline Steps */}
            <div className="flex items-center gap-1 flex-wrap">
              {g.steps.map((step, i) => {
                const prov = PROVIDER_ICONS[step.provider];
                const Icon = prov.icon;
                return (
                  <div key={step.stepId} className="flex items-center gap-1">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{prov.label}</span>
                    </div>
                    {i < g.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>

            {/* Cost */}
            <div className="text-xs text-muted-foreground">
              Kosten/Kontakt: <span className="font-medium text-foreground">{(g.totalCostPerContact * 100).toFixed(1)} ct</span>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {g.categoryLabels.map(label => (
                <Badge key={label} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>

            {/* Notes (first strategy) */}
            <p className="text-xs text-muted-foreground line-clamp-2">{g.strategies[0].notes}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
});

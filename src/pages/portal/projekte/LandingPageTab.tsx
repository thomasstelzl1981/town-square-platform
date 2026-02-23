/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * Widget-Pattern: Project tiles + "Neue Website erstellen"
 * All demo data comes from DB via useDevProjects (isDemoId filter applied there).
 */
import { useState } from 'react';
import { PROJEKTCALC_DEFAULTS } from '@/engines/projektCalc/spec';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoId } from '@/engines/demoData/engine';
import { LandingPageBuilder } from '@/components/projekte/landing-page/LandingPageBuilder';
import { LandingPagePreview } from '@/components/projekte/landing-page/LandingPagePreview';
import { useLandingPageByProject } from '@/hooks/useLandingPage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectPortfolioRow } from '@/types/projekte';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import type { LandingPage } from '@/hooks/useLandingPage';

export default function LandingPageTab() {
  const queryClient = useQueryClient();
  const { projects, isLoading, portfolioRows } = useDevProjects();
  const [selectedId, setSelectedId] = useState<string>(portfolioRows[0]?.id || '');

  const isSelectedDemo = isDemoId(selectedId);
  const isNewMode = selectedId === 'new';

  const activeProject: ProjectPortfolioRow | null = portfolioRows.find(p => p.id === selectedId) || portfolioRows[0] || null;
  const rawProject = projects.find(p => p.id === selectedId);
  const projectName = activeProject?.name || 'Projekt';
  const projectId = activeProject?.id;
  const organizationId = rawProject?.tenant_id;

  const { data: landingPage, isLoading: lpLoading } = useLandingPageByProject(projectId);

  // Fetch real units for projects
  const { data: realUnits } = useQuery({
    queryKey: ['dev_project_units_lp', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', selectedId)
        .order('unit_number');
      if (error) throw error;
      return data;
    },
    enabled: !isNewMode && !!selectedId,
  });

  // Map real units to DemoUnit interface
  const units: DemoUnit[] | undefined = realUnits?.map((u) => {
    const listPrice = u.list_price ?? 0;
    const areaSqm = u.area_sqm ?? 1;
    const rentNet = u.rent_net ?? 0;
    const rentNk = u.rent_nk ?? 0;
    const annualNetRent = rentNet * 12;
    return {
      id: u.id,
      public_id: u.public_id || u.id.substring(0, 8),
      unit_number: u.unit_number || '—',
      rooms: u.rooms_count ?? 0,
      floor: u.floor ?? 0,
      area_sqm: areaSqm,
      list_price: listPrice,
      rent_monthly: rentNet,
      annual_net_rent: annualNetRent,
      non_recoverable_costs: rentNk,
      yield_percent: listPrice > 0 ? (annualNetRent / listPrice) * 100 : 0,
      price_per_sqm: areaSqm > 0 ? Math.round(listPrice / areaSqm) : 0,
      provision_eur: u.commission_amount ?? Math.round(listPrice * (PROJEKTCALC_DEFAULTS.defaultProvisionPercent / 100)),
      parking_price: 0,
      status: (u.status === 'verkauft' ? 'sold' : u.status === 'reserviert' ? 'reserved' : 'available') as DemoUnit['status'],
    };
  });

  if (isLoading || lpLoading) return <LoadingState />;

  const showPreview = !!landingPage && !isNewMode;
  const showBuilder = !landingPage && !isNewMode;

  return (
    <PageShell>
      <ModulePageHeader
        title="LANDING PAGE"
        description={showPreview
          ? `Projekt-Website für „${projectName}" — ${landingPage?.status === 'draft' ? 'Entwurf' : 'Aktiv'}`
          : 'Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner'}
      />

      {/* Widget Grid */}
      <WidgetGrid>
        {/* Project widgets */}
        {portfolioRows.map((p) => (
          <WidgetCell key={p.id}>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all hover:shadow-lg group flex flex-col',
                getActiveWidgetGlow('amber'),
                isDemoId(p.id) && DESIGN.DEMO_WIDGET.CARD,
                isDemoId(p.id) && DESIGN.DEMO_WIDGET.HOVER,
                p.id === selectedId && 'ring-2 ring-primary shadow-glow',
              )}
              onClick={() => setSelectedId(p.id)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">{p.project_code}</Badge>
                  {isDemoId(p.id) && <Badge className={DESIGN.DEMO_WIDGET.BADGE}>DEMODATEN</Badge>}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                  <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                    {isDemoId(p.id) ? <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Building2 className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.postal_code} {p.city}</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-[10px]">{p.total_units_count} Einheiten</Badge>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        ))}

        {/* Neue Website erstellen */}
        <WidgetCell>
          <Card
            className={cn(
              'h-full border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center',
              isNewMode && 'ring-2 ring-primary border-primary/50',
            )}
            onClick={() => setSelectedId('new')}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-3">
              <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Neue Website erstellen</p>
                <p className="text-[10px] text-muted-foreground mt-1">KI-generierte Projekt-Landingpage</p>
              </div>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>

      {/* Inline Detail: Preview or Builder */}
      <div className="mt-6">
        {showPreview && (
          <LandingPagePreview
            project={activeProject}
            landingPage={landingPage!}
            isDemo={isSelectedDemo}
            units={units}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
              queryClient.invalidateQueries({ queryKey: ['dev_project_units_lp', selectedId] });
            }}
          />
        )}

        {(isNewMode || showBuilder) && (
          <LandingPageBuilder
            projectName={isNewMode ? 'Neues Projekt' : projectName}
            projectId={projectId}
            organizationId={organizationId}
            isDemo={false}
            projectAddress={rawProject?.address ?? undefined}
            projectCity={rawProject?.city ?? undefined}
            projectPostalCode={rawProject?.postal_code ?? undefined}
          />
        )}
      </div>
    </PageShell>
  );
}

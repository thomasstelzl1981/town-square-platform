/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * Widget-Pattern: Demo-Widget (grün, Position 0) + "Neue Website erstellen"
 * Demo: Zeigt volle LandingPagePreview inline mit Demodaten
 * Neu: Öffnet Builder für echte Projekte
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
import { isDemoProject, DEMO_PROJECT, DEMO_PROJECT_ID, DEMO_UNITS } from '@/components/projekte/demoProjectData';
import { useDemoToggles } from '@/hooks/useDemoToggles';
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

// Fake landing page for demo project (always "exists")
const DEMO_LANDING_PAGE: LandingPage = {
  id: 'demo-lp-001',
  project_id: DEMO_PROJECT_ID,
  organization_id: 'demo-org',
  slug: 'residenz-am-stadtpark',
  status: 'draft',
  hero_headline: 'Residenz am Stadtpark',
  hero_subheadline: 'Kapitalanlage-Immobilien in bester Lage Münchens',
  location_description: null,
  developer_website_url: null,
  about_text: null,
  contact_email: null,
  contact_phone: null,
  published_at: null,
  preview_expires_at: null,
  locked_at: null,
  booked_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
};

export default function LandingPageTab() {
  const queryClient = useQueryClient();
  const { projects, isLoading, portfolioRows } = useDevProjects();
  const { isEnabled } = useDemoToggles();
  const showDemoProject = isEnabled('GP-PROJEKT');
  const [selectedId, setSelectedId] = useState<string>(showDemoProject ? DEMO_PROJECT_ID : (portfolioRows[0]?.id || 'new'));

  const isSelectedDemo = isDemoProject(selectedId);
  const isNewMode = selectedId === 'new';

  const activeProject: ProjectPortfolioRow = isSelectedDemo
    ? DEMO_PROJECT
    : (portfolioRows.find(p => p.id === selectedId) || portfolioRows[0] || DEMO_PROJECT);
  const rawProject = isSelectedDemo ? null : projects.find(p => p.id === selectedId);
  const projectName = activeProject.name || 'Projekt';
  const projectId = isSelectedDemo ? undefined : activeProject.id;
  const organizationId = rawProject?.tenant_id;

  const { data: landingPage, isLoading: lpLoading } = useLandingPageByProject(projectId);

  // Fetch real units for non-demo projects
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
    enabled: !isSelectedDemo && !isNewMode && !!selectedId,
  });

  // Map real units to DemoUnit interface
  const units: DemoUnit[] | undefined = isSelectedDemo
    ? DEMO_UNITS
    : realUnits?.map((u) => {
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

  // Determine what to show for the selected item
  const effectiveLandingPage = isSelectedDemo ? DEMO_LANDING_PAGE : landingPage;
  const showPreview = !!effectiveLandingPage && !isNewMode;
  const showBuilder = !effectiveLandingPage && !isSelectedDemo && !isNewMode;

  return (
    <PageShell>
      <ModulePageHeader
        title="LANDING PAGE"
        description={showPreview
          ? `Projekt-Website für „${projectName}" — ${effectiveLandingPage?.status === 'draft' ? 'Entwurf' : 'Aktiv'}`
          : 'Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner'}
      />

      {/* Widget Grid: Demo + Neue Website + real projects */}
      <WidgetGrid>
        {/* Widget 1: Demo (grün, Position 0) — only if toggle ON */}
        {showDemoProject && (
          <WidgetCell>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all group flex flex-col',
                DESIGN.DEMO_WIDGET.CARD,
                DESIGN.DEMO_WIDGET.HOVER,
                isSelectedDemo && 'ring-2 ring-emerald-400 shadow-glow',
              )}
              onClick={() => setSelectedId(DEMO_PROJECT_ID)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <Badge className={DESIGN.DEMO_WIDGET.BADGE}>DEMODATEN</Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">SOT-BT-0001</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                  <div className={cn(DESIGN.HEADER.WIDGET_ICON_BOX, 'bg-emerald-500/10')}>
                    <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="font-semibold text-sm leading-tight">Residenz am Stadtpark</p>
                  <p className="text-[11px] text-muted-foreground">80331 München</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-[10px]">24 Einheiten · Entwurf</Badge>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* Widget 2: Neue Website erstellen */}
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

        {/* Real project widgets with existing landing pages */}
        {portfolioRows.map((p) => (
          <WidgetCell key={p.id}>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all hover:shadow-lg group flex flex-col',
                getActiveWidgetGlow('amber'),
                p.id === selectedId && 'ring-2 ring-primary shadow-glow',
              )}
              onClick={() => setSelectedId(p.id)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">{p.project_code}</Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                  <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                    <Building2 className="h-5 w-5 text-primary" />
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
      </WidgetGrid>

      {/* Inline Detail: Preview or Builder */}
      <div className="mt-6">
        {/* Demo or existing LP → full preview */}
        {showPreview && (
          <LandingPagePreview
            project={activeProject}
            landingPage={effectiveLandingPage!}
            isDemo={isSelectedDemo}
            units={units}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
              queryClient.invalidateQueries({ queryKey: ['dev_project_units_lp', selectedId] });
            }}
          />
        )}

        {/* New mode or no LP → Builder */}
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

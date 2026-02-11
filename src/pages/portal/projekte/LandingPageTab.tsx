/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * Two states per project:
 * A) No landing page exists → LandingPageBuilder (URL dialog + generation)
 * B) Landing page exists → LandingPagePreview (browser frame + website)
 * 
 * Demo project is always visible as first tile.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoProject, DEMO_PROJECT, DEMO_PROJECT_ID, DEMO_UNITS } from '@/components/projekte/demoProjectData';
import { LandingPageBuilder } from '@/components/projekte/landing-page/LandingPageBuilder';
import { LandingPagePreview } from '@/components/projekte/landing-page/LandingPagePreview';
import { ProjectCard } from '@/components/projekte/ProjectCard';
import { useLandingPageByProject } from '@/hooks/useLandingPage';
import type { ProjectPortfolioRow } from '@/types/projekte';
import type { DemoUnit } from '@/components/projekte/demoProjectData';

export default function LandingPageTab() {
  const queryClient = useQueryClient();
  const { projects, isLoading, portfolioRows } = useDevProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEMO_PROJECT_ID);

  const isSelectedDemo = isDemoProject(selectedProjectId);
  const activeProject: ProjectPortfolioRow = isSelectedDemo
    ? DEMO_PROJECT
    : (portfolioRows.find(p => p.id === selectedProjectId) || portfolioRows[0] || DEMO_PROJECT);
  const rawProject = isSelectedDemo ? null : projects.find(p => p.id === selectedProjectId);
  const projectName = activeProject.name || 'Projekt';
  const projectId = isSelectedDemo ? undefined : activeProject.id;
  const organizationId = rawProject?.tenant_id;

  const { data: landingPage, isLoading: lpLoading } = useLandingPageByProject(projectId);

  // Fetch real units for non-demo projects
  const { data: realUnits } = useQuery({
    queryKey: ['dev_project_units_lp', selectedProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('unit_number');
      if (error) throw error;
      return data;
    },
    enabled: !isSelectedDemo && !!selectedProjectId,
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
          provision_eur: u.commission_amount ?? Math.round(listPrice * 0.10),
          parking_price: 0,
          status: (u.status === 'verkauft' ? 'sold' : u.status === 'reserviert' ? 'reserved' : 'available') as DemoUnit['status'],
        };
      });

  if (isLoading || lpLoading) return <LoadingState />;

  const showBuilder = !landingPage && !isSelectedDemo;
  const showDemoBuilder = !landingPage && isSelectedDemo;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Landing Page</h2>
        <p className="text-muted-foreground mt-1">
          {landingPage
            ? `Projekt-Website für „${projectName}" — ${landingPage.status === 'draft' ? 'Entwurf' : 'Aktiv'}`
            : 'Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner'}
        </p>
      </div>

      {/* Project Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <ProjectCard
          project={DEMO_PROJECT}
          isDemo
          isSelected={isSelectedDemo}
          onClick={() => setSelectedProjectId(DEMO_PROJECT_ID)}
        />
        {portfolioRows.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            isSelected={p.id === selectedProjectId}
            onClick={(id) => setSelectedProjectId(id)}
          />
        ))}
      </div>

      {/* State A: No landing page yet → show builder */}
      {(showBuilder || showDemoBuilder) && (
        <LandingPageBuilder
          projectName={projectName}
          projectId={projectId}
          organizationId={organizationId}
          isDemo={isSelectedDemo}
          projectAddress={rawProject?.address ?? undefined}
          projectCity={rawProject?.city ?? undefined}
          projectPostalCode={rawProject?.postal_code ?? undefined}
        />
      )}

      {/* State B: Landing page exists → show preview */}
      {landingPage && (
        <LandingPagePreview
          project={activeProject}
          landingPage={landingPage}
          isDemo={isSelectedDemo}
          units={units}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dev_project_units_lp', selectedProjectId] });
          }}
        />
      )}
    </div>
  );
}

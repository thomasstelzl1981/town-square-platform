/**
 * ProjektLandingPage — Public route /projekt/:slug
 * Renders the landing page website for public access
 * Loads real project data from dev_projects + dev_project_units
 */
import { useParams } from 'react-router-dom';
import { useLandingPageBySlug } from '@/hooks/useLandingPage';
import { LandingPageWebsite } from '@/components/projekte/landing-page/LandingPageWebsite';
import { DEMO_PROJECT } from '@/components/projekte/demoProjectData';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import type { ProjectPortfolioRow, ProjectStatus } from '@/types/projekte';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';

/** Fetch project + units for public landing page */
function useProjectDataForLandingPage(projectId: string | undefined) {
  return useQuery({
    queryKey: ['landing-page-project-data', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const [projectRes, unitsRes] = await Promise.all([
        supabase.from('dev_projects').select('*').eq('id', projectId).maybeSingle(),
        supabase.from('dev_project_units').select('*').eq('project_id', projectId).order('unit_number'),
      ]);

      if (projectRes.error || !projectRes.data) return null;

      const p = projectRes.data;
      const units = unitsRes.data ?? [];

      const project: ProjectPortfolioRow = {
        id: p.id,
        project_code: p.project_code,
        name: p.name,
        city: p.city ?? '',
        postal_code: p.postal_code ?? '',
        project_type: p.project_type ?? 'aufteilung',
        status: (p.status ?? 'active') as ProjectStatus,
        total_units_count: p.total_units_count ?? units.length,
        units_available: units.filter(u => u.status === 'geplant' || u.status === 'im_bau' || u.status === 'fertig').length,
        units_reserved: units.filter(u => u.status === 'reserviert').length,
        units_sold: units.filter(u => u.status === 'verkauft').length,
        purchase_price: p.purchase_price ?? 0,
        total_sale_target: p.total_sale_target ?? 0,
        sale_revenue_actual: 0,
        profit_margin_percent: 0,
        progress_percent: 0,
        kaufy_listed: p.kaufy_listed ?? false,
        kaufy_featured: p.kaufy_featured ?? false,
        landingpage_enabled: p.landingpage_enabled ?? false,
      };

      // Map dev_project_units → DemoUnit-compatible shape
      const mappedUnits: DemoUnit[] = units.map((u) => {
        const listPrice = u.list_price ?? 0;
        const areaSqm = u.area_sqm ?? 1;
        const rentNet = u.rent_net ?? u.current_rent ?? 0;
        const annualRent = rentNet * 12;
        const yieldPercent = listPrice > 0 ? Math.round((annualRent / listPrice) * 10000) / 100 : 0;

        return {
          id: u.id,
          public_id: u.public_id ?? u.unit_number,
          unit_number: u.unit_number,
          rooms: u.rooms_count ?? 2,
          floor: u.floor ?? 0,
          area_sqm: areaSqm,
          list_price: listPrice,
          rent_monthly: rentNet,
          annual_net_rent: annualRent,
          non_recoverable_costs: u.rent_nk ?? 0,
          yield_percent: yieldPercent,
          price_per_sqm: u.price_per_sqm ?? Math.round(listPrice / areaSqm),
          provision_eur: u.commission_amount ?? 0,
          parking_price: u.parking ? 20_000 : 0,
          status: u.status === 'verkauft' ? 'sold' : u.status === 'reserviert' ? 'reserved' : 'available',
        };
      });

      return { project, units: mappedUnits };
    },
    enabled: !!projectId,
  });
}

export default function ProjektLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: landingPage, isLoading, error } = useLandingPageBySlug(slug);
  const { data: projectData, isLoading: projectLoading } = useProjectDataForLandingPage(landingPage?.project_id);

  if (isLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
          <p className="text-muted-foreground">Die angeforderte Projekt-Website existiert nicht.</p>
        </div>
      </div>
    );
  }

  if (landingPage.status === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Website nicht verfügbar</h1>
          <p className="text-muted-foreground">
            Diese Projekt-Website ist derzeit nicht öffentlich zugänglich. 
            Bitte kontaktieren Sie den Anbieter für weitere Informationen.
          </p>
        </div>
      </div>
    );
  }

  const project = projectData?.project ?? DEMO_PROJECT;
  const units = projectData?.units;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <LandingPageWebsite
        project={project}
        landingPage={landingPage}
        isDemo={!projectData}
        units={units}
      />
    </div>
  );
}

/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * Two states:
 * A) No landing page exists → LandingPageBuilder (URL dialog + generation)
 * B) Landing page exists → LandingPagePreview (browser frame + website)
 */
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoMode, DEMO_PROJECT } from '@/components/projekte/demoProjectData';
import { LandingPageBuilder } from '@/components/projekte/landing-page/LandingPageBuilder';
import { LandingPagePreview } from '@/components/projekte/landing-page/LandingPagePreview';
import { useLandingPageByProject } from '@/hooks/useLandingPage';
import type { ProjectPortfolioRow } from '@/types/projekte';

export default function LandingPageTab() {
  const { projects, isLoading, portfolioRows } = useDevProjects();
  
  const isDemo = !isLoading && isDemoMode(projects);
  const activeProject: ProjectPortfolioRow = isDemo ? DEMO_PROJECT : (portfolioRows[0] || DEMO_PROJECT);
  const rawProject = isDemo ? null : projects[0];
  const projectName = activeProject.name || 'Projekt';
  const projectId = isDemo ? undefined : activeProject.id;
  const organizationId = rawProject?.tenant_id;

  const { data: landingPage, isLoading: lpLoading } = useLandingPageByProject(projectId);

  if (isLoading || lpLoading) return <LoadingState />;

  // State A: No landing page yet → show builder
  if (!landingPage && !isDemo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Landing Page</h2>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner
          </p>
        </div>
        <LandingPageBuilder
          projectName={projectName}
          projectId={projectId}
          organizationId={organizationId}
          isDemo={isDemo}
          projectAddress={rawProject?.address ?? undefined}
          projectCity={rawProject?.city ?? undefined}
          projectPostalCode={rawProject?.postal_code ?? undefined}
        />
      </div>
    );
  }

  // Demo mode without DB entry also shows builder first
  if (!landingPage && isDemo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Landing Page</h2>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner
          </p>
        </div>
        <LandingPageBuilder
          projectName={projectName}
          isDemo={isDemo}
          projectAddress={rawProject?.address ?? undefined}
          projectCity={rawProject?.city ?? undefined}
          projectPostalCode={rawProject?.postal_code ?? undefined}
        />
      </div>
    );
  }

  // State B: Landing page exists → show preview
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Landing Page</h2>
        <p className="text-muted-foreground mt-1">
          Projekt-Website für „{projectName}" — {landingPage?.status === 'draft' ? 'Entwurf' : 'Aktiv'}
        </p>
      </div>
      <LandingPagePreview
        project={activeProject}
        landingPage={landingPage || null}
        isDemo={isDemo}
      />
    </div>
  );
}

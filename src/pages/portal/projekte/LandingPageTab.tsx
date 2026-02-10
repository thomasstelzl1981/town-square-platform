/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * Two states:
 * A) No draft generated → LandingPageBuilder (explanation + CTA)
 * B) Draft generated → LandingPagePreview (4-tab website view)
 */
import { useState } from 'react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoMode, DEMO_PROJECT } from '@/components/projekte/demoProjectData';
import { LandingPageBuilder } from '@/components/projekte/landing-page/LandingPageBuilder';
import { LandingPagePreview } from '@/components/projekte/landing-page/LandingPagePreview';
import type { ProjectPortfolioRow } from '@/types/projekte';

export default function LandingPageTab() {
  const { projects, isLoading, portfolioRows } = useDevProjects();
  const [draftGenerated, setDraftGenerated] = useState(false);

  if (isLoading) return <LoadingState />;

  const isDemo = isDemoMode(projects);
  const projectName = isDemo ? DEMO_PROJECT.name : (projects[0]?.name || 'Projekt');
  const activeProject: ProjectPortfolioRow = isDemo ? DEMO_PROJECT : (portfolioRows[0] || DEMO_PROJECT);

  if (!draftGenerated) {
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
          onGenerate={() => setDraftGenerated(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Landing Page</h2>
        <p className="text-muted-foreground mt-1">
          Projekt-Website für „{projectName}" — Entwurf aktiv
        </p>
      </div>
      <LandingPagePreview
        project={activeProject}
        isDemo={isDemo}
      />
    </div>
  );
}
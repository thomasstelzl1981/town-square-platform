/**
 * ProjektLandingPage — Public route /projekt/:slug
 * Renders the landing page website for public access
 */
import { useParams } from 'react-router-dom';
import { useLandingPageBySlug } from '@/hooks/useLandingPage';
import { LandingPageWebsite } from '@/components/projekte/landing-page/LandingPageWebsite';
import { DEMO_PROJECT } from '@/components/projekte/demoProjectData';
import { Loader2, Lock } from 'lucide-react';

export default function ProjektLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: landingPage, isLoading, error } = useLandingPageBySlug(slug);

  if (isLoading) {
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

  // For now use DEMO_PROJECT data — in production this would load from dev_projects
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <LandingPageWebsite
        project={DEMO_PROJECT}
        landingPage={landingPage}
        isDemo={false}
      />
    </div>
  );
}

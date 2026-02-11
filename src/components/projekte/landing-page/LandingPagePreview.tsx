/**
 * LandingPagePreview — Browser Frame Mockup (Zustand B)
 * Wraps LandingPageWebsite in a realistic browser chrome with action bar
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil, Eye } from 'lucide-react';
import type { ProjectPortfolioRow } from '@/types/projekte';
import type { LandingPage } from '@/hooks/useLandingPage';
import { LandingPageWebsite } from './LandingPageWebsite';
import { LandingPagePublishSection } from './LandingPagePublishSection';

interface LandingPagePreviewProps {
  project: ProjectPortfolioRow | null;
  landingPage: LandingPage | null;
  isDemo: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  preview: { label: 'Vorschau (36h)', variant: 'default' },
  active: { label: 'Aktiv', variant: 'default' },
  locked: { label: 'Gesperrt', variant: 'destructive' },
};

export function LandingPagePreview({ project, landingPage, isDemo }: LandingPagePreviewProps) {
  const slug = landingPage?.slug || 'mein-projekt';
  const status = landingPage?.status || 'draft';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const publicUrl = `/projekt/${slug}`;

  return (
    <div className="space-y-4">
      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispieldaten — Entwurf basiert auf Demodaten</Badge>
      )}

      {/* Browser Frame */}
      <div className="rounded-2xl border-2 border-border shadow-2xl bg-background overflow-hidden max-w-6xl mx-auto">
        {/* Browser Chrome Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
          </div>

          {/* URL bar */}
          <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 border text-sm text-muted-foreground">
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z" fillRule="evenodd" />
            </svg>
            <span className="truncate">{slug}.kaufy.app</span>
          </div>

          {/* Open in new tab */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(publicUrl, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Website öffnen
          </Button>
        </div>

        {/* Website Content — scrollable frame */}
        <div className="max-h-[75vh] overflow-y-auto">
          <LandingPageWebsite
            project={project}
            landingPage={landingPage}
            isDemo={isDemo}
          />
        </div>
      </div>

      {/* Action Bar below frame */}
      <div className="flex items-center justify-between gap-4 flex-wrap max-w-6xl mx-auto px-1">
        <div className="flex items-center gap-3">
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          {landingPage?.created_at && (
            <span className="text-xs text-muted-foreground">
              Erstellt {new Date(landingPage.created_at).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Pencil className="h-3.5 w-3.5" />
            Bearbeiten
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(publicUrl, '_blank')}>
            <Eye className="h-3.5 w-3.5" />
            Vorschau
          </Button>
        </div>
      </div>

      {/* Publishing Section */}
      <LandingPagePublishSection landingPage={landingPage} />
    </div>
  );
}
